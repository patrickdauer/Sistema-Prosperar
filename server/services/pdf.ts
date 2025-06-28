import PDFDocument from 'pdfkit';
import type { BusinessRegistration } from '@shared/schema';

export async function generateBusinessRegistrationPDF(registration: BusinessRegistration): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const socios = registration.socios as any[];

      // Header
      doc.fontSize(20).fillColor('#22c55e').text('REGISTRO EMPRESARIAL', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).fillColor('#333').text(registration.razaoSocial, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#666').text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' });
      doc.moveDown(1);

      // Line separator
      doc.strokeColor('#22c55e').lineWidth(2).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Company Information Section
      doc.fontSize(14).fillColor('#22c55e').text('📊 INFORMAÇÕES GERAIS');
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor('#333');
      
      // Razão Social
      doc.text('Razão Social:', 50, doc.y);
      doc.text(registration.razaoSocial, 150, doc.y);
      doc.moveDown(0.8);
      
      // Nome Fantasia
      doc.text('Nome Fantasia:', 50, doc.y);
      doc.text(registration.nomeFantasia, 150, doc.y);
      doc.moveDown(0.8);
      
      // CNPJ
      doc.text('CNPJ:', 50, doc.y);
      doc.text(registration.cnpj || 'Não informado', 150, doc.y);
      doc.moveDown(0.8);
      
      // Capital Social
      doc.text('Capital Social:', 50, doc.y);
      doc.text(`R$ ${registration.capitalSocial}`, 150, doc.y);
      doc.moveDown(0.8);
      
      // Telefone
      doc.text('Telefone:', 50, doc.y);
      doc.text(registration.telefoneEmpresa, 150, doc.y);
      doc.moveDown(0.8);
      
      // E-mail
      doc.text('E-mail:', 50, doc.y);
      doc.text(registration.emailEmpresa, 150, doc.y);
      doc.moveDown(0.8);
      
      // Metragem
      doc.text('Metragem:', 50, doc.y);
      doc.text(`${registration.metragem}m²`, 150, doc.y);
      doc.moveDown(0.8);
      
      // Inscrição Imobiliária
      doc.text('Inscrição Imobiliária:', 50, doc.y);
      doc.text(registration.inscricaoImobiliaria, 150, doc.y);
      doc.moveDown(1);

      // Address Section
      doc.fontSize(14).fillColor('#22c55e').text('📍 ENDEREÇO');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#333').text(registration.endereco);
      doc.moveDown(1);

      // Activities Section
      doc.fontSize(14).fillColor('#22c55e').text('🏢 ATIVIDADES');
      doc.moveDown(0.5);
      
      doc.fontSize(10).fillColor('#333');
      
      // Atividade Principal
      doc.text('Atividade Principal:', 50, doc.y);
      doc.text(registration.atividadePrincipal, 150, doc.y, { width: 395 });
      doc.moveDown(1);
      
      // Atividades Secundárias (se existir)
      if (registration.atividadesSecundarias) {
        doc.text('Atividades Secundárias:', 50, doc.y);
        doc.text(registration.atividadesSecundarias, 150, doc.y, { width: 395 });
        doc.moveDown(1);
      }

      // Partners Section
      doc.fontSize(14).fillColor('#22c55e').text('👥 SÓCIOS');
      doc.moveDown(0.5);

      socios.forEach((socio, index) => {
        if (doc.y > 650) {
          doc.addPage();
        }

        doc.fontSize(12).fillColor('#ff8c42').text(`Sócio ${index + 1}: ${socio.nomeCompleto}`);
        doc.moveDown(0.5);

        doc.fontSize(10).fillColor('#333');
        
        // Nome Completo
        doc.text('Nome Completo:', 50, doc.y);
        doc.text(socio.nomeCompleto, 150, doc.y);
        doc.moveDown(0.7);
        
        // CPF
        doc.text('CPF:', 50, doc.y);
        doc.text(socio.cpf, 150, doc.y);
        doc.moveDown(0.7);
        
        // RG
        doc.text('RG:', 50, doc.y);
        doc.text(socio.rg, 150, doc.y);
        doc.moveDown(0.7);
        
        // Data de Nascimento
        doc.text('Data de Nascimento:', 50, doc.y);
        doc.text(socio.dataNascimento, 150, doc.y);
        doc.moveDown(0.7);
        
        // Estado Civil
        doc.text('Estado Civil:', 50, doc.y);
        doc.text(socio.estadoCivil, 150, doc.y);
        doc.moveDown(0.7);
        
        // Nacionalidade
        doc.text('Nacionalidade:', 50, doc.y);
        doc.text(socio.nacionalidade, 150, doc.y);
        doc.moveDown(0.7);
        
        // Profissão
        doc.text('Profissão:', 50, doc.y);
        doc.text(socio.profissao, 150, doc.y);
        doc.moveDown(0.7);
        
        // Telefone
        doc.text('Telefone:', 50, doc.y);
        doc.text(socio.telefonePessoal, 150, doc.y);
        doc.moveDown(0.7);
        
        // E-mail
        doc.text('E-mail:', 50, doc.y);
        doc.text(socio.emailPessoal, 150, doc.y);
        doc.moveDown(0.7);
        
        // Participação
        doc.text('Participação:', 50, doc.y);
        doc.text(`${socio.participacao}%`, 150, doc.y);
        doc.moveDown(0.7);
        
        // Tipo de Participação
        doc.text('Tipo de Participação:', 50, doc.y);
        doc.text(socio.tipoParticipacao, 150, doc.y);
        doc.moveDown(0.7);
        
        // Endereço
        doc.text('Endereço:', 50, doc.y);
        doc.text(socio.endereco, 150, doc.y, { width: 395 });
        doc.moveDown(1.5);
      });

      // Footer
      if (doc.y > 650) {
        doc.addPage();
      }
      
      doc.strokeColor('#22c55e').lineWidth(1).moveTo(50, doc.y + 20).lineTo(545, doc.y + 20).stroke();
      doc.moveDown(1.5);
      doc.fontSize(12).fillColor('#22c55e').text('Prosperar Contabilidade', { align: 'center' });
      doc.fontSize(10).fillColor('#666').text('📧 contato@prosperarcontabilidade.com.br', { align: 'center' });
      doc.text(`Documento gerado automaticamente em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}