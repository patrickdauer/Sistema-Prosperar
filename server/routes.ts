import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBusinessRegistrationSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";
import { generateBusinessRegistrationPDF } from "./services/pdf";
import { sendConfirmationEmail } from "./services/email";
import { googleDriveService } from "./services/googledrive";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

  // Setup Replit Auth
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected route example
  app.get("/api/protected", isAuthenticated, async (req, res) => {
    const userId = req.user?.claims?.sub;
    res.json({ message: "This is a protected route", userId });
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
  app.get("/api/internal/registrations", isAuthenticated, async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}