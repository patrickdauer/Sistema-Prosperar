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

      const startY = doc.y;
      // Left column
      doc.fontSize(10).fillColor('#333');
      doc.text('Razão Social:', 50, doc.y);
      doc.text(registration.razaoSocial, 50, doc.y + 15);
      doc.text('Nome Fantasia:', 50, doc.y + 35);
      doc.text(registration.nomeFantasia, 50, doc.y + 50);
      doc.text('CNPJ:', 50, doc.y + 70);
      doc.text(registration.cnpj || 'Não informado', 50, doc.y + 85);
      doc.text('Capital Social:', 50, doc.y + 105);
      doc.text(`R$ ${registration.capitalSocial}`, 50, doc.y + 120);

      // Right column
      doc.text('Telefone:', 300, startY);
      doc.text(registration.telefoneEmpresa, 300, startY + 15);
      doc.text('E-mail:', 300, startY + 35);
      doc.text(registration.emailEmpresa, 300, startY + 50);
      doc.text('Metragem:', 300, startY + 70);
      doc.text(`${registration.metragem}m²`, 300, startY + 85);
      doc.text('Inscrição Imobiliária:', 300, startY + 105);
      doc.text(registration.inscricaoImobiliaria, 300, startY + 120);

      doc.y = startY + 140;
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
      doc.text('Atividade Principal:');
      doc.text(registration.atividadePrincipal, { indent: 20 });
      
      if (registration.atividadesSecundarias) {
        doc.moveDown(0.5);
        doc.text('Atividades Secundárias:');
        doc.text(registration.atividadesSecundarias, { indent: 20 });
      }
      doc.moveDown(1);

      // Partners Section
      doc.fontSize(14).fillColor('#22c55e').text('👥 SÓCIOS');
      doc.moveDown(0.5);

      socios.forEach((socio, index) => {
        if (doc.y > 700) {
          doc.addPage();
        }

        doc.fontSize(12).fillColor('#ff8c42').text(`Sócio ${index + 1}: ${socio.nomeCompleto}`);
        doc.moveDown(0.3);

        const socioStartY = doc.y;
        // Left column
        doc.fontSize(9).fillColor('#333');
        doc.text('CPF:', 50, doc.y);
        doc.text(socio.cpf, 50, doc.y + 12);
        doc.text('RG:', 50, doc.y + 26);
        doc.text(socio.rg, 50, doc.y + 38);
        doc.text('Data Nascimento:', 50, doc.y + 52);
        doc.text(socio.dataNascimento, 50, doc.y + 64);
        doc.text('Estado Civil:', 50, doc.y + 78);
        doc.text(socio.estadoCivil, 50, doc.y + 90);

        // Right column
        doc.text('Profissão:', 300, socioStartY);
        doc.text(socio.profissao, 300, socioStartY + 12);
        doc.text('Telefone:', 300, socioStartY + 26);
        doc.text(socio.telefonePessoal, 300, socioStartY + 38);
        doc.text('E-mail:', 300, socioStartY + 52);
        doc.text(socio.emailPessoal, 300, socioStartY + 64);
        doc.text('Participação:', 300, socioStartY + 78);
        doc.text(`${socio.participacao}% - ${socio.tipoParticipacao}`, 300, socioStartY + 90);

        doc.y = socioStartY + 110;
        doc.text('Endereço:', 50, doc.y);
        doc.text(socio.endereco, 50, doc.y + 12, { width: 495 });

        doc.moveDown(1);
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