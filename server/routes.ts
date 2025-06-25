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
import XLSX from "xlsx";
import puppeteer from "puppeteer";
import bcrypt from "bcrypt";

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

  app.put("/api/internal/registration/:id", authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedRegistration = await storage.updateBusinessRegistration(id, updateData);
      
      res.json(updatedRegistration);
    } catch (error) {
      console.error('Error updating registration:', error);
      res.status(500).json({ message: "Erro ao atualizar registro" });
    }
  });

  // Update business registration route
  app.put("/api/internal/business-registrations/:id", authenticateToken, async (req, res) => {
    try {
      console.log('PUT request received for ID:', req.params.id);
      console.log('Update data:', req.body);
      
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "ID inválido" });
      }
      
      const updatedRegistration = await storage.updateBusinessRegistration(id, updateData);
      console.log('Updated registration:', updatedRegistration);
      
      res.json(updatedRegistration);
    } catch (error) {
      console.error('Error updating business registration:', error);
      res.status(500).json({ message: "Erro ao atualizar empresa", error: error.message });
    }
  });

  // Delete task route
  app.delete("/api/internal/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      await storage.deleteTask(taskId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: "Erro ao deletar tarefa" });
    }
  });

  // Edit task route
  app.put("/api/internal/tasks/:id", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { title, description } = req.body;
      
      // Update task title and description
      const updatedTask = await storage.updateTaskField(taskId, 'title', title);
      await storage.updateTaskField(taskId, 'description', description);
      
      res.json({ success: true, task: updatedTask });
    } catch (error) {
      console.error('Error editing task:', error);
      res.status(500).json({ message: "Erro ao editar tarefa" });
    }
  });

  // Create new task route
  app.post("/api/internal/tasks", authenticateToken, async (req, res) => {
    try {
      const { businessRegistrationId, title, description, department, status, order } = req.body;
      
      const newTask = await storage.createTask({
        businessRegistrationId,
        title,
        description,
        department,
        status: status || 'pending',
        order: order || 99
      });
      
      res.json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: "Erro ao criar tarefa" });
    }
  });

  // Legacy route for backward compatibility
  app.post("/api/internal/registration/:id/task", authenticateToken, async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      const { title, description, department } = req.body;
      
      const newTask = await storage.createTask({
        businessRegistrationId: registrationId,
        title,
        description,
        department,
        status: 'pending',
        order: 99
      });
      
      res.json(newTask);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: "Erro ao criar tarefa" });
    }
  });

  // API endpoint for sistema-final.tsx - get all business registrations with tasks
  app.get("/api/internal/business-registrations/with-tasks", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrationsWithTasks();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations with tasks:", error);
      res.status(500).json({ message: "Erro ao buscar registros com tarefas" });
    }
  });

  // API endpoint for users management
  app.get("/api/internal/users", authenticateToken, async (req, res) => {
    try {
      // Check if user is admin
      if (req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem acessar usuários." });
      }
      
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  // Export to Excel endpoint
  app.get("/api/internal/export/excel", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrationsWithTasks();
      
      // XLSX already imported at top
      
      // Prepare company data for Excel
      const companiesData = registrations.map((reg: any) => ({
        'ID': reg.id,
        'Razão Social': reg.razaoSocial || reg.razao_social,
        'Nome Fantasia': reg.nomeFantasia || reg.nome_fantasia,
        'Email': reg.emailEmpresa || reg.email_empresa,
        'Telefone': reg.telefoneEmpresa || reg.telefone_empresa,
        'Endereço': reg.endereco,
        'CNPJ': reg.cnpj || 'Não informado',
        'Capital Social': reg.capitalSocial || reg.capital_social || 'Não informado',
        'Atividade Principal': reg.atividadePrincipal || reg.atividade_principal || 'Não informado',
        'Data Criação': new Date(reg.createdAt || reg.created_at).toLocaleDateString('pt-BR'),
        'Total Tarefas': reg.tasks?.length || 0,
        'Tarefas Pendentes': reg.tasks?.filter((t: any) => t.status === 'pending').length || 0,
        'Tarefas Em Andamento': reg.tasks?.filter((t: any) => t.status === 'in_progress').length || 0,
        'Tarefas Concluídas': reg.tasks?.filter((t: any) => t.status === 'completed').length || 0,
      }));

      // Prepare partners data for Excel
      const partnersData: any[] = [];
      registrations.forEach((reg: any) => {
        const socios = reg.socios || [];
        if (Array.isArray(socios)) {
          socios.forEach((socio: any, index: number) => {
            partnersData.push({
              'ID Empresa': reg.id,
              'Razão Social': reg.razaoSocial || reg.razao_social,
              'Sócio #': index + 1,
              'Nome Completo': socio.nomeCompleto || '',
              'CPF': socio.cpf || '',
              'RG': socio.rg || '',
              'Data Nascimento': socio.dataNascimento || '',
              'Estado Civil': socio.estadoCivil || '',
              'Profissão': socio.profissao || '',
              'Nacionalidade': socio.nacionalidade || '',
              'Endereço Pessoal': socio.enderecoPessoal || '',
              'Telefone Pessoal': socio.telefonePessoal || '',
              'Email Pessoal': socio.emailPessoal || '',
              'Filiação': socio.filiacao || ''
            });
          });
        }
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Add companies worksheet
      const companiesWorksheet = XLSX.utils.json_to_sheet(companiesData);
      XLSX.utils.book_append_sheet(workbook, companiesWorksheet, 'Empresas');
      
      // Add partners worksheet if there are partners
      if (partnersData.length > 0) {
        const partnersWorksheet = XLSX.utils.json_to_sheet(partnersData);
        XLSX.utils.book_append_sheet(workbook, partnersWorksheet, 'Sócios');
      }
      
      // Generate buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers
      res.setHeader('Content-Disposition', `attachment; filename="relatorio_completo_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Send file
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({ message: "Erro ao exportar para Excel" });
    }
  });

  // Export to PDF endpoint
  app.get("/api/internal/export/pdf", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrationsWithTasks();
      
      // puppeteer already imported at top
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Empresas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; }
            .company-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px; }
            .info { margin: 5px 0; }
            .tasks { margin-top: 15px; }
            .task { padding: 5px; margin: 3px 0; border-radius: 3px; }
            .task.pending { background-color: #fee; }
            .task.in_progress { background-color: #ffc; }
            .task.completed { background-color: #efe; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Empresas Cadastradas</h1>
            <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
          
          <h2>Resumo Geral</h2>
          <table>
            <tr>
              <th>Total de Empresas</th>
              <th>Total de Tarefas</th>
              <th>Tarefas Pendentes</th>
              <th>Tarefas Em Andamento</th>
              <th>Tarefas Concluídas</th>
            </tr>
            <tr>
              <td>${registrations.length}</td>
              <td>${registrations.reduce((acc: number, reg: any) => acc + (reg.tasks?.length || 0), 0)}</td>
              <td>${registrations.reduce((acc: number, reg: any) => acc + (reg.tasks?.filter((t: any) => t.status === 'pending').length || 0), 0)}</td>
              <td>${registrations.reduce((acc: number, reg: any) => acc + (reg.tasks?.filter((t: any) => t.status === 'in_progress').length || 0), 0)}</td>
              <td>${registrations.reduce((acc: number, reg: any) => acc + (reg.tasks?.filter((t: any) => t.status === 'completed').length || 0), 0)}</td>
            </tr>
          </table>

          <h2>Detalhes das Empresas</h2>
          ${registrations.map((reg: any) => `
            <div class="company">
              <div class="company-title">${reg.razao_social || reg.razaoSocial}</div>
              <div class="info"><strong>Nome Fantasia:</strong> ${reg.nome_fantasia || reg.nomeFantasia}</div>
              <div class="info"><strong>Email:</strong> ${reg.email_empresa || reg.emailEmpresa}</div>
              <div class="info"><strong>Telefone:</strong> ${reg.telefone_empresa || reg.telefoneEmpresa}</div>
              ${reg.cnpj ? `<div class="info"><strong>CNPJ:</strong> ${reg.cnpj}</div>` : ''}
              <div class="info"><strong>Data de Cadastro:</strong> ${new Date(reg.created_at || reg.createdAt).toLocaleDateString('pt-BR')}</div>
              
              
              ${reg.socios && Array.isArray(reg.socios) && reg.socios.length > 0 ? `
                <h4>Sócios:</h4>
                <table>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>RG</th>
                    <th>Profissão</th>
                    <th>Telefone</th>
                    <th>Email</th>
                  </tr>
                  ${reg.socios.map((socio: any) => `
                    <tr>
                      <td>${socio.nomeCompleto || ''}</td>
                      <td>${socio.cpf || ''}</td>
                      <td>${socio.rg || ''}</td>
                      <td>${socio.profissao || ''}</td>
                      <td>${socio.telefonePessoal || ''}</td>
                      <td>${socio.emailPessoal || ''}</td>
                    </tr>
                  `).join('')}
                </table>
              ` : ''}

              ${reg.tasks && reg.tasks.length > 0 ? `
                <div class="tasks">
                  <strong>Tarefas (${reg.tasks.length}):</strong>
                  ${reg.tasks.map((task: any) => `
                    <div class="task ${task.status}">
                      <strong>${task.title}</strong> - 
                      <span style="font-weight: bold;">
                        ${task.status === 'pending' ? 'Pendente' : task.status === 'in_progress' ? 'Em Andamento' : 'Concluída'}
                      </span>
                      ${task.description ? `<br><em style="color: #666;">${task.description}</em>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="margin-top: 15px; color: #7f8c8d;"><em>Nenhuma tarefa cadastrada</em></div>'}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      });

      await browser.close();
      
      res.setHeader('Content-Disposition', `attachment; filename="relatorio_empresas_${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      res.status(500).json({ message: "Erro ao exportar para PDF" });
    }
  });

  // Download task file
  app.get("/api/internal/tasks/files/:id/download", authenticateToken, async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const taskFile = await storage.getTaskFileById(fileId);
      
      if (!taskFile) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }

      // Download file from Google Drive
      const fileBuffer = await googleDriveService.downloadFile(taskFile.filePath);
      
      // Set headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${taskFile.originalName}"`);
      res.setHeader('Content-Type', taskFile.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length);
      
      // Send file
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading task file:", error);
      res.status(500).json({ message: "Erro ao baixar arquivo" });
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

  app.post("/api/internal/tasks/:id/upload", authenticateToken, taskUpload.single('file'), async (req, res) => {
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
      
      // Create initial tasks for the registration (all pending)
      console.log('Creating initial tasks for registration...');
      await storage.createTasksForRegistration(registration.id);
      console.log('Initial tasks created successfully');
      
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

  // Get all users (admin only)
  app.get("/api/internal/users", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
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

  // Update user (admin only)
  app.put("/api/internal/users/:id", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, name, email, role, department, password } = req.body;
      
      const updateData: any = { username, name, email, role, department };
      if (password) {
        updateData.password = password;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      res.json({ message: "Usuário atualizado com sucesso", user: updatedUser });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/internal/users/:id", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao deletar usuário" });
    }
  });

  // Update task field (observacao, dataLembrete)
  app.put("/api/internal/tasks/:id/field", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { field, value } = req.body;
      
      const updatedTask = await storage.updateTaskField(taskId, field, value);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task field:", error);
      res.status(500).json({ message: "Erro ao atualizar campo da tarefa" });
    }
  });

  // Upload file for task
  app.post("/api/internal/tasks/:id/upload", authenticateToken, upload.single('file'), async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const file = req.file;
      
      console.log('Upload request received for task:', taskId, 'File:', file?.originalname);
      
      if (!file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Get task and business registration info
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Tarefa não encontrada" });
      }

      const registration = await storage.getBusinessRegistration(task.businessRegistrationId);
      if (!registration) {
        return res.status(404).json({ message: "Empresa não encontrada" });
      }

      // Create subfolder based on task title
      const subfolderName = task.title.toUpperCase().replace(/[^A-Z0-9]/g, '_');
      
      // Get or create company folder structure
      const folderStructure = await googleDriveService.createBusinessFolderStructure(
        registration.razaoSocial, 
        registration.id
      );
      
      // Create task-specific subfolder in DEPTO SOCIETARIO
      const taskFolderId = await googleDriveService.createFolder(
        subfolderName, 
        folderStructure.societarioFolderId
      );

      // Upload file to task subfolder
      const fileName = `${task.title}_${Date.now()}_${file.originalname}`;
      const driveFileId = await googleDriveService.uploadFile(
        fileName,
        file.buffer,
        file.mimetype,
        taskFolderId
      );

      // Save file record to database
      const taskFile = await storage.createTaskFile({
        taskId: taskId,
        fileName: fileName,
        originalName: file.originalname,
        filePath: driveFileId,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: (req as any).user.userId
      });

      res.json({
        message: "Arquivo enviado com sucesso",
        file: taskFile,
        driveFileId: driveFileId
      });
    } catch (error) {
      console.error("Error uploading task file:", error);
      res.status(500).json({ message: "Erro ao fazer upload do arquivo" });
    }
  });

  // Get task files
  app.get("/api/internal/tasks/:id/files", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const files = await storage.getTaskFiles(taskId);
      res.json(files);
    } catch (error) {
      console.error("Error getting task files:", error);
      res.status(500).json({ message: "Erro ao buscar arquivos da tarefa" });
    }
  });

  // Download task file
  app.get("/api/internal/files/:fileId/download", authenticateToken, async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const taskFile = await storage.getTaskFileById(fileId);
      
      if (!taskFile) {
        return res.status(404).json({ message: "Arquivo não encontrado" });
      }

      // Extract Google Drive file ID from URL or use as-is if it's already an ID
      let driveFileId = taskFile.filePath;
      if (taskFile.filePath.includes('drive.google.com')) {
        const match = taskFile.filePath.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) {
          driveFileId = match[1];
        }
      }

      // Download from Google Drive using the extracted file ID
      const fileBuffer = await googleDriveService.downloadFile(driveFileId);
      
      res.setHeader('Content-Disposition', `attachment; filename="${taskFile.originalName}"`);
      res.setHeader('Content-Type', taskFile.mimeType || 'application/octet-stream');
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading task file:", error);
      res.status(500).json({ message: "Erro ao baixar arquivo" });
    }
  });

  // Update task field (observações, data lembrete, etc)
  app.put("/api/internal/tasks/:id/field", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { field, value } = req.body;
      
      const updatedTask = await storage.updateTaskField(taskId, field, value);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task field:", error);
      res.status(500).json({ message: "Erro ao atualizar campo da tarefa" });
    }
  });

  // Update task status
  app.put("/api/internal/tasks/:id/status", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const { status } = req.body;
      const userId = req.user!.id; // Corrigido para usar req.user.id
      
      const updatedTask = await storage.updateTaskStatus(taskId, status, userId);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Erro ao atualizar status da tarefa" });
    }
  });

  // Delete business registration
  app.delete("/api/internal/business-registrations/:id", authenticateToken, requireRole('admin'), async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      
      // Delete all tasks associated with this registration
      const tasks = await storage.getTasksByRegistration(registrationId);
      for (const task of tasks) {
        // Delete all files for each task
        const files = await storage.getTaskFiles(task.id);
        for (const file of files) {
          await storage.deleteTaskFile(file.id);
        }
        // Delete the task
        await storage.deleteTask(task.id);
      }
      
      // Delete the business registration
      await storage.deleteBusinessRegistration(registrationId);
      
      res.json({ message: "Empresa deletada com sucesso" });
    } catch (error) {
      console.error("Error deleting business registration:", error);
      res.status(500).json({ message: "Erro ao deletar empresa" });
    }
  });

  // Export to Excel
  app.get("/api/internal/export/excel", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrationsWithTasks();
      // XLSX already imported
      
      // Prepare data for Excel with safe property access
      const excelData = registrations.map((reg: any) => {
        const socios = reg.socios && typeof reg.socios === 'object' && Array.isArray(reg.socios) 
          ? reg.socios.map((s: any) => s.nomeCompleto || 'Nome não informado').join('; ')
          : 'Nenhum sócio cadastrado';

        const tarefas = reg.tasks && Array.isArray(reg.tasks) 
          ? reg.tasks.map((t: any) => `${t.title} (${t.status === 'pending' ? 'Pendente' : t.status === 'in_progress' ? 'Em Andamento' : 'Concluída'})`).join('; ')
          : 'Nenhuma tarefa';

        const statusGeral = reg.tasks && Array.isArray(reg.tasks) && reg.tasks.length > 0
          ? (reg.tasks.every((t: any) => t.status === 'completed') ? 'Todas Concluídas' :
             reg.tasks.some((t: any) => t.status === 'in_progress') ? 'Em Andamento' : 
             reg.tasks.some((t: any) => t.status === 'pending') ? 'Pendente' : 'Sem Status')
          : 'Sem Tarefas';

        return {
          'ID': reg.id || '',
          'Razão Social': reg.razaoSocial || '',
          'Nome Fantasia': reg.nomeFantasia || '',
          'Email': reg.emailEmpresa || '',
          'Telefone': reg.telefoneEmpresa || '',
          'Endereço': reg.endereco || '',
          'Capital Social': reg.capitalSocial || '',
          'Atividade Principal': reg.atividadePrincipal || '',
          'Data Cadastro': reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('pt-BR') : '',
          'Sócios': socios,
          'Tarefas': tarefas,
          'Status Geral': statusGeral
        };
      });

      // Create workbook
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-width columns
      const colWidths = [
        {wch: 8},   // ID
        {wch: 35},  // Razão Social
        {wch: 25},  // Nome Fantasia
        {wch: 30},  // Email
        {wch: 18},  // Telefone
        {wch: 45},  // Endereço
        {wch: 18},  // Capital Social
        {wch: 35},  // Atividade Principal
        {wch: 15},  // Data Cadastro
        {wch: 50},  // Sócios
        {wch: 60},  // Tarefas
        {wch: 20}   // Status Geral
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Empresas');

      // Generate buffer with proper options
      const buffer = XLSX.write(wb, { 
        type: 'buffer', 
        bookType: 'xlsx',
        cellStyles: true,
        sheetStubs: false
      });

      // Set proper headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="empresas_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.setHeader('Content-Length', buffer.length);
      
      res.end(buffer);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({ message: "Erro ao exportar para Excel", error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  });

  // Export to PDF
  app.get("/api/internal/export/pdf", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrationsWithTasks();
      // puppeteer already imported

      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
      });
      const page = await browser.newPage();

      // Safe data processing
      const safeRegistrations = registrations.map((reg: any) => ({
        id: reg.id || 0,
        razaoSocial: reg.razaoSocial || 'Não informado',
        nomeFantasia: reg.nomeFantasia || 'Não informado',
        emailEmpresa: reg.emailEmpresa || 'Não informado',
        telefoneEmpresa: reg.telefoneEmpresa || 'Não informado',
        endereco: reg.endereco || 'Não informado',
        capitalSocial: reg.capitalSocial || 'Não informado',
        atividadePrincipal: reg.atividadePrincipal || 'Não informado',
        createdAt: reg.createdAt ? new Date(reg.createdAt).toLocaleDateString('pt-BR') : 'Não informado',
        socios: reg.socios && Array.isArray(reg.socios) ? reg.socios : []
      }));

      // Create HTML content
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Empresas</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            h1 { 
              color: #2c3e50; 
              text-align: center; 
              margin-bottom: 30px; 
              font-size: 24px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 40px; 
              padding: 20px;
              border-bottom: 2px solid #3498db;
            }
            .company { 
              margin-bottom: 30px; 
              border: 1px solid #ddd; 
              padding: 20px; 
              border-radius: 8px;
              background: #f9f9f9;
            }
            .company-title { 
              font-size: 18px; 
              font-weight: bold; 
              color: #2c3e50; 
              margin-bottom: 15px;
              border-bottom: 1px solid #3498db;
              padding-bottom: 8px;
            }
            .info-row { 
              margin-bottom: 8px; 
              display: flex;
            }
            .label { 
              font-weight: bold; 
              color: #34495e; 
              min-width: 150px;
            }
            .value {
              flex: 1;
              color: #2c3e50;
            }
            .partners { 
              margin-top: 20px; 
              padding: 15px;
              background: #ecf0f1;
              border-radius: 5px;
            }
            .partner { 
              background: #fff; 
              padding: 12px; 
              margin: 8px 0; 
              border-left: 4px solid #3498db;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório de Empresas Cadastradas</h1>
            <p><strong>Data do Relatório:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de Empresas:</strong> ${safeRegistrations.length}</p>
          </div>

          ${safeRegistrations.map((reg, index) => `
            <div class="company">
              <div class="company-title">${reg.razaoSocial}</div>
              <div class="info-row">
                <span class="label">ID:</span>
                <span class="value">${reg.id}</span>
              </div>
              <div class="info-row">
                <span class="label">Nome Fantasia:</span>
                <span class="value">${reg.nomeFantasia}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${reg.emailEmpresa}</span>
              </div>
              <div class="info-row">
                <span class="label">Telefone:</span>
                <span class="value">${reg.telefoneEmpresa}</span>
              </div>
              <div class="info-row">
                <span class="label">Endereço:</span>
                <span class="value">${reg.endereco}</span>
              </div>
              <div class="info-row">
                <span class="label">Capital Social:</span>
                <span class="value">${reg.capitalSocial}</span>
              </div>
              <div class="info-row">
                <span class="label">Atividade Principal:</span>
                <span class="value">${reg.atividadePrincipal}</span>
              </div>
              <div class="info-row">
                <span class="label">Data de Cadastro:</span>
                <span class="value">${reg.createdAt}</span>
              </div>
              
              ${reg.socios.length > 0 ? `
                <div class="partners">
                  <div class="label" style="margin-bottom: 10px;">Sócios:</div>
                  ${reg.socios.map((socio: any) => `
                    <div class="partner">
                      <strong>${socio.nomeCompleto || 'Nome não informado'}</strong><br>
                      <span>CPF: ${socio.cpf || 'Não informado'}</span> | 
                      <span>RG: ${socio.rg || 'Não informado'}</span><br>
                      <span>Participação: ${socio.percentualSociedade || 'Não informado'}%</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<div style="margin-top: 15px; color: #7f8c8d;"><em>Nenhum sócio cadastrado</em></div>'}
            </div>
          `).join('')}
        </body>
        </html>
      `;

      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="relatorio_empresas_${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.end(pdfBuffer);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      res.status(500).json({ message: "Erro ao exportar para PDF", error: error instanceof Error ? error.message : 'Erro desconhecido' });
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
      // bcrypt already imported
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

  // Contratação de Funcionários
  app.post("/api/contratacao-funcionarios", upload.array('documentos', 10), async (req, res) => {
    try {
      console.log('Recebendo solicitação de contratação:', req.body);
      console.log('Arquivos recebidos:', req.files?.length || 0);
      
      // Validar dados básicos
      const requiredFields = ['razaoSocial', 'cnpj', 'nomeFuncionario', 'cpfFuncionario'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({ message: `Campo obrigatório: ${field}` });
        }
      }

      // Criar pasta no Google Drive
      const folderName = `Contratação - ${req.body.nomeFuncionario} - ${Date.now()}`;
      let folderId;
      let documentUrls: string[] = [];

      try {
        folderId = await googleDriveService.createFolder(folderName);
        console.log('Pasta criada no Google Drive:', folderId);

        // Upload dos documentos
        if (req.files && Array.isArray(req.files)) {
          for (const file of req.files) {
            const fileName = `${file.originalname}`;
            const fileId = await googleDriveService.uploadFile(
              fileName,
              file.buffer,
              file.mimetype,
              folderId
            );
            const fileUrl = `https://drive.google.com/file/d/${fileId}/view`;
            documentUrls.push(fileUrl);
            console.log('Arquivo enviado:', fileName, fileId);
          }
        }
      } catch (error) {
        console.error('Erro no Google Drive:', error);
      }

      // Simular salvamento (adicionar ao banco quando necessário)
      const contratacao = {
        id: Date.now(),
        ...req.body,
        documentUrls,
        folderId,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };

      console.log('Contratação salva:', contratacao.id);

      res.json({ 
        message: "Solicitação de contratação recebida com sucesso!",
        id: contratacao.id,
        folderUrl: folderId ? `https://drive.google.com/drive/folders/${folderId}` : null
      });
    } catch (error) {
      console.error("Erro ao processar contratação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
