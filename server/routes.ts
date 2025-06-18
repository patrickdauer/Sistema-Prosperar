import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBusinessRegistrationSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import { generateBusinessRegistrationPDF } from "./services/pdf";
import { sendConfirmationEmail } from "./services/email";
import { googleDriveService } from "./services/googledrive";
import { generateToken, authenticateToken, requireRole } from "./auth";
import { seedTaskTemplates, createAdminUser } from "./seedData";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize seed data
  await seedTaskTemplates();
  await createAdminUser();

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username e senha são obrigatórios" });
      }

      const user = await storage.authenticateUser(username, password);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const token = generateToken(user);
      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          name: user.name, 
          email: user.email, 
          role: user.role, 
          department: user.department 
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/me", authenticateToken, async (req, res) => {
    res.json({ 
      user: { 
        id: req.user!.id, 
        username: req.user!.username, 
        name: req.user!.name, 
        email: req.user!.email, 
        role: req.user!.role, 
        department: req.user!.department 
      } 
    });
  });

  // Internal management routes
  app.get("/api/internal/registrations", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrations();
      
      // Get tasks for each registration
      const registrationsWithTasks = await Promise.all(
        registrations.map(async (registration) => {
          const tasks = await storage.getTasksByRegistration(registration.id);
          return { ...registration, tasks };
        })
      );

      res.json(registrationsWithTasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registros" });
    }
  });

  app.get("/api/internal/registration/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getBusinessRegistration(id);
      
      if (!registration) {
        return res.status(404).json({ message: "Registro não encontrado" });
      }

      const tasks = await storage.getTasksByRegistration(id);
      const activities = await storage.getActivities(id);

      res.json({ registration, tasks, activities });
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registro" });
    }
  });

  app.get("/api/internal/my-tasks", authenticateToken, async (req, res) => {
    try {
      const tasks = await storage.getTasksByUser(req.user!.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar tarefas" });
    }
  });

  app.put("/api/internal/task/:id/status", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['pending', 'in_progress', 'completed', 'blocked'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const updatedTask = await storage.updateTaskStatus(taskId, status, req.user!.id);
      
      // Send notification when task is completed
      if (status === 'completed') {
        try {
          const webhookUrl = process.env.N8N_WEBHOOK_URL;
          if (webhookUrl) {
            const registration = await storage.getBusinessRegistration(updatedTask.businessRegistrationId);
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'task_completed',
                task: updatedTask,
                company: registration?.razaoSocial,
                user: req.user!.name,
                department: updatedTask.department
              })
            });
          }
        } catch (webhookError) {
          console.error('Webhook notification error:', webhookError);
        }
      }

      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atualizar tarefa" });
    }
  });

  app.put("/api/internal/task/:id/assign", authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { userId } = req.body;

      const updatedTask = await storage.assignTask(taskId, userId);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Erro ao atribuir tarefa" });
    }
  });

  // File upload for tasks
  const taskUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      cb(null, allowedTypes.includes(file.mimetype));
    }
  });

  app.post("/api/internal/task/:id/upload", authenticateToken, taskUpload.single('file'), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "Arquivo é obrigatório" });
      }

      // Get task and registration details
      const task = await storage.getTasksByRegistration(0).then(tasks => tasks.find(t => t.id === taskId));
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }

      const registration = await storage.getBusinessRegistration(task.businessRegistrationId);
      
      // Upload to Google Drive
      const folderName = `${registration?.razaoSocial} - ${registration?.id}`;
      let folderId;
      
      try {
        folderId = await googleDriveService.createFolder(folderName);
        const departmentFolder = await googleDriveService.createFolder(`Depto ${task.department}`, folderId);
        const taskFolder = await googleDriveService.createFolder(task.title, departmentFolder);
        
        const fileName = `${task.title}_${Date.now()}_${file.originalname}`;
        const fileUrl = await googleDriveService.uploadFile(fileName, file.buffer, file.mimetype, taskFolder);
        
        // Save file record
        await storage.createTaskFile({
          taskId: taskId,
          fileName: fileName,
          originalName: file.originalname,
          filePath: fileUrl,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: req.user!.id
        });

        res.json({ success: true, fileUrl, fileName });
      } catch (driveError) {
        console.error('Google Drive upload error:', driveError);
        res.status(500).json({ message: "Erro ao fazer upload do arquivo" });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao processar upload" });
    }
  });

  app.get("/api/internal/task/:id/files", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const files = await storage.getTaskFiles(taskId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar arquivos" });
    }
  });
  
  // Business registration submission endpoint
  app.post("/api/business-registration", upload.any(), async (req, res) => {
    try {
      // Parse form data
      const formData = JSON.parse(req.body.data);
      
      // Validate form data
      const validatedData = insertBusinessRegistrationSchema.parse(formData);
      
      // Handle file uploads for partners (In a real app, this would upload to Google Drive)
      const files = req.files as Express.Multer.File[];
      
      // Process partner files and update their URLs
      if (validatedData.socios && Array.isArray(validatedData.socios)) {
        validatedData.socios = validatedData.socios.map((socio: any, index: number) => {
          const partnerFiles = files.filter(file => file.fieldname.startsWith(`socio_${index}_`));
          
          const documentoComFoto = partnerFiles.find(f => f.fieldname === `socio_${index}_documentoComFoto`);
          const certidaoCasamento = partnerFiles.find(f => f.fieldname === `socio_${index}_certidaoCasamento`);
          const documentosAdicionais = partnerFiles.filter(f => f.fieldname === `socio_${index}_documentosAdicionais`);
          
          return {
            ...socio,
            documentoComFotoUrl: documentoComFoto ? `https://drive.google.com/file/socio-${index}-doc-${Date.now()}` : socio.documentoComFotoUrl,
            certidaoCasamentoUrl: certidaoCasamento ? `https://drive.google.com/file/socio-${index}-cert-${Date.now()}` : socio.certidaoCasamentoUrl,
            documentosAdicionaisUrls: documentosAdicionais.length > 0 
              ? documentosAdicionais.map((_, fileIndex) => `https://drive.google.com/file/socio-${index}-add-${Date.now()}-${fileIndex}`)
              : socio.documentosAdicionaisUrls || []
          };
        });
      }
      
      // Create registration
      const registration = await storage.createBusinessRegistration(validatedData);
      
      // Process uploads and integrations in parallel
      const promises = [];
      
      // 1. Create Google Drive folder and upload files
      promises.push((async () => {
        try {
          const folderName = `${registration.razaoSocial} - ${registration.id}`;
          const folderId = await googleDriveService.createFolder(folderName);
          
          // Upload partner files to Google Drive
          const socios = registration.socios as any[];
          for (let i = 0; i < socios.length; i++) {
            const partnerFiles = files.filter(file => file.fieldname.startsWith(`socio_${i}_`));
            
            for (const file of partnerFiles) {
              const fileName = `${socios[i].nomeCompleto}_${file.fieldname.split('_').pop()}_${file.originalname}`;
              await googleDriveService.uploadFile(fileName, file.buffer, file.mimetype, folderId);
            }
          }
          
          // Generate and upload PDF
          const pdfBuffer = await generateBusinessRegistrationPDF(registration);
          await googleDriveService.uploadPDF(`${registration.razaoSocial}_Dados_Empresa.pdf`, pdfBuffer, folderId);
          
          console.log(`Files uploaded to Google Drive folder: ${folderName}`);
        } catch (error) {
          console.error('Google Drive error:', error);
        }
      })());
      
      // 2. Send confirmation emails
      promises.push((async () => {
        try {
          await sendConfirmationEmail(registration);
          console.log('Confirmation emails sent successfully');
        } catch (error) {
          console.error('Email error:', error);
        }
      })());
      
      // 3. Send webhook to n8n for WhatsApp notification
      promises.push((async () => {
        try {
          const webhookUrl = process.env.N8N_WEBHOOK_URL;
          if (webhookUrl) {
            const socios = registration.socios as any[];
            const sociosInfo = socios.map((socio: any, index: number) => 
              `*Sócio ${index + 1}:*
• Nome: ${socio.nomeCompleto}
• CPF: ${socio.cpf}
• Estado Civil: ${socio.estadoCivil}
• Telefone: ${socio.telefonePessoal}
• Email: ${socio.emailPessoal}
• Documentos: ${socio.documentoComFotoUrl ? 'Doc. com foto ✓' : 'Doc. com foto ✗'} ${socio.certidaoCasamentoUrl ? 'Certidão ✓' : ''}`
            ).join('\n\n');

            const webhookData = {
              registration,
              message: `🏢 *NOVA SOLICITAÇÃO DE ABERTURA DE EMPRESA*

📋 *DADOS DA EMPRESA*
• Razão Social: ${registration.razaoSocial}
• Nome Fantasia: ${registration.nomeFantasia}
• Endereço: ${registration.endereco}
• Telefone: ${registration.telefoneEmpresa}
• Email: ${registration.emailEmpresa}
• Capital Social: ${registration.capitalSocial}
• Atividade Principal: ${registration.atividadePrincipal}

👥 *SÓCIOS (${socios.length})*
${sociosInfo}

📎 *STATUS DOS DOCUMENTOS*
Todos os arquivos foram enviados para o Google Drive na pasta: ${registration.razaoSocial} - ${registration.id}

⏰ *Recebido em:* ${new Date().toLocaleString('pt-BR')}`
            };
            
            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(webhookData)
            });
          }
        } catch (webhookError) {
          console.error('Webhook error:', webhookError);
        }
      })());
      
      // Wait for all processes to complete (but don't fail if any individual service fails)
      await Promise.allSettled(promises);
      
      res.json({ 
        success: true, 
        message: "Registro criado com sucesso!",
        id: registration.id 
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Dados inválidos",
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Erro interno do servidor" 
        });
      }
    }
  });
  
  // Get all registrations (for admin purposes)
  app.get("/api/business-registrations", async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registros" });
    }
  });
  
  // Get specific registration
  app.get("/api/business-registration/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getBusinessRegistration(id);
      
      if (!registration) {
        res.status(404).json({ message: "Registro não encontrado" });
        return;
      }
      
      res.json(registration);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar registro" });
    }
  });

  // Generate PDF for specific registration
  app.get("/api/business-registration/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getBusinessRegistration(id);
      
      if (!registration) {
        res.status(404).json({ message: "Registro não encontrado" });
        return;
      }
      
      const pdfBuffer = await generateBusinessRegistrationPDF(registration);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="empresa-${registration.razaoSocial}-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: "Erro ao gerar PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
