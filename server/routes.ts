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
  
  // Simple test endpoint
  app.get("/api/test", (req, res) => {
    res.json({ message: "Server is working!" });
  });

  // Business registration submission endpoint
  app.post("/api/business-registration", upload.any(), async (req, res) => {
    console.log('=== INCOMING REGISTRATION REQUEST ===');
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Body exists:', !!req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'NO BODY');
    console.log('Files count:', req.files ? req.files.length : 0);
    
    // Log raw body data for debugging
    if (req.body && req.body.data) {
      console.log('Raw data field length:', req.body.data.length);
      console.log('Data starts with:', req.body.data.substring(0, 100));
    }
    
    try {
      // Check if we have form data
      if (!req.body) {
        console.error('ERROR: No request body received');
        return res.status(400).json({ 
          success: false, 
          message: "Nenhum corpo da requisição foi recebido" 
        });
      }
      
      if (!req.body.data) {
        console.error('ERROR: No data field in request body');
        console.log('Available body fields:', Object.keys(req.body));
        return res.status(400).json({ 
          success: false, 
          message: "Campo 'data' não encontrado na requisição" 
        });
      }
      
      // Parse and validate the JSON data
      let formData;
      try {
        formData = JSON.parse(req.body.data);
        console.log('Successfully parsed form data:', {
          razaoSocial: formData.razaoSocial,
          sociosCount: formData.socios ? formData.socios.length : 0
        });
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        return res.status(400).json({ 
          success: false, 
          message: "Dados do formulário estão corrompidos" 
        });
      }
      
      // Basic validation
      const requiredFields = ['razaoSocial', 'nomeFantasia', 'endereco', 'telefoneEmpresa', 'emailEmpresa'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          return res.status(400).json({ 
            success: false, 
            message: `Campo obrigatório não preenchido: ${field}` 
          });
        }
      }
      
      if (!formData.socios || !Array.isArray(formData.socios) || formData.socios.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "É necessário adicionar pelo menos um sócio" 
        });
      }
      
      // Prepare data for database storage
      const registrationData = {
        razaoSocial: formData.razaoSocial,
        nomeFantasia: formData.nomeFantasia,
        endereco: formData.endereco,
        inscricaoImobiliaria: formData.inscricaoImobiliaria || '',
        metragem: parseInt(formData.metragem) || 0,
        telefoneEmpresa: formData.telefoneEmpresa,
        emailEmpresa: formData.emailEmpresa,
        capitalSocial: formData.capitalSocial || '',
        atividadePrincipal: formData.atividadePrincipal || '',
        atividadesSecundarias: formData.atividadesSecundarias || '',
        atividadesSugeridas: formData.atividadesSugeridas || [],
        socios: formData.socios
      };
      
      console.log('Creating business registration...');
      
      // Create registration in database
      const registration = await storage.createBusinessRegistration(registrationData);
      console.log('Registration created with ID:', registration.id);
      
      // Process uploads and integrations in sequence to ensure folder data is available for email
      let folderData: { mainFolderId: string, societarioFolderId: string } | undefined;
      
      // 1. Create Google Drive folder and upload files first
      try {
        console.log('Starting Google Drive integration...');
        
        // Test connection first
        const connectionOk = await googleDriveService.testConnection();
        if (!connectionOk) {
          throw new Error('Google Drive connection failed');
        }
        
        // Criar estrutura completa: Pasta principal > DEPTO SOCIETARIO
        folderData = await googleDriveService.createBusinessFolderStructure(
          registration.razaoSocial, 
          registration.id
        );
        
        console.log(`Folder structure created - Main: ${folderData.mainFolderId}, Societário: ${folderData.societarioFolderId}`);
        
        // Upload partner files to DEPTO SOCIETARIO folder
        const uploadedFiles = req.files as Express.Multer.File[];
        if (uploadedFiles && uploadedFiles.length > 0) {
          console.log(`Uploading ${uploadedFiles.length} files to DEPTO SOCIETARIO folder...`);
          const socios = registration.socios as any[];
          
          for (let i = 0; i < socios.length; i++) {
            const partnerFiles = uploadedFiles.filter((file: Express.Multer.File) => file.fieldname.startsWith(`socio_${i}_`));
            
            for (const file of partnerFiles) {
              const fileName = `${socios[i].nomeCompleto}_${file.fieldname.split('_').pop()}_${file.originalname}`;
              console.log(`Uploading file: ${fileName}`);
              await googleDriveService.uploadFile(fileName, file.buffer, file.mimetype, folderData.societarioFolderId);
              console.log(`✓ File uploaded: ${fileName}`);
            }
          }
        }
        
        // Generate and upload PDF to main folder
        const pdfBuffer = await generateBusinessRegistrationPDF(registration);
        await googleDriveService.uploadPDF(`${registration.razaoSocial}_Dados_Empresa.pdf`, pdfBuffer, folderData.mainFolderId);
        
        console.log(`Files uploaded to Google Drive folder structure successfully`);
      } catch (error) {
        console.error('Google Drive error:', error);
      }
      
      // Now process other integrations in parallel
      const promises = [];
      
      // 2. Send confirmation emails with folder data
      promises.push((async () => {
        try {
          await sendConfirmationEmail(registration, folderData);
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
        console.log('Validation errors:', error.errors);
        res.status(400).json({ 
          success: false, 
          message: "Dados inválidos: " + error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          errors: error.errors 
        });
      } else if (error instanceof SyntaxError) {
        res.status(400).json({ 
          success: false, 
          message: "Erro ao processar dados do formulário" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Erro interno do servidor: " + (error instanceof Error ? error.message : String(error))
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

  // API for internal dashboard - get all registrations with tasks
  app.get("/api/internal/registrations", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrations();
      
      // Add tasks for each registration
      const registrationsWithTasks = await Promise.all(
        registrations.map(async (registration) => {
          const tasks = await storage.getTasksByRegistration(registration.id);
          return {
            ...registration,
            tasks: tasks
          };
        })
      );
      
      res.json(registrationsWithTasks);
    } catch (error) {
      console.error("Error fetching registrations:", error);
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

  // Internal system routes for authenticated users
  
  // Delete company registration
  app.delete("/api/internal/registration/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getBusinessRegistration(id);
      
      if (!registration) {
        res.status(404).json({ message: "Empresa não encontrada" });
        return;
      }
      
      await storage.deleteBusinessRegistration(id);
      res.json({ message: "Empresa deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ message: "Erro ao deletar empresa" });
    }
  });

  // Update company registration
  app.put("/api/internal/registration/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const existingRegistration = await storage.getBusinessRegistration(id);
      if (!existingRegistration) {
        res.status(404).json({ message: "Empresa não encontrada" });
        return;
      }
      
      const updatedRegistration = await storage.updateBusinessRegistration(id, updateData);
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error updating registration:", error);
      res.status(500).json({ message: "Erro ao atualizar empresa" });
    }
  });

  // Create new user
  app.post("/api/internal/users", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const { username, password, name, email, role, department } = req.body;
      
      if (!username || !password || !name) {
        res.status(400).json({ message: "Campos obrigatórios não preenchidos" });
        return;
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        res.status(400).json({ message: "Nome de usuário já existe" });
        return;
      }
      
      const newUser = await storage.createUser({
        username,
        password,
        name,
        email,
        role: role || 'user',
        department
      });
      
      res.json({ message: "Usuário criado com sucesso", user: newUser });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Change password
  app.put("/api/internal/change-password", authenticateToken, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req as any).user.userId;
      
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Senhas são obrigatórias" });
        return;
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "Usuário não encontrado" });
        return;
      }
      
      // Verify current password
      const bcrypt = require('bcrypt');
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        res.status(400).json({ message: "Senha atual incorreta" });
        return;
      }
      
      // Update password using storage method
      await storage.updateUserPassword(userId, newPassword);
      
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
