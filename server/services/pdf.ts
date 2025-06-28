import PDFDocument from 'pdfkit';
import type { BusinessRegistration } from '@shared/schema';

export async function generateBusinessRegistrationPDF(registration: BusinessRegistration): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        bufferPages: true
      });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Função para limpar caracteres especiais
      const cleanText = (text: string | null | undefined): string => {
        if (!text) return 'Nao informado';
        return text
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[ñ]/g, 'n')
          .replace(/[ÀÁÂÃÄÅ]/g, 'A')
          .replace(/[ÈÉÊË]/g, 'E')
          .replace(/[ÌÍÎÏ]/g, 'I')
          .replace(/[ÒÓÔÕÖ]/g, 'O')
          .replace(/[ÙÚÛÜ]/g, 'U')
          .replace(/[Ç]/g, 'C')
          .replace(/[Ñ]/g, 'N')
          .replace(/[^\x00-\x7F]/g, ''); // Remove caracteres não-ASCII
      };

      const socios = registration.socios as any[];

      // Header
      doc.fontSize(20).fillColor('#1a7a3a').font('Helvetica-Bold').text('REGISTRO EMPRESARIAL', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('#333').font('Helvetica-Bold').text(cleanText(registration.razaoSocial), { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#666').font('Helvetica').text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
      doc.moveDown(1.5);

      // Company Information Section
      doc.fontSize(14).fillColor('#1a7a3a').font('Helvetica-Bold').text('INFORMACOES GERAIS', { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(10).fillColor('#333');
      
      // Razão Social
      doc.font('Helvetica-Bold').text('Razao Social:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(cleanText(registration.razaoSocial), 50, doc.y);
      doc.moveDown(0.8);
      
      // Nome Fantasia
      doc.font('Helvetica-Bold').text('Nome Fantasia:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(cleanText(registration.nomeFantasia), 50, doc.y);
      doc.moveDown(0.8);
      
      // CNPJ
      doc.font('Helvetica-Bold').text('CNPJ:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(cleanText(registration.cnpj), 50, doc.y);
      doc.moveDown(0.8);
      
      // Capital Social
      doc.font('Helvetica-Bold').text('Capital Social:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(`R$ ${registration.capitalSocial}`, 50, doc.y);
      doc.moveDown(0.8);
      
      // Telefone
      doc.font('Helvetica-Bold').text('Telefone:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(cleanText(registration.telefoneEmpresa), 50, doc.y);
      doc.moveDown(0.8);
      
      // E-mail
      doc.font('Helvetica-Bold').text('E-mail:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(cleanText(registration.emailEmpresa), 50, doc.y);
      doc.moveDown(0.8);
      
      // Metragem
      doc.font('Helvetica-Bold').text('Metragem:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(`${registration.metragem}m2`, 50, doc.y);
      doc.moveDown(0.8);
      
      // Inscricao Imobiliaria
      doc.font('Helvetica-Bold').text('Inscricao Imobiliaria:', 50, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').text(cleanText(registration.inscricaoImobiliaria), 50, doc.y);
      doc.moveDown(1);

      // Address Section
      doc.fontSize(14).fillColor('#1a7a3a').font('Helvetica-Bold').text('ENDERECO', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(10).fillColor('#333').font('Helvetica-Bold').text('Endereco:', 50, doc.y);
      doc.moveDown(0.5);
      doc.font('Helvetica').text(cleanText(registration.endereco), 50, doc.y, { width: 495 });
      doc.moveDown(1.5);

      // Activities Section
      doc.fontSize(14).fillColor('#1a7a3a').font('Helvetica-Bold').text('ATIVIDADES', { align: 'center' });
      doc.moveDown(1);
      
      doc.fontSize(10).fillColor('#333');
      
      // Atividade Principal
      doc.font('Helvetica-Bold').text('Atividade Principal:', 50, doc.y);
      doc.moveDown(0.5);
      doc.font('Helvetica').text(cleanText(registration.atividadePrincipal), 50, doc.y, { width: 495 });
      doc.moveDown(1);
      
      // Atividades Secundárias (se existir)
      if (registration.atividadesSecundarias) {
        doc.font('Helvetica-Bold').text('Atividades Secundarias:', 50, doc.y);
        doc.moveDown(0.5);
        doc.font('Helvetica').text(cleanText(registration.atividadesSecundarias), 50, doc.y, { width: 495 });
        doc.moveDown(1);
      }
      doc.moveDown(0.5);

      // Partners Section
      doc.fontSize(14).fillColor('#1a7a3a').font('Helvetica-Bold').text('SOCIOS', { align: 'center' });
      doc.moveDown(1);

      socios.forEach((socio, index) => {
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(12).fillColor('#1a7a3a').font('Helvetica-Bold').text(`Socio ${index + 1}: ${cleanText(socio.nomeCompleto)}`);
        doc.moveDown(0.5);

        doc.fontSize(10).fillColor('#333');
        
        // Nome Completo
        doc.font('Helvetica-Bold').text('Nome Completo:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.nomeCompleto), 50, doc.y);
        doc.moveDown(0.7);
        
        // CPF
        doc.font('Helvetica-Bold').text('CPF:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.cpf), 50, doc.y);
        doc.moveDown(0.7);
        
        // RG
        doc.font('Helvetica-Bold').text('RG:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.rg), 50, doc.y);
        doc.moveDown(0.7);
        
        // Data de Nascimento
        doc.font('Helvetica-Bold').text('Data de Nascimento:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.dataNascimento), 50, doc.y);
        doc.moveDown(0.7);
        
        // Estado Civil
        doc.font('Helvetica-Bold').text('Estado Civil:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.estadoCivil), 50, doc.y);
        doc.moveDown(0.7);
        
        // Nacionalidade
        doc.font('Helvetica-Bold').text('Nacionalidade:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.nacionalidade), 50, doc.y);
        doc.moveDown(0.7);
        
        // Profissao
        doc.font('Helvetica-Bold').text('Profissao:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.profissao), 50, doc.y);
        doc.moveDown(0.7);
        
        // Telefone
        doc.font('Helvetica-Bold').text('Telefone:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.telefonePessoal), 50, doc.y);
        doc.moveDown(0.7);
        
        // E-mail
        doc.font('Helvetica-Bold').text('E-mail:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.emailPessoal), 50, doc.y);
        doc.moveDown(0.7);
        
        // Participacao
        doc.font('Helvetica-Bold').text('Participacao:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(`${socio.participacao}%`, 50, doc.y);
        doc.moveDown(0.7);
        
        // Tipo de Participacao
        doc.font('Helvetica-Bold').text('Tipo de Participacao:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.tipoParticipacao), 50, doc.y);
        doc.moveDown(0.7);
        
        // Endereco
        doc.font('Helvetica-Bold').text('Endereco:', 50, doc.y);
        doc.moveDown(0.3);
        doc.font('Helvetica').text(cleanText(socio.endereco), 50, doc.y, { width: 495 });
        doc.moveDown(1.5);
      });

      // Footer
      if (doc.y > 650) {
        doc.addPage();
      }
      
      doc.moveDown(2);
      doc.fontSize(12).fillColor('#1a7a3a').font('Helvetica-Bold').text('Prosperar Contabilidade', { align: 'center' });
      doc.fontSize(10).fillColor('#666').font('Helvetica').text('Email: contato@prosperarcontabilidade.com.br', { align: 'center' });
      doc.text(`Documento gerado automaticamente em ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}