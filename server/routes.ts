import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBusinessRegistrationSchema } from "@shared/schema";
import multer from "multer";
import { z } from "zod";

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
  
  // Business registration submission endpoint
  app.post("/api/business-registration", upload.fields([
    { name: 'documentoComFoto', maxCount: 1 },
    { name: 'certidaoCasamento', maxCount: 1 },
    { name: 'documentosAdicionais', maxCount: 10 }
  ]), async (req, res) => {
    try {
      // Parse form data
      const formData = JSON.parse(req.body.data);
      
      // Validate form data
      const validatedData = insertBusinessRegistrationSchema.parse(formData);
      
      // Handle file uploads (In a real app, this would upload to Google Drive)
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      let documentoComFotoUrl = null;
      let certidaoCasamentoUrl = null;
      let documentosAdicionaisUrls: string[] = [];
      
      if (files.documentoComFoto) {
        // Simulate Google Drive upload
        documentoComFotoUrl = `https://drive.google.com/file/documento-${Date.now()}`;
      }
      
      if (files.certidaoCasamento) {
        certidaoCasamentoUrl = `https://drive.google.com/file/certidao-${Date.now()}`;
      }
      
      if (files.documentosAdicionais) {
        documentosAdicionaisUrls = files.documentosAdicionais.map((_, index) => 
          `https://drive.google.com/file/adicional-${Date.now()}-${index}`
        );
      }
      
      // Create registration with file URLs
      const registration = await storage.createBusinessRegistration({
        ...validatedData,
        documentoComFotoUrl,
        certidaoCasamentoUrl,
        documentosAdicionaisUrls
      });
      
      // Send webhook to n8n for WhatsApp notification
      try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (webhookUrl) {
          const webhookData = {
            registration,
            message: `Nova solicitação de abertura de empresa recebida!
            
📋 *DADOS DA EMPRESA*
• Razão Social: ${registration.razaoSocial}
• Nome Fantasia: ${registration.nomeFantasia}
• Telefone: ${registration.telefoneEmpresa}
• Email: ${registration.emailEmpresa}

👤 *DADOS DO SÓCIO*
• Nome: ${registration.nomeCompleto}
• CPF: ${registration.cpf}
• Estado Civil: ${registration.estadoCivil}
• Telefone: ${registration.telefonePessoal}

📎 *DOCUMENTOS*
• Documento com foto: ${documentoComFotoUrl ? 'Anexado' : 'Não anexado'}
• Certidão de casamento: ${certidaoCasamentoUrl ? 'Anexado' : 'Não anexado'}
• Documentos adicionais: ${documentosAdicionaisUrls.length} arquivo(s)

Os arquivos foram salvos no Google Drive.`
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
        // Don't fail the registration if webhook fails
      }
      
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

  const httpServer = createServer(app);
  return httpServer;
}
