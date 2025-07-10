import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertBusinessRegistrationSchema } from "@shared/schema";
import { insertContratacaoSchema } from "@shared/contratacao-schema";
import multer from "multer";
import { z } from "zod";
import { generateBusinessRegistrationPDF } from "./services/pdf";
import { sendConfirmationEmail } from "./services/email";
import { googleDriveService } from "./services/googledrive";
import { googleDriveNewService } from "./services/googledrive-new";
import { googleDriveSharedService } from "./services/googledrive-shared";
import { sendContratacaoEmails } from "./services/contratacao-email";
import { webhookService } from "./services/webhook";
import { generateContratacaoPDF } from "./services/contratacao-pdf";
import { alternativeUploadService } from "./services/alternative-upload";
import { authenticateToken, generateToken } from "./auth";
import bcrypt from "bcrypt";
import { seedTaskTemplates, createAdminUser } from "./seedData";
import XLSX from "xlsx";
import puppeteer from "puppeteer";
import express from "express";
import path from "path";

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
  // Serve static files from public directory
  const publicPath = path.resolve(process.cwd(), "public");
  app.use(express.static(publicPath));

  // Initialize seed data
  await seedTaskTemplates();
  await createAdminUser();

  // Traditional Auth routes
  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username e senha são obrigatórios' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Usuário inativo' });
      }

      const token = generateToken(user);
      const userResponse = { ...user, password: undefined };
      
      res.json({ user: userResponse, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.get('/api/user', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const userResponse = { ...user, password: undefined };
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile endpoint - secure route for profile data
  app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Get fresh user data from database
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Usuário inativo' });
      }

      // Return user profile without sensitive data
      const userProfile = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Erro ao buscar perfil do usuário" });
    }
  });

  // Update user profile endpoint - secure route for profile updates
  app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      const { name, email, department, currentPassword, newPassword } = req.body;
      
      // Validate input
      if (!name || !email) {
        return res.status(400).json({ message: 'Nome e email são obrigatórios' });
      }

      // Get current user data
      const currentUser = await storage.getUser(req.user.id);
      if (!currentUser) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Prepare update data
      const updateData: any = {
        name: name.trim(),
        email: email.trim(),
        department: department?.trim()
      };

      // Handle password change if provided
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ message: 'Senha atual é obrigatória para alterar a senha' });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isValidPassword) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }

        // Validate new password
        if (newPassword.length < 6) {
          return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updateData.password = hashedPassword;
      }

      // Update user
      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      // Return updated profile without sensitive data
      const userProfile = {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      };

      res.json(userProfile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Erro ao atualizar perfil do usuário" });
    }
  });

  // Protected route example
  app.get("/api/protected", authenticateToken, async (req, res) => {
    const userId = req.user?.id;
    res.json({ message: "This is a protected route", userId });
  });

  // User management routes
  app.get('/api/users', authenticateToken, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersResponse = users.map(user => ({ ...user, password: undefined }));
      res.json(usersResponse);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Erro ao buscar usuários" });
    }
  });

  app.post('/api/users', authenticateToken, async (req, res) => {
    try {
      const { username, password, name, email, role, department } = req.body;
      
      if (!username || !password || !name) {
        return res.status(400).json({ message: 'Nome de usuário, senha e nome são obrigatórios' });
      }

      // Verificar se o usuário atual é admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Apenas administradores podem criar usuários' });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        name,
        email: email || null,
        role: role || 'user',
        department: department || null,
        isActive: true
      });

      const userResponse = { ...newUser, password: undefined };
      res.json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  app.patch('/api/users/:id', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { name, email, role, department } = req.body;

      // Verificar se o usuário pode editar este perfil
      const isAdmin = req.user?.role === 'admin';
      const isOwnProfile = req.user?.id === userId;
      
      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({ message: 'Você só pode editar seu próprio perfil ou ser administrador' });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (department !== undefined) updateData.department = department;
      
      // Apenas admins podem alterar role
      if (role !== undefined && isAdmin) {
        updateData.role = role;
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      const userResponse = { ...updatedUser, password: undefined };
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);

      // Verificar se o usuário atual é admin
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Apenas administradores podem deletar usuários' });
      }

      // Não permitir que o admin delete a si mesmo
      if (req.user?.id === userId) {
        return res.status(400).json({ message: 'Não é possível deletar seu próprio usuário' });
      }

      await storage.deleteUser(userId);
      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Erro ao deletar usuário" });
    }
  });

  // Change user password route
  app.patch('/api/users/:id/password', authenticateToken, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { password, currentPassword, newPassword } = req.body;

      // Verificar se o usuário pode alterar esta senha
      const isAdmin = req.user?.role === 'admin';
      const isOwnProfile = req.user?.id === userId;
      
      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({ message: 'Você só pode alterar sua própria senha ou ser administrador' });
      }

      // Para usuários alterando sua própria senha, verificar senha atual
      if (isOwnProfile && !isAdmin) {
        if (!currentPassword || !newPassword) {
          return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
        }

        // Buscar usuário atual para verificar senha
        const currentUser = await storage.getUser(userId);
        if (!currentUser) {
          return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        // Verificar senha atual
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: 'Senha atual incorreta' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ message: 'Nova senha deve ter pelo menos 6 caracteres' });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        const updatedUser = await storage.updateUser(userId, {
          password: hashedPassword
        });
        
        return res.json({ message: 'Senha alterada com sucesso' });
      }

      // Para admins alterando senha de outros usuários
      if (isAdmin) {
        const adminPassword = password || newPassword;
        if (!adminPassword || adminPassword.length < 6) {
          return res.status(400).json({ message: 'Senha deve ter pelo menos 6 caracteres' });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const updatedUser = await storage.updateUser(userId, {
          password: hashedPassword
        });

        return res.json({ message: 'Senha alterada com sucesso' });
      }

    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Erro ao alterar senha" });
    }
  });

  // Business registration route (public)
  app.post("/api/business-registration", upload.fields([
    { name: 'documentoComFoto_0', maxCount: 1 },
    { name: 'certidaoCasamento_0', maxCount: 1 },
    { name: 'documentosAdicionais_0', maxCount: 10 },
    { name: 'documentoComFoto_1', maxCount: 1 },
    { name: 'certidaoCasamento_1', maxCount: 1 },
    { name: 'documentosAdicionais_1', maxCount: 10 },
    { name: 'documentoComFoto_2', maxCount: 1 },
    { name: 'certidaoCasamento_2', maxCount: 1 },
    { name: 'documentosAdicionais_2', maxCount: 10 },
    { name: 'documentoComFoto_3', maxCount: 1 },
    { name: 'certidaoCasamento_3', maxCount: 1 },
    { name: 'documentosAdicionais_3', maxCount: 10 },
    { name: 'documentoComFoto_4', maxCount: 1 },
    { name: 'certidaoCasamento_4', maxCount: 1 },
    { name: 'documentosAdicionais_4', maxCount: 10 },
  ]), async (req, res) => {
    try {
      console.log("Received business registration request");
      console.log("Body:", req.body);
      console.log("Files:", req.files);

      // Parse and validate the request body
      let businessData;
      try {
        businessData = JSON.parse(req.body.businessData);
        console.log("Parsed business data:", businessData);
      } catch (parseError) {
        console.error("Error parsing business data:", parseError);
        return res.status(400).json({ 
          message: "Invalid business data format",
          error: parseError instanceof Error ? parseError.message : "Unknown parsing error"
        });
      }

      // Validate business data
      const validationResult = insertBusinessRegistrationSchema.safeParse(businessData);
      if (!validationResult.success) {
        console.error("Validation errors:", validationResult.error.errors);
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: validationResult.error.errors 
        });
      }

      const validatedData = validationResult.data;
      console.log("Validated data:", validatedData);

      // Create the business registration in database
      const registration = await storage.createBusinessRegistration(validatedData);
      console.log("Created registration with ID:", registration.id);

      // Create Google Drive folder structure
      const folderData = await googleDriveService.createBusinessFolderStructure(
        validatedData.razaoSocial, 
        registration.id
      );
      console.log("Created Google Drive folders:", folderData);

      // Handle file uploads for each partner
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const uploadPromises = [];

      for (let i = 0; i < validatedData.socios.length; i++) {
        const partner = validatedData.socios[i];
        
        // Upload document with photo
        const docComFotoKey = `documentoComFoto_${i}`;
        if (files[docComFotoKey] && files[docComFotoKey][0]) {
          const file = files[docComFotoKey][0];
          const fileName = `${partner.nomeCompleto}_DocumentoComFoto.${file.originalname.split('.').pop()}`;
          uploadPromises.push(
            googleDriveService.uploadFile(
              fileName,
              file.buffer,
              file.mimetype,
              folderData.societarioFolderId
            )
          );
        }

        // Upload marriage certificate if exists
        const certidaoKey = `certidaoCasamento_${i}`;
        if (files[certidaoKey] && files[certidaoKey][0]) {
          const file = files[certidaoKey][0];
          const fileName = `${partner.nomeCompleto}_CertidaoCasamento.${file.originalname.split('.').pop()}`;
          uploadPromises.push(
            googleDriveService.uploadFile(
              fileName,
              file.buffer,
              file.mimetype,
              folderData.societarioFolderId
            )
          );
        }

        // Upload additional documents
        const additionalKey = `documentosAdicionais_${i}`;
        if (files[additionalKey]) {
          files[additionalKey].forEach((file, index) => {
            const fileName = `${partner.nomeCompleto}_Documento_${index + 1}.${file.originalname.split('.').pop()}`;
            uploadPromises.push(
              googleDriveService.uploadFile(
                fileName,
                file.buffer,
                file.mimetype,
                folderData.societarioFolderId
              )
            );
          });
        }
      }

      // Wait for all file uploads to complete
      await Promise.all(uploadPromises);
      console.log("All files uploaded successfully");

      // Generate PDF
      const pdfBuffer = await generateBusinessRegistrationPDF(registration);
      console.log("Generated PDF buffer, size:", pdfBuffer.length);

      // Upload PDF to Google Drive
      const pdfFileName = `${validatedData.razaoSocial}_Cadastro.pdf`;
      await googleDriveService.uploadPDF(
        pdfFileName,
        pdfBuffer,
        folderData.mainFolderId
      );
      console.log("PDF uploaded to Google Drive");

      // Send confirmation emails
      await sendConfirmationEmail(registration, folderData);
      console.log("Confirmation emails sent");

      // Create initial tasks for the registration
      await storage.createTasksForRegistration(registration.id);
      console.log("Initial tasks created");

      // Automatically create a client from the registration
      try {
        const cliente = await storage.promoverClienteFromRegistration(registration.id, {
          origem: 'website',
          status: 'novo'
        });
        console.log(`Cliente criado automaticamente com ID: ${cliente.id}`);
        
        // Create tasks for the new client as well
        await storage.createTasksForClient(cliente.id);
        console.log("Tarefas criadas para o novo cliente");
      } catch (clientError) {
        console.error("Erro ao criar cliente automaticamente:", clientError);
        // Continue even if client creation fails - registration was successful
      }

      res.status(201).json({ 
        message: "Cadastro realizado com sucesso!",
        registrationId: registration.id
      });

    } catch (error) {
      console.error("Error in business registration:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Internal management routes (protected)
  app.get("/api/internal/registrations", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrationsWithTasks();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Erro ao buscar cadastros" });
    }
  });

  // Rota alternativa para compatibilidade
  app.get("/api/internal/business-registrations/with-tasks", authenticateToken, async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrationsWithTasks();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Erro ao buscar cadastros" });
    }
  });

  // Update task status
  app.patch("/api/internal/tasks/:taskId/status", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { status } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }

      const updatedTask = await storage.updateTaskStatus(taskId, status, userId);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Erro ao atualizar status da tarefa" });
    }
  });

  // Update full task
  app.patch('/api/internal/tasks/:taskId/edit', authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { title, description, observacao, department, priority } = req.body;

      const updatedTask = await storage.updateTaskField(taskId, 'multiple', {
        title,
        description,
        observacao,
        department,
        priority
      });
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: 'Erro ao atualizar tarefa' });
    }
  });

  // Delete task
  app.delete('/api/internal/tasks/:taskId', authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      await storage.deleteTask(taskId);
      res.json({ message: 'Tarefa deletada com sucesso' });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ message: 'Erro ao deletar tarefa' });
    }
  });

  // Assign task to user
  app.patch("/api/internal/tasks/:taskId/assign", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { userId } = req.body;

      const updatedTask = await storage.assignTask(taskId, userId);
      res.json(updatedTask);
    } catch (error) {
      console.error("Error assigning task:", error);
      res.status(500).json({ message: "Erro ao atribuir tarefa" });
    }
  });

  // Create new task
  app.post("/api/internal/tasks", authenticateToken, async (req, res) => {
    try {
      const task = await storage.createTask(req.body);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Erro ao criar tarefa" });
    }
  });

  // Delete task
  app.delete("/api/internal/tasks/:taskId", authenticateToken, async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      await storage.deleteTask(taskId);
      res.json({ message: "Tarefa excluída com sucesso" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Erro ao excluir tarefa" });
    }
  });

  // Client with tasks routes
  app.get("/api/clientes/with-tasks", authenticateToken, async (req, res) => {
    try {
      const clients = await storage.getAllClientsWithTasks();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients with tasks:", error);
      res.status(500).json({ message: "Erro ao buscar clientes com tarefas" });
    }
  });

  // Create tasks for specific client
  app.post("/api/clientes/:clientId/tasks", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      
      // Se há dados da tarefa no body, criar tarefa personalizada
      if (req.body.title) {
        const customTask = await storage.createTask({
          title: req.body.title,
          description: req.body.description || null,
          status: req.body.status || 'pending',
          priority: req.body.priority || 'medium',
          department: req.body.department || 'DEPTO SOCIETARIO',
          businessRegistrationId: null,
          clienteId: clientId,
          dueDate: null,
          order: req.body.order || 1,
          assignedUserId: null
        });
        res.status(201).json([customTask]);
      } else {
        // Caso contrário, criar tarefas a partir de templates
        const tasks = await storage.createTasksForClient(clientId);
        res.status(201).json(tasks);
      }
    } catch (error) {
      console.error("Error creating tasks for client:", error);
      res.status(500).json({ message: "Erro ao criar tarefas para cliente" });
    }
  });

  // Get tasks for specific client
  app.get("/api/clientes/:clientId/tasks", authenticateToken, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const tasks = await storage.getTasksByClient(clientId);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching client tasks:", error);
      res.status(500).json({ message: "Erro ao buscar tarefas do cliente" });
    }
  });

  // Get registration by ID
  app.get("/api/business-registration/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getBusinessRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Cadastro não encontrado" });
      }
      res.json(registration);
    } catch (error) {
      console.error("Error fetching registration:", error);
      res.status(500).json({ message: "Erro ao buscar cadastro" });
    }
  });

  // Get all business registrations (public for dashboard)
  app.get("/api/business-registrations", async (req, res) => {
    try {
      const registrations = await storage.getAllBusinessRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Erro ao buscar cadastros" });
    }
  });

  // Update business registration status
  app.patch("/api/business-registration/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['pending', 'processing', 'completed'].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      const registration = await storage.getBusinessRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Cadastro não encontrado" });
      }

      const updatedRegistration = await storage.updateBusinessRegistration(id, { status });
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ message: "Erro ao atualizar status" });
    }
  });

  // Update complete business registration
  app.put("/api/business-registration/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;

      const registration = await storage.getBusinessRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Cadastro não encontrado" });
      }

      const updatedRegistration = await storage.updateBusinessRegistration(id, updateData);
      res.json(updatedRegistration);
    } catch (error) {
      console.error("Error updating registration:", error);
      res.status(500).json({ message: "Erro ao atualizar cadastro" });
    }
  });

  // Delete business registration
  app.delete("/api/business-registration/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const registration = await storage.getBusinessRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Cadastro não encontrado" });
      }

      await storage.deleteBusinessRegistration(id);
      res.json({ message: "Cadastro deletado com sucesso" });
    } catch (error) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ message: "Erro ao deletar cadastro" });
    }
  });

  // Generate and download PDF
  app.get("/api/business-registration/:id/pdf", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getBusinessRegistration(id);
      
      if (!registration) {
        return res.status(404).json({ message: "Cadastro não encontrado" });
      }

      const pdfBuffer = await generateBusinessRegistrationPDF(registration);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${registration.razaoSocial}_Cadastro.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Erro ao gerar PDF" });
    }
  });

  // Contratação de Funcionários route
  app.post("/api/contratacao-funcionarios", upload.any(), async (req, res) => {
    try {
      console.log("Processing contratacao funcionarios request...");
      
      // Parse and validate the form data
      const formData = { ...req.body };
      
      // Convert boolean fields from strings
      const booleanFields = ['valeTransporte', 'valeRefeicao', 'valeAlimentacao', 'planoSaude', 'planoDental', 'seguroVida'];
      booleanFields.forEach(field => {
        if (formData[field] === 'true') formData[field] = true;
        else if (formData[field] === 'false') formData[field] = false;
        else formData[field] = false;
      });

      // Parse dependentes if provided
      let dependentes: any[] = [];
      if (formData.dependentes) {
        try {
          const parsed = JSON.parse(formData.dependentes);
          // Ensure it's an array and clean the data
          if (Array.isArray(parsed)) {
            dependentes = parsed.map(dep => ({
              nomeCompleto: dep.nomeCompleto || '',
              dataNascimento: dep.dataNascimento || '',
              cpf: dep.cpf || ''
            }));
          }
        } catch (error) {
          console.error("Error parsing dependentes:", error);
          dependentes = [];
        }
      }

      // Remove dependentes from formData for validation
      delete formData.dependentes;

      // Convert termoCiencia from string to boolean if needed
      if (formData.termoCiencia === 'true') formData.termoCiencia = true;
      if (formData.termoCiencia === 'false') formData.termoCiencia = false;
      if (formData.termoCiencia === 'on') formData.termoCiencia = true; // HTML checkbox often sends 'on'
      if (!formData.termoCiencia) formData.termoCiencia = false;

      // Create custom validation schema - only termoCiencia is required
      const customValidationSchema = z.object({
        termoCiencia: z.boolean().refine(val => val === true, {
          message: "Você deve marcar esta caixa para concordar com as obrigações legais."
        })
      }).passthrough(); // Allow all other fields to pass through without validation

      // Validate only the required field
      const validatedData = customValidationSchema.parse(formData);
      
      // Add dependentes back after validation (serialize as JSON string)
      validatedData.dependentes = JSON.stringify(dependentes);
      
      // Prepare data for insertion - map fields correctly
      const insertData = {
        razaoSocial: validatedData.razaoSocial || null,
        cnpj: validatedData.cnpj || null,
        endereco: validatedData.endereco || null,
        telefone: validatedData.telefone || null,
        email: validatedData.email || null,
        responsavel: validatedData.responsavel || null,
        nomeFuncionario: validatedData.nomeFuncionario || null,
        nomeMae: validatedData.nomeMae || null,
        cpfFuncionario: validatedData.cpfFuncionario || null,
        rgFuncionario: validatedData.rgFuncionario || null,
        dataNascimento: validatedData.dataNascimento || null,
        estadoCivil: validatedData.estadoCivil || null,
        escolaridade: validatedData.escolaridade || null,
        endereco_funcionario: validatedData.endereco_funcionario || null,
        telefone_funcionario: validatedData.telefone_funcionario || null,
        email_funcionario: validatedData.email_funcionario || null,
        cargo: validatedData.cargo || null,
        setor: validatedData.setor || null,
        salario: validatedData.salario || null,
        cargaHoraria: validatedData.cargaHoraria || null,
        tipoContrato: validatedData.tipoContrato || null,
        dataAdmissao: validatedData.dataAdmissao || null,
        valeTransporte: validatedData.valeTransporte || false,
        valeRefeicao: validatedData.valeRefeicao || false,
        valeAlimentacao: validatedData.valeAlimentacao || false,
        planoSaude: validatedData.planoSaude || false,
        planoDental: validatedData.planoDental || false,
        seguroVida: validatedData.seguroVida || false,
        possuiCarteira: null,
        banco: validatedData.banco || null,
        agencia: validatedData.agencia || null,
        conta: validatedData.conta || null,
        tipoConta: validatedData.tipoConta || null,
        numeroPis: validatedData.numeroPis || null,
        observacoes: validatedData.observacoes || null,
        dependentes: validatedData.dependentes || null,
        googleDriveLink: null,
        status: 'pending'
      };

      // Create the contratacao record
      const contratacao = await storage.createContratacaoFuncionario(insertData);
      console.log("Contratacao record created with ID:", contratacao.id);
      
      // Use Shared Drive for file uploads
      console.log("Configuring Google Drive links...");
      const sharedDriveLink = googleDriveSharedService.getSharedDriveLink();
      const sharedFolderLink = googleDriveSharedService.getSharedFolderLink();
      
      console.log(`Shared Drive link: ${sharedDriveLink}`);
      console.log(`Shared Folder link: ${sharedFolderLink}`);
      
      // Update contratacao with Google Drive link (using Shared Drive)
      await storage.updateContratacaoFuncionario(contratacao.id, { googleDriveLink: sharedDriveLink });
      
      // Handle file uploads to Google Drive - directly to shared folder
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        console.log(`Processing ${files.length} files for upload to shared folder...`);
        try {
          // Create file prefix with ID and employee name for organization
          const prefix = `${contratacao.id}_${contratacao.nomeFuncionario || 'Funcionario'}`;
          
          for (const file of files) {
            const fileName = `${prefix}_${file.originalname}`;
            console.log(`Uploading file: ${fileName}`);
            
            try {
              // Try with Shared Drive (root)
              const result = await googleDriveNewService.uploadFile(fileName, file.buffer, file.mimetype, googleDriveSharedService.getSharedDriveId());
              console.log(`✅ File uploaded successfully to Shared Drive: ${fileName}`);
            } catch (error) {
              console.error(`❌ Upload failed to Shared Drive: ${fileName}`, error);
              // Try fallback to shared folder
              try {
                const result = await googleDriveNewService.uploadFile(fileName, file.buffer, file.mimetype, '1bGzY-dEAevVafaAwF_hjLj0g--_A9o_e');
                console.log(`✅ File uploaded to shared folder: ${fileName}`);
              } catch (fallbackError) {
                console.error(`❌ All uploads failed: ${fileName}`, fallbackError);
              }
            }
          }
        } catch (error) {
          console.error("Error processing file uploads:", error);
        }
      }
      
      // Generate PDF
      console.log("Generating PDF...");
      const pdfBuffer = await generateContratacaoPDF(contratacao);
      
      // Upload PDF to Google Drive
      try {
        const pdfFileName = `${contratacao.id}_${contratacao.razaoSocial || 'Empresa'}_Contratacao_${contratacao.nomeFuncionario || 'Funcionario'}.pdf`;
        console.log(`Uploading PDF: ${pdfFileName}`);
        
        try {
          // Try with Shared Drive (root)
          const pdfResult = await googleDriveNewService.uploadPDF(pdfFileName, pdfBuffer, googleDriveSharedService.getSharedDriveId());
          console.log("✅ PDF uploaded successfully to Shared Drive");
        } catch (error) {
          console.error("❌ PDF upload failed to Shared Drive:", error);
          // Try fallback to shared folder
          try {
            const pdfResult = await googleDriveNewService.uploadPDF(pdfFileName, pdfBuffer, '1bGzY-dEAevVafaAwF_hjLj0g--_A9o_e');
            console.log("✅ PDF uploaded successfully to shared folder");
          } catch (fallbackError) {
            console.error("❌ All PDF uploads failed:", fallbackError);
          }
        }
      } catch (error) {
        console.error("Error uploading PDF to Google Drive:", error);
        console.log("PDF generated successfully (upload failed)");
      }
      
      // Send emails
      try {
        console.log("Sending emails...");
        await sendContratacaoEmails(contratacao, sharedDriveLink);
        console.log("Emails sent successfully");
      } catch (error) {
        console.error("Error sending emails:", error);
      }
      
      // Send webhook
      try {
        console.log("Sending webhook...");
        await webhookService.sendContratacaoData(contratacao, sharedDriveLink);
        console.log("Webhook sent successfully");
      } catch (error) {
        console.error("Error sending webhook:", error);
      }
      
      res.json({ 
        message: "Solicitação de contratação enviada com sucesso!", 
        id: contratacao.id,
        googleDriveLink: sharedDriveLink
      });
    } catch (error) {
      console.error("Error creating contratacao:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Route to get all contratacao records
  app.get("/api/contratacao-funcionarios", async (req, res) => {
    try {
      const contratacoes = await storage.getAllContratacoes();
      res.json(contratacoes);
    } catch (error) {
      console.error("Error fetching contratacoes:", error);
      res.status(500).json({ message: "Erro ao buscar contratações" });
    }
  });

  // Route to get specific contratacao record
  app.get("/api/contratacao-funcionarios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contratacao = await storage.getContratacao(id);
      
      if (!contratacao) {
        return res.status(404).json({ message: "Contratação não encontrada" });
      }
      
      res.json(contratacao);
    } catch (error) {
      console.error("Error fetching contratacao:", error);
      res.status(500).json({ message: "Erro ao buscar contratação" });
    }
  });

  // Rotas para gerenciamento de clientes
  app.get('/api/clientes', async (req, res) => {
    try {
      const { 
        search, 
        cidade, 
        regimeTributario, 
        dataAberturaInicio, 
        dataAberturaFim, 
        clienteDesdeInicio, 
        clienteDesdeFim 
      } = req.query;
      
      const filters = {
        cidade,
        regimeTributario,
        dataAberturaInicio,
        dataAberturaFim,
        clienteDesdeInicio,
        clienteDesdeFim
      };
      
      const searchTerm = search && typeof search === 'string' ? search : undefined;
      const clientes = await storage.searchClientes(searchTerm, filters);
      
      res.json(clientes);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/clientes', async (req, res) => {
    try {
      const cliente = await storage.createCliente(req.body);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.get('/api/clientes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.getCliente(id);
      
      if (!cliente) {
        return res.status(404).json({ error: 'Cliente não encontrado' });
      }
      
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/clientes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.updateCliente(id, req.body);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.patch('/api/clientes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🔄 Atualizando status do cliente ${id}:`, req.body);
      const cliente = await storage.updateCliente(id, req.body);
      console.log(`✅ Cliente ${id} atualizado com sucesso:`, cliente.status);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao atualizar status do cliente:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.delete('/api/clientes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCliente(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rota para promover registro para cliente
  app.post('/api/business-registrations/:id/promover-cliente', async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      const cliente = await storage.promoverClienteFromRegistration(registrationId, req.body);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao promover cliente:', error);
      res.status(400).json({ error: 'Erro ao promover cliente' });
    }
  });

  // Rota para promover registro para cliente (novo endpoint)
  app.post('/api/business-registration/:id/promote-to-client', async (req, res) => {
    try {
      const registrationId = parseInt(req.params.id);
      const cliente = await storage.promoverClienteFromRegistration(registrationId, {
        origem: 'dashboard',
        status: 'ativo'
      });
      
      // Criar tarefas para o novo cliente
      await storage.createTasksForClient(cliente.id);
      
      res.json({ 
        message: 'Cliente criado com sucesso!',
        cliente: cliente 
      });
    } catch (error) {
      console.error('Erro ao promover cliente:', error);
      res.status(400).json({ error: 'Erro ao promover cliente' });
    }
  });

  // Rotas para histórico de IR
  app.get('/api/clientes/:id/ir-history', async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      const history = await storage.getIrHistory(clienteId);
      res.json(history);
    } catch (error) {
      console.error('Erro ao buscar histórico de IR:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/clientes/:id/ir-history', async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      await storage.saveIrToHistory(clienteId);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao salvar histórico de IR:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.put('/api/clientes/:id/ir-history/:year', async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      const year = parseInt(req.params.year);
      await storage.updateIrHistoryYear(clienteId, year, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao atualizar histórico de IR:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}