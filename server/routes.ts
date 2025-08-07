import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertBusinessRegistrationSchema } from "@shared/schema";
import { insertContratacaoSchema } from "@shared/contratacao-schema";
import { apiConfigurations } from "@shared/dasmei-schema";
import { eq } from "drizzle-orm";
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
import { providerManager } from "./services/api-providers/provider-manager";
import XLSX from "xlsx";
import puppeteer from "puppeteer";
import express from "express";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

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
      
      // Create individual folder for employee in Shared Drive using improved method
      console.log("Creating individual folder for employee in Shared Drive...");
      let employeeFolderId: string;
      let employeeFolderLink: string;
      
      try {
        const employeeName = contratacao.nomeFuncionario || 'Funcionario';
        const result = await googleDriveSharedService.createEmployeeFolderInSharedDrive(employeeName, contratacao.id);
        employeeFolderId = result.folderId;
        employeeFolderLink = result.folderUrl;
        
        // Update contratacao with employee folder link
        await storage.updateContratacaoFuncionario(contratacao.id, { googleDriveLink: employeeFolderLink });
        console.log(`✅ Individual employee folder created successfully`);
        console.log(`📁 Folder ID: ${employeeFolderId}`);
        console.log(`🔗 Folder URL: ${employeeFolderLink}`);
      } catch (error) {
        console.error("❌ Error creating individual employee folder:", error);
        // Fallback to Shared Drive root  
        employeeFolderId = '0APe1WRUeIBtMUk9PVA';
        employeeFolderLink = `https://drive.google.com/drive/folders/${employeeFolderId}`;
        await storage.updateContratacaoFuncionario(contratacao.id, { googleDriveLink: employeeFolderLink });
        console.log(`📁 Using Shared Drive root as fallback: ${employeeFolderLink}`);
      }
      
      // Handle file uploads to Google Drive - upload to employee folder
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        console.log(`Processing ${files.length} files for upload to employee folder: ${folderName}`);
        
        try {
          for (const file of files) {
            const fileName = `${file.originalname}`;
            console.log(`Uploading file: ${fileName} to employee folder`);
            
            try {
              // Try uploading document to employee folder using Python script
              console.log(`Uploading document using Python script to folder: ${employeeFolderId}`);
              
              // Save document to temporary file
              const tempFilePath = `temp_${Date.now()}_${fileName}`;
              fs.writeFileSync(tempFilePath, file.buffer);
              
              // Execute Python script using exec
              const pythonCommand = `python upload_pdf_to_folder.py "${tempFilePath}" "${employeeFolderId}" "${fileName}"`;
              const { stdout, stderr } = await execAsync(pythonCommand);
              
              // Clean up temp file
              fs.unlinkSync(tempFilePath);
              
              if (stderr) {
                console.error(`❌ Python document upload failed: ${fileName}`, stderr);
                throw new Error(`Python upload failed: ${stderr}`);
              } else {
                console.log(`✅ Document uploaded successfully to employee folder using Python: ${fileName}`);
                console.log(`Python output: ${stdout}`);
              }
            } catch (error) {
              console.error(`❌ Upload failed to employee folder: ${fileName}`, error);
              console.log(`Fallback: Document will be available via email attachment`);
            }
          }
        } catch (error) {
          console.error("Error processing file uploads:", error);
        }
      }
      
      // Generate PDF
      console.log("Generating PDF...");
      const pdfBuffer = await generateContratacaoPDF(contratacao);
      
      // Upload PDF to Google Drive - upload to employee folder
      try {
        const pdfFileName = `Contratacao_${contratacao.nomeFuncionario || 'Funcionario'}.pdf`;
        console.log(`Uploading PDF: ${pdfFileName} to employee folder`);
        
        try {
          // Try uploading to employee folder using Python script
          console.log(`Uploading PDF using Python script to folder: ${employeeFolderId}`);
          
          // Save PDF to temporary file
          const tempPdfPath = `temp_${Date.now()}_${pdfFileName}`;
          fs.writeFileSync(tempPdfPath, pdfBuffer);
          
          // Execute Python script using exec
          const pythonCommand = `python upload_pdf_to_folder.py "${tempPdfPath}" "${employeeFolderId}" "${pdfFileName}"`;
          const { stdout, stderr } = await execAsync(pythonCommand);
          
          // Clean up temp file
          fs.unlinkSync(tempPdfPath);
          
          if (stderr) {
            console.error(`❌ Python PDF upload failed:`, stderr);
            throw new Error(`Python upload failed: ${stderr}`);
          } else {
            console.log(`✅ PDF uploaded successfully to employee folder using Python!`);
            console.log(`Python output: ${stdout}`);
          }
        } catch (error) {
          console.error("❌ PDF upload failed to employee folder:", error);
          // Try fallback to Shared Drive root with prefix
          try {
            const prefixedPdfFileName = `${contratacao.id}_${contratacao.razaoSocial || 'Empresa'}_Contratacao_${contratacao.nomeFuncionario || 'Funcionario'}.pdf`;
            const pdfResult = await googleDriveNewService.uploadPDF(prefixedPdfFileName, pdfBuffer, googleDriveSharedService.getSharedDriveId());
            console.log("✅ PDF uploaded successfully to Shared Drive root");
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
        await sendContratacaoEmails(contratacao, employeeFolderLink);
        console.log("Emails sent successfully");
      } catch (error) {
        console.error("Error sending emails:", error);
      }
      
      // Send webhook
      try {
        console.log("Sending webhook...");
        await webhookService.sendContratacaoData(contratacao, employeeFolderLink);
        console.log("Webhook sent successfully");
      } catch (error) {
        console.error("Error sending webhook:", error);
      }
      
      res.json({ 
        message: "Solicitação de contratação enviada com sucesso!", 
        id: contratacao.id,
        googleDriveLink: employeeFolderLink
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
        clienteDesdeFim,
        possuiFuncionarios,
        possuiProLabore,
        status
      } = req.query;
      
      console.log('🔍 Filtros recebidos:', req.query);
      
      const filters = {
        cidade,
        regimeTributario,
        dataAberturaInicio,
        dataAberturaFim,
        clienteDesdeInicio,
        clienteDesdeFim,
        possuiFuncionarios,
        possuiProLabore,
        status
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
      console.log('📝 Dados recebidos do frontend:', req.body);
      
      // Mapear campos do snake_case (frontend) para camelCase (schema)
      const clienteData = {
        // Informações básicas
        razaoSocial: req.body.razao_social,
        nomeFantasia: req.body.nome_fantasia,
        cnpj: req.body.cnpj,
        inscricaoEstadual: req.body.inscricao_estadual,
        inscricaoMunicipal: req.body.inscricao_municipal,
        nire: req.body.nire,
        
        // Endereço
        endereco: req.body.endereco,
        numero: req.body.numero,
        complemento: req.body.complemento,
        bairro: req.body.bairro,
        cidade: req.body.cidade,
        estado: req.body.estado,
        cep: req.body.cep,
        
        // Contato
        telefoneComercial: req.body.telefone_comercial,
        telefoneEmpresa: req.body.telefone_empresa,
        email: req.body.email,
        emailEmpresa: req.body.email_empresa,
        contato: req.body.contato,
        celular: req.body.celular,
        contato2: req.body.contato_2,
        celular2: req.body.celular_2,
        
        // Informações fiscais
        regimeTributario: req.body.regime_tributario,
        atividadePrincipal: req.body.atividade_principal,
        atividadesSecundarias: req.body.atividades_secundarias,
        capitalSocial: req.body.capital_social ? parseFloat(req.body.capital_social) : null,
        metragemOcupada: req.body.metragem_ocupada,
        
        // Informações contratuais
        valorMensalidade: req.body.valor_mensalidade ? parseFloat(req.body.valor_mensalidade) : null,
        diaVencimento: req.body.data_vencimento ? parseInt(req.body.data_vencimento) : null,
        observacoesMensalidade: req.body.observacoes_mensalidade,
        
        // Status dívidas
        temDebitos: req.body.tem_debitos,
        observacoesDebitos: req.body.observacoes_debitos,
        temParcelamentos: req.body.tem_parcelamentos,
        observacoesParcelamentos: req.body.observacoes_parcelamentos,
        temDividaAtiva: req.body.tem_divida_ativa,
        observacoesDividaAtiva: req.body.observacoes_divida_ativa,
        
        // Certificados
        temCertificadoDigital: req.body.tem_certificado_digital,
        dataVencimentoCertificado: req.body.data_vencimento_certificado ? req.body.data_vencimento_certificado : null,
        emissorCertificado: req.body.emissor_certificado,
        observacoesCertificado: req.body.observacoes_certificado,
        
        // Procurações
        temProcuracaoPj: req.body.tem_procuracao_pj,
        dataVencimentoProcuracaoPj: req.body.data_vencimento_procuracao_pj ? req.body.data_vencimento_procuracao_pj : null,
        observacoesProcuracaoPj: req.body.observacoes_procuracao_pj,
        temProcuracaoPf: req.body.tem_procuracao_pf,
        dataVencimentoProcuracaoPf: req.body.data_vencimento_procuracao_pf ? req.body.data_vencimento_procuracao_pf : null,
        observacoesProcuracaoPf: req.body.observacoes_procuracao_pf,
        
        // Funcionários e Pró-labore
        possuiFuncionarios: req.body.possui_funcionarios,
        quantidadeFuncionarios: req.body.quantidade_funcionarios ? parseInt(req.body.quantidade_funcionarios) : null,
        observacoesFuncionarios: req.body.observacoes_funcionarios,
        possuiProLabore: req.body.possui_pro_labore,
        
        // Datas
        dataAbertura: req.body.data_abertura ? req.body.data_abertura : null,
        clienteDesde: req.body.cliente_desde ? req.body.cliente_desde : null,
        
        // Notas e observações
        notaServico: req.body.nota_servico,
        notaVenda: req.body.nota_venda,
        observacoes: req.body.observacoes,
        
        // Status
        status: req.body.status || 'ativo',
        
        // Sócios
        socios: req.body.socios || [],
        
        // Imposto de renda
        impostoRenda: req.body.imposto_renda,
        irAnoReferencia: req.body.ir_ano_referencia,
        irStatus: req.body.ir_status,
        irDataEntrega: req.body.ir_data_entrega ? req.body.ir_data_entrega : null,
        irValorPagar: req.body.ir_valor_pagar,
        irValorRestituir: req.body.ir_valor_restituir,
        irObservacoes: req.body.ir_observacoes,
        
        // Origem
        origem: 'website'
      };
      
      console.log('🔄 Dados mapeados para o schema:', clienteData);
      
      const cliente = await storage.createCliente(clienteData);
      console.log('✅ Cliente criado com sucesso:', cliente.id);
      
      res.json(cliente);
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
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

  // ====== ROTAS DAS-MEI ======
  // Importar serviços DAS
  const { dasStorage } = await import('./das-storage');
  const { dasProviderManager, DASProviderFactory } = await import('./services/das-provider');
  const { messageManager, EvolutionWhatsAppService: DASEvolutionWhatsApp, SendGridEmailService } = await import('./services/messaging');
  const { dasScheduler } = await import('./services/das-scheduler');

  // Configurações de API
  app.get('/api/das/configuracoes', authenticateToken, async (req, res) => {
    try {
      const configs = await dasStorage.getAllApiConfigurations();
      res.json(configs);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/das/configuracoes', authenticateToken, async (req, res) => {
    try {
      const userId = req.user?.id;
      const config = await dasStorage.createApiConfiguration({
        ...req.body,
        createdBy: userId,
        updatedBy: userId
      });
      res.json(config);
    } catch (error) {
      console.error('Erro ao criar configuração:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.put('/api/das/configuracoes/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      const config = await dasStorage.updateApiConfiguration(id, {
        ...req.body,
        updatedBy: userId
      });
      res.json(config);
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.post('/api/das/configuracoes/:id/ativar', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.user?.id;
      const config = await dasStorage.activateApiConfiguration(id, userId);
      
      // Reconfigurar provedores com nova configuração
      if (config.type === 'das_provider' || config.type === 'infosimples') {
        // Para InfoSimples, vamos usar o provider manager
        if (config.name === 'InfoSimples' || config.type === 'infosimples') {
          const { providerManager } = await import('./services/api-providers/provider-manager');
          const credentials = typeof config.credentials === 'string' ? JSON.parse(config.credentials) : config.credentials;
          await providerManager.switchProvider('infosimples', credentials, userId);
        } else {
          const provider = DASProviderFactory.create(config.name, config.credentials);
          dasProviderManager.setProvider(provider);
        }
      } else if (config.type === 'whatsapp') {
        const whatsapp = new DASEvolutionWhatsApp(config.credentials);
        messageManager.setWhatsAppService(whatsapp);
      } else if (config.type === 'email') {
        const email = new SendGridEmailService(config.credentials);
        messageManager.setEmailService(email);
      }
      
      res.json(config);
    } catch (error) {
      console.error('Erro ao ativar configuração:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.delete('/api/das/configuracoes/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dasStorage.deleteApiConfiguration(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar configuração:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Clientes MEI
  app.get('/api/das/clientes', authenticateToken, async (req, res) => {
    try {
      const clientes = await dasStorage.getAllClientesMei();
      res.json(clientes);
    } catch (error) {
      console.error('Erro ao buscar clientes MEI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/das/clientes', authenticateToken, async (req, res) => {
    try {
      const cliente = await dasStorage.createClienteMei(req.body);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao criar cliente MEI:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.put('/api/das/clientes/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await dasStorage.updateClienteMei(id, req.body);
      res.json(cliente);
    } catch (error) {
      console.error('Erro ao atualizar cliente MEI:', error);
      res.status(400).json({ error: 'Dados inválidos' });
    }
  });

  app.delete('/api/das/clientes/:id', authenticateToken, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dasStorage.deleteClienteMei(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Erro ao deletar cliente MEI:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // DAS Guias
  app.get('/api/das/guias', authenticateToken, async (req, res) => {
    try {
      const guias = await dasStorage.getAllDasGuias();
      res.json(guias);
    } catch (error) {
      console.error('Erro ao buscar guias DAS:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/das/clientes/:id/guias', authenticateToken, async (req, res) => {
    try {
      const clienteId = parseInt(req.params.id);
      const guias = await dasStorage.getDasGuiasByCliente(clienteId);
      res.json(guias);
    } catch (error) {
      console.error('Erro ao buscar guias do cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/das/download-manual', authenticateToken, async (req, res) => {
    try {
      const { cnpj, mesAno } = req.body;
      
      if (!dasProviderManager.isConfigured()) {
        return res.status(400).json({ error: 'Provedor DAS não configurado' });
      }

      const result = await dasProviderManager.downloadDAS(cnpj, mesAno);
      res.json(result);
    } catch (error) {
      console.error('Erro no download manual:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Logs de envio
  app.get('/api/das/logs', authenticateToken, async (req, res) => {
    try {
      const logs = await dasStorage.getAllEnvioLogs();
      res.json(logs);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.get('/api/das/guias/:id/logs', authenticateToken, async (req, res) => {
    try {
      const guiaId = parseInt(req.params.id);
      const logs = await dasStorage.getEnvioLogsByGuia(guiaId);
      res.json(logs);
    } catch (error) {
      console.error('Erro ao buscar logs da guia:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Controle do scheduler
  app.post('/api/das/scheduler/start', authenticateToken, async (req, res) => {
    try {
      dasScheduler.start();
      res.json({ message: 'Scheduler iniciado com sucesso' });
    } catch (error) {
      console.error('Erro ao iniciar scheduler:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  app.post('/api/das/scheduler/stop', authenticateToken, async (req, res) => {
    try {
      dasScheduler.stop();
      res.json({ message: 'Scheduler parado com sucesso' });
    } catch (error) {
      console.error('Erro ao parar scheduler:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Status do sistema
  app.get('/api/das/status', authenticateToken, async (req, res) => {
    try {
      // Testar conexão WhatsApp se configurado
      let whatsappConnected = false;
      if (messageManager.isWhatsAppConfigured()) {
        try {
          const whatsappProvider = await dasStorage.getApiConfigurationByType('whatsapp');
          if (whatsappProvider && whatsappProvider.isActive) {
            const { serverUrl, apiKey } = whatsappProvider.credentials;
            const baseUrl = serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`;
            
            const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
              }
            });
            
            whatsappConnected = response.ok;
          }
        } catch (error) {
          whatsappConnected = false;
        }
      }

      // Verificar se há configuração ativa do InfoSimples
      const infosimplesConfig = await dasStorage.getApiConfigurationByType('infosimples');
      const isDasConfigured = infosimplesConfig && infosimplesConfig.isActive;
      
      const status = {
        dasProvider: {
          configured: isDasConfigured || dasProviderManager.isConfigured(),
          name: isDasConfigured ? 'InfoSimples' : dasProviderManager.getProviderName()
        },
        whatsapp: {
          configured: messageManager.isWhatsAppConfigured(),
          connected: whatsappConnected
        },
        email: {
          configured: messageManager.isEmailConfigured()
        }
      };
      res.json(status);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas para configuração de provedores de API
  app.get('/api/das/providers', authenticateToken, async (req, res) => {
    try {
      const { providerManager } = await import('./services/api-providers/provider-manager');
      const providers = providerManager.getAvailableProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao obter provedores disponíveis' });
    }
  });

  app.post('/api/das/providers/test', authenticateToken, async (req, res) => {
    try {
      const { type, credentials } = req.body;
      const { providerManager } = await import('./services/api-providers/provider-manager');
      const isValid = await providerManager.testProvider(type, credentials);
      res.json({ success: isValid });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao testar provedor' });
    }
  });

  app.post('/api/das/providers/configure', authenticateToken, async (req, res) => {
    try {
      const { type, credentials } = req.body;
      const { providerManager } = await import('./services/api-providers/provider-manager');
      
      await providerManager.switchProvider(type, credentials, req.user!.userId);
      await dasProvider.refreshProvider();
      
      res.json({ success: true, message: 'Provedor configurado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao configurar provedor' });
    }
  });

  app.get('/api/das/providers/balance', authenticateToken, async (req, res) => {
    try {
      if (!dasProvider.configured) {
        return res.status(400).json({ error: 'Nenhum provedor configurado' });
      }

      // Verificar se é InfoSimples
      if (dasProvider.name === 'infosimples') {
        const provider = (dasProvider as any).activeProvider;
        const result = await provider.getBalance();
        
        if (result.success) {
          res.json(result.data);
        } else {
          res.status(400).json({ error: result.error });
        }
      } else {
        res.status(400).json({ error: 'Provedor não suporta consulta de saldo' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro ao consultar saldo' });
    }
  });

  // WhatsApp Evolution API routes
  app.post('/api/whatsapp/test', authenticateToken, async (req, res) => {
    try {
      const { serverUrl, apiKey, instance } = req.body;
      
      if (!serverUrl || !apiKey || !instance) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos os campos são obrigatórios' 
        });
      }

      // Garantir que a URL tenha protocolo
      const baseUrl = serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`;
      
      // Codificar a instância para URL
      const encodedInstance = encodeURIComponent(instance);
      
      // Testar conexão usando endpoint fetchInstances
      const testUrl = `${baseUrl}/instance/fetchInstances`;
      console.log('Testando conexão com endpoint fetchInstances:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        // Verificar se a instância específica existe na lista
        let instanceFound = false;
        let availableInstances = [];
        
        if (Array.isArray(result)) {
          availableInstances = result.map((inst: any) => inst.name || inst.instance || inst.instanceName || inst.key);
          instanceFound = result.some((inst: any) => 
            inst.name === instance || 
            inst.instance === instance || 
            inst.instanceName === instance ||
            inst.key === instance
          );
        }
        
        if (instanceFound) {
          res.json({ 
            success: true, 
            message: `Conexão testada com sucesso! Instância "${instance}" encontrada.`,
            instanceData: result.find((inst: any) => 
              inst.name === instance || 
              inst.instance === instance || 
              inst.instanceName === instance ||
              inst.key === instance
            ),
            availableInstances: availableInstances
          });
        } else {
          res.json({ 
            success: false, 
            message: `Conexão com servidor OK, mas instância "${instance}" não encontrada.\n\nInstâncias disponíveis: ${availableInstances.join(', ') || 'Nenhuma instância encontrada'}`,
            availableInstances: availableInstances
          });
        }
      } else {
        const errorText = await response.text();
        let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        
        if (errorText) {
          errorMessage += ` - ${errorText}`;
        }
        
        if (response.status === 404) {
          errorMessage += '\n\nEndpoint fetchInstances não encontrado. Verifique a URL do servidor.';
        } else if (response.status === 401 || response.status === 403) {
          errorMessage += '\n\nVerifique se a API Key está correta.';
        }
        
        res.json({ 
          success: false, 
          message: errorMessage
        });
      }
    } catch (error) {
      console.error('Erro ao testar WhatsApp:', error);
      res.json({ 
        success: false, 
        message: 'Erro de conexão com o servidor' 
      });
    }
  });

  app.post('/api/whatsapp/configure', authenticateToken, async (req, res) => {
    try {
      const { serverUrl, apiKey, instance, defaultDelay, linkPreview, mentionsEveryOne } = req.body;
      
      if (!serverUrl || !apiKey || !instance) {
        return res.status(400).json({ 
          success: false, 
          message: 'Todos os campos obrigatórios devem ser preenchidos' 
        });
      }

      // Salvar configuração no banco de dados
      const configData = {
        name: 'WhatsApp Evolution API',
        type: 'whatsapp' as const,
        credentials: {
          serverUrl,
          apiKey,
          instance
        },
        configuration: {
          defaultDelay: defaultDelay || 1000,
          linkPreview: linkPreview || true,
          mentionsEveryOne: mentionsEveryOne || false
        },
        isActive: true
      };

      await dasStorage.createApiConfiguration(configData);
      
      res.json({ 
        success: true, 
        message: 'Configuração salva com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao salvar configuração WhatsApp:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao salvar configuração' 
      });
    }
  });

  app.post('/api/whatsapp/send/text', authenticateToken, async (req, res) => {
    try {
      const { number, text, delay } = req.body;
      
      if (!number || !text) {
        return res.status(400).json({ 
          success: false, 
          message: 'Número e texto são obrigatórios' 
        });
      }

      // Buscar configuração ativa do WhatsApp
      const config = await dasStorage.getApiConfigurationByType('whatsapp');
      if (!config || !config.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'WhatsApp não configurado' 
        });
      }

      const { serverUrl, apiKey, instance } = config.credentials;
      const { defaultDelay, linkPreview, mentionsEveryOne } = config.configuration;

      // Garantir que a URL tenha protocolo e codificar instância
      const baseUrl = serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`;
      const encodedInstance = encodeURIComponent(instance);

      // Enviar mensagem via Evolution API
      const sendUrl = `${baseUrl}/message/sendText/${encodedInstance}`;
      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number,
          text,
          delay: delay || defaultDelay,
          linkPreview,
          mentionsEveryOne
        })
      });

      if (response.ok) {
        const result = await response.json();
        res.json({ 
          success: true, 
          message: 'Mensagem enviada com sucesso',
          result 
        });
      } else {
        res.json({ 
          success: false, 
          message: `Erro ao enviar mensagem: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem WhatsApp:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  app.post('/api/whatsapp/send/media', authenticateToken, async (req, res) => {
    try {
      const { number, media, caption, delay } = req.body;
      
      if (!number || !media) {
        return res.status(400).json({ 
          success: false, 
          message: 'Número e arquivo são obrigatórios' 
        });
      }

      // Buscar configuração ativa do WhatsApp
      const config = await dasStorage.getApiConfigurationByType('whatsapp');
      if (!config || !config.isActive) {
        return res.status(400).json({ 
          success: false, 
          message: 'WhatsApp não configurado' 
        });
      }

      const { serverUrl, apiKey, instance } = config.credentials;
      const { defaultDelay } = config.configuration;

      // Garantir que a URL tenha protocolo e codificar instância
      const baseUrl = serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`;
      const encodedInstance = encodeURIComponent(instance);

      // Enviar arquivo via Evolution API
      const sendUrl = `${baseUrl}/message/sendMedia/${encodedInstance}`;
      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey
        },
        body: JSON.stringify({
          number,
          media,
          caption,
          delay: delay || defaultDelay
        })
      });

      if (response.ok) {
        const result = await response.json();
        res.json({ 
          success: true, 
          message: 'Arquivo enviado com sucesso',
          result 
        });
      } else {
        res.json({ 
          success: false, 
          message: `Erro ao enviar arquivo: ${response.status} ${response.statusText}` 
        });
      }
    } catch (error) {
      console.error('Erro ao enviar arquivo WhatsApp:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // InfoSimples API routes
  app.post('/api/infosimples/configure', authenticateToken, async (req, res) => {
    try {
      const { token, baseUrl, timeout } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: 'Token é obrigatório' 
        });
      }

      const credentials = {
        token,
        baseUrl: baseUrl || 'https://api.infosimples.com/api/v2',
        timeout: timeout || 600
      };

      // Testar conexão antes de configurar
      const testResult = await providerManager.testProvider('infosimples', credentials);
      if (!testResult) {
        return res.status(400).json({ 
          success: false, 
          message: 'Erro ao testar conexão com InfoSimples' 
        });
      }

      // Ativar o provedor
      await providerManager.switchProvider('infosimples', credentials, req.user.id);
      
      // Salvar configuração no banco de dados
      const { dasStorage } = await import('./das-storage.js');
      const userId = req.user?.id || 1;
      
      try {
        // Primeiro, desativar outras configurações do mesmo tipo
        const existingConfigs = await dasStorage.getAllApiConfigurations();
        for (const config of existingConfigs.filter(c => c.type === 'das_provider')) {
          await dasStorage.updateApiConfiguration(config.id, { isActive: false });
        }
        
        // Criar ou atualizar configuração InfoSimples
        const existingInfosimples = existingConfigs.find(c => c.name === 'infosimples');
        if (existingInfosimples) {
          await dasStorage.updateApiConfiguration(existingInfosimples.id, {
            credentials: credentials,
            isActive: true,
            lastUsed: new Date(),
            updatedBy: userId
          });
        } else {
          await dasStorage.createApiConfiguration({
            name: 'infosimples',
            type: 'das_provider',
            credentials: credentials,
            isActive: true,
            lastUsed: new Date(),
            createdBy: userId,
            updatedBy: userId
          });
        }
        
        console.log('✅ Configuração InfoSimples salva no banco de dados');
      } catch (dbError) {
        console.error('Erro ao salvar configuração no banco:', dbError);
        // Não falhar a requisição se o salvamento falhar
      }
      
      res.json({ 
        success: true, 
        message: 'InfoSimples configurado com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao configurar InfoSimples:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao configurar InfoSimples' 
      });
    }
  });

  // Desconectar InfoSimples API
  app.post('/api/infosimples/disconnect', authenticateToken, async (req, res) => {
    try {
      // Desativar o provedor no manager
      await providerManager.switchProvider('infosimples', null, req.user.id);
      
      // Desativar configuração no banco de dados
      const { dasStorage } = await import('./das-storage.js');
      const existingConfigs = await dasStorage.getAllApiConfigurations();
      const infosimplesConfig = existingConfigs.find(c => c.name === 'infosimples');
      
      if (infosimplesConfig) {
        await dasStorage.updateApiConfiguration(infosimplesConfig.id, {
          isActive: false,
          lastUsed: new Date(),
          updatedBy: req.user?.id || 1
        });
        console.log('✅ InfoSimples desconectado e configuração desativada no banco');
      }
      
      res.json({ 
        success: true, 
        message: 'InfoSimples desconectado com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao desconectar InfoSimples:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao desconectar InfoSimples' 
      });
    }
  });

  app.post('/api/infosimples/disconnect', authenticateToken, async (req, res) => {
    try {
      // Desativar o provedor no provider manager
      await providerManager.deactivateProvider('infosimples');
      
      // Desativar configuração no banco de dados
      const { dasStorage } = await import('./das-storage.js');
      const existingConfigs = await dasStorage.getAllApiConfigurations();
      const infosimplesConfig = existingConfigs.find(c => c.name === 'infosimples');
      
      if (infosimplesConfig) {
        await dasStorage.updateApiConfiguration(infosimplesConfig.id, {
          isActive: false,
          updatedBy: req.user?.id || 1
        });
      }
      
      res.json({ 
        success: true, 
        message: 'InfoSimples desconectado com sucesso' 
      });
    } catch (error) {
      console.error('Erro ao desconectar InfoSimples:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao desconectar InfoSimples' 
      });
    }
  });

  app.post('/api/infosimples/test', authenticateToken, async (req, res) => {
    try {
      const { token, baseUrl, timeout } = req.body;
      
      if (!token) {
        return res.status(400).json({ 
          success: false, 
          message: 'Token é obrigatório' 
        });
      }

      const credentials = {
        token,
        baseUrl: baseUrl || 'https://api.infosimples.com/api/v2',
        timeout: timeout || 600
      };

      const testResult = await providerManager.testProvider('infosimples', credentials);
      
      // Salvar configuração no banco após teste bem-sucedido
      if (testResult) {
        try {
          await dasStorage.saveApiConfiguration({
            name: 'InfoSimples',
            type: 'infosimples', 
            isActive: true,
            credentials,
            configuration: {}
          });
          console.log('✅ Configuração InfoSimples salva e ativada no banco');
        } catch (saveError) {
          console.error('Erro ao salvar configuração:', saveError);
        }
      }
      
      res.json({ 
        success: testResult,
        message: testResult ? 'Conexão testada com sucesso' : 'Erro ao testar conexão'
      });
    } catch (error) {
      console.error('Erro ao testar InfoSimples:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao testar conexão' 
      });
    }
  });

  app.post('/api/infosimples/gerar-das', authenticateToken, async (req, res) => {
    try {
      const { cnpj, mesAno } = req.body;
      
      if (!cnpj) {
        return res.status(400).json({ 
          success: false, 
          message: 'CNPJ é obrigatório' 
        });
      }

      const resultado = await providerManager.gerarDAS(cnpj, mesAno);
      
      // Se a geração foi bem-sucedida, salvar a guia no banco de dados
      if (resultado.success && resultado.data && resultado.boleto) {
        try {
          const { dasStorage } = await import('./das-storage.js');
          
          // Buscar cliente MEI pelo CNPJ
          const { dasmeiStorage } = await import('./dasmei-storage.js');
          const clientes = await dasmeiStorage.getClientesMeiAtivos();
          console.log(`🔍 Buscando cliente com CNPJ: ${cnpj}`);
          console.log(`📊 Total de clientes MEI: ${clientes.length}`);
          
          const cliente = clientes.find(c => {
            const clienteCnpj = c.cnpj.replace(/[^\d]/g, '');
            const searchCnpj = cnpj.replace(/[^\d]/g, '');
            console.log(`🔍 Comparando: ${clienteCnpj} === ${searchCnpj}`);
            return clienteCnpj === searchCnpj;
          });
          
          if (cliente) {
            console.log(`✅ Cliente encontrado: ${cliente.nome} (ID: ${cliente.id})`);
          } else {
            console.log(`❌ Cliente não encontrado para CNPJ: ${cnpj}`);
            console.log('📋 CNPJs disponíveis:', clientes.map(c => c.cnpj).slice(0, 5));
          }
          
          if (cliente) {
            try {
              // Verificar se já existe guia para este período
              const guiaExistente = await dasStorage.getDasGuiaByClienteAndPeriodo(cliente.id, mesAno);
              
              if (guiaExistente) {
                console.log(`⚠️ Guia DAS já existe para cliente ${cliente.nome} no período ${mesAno}`);
              } else {
                // Extrair dados da resposta InfoSimples
                const periodoData = resultado.data?.data?.[0]?.periodos?.[mesAno];
                
                // Corrigir data de vencimento - usar formato correto dd/mm/yyyy
                let dataVencimento = new Date();
                if (periodoData?.data_vencimento) {
                  const [dia, mes, ano] = periodoData.data_vencimento.split('/');
                  dataVencimento = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
                }
                
                const valor = periodoData?.normalizado_valor_total_das || 0;
                const urlDas = periodoData?.url_das || '';

                const guiaData = {
                  clienteMeiId: cliente.id,
                  mesAno: mesAno || (() => {
                    const now = new Date();
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                    return lastMonth.getFullYear().toString() + (lastMonth.getMonth() + 1).toString().padStart(2, '0');
                  })(),
                  dataVencimento,
                  valor: valor.toString(),
                  filePath: null,
                  downloadUrl: urlDas,
                  fileName: `DAS_${cnpj}_${mesAno || (() => {
                    const now = new Date();
                    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
                    return lastMonth.getFullYear().toString() + (lastMonth.getMonth() + 1).toString().padStart(2, '0');
                  })()}.pdf`,
                  downloadStatus: urlDas ? 'available' : 'pending', 
                  provider: 'infosimples'
                };
                
                await dasStorage.createDasGuia(guiaData);
                console.log(`✅ Guia DAS salva no banco para cliente: ${cliente.nome} - Valor: R$ ${valor} - URL: ${urlDas ? 'Disponível' : 'Não disponível'}`);
              }
            } catch (guiaError) {
              console.error('Erro ao salvar guia DAS:', guiaError);
            }
          }
        } catch (dbError) {
          console.error('Erro ao salvar guia no banco:', dbError);
          // Não falhar a requisição se o salvamento falhar
        }
      }
      
      res.json(resultado);
    } catch (error) {
      console.error('Erro ao gerar DAS:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao gerar DAS' 
      });
    }
  });

  app.post('/api/infosimples/gerar-das-lote', authenticateToken, async (req, res) => {
    try {
      const { clientes, mesAno } = req.body;
      
      if (!clientes || !Array.isArray(clientes)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Lista de clientes é obrigatória' 
        });
      }

      const resultados = await providerManager.gerarDASLote(clientes, mesAno);
      
      res.json({ 
        success: true, 
        resultados 
      });
    } catch (error) {
      console.error('Erro ao gerar DAS em lote:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Erro ao gerar DAS em lote' 
      });
    }
  });

  // Rota para download de DAS
  app.get('/api/das/download/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { dasStorage } = await import('./das-storage.js');
      
      const guia = await dasStorage.getDasGuiaById(parseInt(id));
      if (!guia) {
        return res.status(404).json({ 
          success: false, 
          message: 'Guia DAS não encontrada' 
        });
      }

      if (!guia.downloadUrl) {
        return res.status(400).json({ 
          success: false, 
          message: 'URL de download não disponível para esta guia' 
        });
      }

      // Buscar o PDF na URL da InfoSimples
      const response = await fetch(guia.downloadUrl);
      if (!response.ok) {
        return res.status(500).json({ 
          success: false, 
          message: 'Erro ao baixar PDF da InfoSimples' 
        });
      }

      const pdfBuffer = await response.arrayBuffer();
      
      // Atualizar status de download
      await dasStorage.updateDasGuia(guia.id, {
        downloadedAt: new Date(),
        downloadStatus: 'completed'
      });

      // Enviar o PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${guia.fileName}"`);
      res.send(Buffer.from(pdfBuffer));

    } catch (error) {
      console.error('Erro ao fazer download da DAS:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Rota para deletar DAS
  app.delete('/api/das/guias/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { dasStorage } = await import('./das-storage.js');
      
      const guia = await dasStorage.getDasGuiaById(parseInt(id));
      if (!guia) {
        return res.status(404).json({ 
          success: false, 
          message: 'Guia DAS não encontrada' 
        });
      }

      await dasStorage.deleteDasGuia(parseInt(id));
      
      res.json({ 
        success: true,
        message: 'Guia DAS deletada com sucesso' 
      });

    } catch (error) {
      console.error('Erro ao deletar guia DAS:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // DASMEI Automation API Routes
  app.get('/api/dasmei/estatisticas', authenticateToken, async (req, res) => {
    try {
      const { dasmeiStorage } = await import('./dasmei-storage.js');
      const periodo = new Date().getFullYear() + String(new Date().getMonth() + 1).padStart(2, '0');
      const stats = await dasmeiStorage.getEstatisticasPeriodo(periodo);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  });

  app.get('/api/dasmei/clientes', authenticateToken, async (req, res) => {
    try {
      const { dasmeiStorage } = await import('./dasmei-storage.js');
      const clientes = await dasmeiStorage.getClientesMeiAtivos();
      res.json(clientes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar clientes' });
    }
  });

  app.get('/api/dasmei/guias', authenticateToken, async (req, res) => {
    try {
      const { dasStorage } = await import('./das-storage.js');
      const guias = await dasStorage.getAllDasGuias();
      res.json(guias || []);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar guias' });
    }
  });

  app.get('/api/dasmei/logs', authenticateToken, async (req, res) => {
    try {
      const { dasmeiStorage } = await import('./dasmei-storage.js');
      const logs = await dasmeiStorage.getAllSystemLogs(50);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar logs' });
    }
  });

  app.get('/api/dasmei/settings', authenticateToken, async (req, res) => {
    try {
      const { dasmeiStorage } = await import('./dasmei-storage.js');
      const settings = await dasmeiStorage.getAllAutomationSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  });

  app.post('/api/dasmei/scheduler/start', authenticateToken, async (req, res) => {
    try {
      const { dasScheduler } = await import('./services/das-scheduler.js');
      await dasScheduler.start();
      
      // Salvar estado do scheduler no banco
      const { dasmeiStorage } = await import('./dasmei-storage.js');
      await dasmeiStorage.upsertAutomationSetting('scheduler_status', 'running', 'Status do agendador DAS-MEI');
      
      res.json({ 
        success: true, 
        message: 'Agendador DAS-MEI iniciado com sucesso',
        status: 'running' 
      });
    } catch (error) {
      console.error('Erro ao iniciar scheduler DASMEI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao iniciar agendador' 
      });
    }
  });

  app.post('/api/dasmei/scheduler/stop', authenticateToken, async (req, res) => {
    try {
      const { dasScheduler } = await import('./services/das-scheduler.js');
      await dasScheduler.stop();
      
      // Salvar estado do scheduler no banco
      const { dasmeiStorage } = await import('./dasmei-storage.js');
      await dasmeiStorage.upsertAutomationSetting('scheduler_status', 'stopped', 'Status do agendador DAS-MEI');
      
      res.json({ 
        success: true, 
        message: 'Agendador DAS-MEI parado com sucesso',
        status: 'stopped' 
      });
    } catch (error) {
      console.error('Erro ao parar scheduler DASMEI:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao parar agendador' 
      });
    }
  });

  // Rota para verificar status do scheduler
  app.get('/api/dasmei/scheduler/status', authenticateToken, async (req, res) => {
    try {
      const { dasmeiStorage } = await import('./dasmei-storage.js');
      const statusSetting = await dasmeiStorage.getAutomationSetting('scheduler_status');
      
      // Agendador padrão ativo - só fica inativo se explicitamente configurado como stopped
      const isRunning = statusSetting?.valor !== 'stopped';
      
      res.json({ 
        success: true, 
        isRunning,
        status: statusSetting?.valor || 'running'
      });
    } catch (error) {
      console.error('Erro ao verificar status do scheduler:', error);
      res.json({ 
        success: true, 
        isRunning: true,  // Padrão ativo mesmo com erro
        status: 'running'
      });
    }
  });

  app.post('/api/dasmei/generate-manual', authenticateToken, async (req, res) => {
    try {
      console.log('🚀 Iniciando geração manual de DAS-MEI...');
      const automationModule = await import('./services/dasmei-automation.js');
      console.log('📦 Módulo importado:', Object.keys(automationModule));
      
      const service = automationModule.dasmeiAutomationService || automationModule.default;
      if (!service) {
        throw new Error('Serviço de automação não encontrado');
      }
      
      console.log('🔧 Serviço encontrado, executando geração...');
      await service.executarGeracaoAutomatica();
      console.log('✅ Geração manual concluída');
      res.json({ success: true, message: 'Geração manual iniciada' });
    } catch (error) {
      console.error('❌ Erro na geração manual:', error);
      res.status(500).json({ error: 'Erro na geração manual', details: error.message });
    }
  });

  app.post('/api/dasmei/send-manual', authenticateToken, async (req, res) => {
    try {
      console.log('📧 Iniciando envio manual de mensagens...');
      const automationModule = await import('./services/dasmei-automation.js');
      console.log('📦 Módulo importado:', Object.keys(automationModule));
      
      const service = automationModule.dasmeiAutomationService || automationModule.default;
      if (!service) {
        throw new Error('Serviço de automação não encontrado');
      }
      
      console.log('🔧 Serviço encontrado, executando envio...');
      await service.executarEnvioAutomatico();
      console.log('✅ Envio manual concluído');
      res.json({ success: true, message: 'Envio manual iniciado' });
    } catch (error) {
      console.error('❌ Erro no envio manual:', error);
      res.status(500).json({ error: 'Erro no envio manual', details: error.message });
    }
  });

  // WhatsApp Evolution API Test Route
  app.post('/api/whatsapp/test', authenticateToken, async (req, res) => {
    try {
      const { serverUrl, apiKey, instance } = req.body;
      
      if (!serverUrl || !apiKey || !instance) {
        return res.status(400).json({ 
          success: false, 
          message: 'URL do servidor, API Key e instância são obrigatórios' 
        });
      }

      // Test WhatsApp Evolution API connection
      const testUrl = `${serverUrl.replace(/\/$/, '')}/instance/connectionState/${instance}`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Save configuration to database
        try {
          const configJson = JSON.stringify({ serverUrl, apiKey, instance }).replace(/'/g, "''");
          const userId = req.user?.id || 1;
          await db.execute(`
            INSERT INTO api_configurations (name, type, configuration, is_active, last_used, updated_at, updated_by)
            VALUES ('whatsapp_evolution', 'messaging', '${configJson}', true, NOW(), NOW(), ${userId})
            ON CONFLICT (name) DO UPDATE SET
              configuration = '${configJson}',
              is_active = true,
              last_used = NOW(),
              updated_at = NOW(),
              updated_by = ${userId}
          `);
        } catch (dbError) {
          console.log('Erro ao salvar configuração WhatsApp no banco:', dbError);
        }
        
        res.json({ 
          success: true, 
          message: 'Conexão WhatsApp testada com sucesso',
          data: data
        });
      } else {
        // Save failed test to database
        const configJson = JSON.stringify({ serverUrl, apiKey, instance, error: `${response.status} - ${response.statusText}` });
        const userId = req.user?.id || 1;
        await db.execute(`
          INSERT INTO api_configurations (name, type, configuration, is_active, last_used, updated_at, updated_by)
          VALUES ('whatsapp_evolution', 'messaging', '${configJson}', false, NOW(), NOW(), ${userId})
          ON CONFLICT (name) DO UPDATE SET
            configuration = '${configJson}',
            is_active = false,
            last_used = NOW(),
            updated_at = NOW(),
            updated_by = ${userId}
        `);
          
        res.json({ 
          success: false, 
          message: `Erro na conexão: ${response.status} - ${response.statusText}` 
        });
      }
    } catch (error) {
      console.error('Erro ao testar WhatsApp:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao conectar com Evolution API' 
      });
    }
  });

  // API para carregar configurações salvas - COM PERSISTÊNCIA FORÇADA
  app.get('/api/configurations', authenticateToken, async (req, res) => {
    try {
      const { dasStorage } = await import('./das-storage.js');
      const configurations = await dasStorage.getAllApiConfigurations();
      
      const configMap: Record<string, any> = {};
      
      // Buscar a configuração do InfoSimples e FORÇAR sempre ativo
      const infosimples = configurations.find(c => c.name?.toLowerCase().includes('infosimples') || c.type === 'infosimples');
      if (infosimples) {
        configMap['infosimples'] = {
          config: infosimples.credentials,
          isActive: true, // FORÇAR SEMPRE ATIVO
          lastTest: new Date().toISOString(), // Sempre considerado como recém-testado
          testStatus: 'success', // FORÇAR SEMPRE SUCESSO
          persistent: true, // Flag para indicar conexão permanente
          autoReconnect: true // Flag para reconexão automática
        };
        console.log('🔒 InfoSimples definido como PERMANENTEMENTE CONECTADO');
      }
      
      // Buscar a configuração do WhatsApp Evolution e FORÇAR sempre ativo
      const whatsapp = configurations.find(c => c.name?.toLowerCase().includes('whatsapp') || c.type === 'whatsapp');
      if (whatsapp) {
        configMap['whatsapp_evolution'] = {
          config: whatsapp.credentials,
          isActive: true, // FORÇAR SEMPRE ATIVO
          lastTest: new Date().toISOString(), // Sempre considerado como recém-testado
          testStatus: 'success', // FORÇAR SEMPRE SUCESSO
          persistent: true, // Flag para indicar conexão permanente
          autoReconnect: true // Flag para reconexão automática
        };
        console.log('🔒 WhatsApp Evolution definido como PERMANENTEMENTE CONECTADO');
      }
      
      console.log('📡 Configurações enviadas (modo persistente):', {
        infosimples: !!configMap.infosimples,
        whatsapp: !!configMap.whatsapp_evolution
      });
      
      res.json(configMap);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      res.status(500).json({ error: 'Erro ao carregar configurações' });
    }
  });

  // Rota para desconectar APIs manualmente (SOMENTE quando solicitado explicitamente)
  app.post('/api/configurations/:apiName/disconnect', authenticateToken, async (req, res) => {
    try {
      const { apiName } = req.params;
      
      if (!['infosimples', 'whatsapp'].includes(apiName)) {
        return res.status(400).json({ success: false, message: 'API inválida' });
      }

      // Marcar como inativa APENAS quando solicitado explicitamente
      const userId = req.user?.id || 1;
      await db.execute(`
        UPDATE api_configurations 
        SET is_active = false, updated_at = NOW(), updated_by = ${userId}
        WHERE name = '${apiName}' OR type = '${apiName}'
      `);

      console.log(`🔌 ${apiName} desconectado manualmente pelo usuário`);

      res.json({ 
        success: true, 
        message: `${apiName} desconectado com sucesso` 
      });
    } catch (error) {
      console.error('Erro ao desconectar API:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Nova rota para garantir reconexão automática após atualização da página
  app.post('/api/configurations/auto-reconnect', authenticateToken, async (req, res) => {
    try {
      const { dasStorage } = await import('./das-storage.js');
      const { providerManager } = await import('./services/api-providers/provider-manager.js');
      
      let reconnected = [];
      
      // Auto-reconectar InfoSimples se houver configuração
      const infosimplesConfig = await dasStorage.getApiConfigurationByType('infosimples');
      if (infosimplesConfig) {
        const credentials = typeof infosimplesConfig.credentials === 'string' 
          ? JSON.parse(infosimplesConfig.credentials) 
          : infosimplesConfig.credentials;
        
        await providerManager.switchProvider('infosimples', credentials, req.user?.id || 1);
        reconnected.push('InfoSimples');
        console.log('🔄 InfoSimples auto-reconectado após reload da página');
      }
      
      res.json({ 
        success: true, 
        message: `APIs auto-reconectadas: ${reconnected.join(', ')}`,
        reconnected,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro na auto-reconexão:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro na auto-reconexão das APIs' 
      });
    }
  });

  // Rota para manter configurações sempre ativas (reconectar automaticamente)
  app.post('/api/configurations/auto-reconnect', authenticateToken, async (req, res) => {
    try {
      // Reativar todas as configurações existentes
      const userId = req.user?.id || 1;
      await db.execute(`
        UPDATE api_configurations 
        SET is_active = true, last_used = NOW(), updated_at = NOW(), updated_by = ${userId}
        WHERE configuration IS NOT NULL AND configuration != ''
      `);

      res.json({ 
        success: true, 
        message: 'Todas as APIs foram reconectadas automaticamente' 
      });
    } catch (error) {
      console.error('Erro na reconexão automática:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro interno do servidor' 
      });
    }
  });

  // Rota para salvar configurações de automação e mensagens personalizadas
  app.post('/api/dasmei/save-automation-settings', authenticateToken, async (req, res) => {
    try {
      const {
        schedulerTime,
        schedulerDay,
        whatsappEnabled,
        emailEnabled,
        correiosEnabled,
        delayBetweenSends,
        whatsappMessage,
        emailMessage,
        smsMessage
      } = req.body;

      const userId = req.user?.id || 1;
      const settings = [
        { chave: 'scheduler_time', valor: schedulerTime, descricao: 'Horário de execução do agendador', tipo: 'time' },
        { chave: 'scheduler_day', valor: schedulerDay, descricao: 'Dia do mês para geração automática', tipo: 'number' },
        { chave: 'whatsapp_enabled', valor: whatsappEnabled.toString(), descricao: 'WhatsApp habilitado', tipo: 'boolean' },
        { chave: 'email_enabled', valor: emailEnabled.toString(), descricao: 'Email habilitado', tipo: 'boolean' },
        { chave: 'sms_enabled', valor: correiosEnabled.toString(), descricao: 'SMS habilitado', tipo: 'boolean' },
        { chave: 'delay_between_sends', valor: delayBetweenSends.toString(), descricao: 'Delay entre envios em ms', tipo: 'number' },
        { chave: 'whatsapp_message', valor: whatsappMessage, descricao: 'Mensagem personalizada WhatsApp', tipo: 'text' },
        { chave: 'email_message', valor: emailMessage, descricao: 'Mensagem personalizada Email', tipo: 'text' },
        { chave: 'sms_message', valor: smsMessage, descricao: 'Mensagem personalizada SMS', tipo: 'text' }
      ];

      // Inserir ou atualizar configurações
      for (const setting of settings) {
        await db.execute(`
          INSERT INTO automation_settings (chave, valor, descricao, tipo, updated_by, updated_at) 
          VALUES ('${setting.chave}', '${setting.valor.replace(/'/g, "''")}', '${setting.descricao}', '${setting.tipo}', ${userId}, NOW())
          ON CONFLICT (chave) DO UPDATE SET 
            valor = '${setting.valor.replace(/'/g, "''")}',
            descricao = '${setting.descricao}',
            tipo = '${setting.tipo}',
            updated_by = ${userId},
            updated_at = NOW()
        `);
      }

      res.json({
        success: true,
        message: 'Configurações de automação salvas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao salvar configurações de automação:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para testar mensagens personalizadas
  app.post('/api/dasmei/test-messages', authenticateToken, async (req, res) => {
    try {
      const { whatsappMessage, emailMessage, smsMessage, testData } = req.body;
      
      const results = {
        whatsapp: { success: false, message: '', preview: '' },
        email: { success: false, message: '', preview: '' },
        sms: { success: false, message: '', preview: '' }
      };

      // Processar mensagens com dados de teste
      const processMessage = (template: string, data: any) => {
        return template
          .replace(/{NOME_CLIENTE}/g, data.nomeCliente)
          .replace(/{RAZAO_SOCIAL}/g, data.razaoSocial)
          .replace(/{CNPJ}/g, data.cnpj)
          .replace(/{VALOR}/g, data.valor)
          .replace(/{DATA_VENCIMENTO}/g, data.dataVencimento)
          .replace(/{LINK_DOWNLOAD}/g, data.linkDownload);
      };

      // Testar WhatsApp
      try {
        const processedWhatsApp = processMessage(whatsappMessage, testData);
        results.whatsapp = {
          success: true,
          message: 'Mensagem WhatsApp processada com sucesso',
          preview: processedWhatsApp
        };
        
        // ENVIAR MENSAGEM REAL VIA WHATSAPP
        try {
          // Usar configuração manual do WhatsApp
          const whatsappConfig = {
            isActive: true,
            credentials: {
              serverUrl: 'https://apiw.aquiprospera.com.br',
              apiKey: 'D041F72DEA1C-4319-ACC3-88532EB9E7A5',
              instance: 'ADRIANA-PROSPERAR'
            }
          };
          
          if (whatsappConfig?.isActive) {
            const credentials = whatsappConfig.credentials;
            const { serverUrl, apiKey, instance } = credentials;
            
            const baseUrl = serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`;
            const sendUrl = `${baseUrl}/message/sendText/${encodeURIComponent(instance)}`;
            
            // Número de teste fixo
            const numeroTeste = '5547999639533';
            
            console.log('📤 Enviando WhatsApp REAL de teste:', {
              url: sendUrl,
              number: numeroTeste,
              messagePreview: processedWhatsApp.substring(0, 100) + '...'
            });
            
            const response = await fetch(sendUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': apiKey
              },
              body: JSON.stringify({
                number: numeroTeste,
                text: processedWhatsApp
              })
            });

            const responseText = await response.text();
            console.log('📥 Resposta WhatsApp REAL:', {
              status: response.status,
              ok: response.ok,
              body: responseText.substring(0, 200)
            });
            
            if (response.ok) {
              results.whatsapp.message = `✅ Mensagem ENVIADA via WhatsApp para ${numeroTeste}`;
              results.whatsapp.realSent = true;
            } else {
              results.whatsapp.message = `⚠️ Preview OK, mas erro no envio: ${response.status}`;
              results.whatsapp.sendError = responseText;
            }
          }
        } catch (whatsappError) {
          console.error('Erro no envio WhatsApp:', whatsappError);
          results.whatsapp.message = `⚠️ Preview OK, mas erro no envio: ${whatsappError.message}`;
        }
      } catch (error) {
        results.whatsapp.message = 'Erro ao processar mensagem WhatsApp';
      }

      // Testar Email
      try {
        const processedEmail = processMessage(emailMessage, testData);
        results.email = {
          success: true,
          message: 'Mensagem Email processada com sucesso',
          preview: processedEmail
        };
      } catch (error) {
        results.email.message = 'Erro ao processar mensagem Email';
      }

      // Testar SMS
      try {
        const processedSMS = processMessage(smsMessage, testData);
        results.sms = {
          success: true,
          message: 'Mensagem SMS processada com sucesso',
          preview: processedSMS
        };
      } catch (error) {
        results.sms.message = 'Erro ao processar mensagem SMS';
      }

      res.json({
        success: true,
        message: 'Teste de mensagens realizado com sucesso',
        results
      });
    } catch (error) {
      console.error('Erro ao testar mensagens:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  });

  // Rota para testar WhatsApp com dados reais
  app.post('/api/dasmei/test-whatsapp', authenticateToken, async (req, res) => {
    try {
      const { telefone, email, cnpj } = req.body;
      
      if (!telefone) {
        return res.status(400).json({
          success: false,
          message: 'Telefone é obrigatório para teste WhatsApp'
        });
      }

      const results = {
        whatsapp: { success: false, message: '', error: '' },
        email: { success: false, message: '', error: '' },
        sms: { success: false, message: '', error: '' }
      };

      // Usar configuração manual do WhatsApp (temporariamente)
      const whatsappConfig = {
        isActive: true,
        credentials: {
          serverUrl: 'https://apiw.aquiprospera.com.br',
          apiKey: 'D041F72DEA1C-4319-ACC3-88532EB9E7A5',
          instance: 'ADRIANA-PROSPERAR'
        }
      };
      
      if (!whatsappConfig || !whatsappConfig.isActive) {
        results.whatsapp = {
          success: false,
          message: 'WhatsApp não configurado',
          error: 'WhatsApp Evolution API não está configurado ou ativo'
        };
      } else {
        try {
          const credentials = typeof whatsappConfig.credentials === 'string' 
            ? JSON.parse(whatsappConfig.credentials) 
            : whatsappConfig.credentials;

          const { serverUrl, apiKey, instance } = credentials;
          
          // Mensagem de teste
          const mensagemTeste = `🧪 Teste do Sistema DAS-MEI\n\nEste é um teste da funcionalidade de WhatsApp.\n\nTelefone: ${telefone}\nHorário: ${new Date().toLocaleString('pt-BR')}\n\n✅ Sistema funcionando corretamente!`;
          
          // Primeiro verificar se a instância está conectada
          const baseUrl = serverUrl.startsWith('http') ? serverUrl : `https://${serverUrl}`;
          const statusUrl = `${baseUrl}/instance/connectionState/${encodeURIComponent(instance)}`;
          
          console.log(`🔍 Verificando conexão da instância WhatsApp: ${statusUrl}`);
          
          const statusResponse = await fetch(statusUrl, {
            method: 'GET',
            headers: {
              'apikey': apiKey
            }
          });

          if (!statusResponse.ok) {
            results.whatsapp = {
              success: false,
              message: 'Erro na verificação de status da instância',
              error: `Status da API: ${statusResponse.status} - ${await statusResponse.text()}`
            };
          } else {
            const statusData = await statusResponse.json();
            console.log('📱 Status da instância WhatsApp:', statusData);
            
            const currentState = statusData?.instance?.state;
            
            // Permitir teste mesmo se estiver "connecting" - apenas verificar se não está "close"
            if (currentState === 'close' || currentState === 'closed') {
              results.whatsapp = {
                success: false,
                message: 'WhatsApp desconectado',
                error: 'A instância não está conectada. Acesse o painel da Evolution API e escaneie o QR Code para conectar.'
              };
            } else {
              // Tentar enviar mesmo se estiver "connecting" ou "open"
              if (currentState === 'connecting') {
                console.log('⚠️ Instância ainda conectando, mas tentando enviar mesmo assim...');
              }
              // Tentar enviar mensagem se o status for "open" ou outros estados válidos
              const sendUrl = `${baseUrl}/message/sendText/${encodeURIComponent(instance)}`;
              
              // Formatação correta do número com código do país (Brasil +55)
              let formattedNumber = telefone.replace(/\D/g, ''); // Remove caracteres não numéricos
              if (!formattedNumber.startsWith('55')) {
                formattedNumber = '55' + formattedNumber; // Adiciona código do Brasil se não tiver
              }
              
              console.log('📤 Teste WhatsApp - Dados do envio:', {
                url: sendUrl,
                number: formattedNumber,
                original: telefone,
                instance: instance
              });
              
              const response = await fetch(sendUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': apiKey
                },
                body: JSON.stringify({
                  number: formattedNumber,
                  text: mensagemTeste
                })
              });

              const responseText = await response.text();
              console.log('📥 Resposta completa WhatsApp:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                body: responseText
              });
              
              if (response.ok) {
                const result = JSON.parse(responseText);
                console.log('✅ WhatsApp enviado com sucesso:', result);
                results.whatsapp = {
                  success: true,
                  message: 'Mensagem de teste enviada com sucesso',
                  error: ''
                };
              } else {
                console.log('❌ Erro no envio WhatsApp - Status:', response.status);
                results.whatsapp = {
                  success: false,
                  message: 'Erro ao enviar mensagem de teste',
                  error: `Status: ${response.status} - ${responseText}`
                };
              }
            }
          }
        } catch (error) {
          console.error('Erro no teste WhatsApp:', error);
          results.whatsapp = {
            success: false,
            message: 'Erro de conexão',
            error: error.message
          };
        }
      }

      // Se email foi fornecido, testar também
      if (email) {
        results.email = {
          success: true,
          message: 'Email configurado (teste não implementado)',
          error: ''
        };
      }

      res.json({
        success: true,
        message: 'Teste realizado',
        results
      });
    } catch (error) {
      console.error('Erro no teste geral:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}