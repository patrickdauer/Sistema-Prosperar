import PDFDocument from 'pdfkit';
import type { ContratacaoFuncionario } from '@shared/contratacao-schema';

export async function generateContratacaoPDF(contratacao: ContratacaoFuncionario): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => {
      chunks.push(chunk);
    });

    doc.on('end', () => {
      const result = Buffer.concat(chunks);
      resolve(result);
    });

    doc.on('error', (error) => {
      reject(error);
    });

    // Header
    doc.fontSize(20)
       .font('Helvetica-Bold')
       .text('SOLICITAÇÃO DE CONTRATAÇÃO DE FUNCIONÁRIO', 50, 50);
    
    doc.fontSize(14)
       .font('Helvetica')
       .text('Prosperar Contabilidade', 50, 80);
    
    doc.fontSize(10)
       .text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 50, 95);
    
    doc.fontSize(8)
       .text(`ID: ${contratacao.id}`, 50, 105);

    let yPosition = 140;

    // Dados da Empresa
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('DADOS DA EMPRESA', 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(10)
       .font('Helvetica');

    const empresaData = [
      ['Razão Social:', contratacao.razaoSocial],
      ['CNPJ:', contratacao.cnpj],
      ['Endereço:', contratacao.endereco],
      ['Telefone:', contratacao.telefone],
      ['E-mail:', contratacao.email],
      ['Responsável:', contratacao.responsavel]
    ];

    empresaData.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, 50, yPosition);
      doc.font('Helvetica').text(value || '', 150, yPosition);
      yPosition += 15;
    });

    // Dados do Funcionário
    yPosition += 10;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('DADOS DO FUNCIONÁRIO', 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(10)
       .font('Helvetica');

    const funcionarioData = [
      ['Nome:', contratacao.nomeFuncionario],
      ['Nome da Mãe:', contratacao.nomeMae],
      ['CPF:', contratacao.cpfFuncionario],
      ['RG:', contratacao.rgFuncionario],
      ['Data de Nascimento:', contratacao.dataNascimento],
      ['Estado Civil:', contratacao.estadoCivil],
      ['Escolaridade:', contratacao.escolaridade],
      ['Endereço:', contratacao.endereco_funcionario],
      ['Telefone:', contratacao.telefone_funcionario],
      ['E-mail:', contratacao.email_funcionario]
    ];

    funcionarioData.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, 50, yPosition);
      doc.font('Helvetica').text(value || '', 150, yPosition);
      yPosition += 15;
    });

    // Dados do Cargo
    yPosition += 10;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('DADOS DO CARGO', 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(10)
       .font('Helvetica');

    const cargoData = [
      ['Cargo:', contratacao.cargo],
      ['Setor:', contratacao.setor],
      ['Salário:', contratacao.salario],
      ['Carga Horária:', contratacao.cargaHoraria],
      ['Tipo de Contrato:', contratacao.tipoContrato],
      ['Data de Admissão:', contratacao.dataAdmissao]
    ];

    cargoData.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, 50, yPosition);
      doc.font('Helvetica').text(value || '', 150, yPosition);
      yPosition += 15;
    });

    // Benefícios
    yPosition += 10;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('BENEFÍCIOS', 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(10)
       .font('Helvetica');

    const beneficiosData = [
      ['Vale Transporte:', contratacao.valeTransporte ? 'Sim' : 'Não'],
      ['Vale Refeição:', contratacao.valeRefeicao ? 'Sim' : 'Não'],
      ['Vale Alimentação:', contratacao.valeAlimentacao ? 'Sim' : 'Não'],
      ['Plano de Saúde:', contratacao.planoSaude ? 'Sim' : 'Não'],
      ['Plano Dental:', contratacao.planoDental ? 'Sim' : 'Não'],
      ['Seguro de Vida:', contratacao.seguroVida ? 'Sim' : 'Não']
    ];

    beneficiosData.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, 50, yPosition);
      doc.font('Helvetica').text(value || '', 150, yPosition);
      yPosition += 15;
    });

    // Dados Bancários
    yPosition += 10;
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('DADOS BANCÁRIOS', 50, yPosition);
    
    yPosition += 25;
    doc.fontSize(10)
       .font('Helvetica');

    const bancarioData = [
      ['Banco:', contratacao.banco],
      ['Agência:', contratacao.agencia],
      ['Conta:', contratacao.conta],
      ['Tipo de Conta:', contratacao.tipoConta]
    ];

    bancarioData.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, 50, yPosition);
      doc.font('Helvetica').text(value || '', 150, yPosition);
      yPosition += 15;
    });

    // Dependentes
    if (contratacao.dependentes) {
      let dependentes: any[] = [];
      try {
        dependentes = JSON.parse(contratacao.dependentes);
      } catch (error) {
        console.error('Error parsing dependentes in PDF:', error);
        dependentes = [];
      }
      
      if (dependentes.length > 0) {
        yPosition += 10;
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('DEPENDENTES (FILHOS)', 50, yPosition);
        
        yPosition += 25;
        doc.fontSize(10)
           .font('Helvetica');

        dependentes.forEach((dependente: any, index: number) => {
          doc.font('Helvetica-Bold').text(`Dependente ${index + 1}:`, 50, yPosition);
          yPosition += 15;
          
          doc.font('Helvetica-Bold').text('Nome:', 70, yPosition);
          doc.font('Helvetica').text(dependente.nomeCompleto || '', 150, yPosition);
          yPosition += 15;
          
          doc.font('Helvetica-Bold').text('Data de Nascimento:', 70, yPosition);
          doc.font('Helvetica').text(dependente.dataNascimento || '', 200, yPosition);
          yPosition += 15;
          
          doc.font('Helvetica-Bold').text('CPF:', 70, yPosition);
          doc.font('Helvetica').text(dependente.cpf || '', 150, yPosition);
          yPosition += 20;
        });
      }
    }

    // Informações Adicionais
    if (contratacao.numeroPis || contratacao.observacoes) {
      yPosition += 10;
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text('INFORMAÇÕES ADICIONAIS', 50, yPosition);
      
      yPosition += 25;
      doc.fontSize(10)
         .font('Helvetica');

      if (contratacao.numeroPis) {
        doc.font('Helvetica-Bold').text('Número PIS:', 50, yPosition);
        doc.font('Helvetica').text(contratacao.numeroPis, 150, yPosition);
        yPosition += 15;
      }

      if (contratacao.observacoes) {
        doc.font('Helvetica-Bold').text('Observações:', 50, yPosition);
        yPosition += 15;
        doc.font('Helvetica').text(contratacao.observacoes, 50, yPosition, {
          width: 500,
          align: 'justify'
        });
      }
    }

    // Footer
    doc.fontSize(8)
       .font('Helvetica')
       .text('Prosperar Contabilidade - Serviços Contábeis', 50, 750);

    doc.end();
  });
}