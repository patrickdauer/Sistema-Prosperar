import nodemailer from 'nodemailer';
import type { ContratacaoFuncionario } from '@shared/contratacao-schema';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendContratacaoEmails(contratacao: ContratacaoFuncionario, folderLink?: string) {
  const emailContent = `
    <h2>Nova Solicitação de Contratação de Funcionário</h2>
    
    <h3>📋 Dados da Empresa:</h3>
    <ul>
      <li><strong>Razão Social:</strong> ${contratacao.razaoSocial}</li>
      <li><strong>CNPJ:</strong> ${contratacao.cnpj}</li>
      <li><strong>Endereço:</strong> ${contratacao.endereco}</li>
      <li><strong>Telefone:</strong> ${contratacao.telefone}</li>
      <li><strong>E-mail:</strong> ${contratacao.email}</li>
      <li><strong>Responsável:</strong> ${contratacao.responsavel}</li>
    </ul>
    
    <h3>👤 Dados do Funcionário:</h3>
    <ul>
      <li><strong>Nome:</strong> ${contratacao.nomeFuncionario}</li>
      <li><strong>CPF:</strong> ${contratacao.cpfFuncionario}</li>
      <li><strong>RG:</strong> ${contratacao.rgFuncionario}</li>
      <li><strong>Data de Nascimento:</strong> ${contratacao.dataNascimento}</li>
      <li><strong>Estado Civil:</strong> ${contratacao.estadoCivil}</li>
      <li><strong>Escolaridade:</strong> ${contratacao.escolaridade}</li>
      <li><strong>Endereço:</strong> ${contratacao.endereco_funcionario}</li>
      <li><strong>Telefone:</strong> ${contratacao.telefone_funcionario}</li>
      <li><strong>E-mail:</strong> ${contratacao.email_funcionario}</li>
    </ul>
    
    <h3>💼 Dados do Cargo:</h3>
    <ul>
      <li><strong>Cargo:</strong> ${contratacao.cargo}</li>
      <li><strong>Setor:</strong> ${contratacao.setor}</li>
      <li><strong>Salário:</strong> ${contratacao.salario}</li>
      <li><strong>Carga Horária:</strong> ${contratacao.cargaHoraria}</li>
      <li><strong>Tipo de Contrato:</strong> ${contratacao.tipoContrato}</li>
      <li><strong>Data de Admissão:</strong> ${contratacao.dataAdmissao}</li>
    </ul>
    
    <h3>🎁 Benefícios:</h3>
    <ul>
      <li><strong>Vale Transporte:</strong> ${contratacao.valeTransporte ? 'Sim' : 'Não'}</li>
      <li><strong>Vale Refeição:</strong> ${contratacao.valeRefeicao ? 'Sim' : 'Não'}</li>
      <li><strong>Vale Alimentação:</strong> ${contratacao.valeAlimentacao ? 'Sim' : 'Não'}</li>
      <li><strong>Plano de Saúde:</strong> ${contratacao.planoSaude ? 'Sim' : 'Não'}</li>
      <li><strong>Plano Dental:</strong> ${contratacao.planoDental ? 'Sim' : 'Não'}</li>
      <li><strong>Seguro de Vida:</strong> ${contratacao.seguroVida ? 'Sim' : 'Não'}</li>
    </ul>
    
    <h3>🏦 Dados Bancários:</h3>
    <ul>
      <li><strong>Banco:</strong> ${contratacao.banco}</li>
      <li><strong>Agência:</strong> ${contratacao.agencia}</li>
      <li><strong>Conta:</strong> ${contratacao.conta}</li>
      <li><strong>Tipo de Conta:</strong> ${contratacao.tipoConta}</li>
    </ul>
    
    ${contratacao.numeroPis ? `<h3>📋 Informações Adicionais:</h3>
    <ul>
      <li><strong>Número PIS:</strong> ${contratacao.numeroPis}</li>
    </ul>` : ''}
    
    ${contratacao.observacoes ? `<h3>📝 Observações:</h3>
    <p>${contratacao.observacoes}</p>` : ''}
    
    ${folderLink ? `
    <h3>📂 Documentos no Google Drive:</h3>
    <p>Todos os documentos enviados foram organizados em uma pasta exclusiva:</p>
    <a href="${folderLink}" target="_blank" style="color: #4CAF50; text-decoration: none;">
      🔗 Acessar Pasta no Google Drive
    </a>
    ` : ''}
    
    <hr>
    <p><strong>Data da Solicitação:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
    <p><small>ID da Solicitação: ${contratacao.id}</small></p>
  `;

  try {
    // Enviar email para os endereços especificados
    const emailAddresses = [
      'contato@prosperarcontabilidade.com.br',
      'empresasdp01@gmail.com'
    ];

    for (const email of emailAddresses) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Nova Contratação: ${contratacao.nomeFuncionario} - ${contratacao.razaoSocial}`,
        html: emailContent,
      });
    }

    console.log('Emails de contratação enviados com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao enviar emails de contratação:', error);
    return false;
  }
}