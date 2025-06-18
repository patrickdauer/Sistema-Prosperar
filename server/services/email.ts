import nodemailer from 'nodemailer';
import type { BusinessRegistration } from '@shared/schema';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendConfirmationEmail(registration: BusinessRegistration, folderData?: { mainFolderId: string, societarioFolderId: string }) {
  const socios = registration.socios as any[];
  
  // Email para o cliente
  const clientEmailContent = `
    <h2>Confirmação de Recebimento - Dados para Abertura de Empresa</h2>
    
    <p>Olá <strong>${socios[0]?.nomeCompleto}</strong>,</p>
    
    <p>Recebemos com sucesso os dados para abertura da empresa <strong>${registration.razaoSocial}</strong>.</p>
    
    <h3>📋 Resumo dos Dados Enviados:</h3>
    <ul>
      <li><strong>Razão Social:</strong> ${registration.razaoSocial}</li>
      <li><strong>Nome Fantasia:</strong> ${registration.nomeFantasia}</li>
      <li><strong>Endereço:</strong> ${registration.endereco}</li>
      <li><strong>Telefone:</strong> ${registration.telefoneEmpresa}</li>
      <li><strong>E-mail:</strong> ${registration.emailEmpresa}</li>
      <li><strong>Capital Social:</strong> R$ ${registration.capitalSocial}</li>
      <li><strong>Atividade Principal:</strong> ${registration.atividadePrincipal}</li>
      <li><strong>Número de Sócios:</strong> ${socios.length}</li>
    </ul>
    
    ${folderData ? `
    <h3>📂 Acesso aos Documentos:</h3>
    <p>Todos os documentos enviados foram organizados em uma pasta exclusiva no Google Drive:</p>
    <p><a href="https://drive.google.com/drive/folders/${folderData.mainFolderId}" target="_blank" style="background-color: #4285f4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🔗 Acessar Pasta dos Documentos</a></p>
    <p><small>Clique no link acima para visualizar todos os documentos enviados organizados por departamento.</small></p>
    ` : ''}
    
    <h3>📝 Próximos Passos:</h3>
    <p>Nossa equipe irá analisar os documentos enviados e entrar em contato em até 2 dias úteis para dar continuidade ao processo de abertura da empresa.</p>
    
    <p>Caso tenha alguma dúvida, entre em contato conosco.</p>
    
    <p><strong>Prosperar Contabilidade</strong><br>
    📧 contato@prosperarcontabilidade.com.br<br>
    📱 WhatsApp disponível</p>
    
    <hr>
    <p><small>Este e-mail foi enviado automaticamente. Não responda a este e-mail.</small></p>
  `;
  
  // Email para a contabilidade
  const internalEmailContent = `
    <h2>🏢 Nova Solicitação de Abertura de Empresa</h2>
    
    <h3>📋 Dados da Empresa:</h3>
    <ul>
      <li><strong>Razão Social:</strong> ${registration.razaoSocial}</li>
      <li><strong>Nome Fantasia:</strong> ${registration.nomeFantasia}</li>
      <li><strong>Endereço:</strong> ${registration.endereco}</li>
      <li><strong>Inscrição Imobiliária:</strong> ${registration.inscricaoImobiliaria}</li>
      <li><strong>Metragem:</strong> ${registration.metragem}m²</li>
      <li><strong>Telefone:</strong> ${registration.telefoneEmpresa}</li>
      <li><strong>E-mail:</strong> ${registration.emailEmpresa}</li>
      <li><strong>Capital Social:</strong> R$ ${registration.capitalSocial}</li>
      <li><strong>Atividade Principal:</strong> ${registration.atividadePrincipal}</li>
      <li><strong>Atividades Secundárias:</strong> ${registration.atividadesSecundarias || 'Não informado'}</li>
    </ul>
    
    <h3>👥 Sócios (${socios.length}):</h3>
    ${socios.map((socio, index) => `
      <h4>Sócio ${index + 1}:</h4>
      <ul>
        <li><strong>Nome:</strong> ${socio.nomeCompleto}</li>
        <li><strong>CPF:</strong> ${socio.cpf}</li>
        <li><strong>RG:</strong> ${socio.rg}</li>
        <li><strong>Data de Nascimento:</strong> ${socio.dataNascimento}</li>
        <li><strong>Estado Civil:</strong> ${socio.estadoCivil}</li>
        <li><strong>Nacionalidade:</strong> ${socio.nacionalidade}</li>
        <li><strong>Profissão:</strong> ${socio.profissao}</li>
        <li><strong>Endereço:</strong> ${socio.enderecoPessoal}</li>
        <li><strong>Telefone:</strong> ${socio.telefonePessoal}</li>
        <li><strong>E-mail:</strong> ${socio.emailPessoal}</li>
        <li><strong>Filiação:</strong> ${socio.filiacao}</li>
      </ul>
    `).join('')}
    
    <h3>📎 Status dos Documentos:</h3>
    <p>Todos os arquivos foram enviados e organizados no Google Drive.</p>
    
    ${folderData ? `
    <p><strong>🔗 Acesso Direto aos Documentos:</strong></p>
    <p><a href="https://drive.google.com/drive/folders/${folderData.mainFolderId}" target="_blank" style="background-color: #4285f4; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">📂 Pasta Principal: ${registration.razaoSocial}</a></p>
    <p><a href="https://drive.google.com/drive/folders/${folderData.societarioFolderId}" target="_blank" style="background-color: #34a853; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px;">📁 DEPTO SOCIETARIO</a></p>
    ` : `<p><strong>Pasta no Google Drive:</strong> ${registration.razaoSocial}</p>`}
    
    <p><strong>Data/Hora do Envio:</strong> ${registration.createdAt?.toLocaleString('pt-BR')}</p>
    
    <hr>
    <p><small>ID da Solicitação: ${registration.id}</small></p>
  `;

  try {
    // Enviar email para o cliente
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: registration.emailEmpresa,
      subject: `Confirmação de Recebimento - ${registration.razaoSocial}`,
      html: clientEmailContent,
    });

    // Enviar email para a contabilidade
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'contato@prosperarcontabilidade.com.br',
      subject: `Nova Solicitação: ${registration.razaoSocial}`,
      html: internalEmailContent,
    });

    console.log('Emails enviados com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao enviar emails:', error);
    return false;
  }
}