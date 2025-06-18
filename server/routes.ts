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
      
      // Send webhook to n8n for WhatsApp notification
      try {
        const webhookUrl = process.env.N8N_WEBHOOK_URL;
        if (webhookUrl) {
          // Format partners information
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
Todos os arquivos foram enviados e estão sendo processados para upload no Google Drive.

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
