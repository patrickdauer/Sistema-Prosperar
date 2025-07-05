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
import { authenticateToken, generateToken } from "./auth";
import bcrypt from "bcrypt";
import { seedTaskTemplates, createAdminUser } from "./seedData";
import XLSX from "xlsx";
import puppeteer from "puppeteer";

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
  app.post("/api/contratacao-funcionarios", upload.array('documento', 10), async (req, res) => {
    try {
      // Parse and validate the form data
      const formData = { ...req.body };
      
      // Convert boolean fields from strings
      const booleanFields = ['valeTransporte', 'valeRefeicao', 'valeAlimentacao', 'planoSaude', 'planoDental', 'seguroVida'];
      booleanFields.forEach(field => {
        if (formData[field] === 'true') formData[field] = true;
        else if (formData[field] === 'false') formData[field] = false;
        else formData[field] = false;
      });

      // Validate the data
      const validatedData = insertContratacaoSchema.parse(formData);
      
      // Create the contratacao record
      const contratacao = await storage.createContratacaoFuncionario(validatedData);
      
      // Handle file uploads if any
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        // You can add file handling logic here if needed
        console.log(`Received ${files.length} files for contratacao ${contratacao.id}`);
      }

      res.json({ 
        message: "Solicitação de contratação enviada com sucesso!", 
        id: contratacao.id 
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

  // Rotas para gerenciamento de clientes
  app.get('/api/clientes', async (req, res) => {
    try {
      const { search } = req.query;
      let query = `
        SELECT id, razao_social, nome_fantasia, cnpj, email_empresa, telefone_empresa, 
               contato, celular, status, created_at 
        FROM clientes 
      `;
      
      if (search && typeof search === 'string') {
        query += `
          WHERE razao_social ILIKE '%${search}%'
             OR nome_fantasia ILIKE '%${search}%'
             OR cnpj ILIKE '%${search}%'
             OR email_empresa ILIKE '%${search}%'
        `;
      }
      
      query += ' ORDER BY created_at DESC';
      
      const result = await db.execute(query);
      res.json(result.rows);
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

  const httpServer = createServer(app);
  return httpServer;
}