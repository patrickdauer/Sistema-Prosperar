import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from './server/db.js';
import { clientes } from './shared/clientes-schema.js';

// Função para limpar e processar dados
function cleanData(value) {
  if (!value || value === '') return null;
  return value.trim();
}

// Função para processar telefone
function processPhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
}

// Função para processar CNPJ
function processCNPJ(cnpj) {
  if (!cnpj) return null;
  return cnpj.replace(/[^\d]/g, ''); // Remove caracteres especiais
}

async function importClientes() {
  try {
    console.log('Lendo arquivo CSV...');
    const csvContent = fs.readFileSync('attached_assets/CLIENTES PROSPERAR CONTABILIDADE - CLIENTE_1751717065440.csv', 'utf-8');
    
    console.log('Processando dados...');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    console.log(`Encontrados ${records.length} registros para importar`);
    
    let imported = 0;
    
    for (const record of records) {
      try {
        // Mapeamento dos campos do CSV para o banco
        const clienteData = {
          email: cleanData(record['EMAIL EMPRESA']) || 'sem-email@prosperar.com.br',
          razaoSocial: cleanData(record['RAZÃO SOCIAL']) || 'Nome não informado',
          endereco: `${cleanData(record['ENDEREÇO']) || ''} ${cleanData(record['NUMERO']) || ''} ${cleanData(record['COMPLEMENTO']) || ''} ${cleanData(record['BAIRRO']) || ''} ${cleanData(record['CIDADE']) || ''} ${cleanData(record['ESTADO']) || ''}`.trim(),
          dataNascimento: cleanData(record['DATA ABERTURA']),
          cnpj: processCNPJ(record['CNPJ']),
          inscricaoEstadual: cleanData(record['INSCRIÇÃO ESTADUAL']),
          inscricaoMunicipal: cleanData(record['INSCRIÇÃO MUNICIPAL']),
          nomeFantasia: cleanData(record['NOME FANTASIA']),
          telefoneComercial: processPhone(record['TELEFONE EMPRESA']),
          telefonePessoal: processPhone(record['CELULAR']),
          emailPessoal: cleanData(record['EMAIL EMPRESA']),
          cep: cleanData(record['CEP.']),
          numero: cleanData(record['NUMERO']),
          complemento: cleanData(record['COMPLEMENTO']),
          bairro: cleanData(record['BAIRRO']),
          cidade: cleanData(record['CIDADE']),
          estado: cleanData(record['ESTADO']),
          atividadePrincipal: cleanData(record['ATIVIDADE PRINCIPAL']),
          atividadesSecundarias: cleanData(record['ATIVIDADES SECUNDÁRIAS']),
          capitalSocial: record['CAPITAL SOCIAL'] ? parseFloat(record['CAPITAL SOCIAL'].toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : null,
          regimeTributario: cleanData(record['REGIME TRIBUTÁRIO']),
          dataAbertura: cleanData(record['DATA ABERTURA']),
          clienteDesde: cleanData(record['CLIENTE DESDE']),
          impostoRenda: cleanData(record['IMPOSTO DE RENDA']),
          nire: cleanData(record['NIRE']),
          contato: cleanData(record['CONTATO']),
          celular: processPhone(record['CELULAR']),
          contato2: cleanData(record['CONTATO 2']),
          celular2: processPhone(record['CELULAR 2']),
          notaServico: cleanData(record['NOTA DE SERVIÇO']),
          notaVenda: cleanData(record['NOTA DE VENDA']),
          metragemOcupada: cleanData(record['METRAGEM OCUPADA']),
          certificadoDigitalEmpresa: cleanData(record['CERTIFICADO DIGITAL EMPRESA']),
          senhaCertificadoDigital: cleanData(record['SENHA CERTIFICADO DIGITAL EMPRESA']),
          validadeCertificadoDigital: cleanData(record['VALIDADE CERTIFICADO DIGITAL EMPRESA']),
          site: cleanData(record['LINK MEI']),
          status: 'ativo',
          numeroPis: cleanData(record['NÚMERO PIS']),
          observacoes: cleanData(record['OBSERVAÇÕES']),
          indicadoPor: cleanData(record['INDICADO POR']),
          socios: record['SÓCIO 1'] ? [{
            nome: cleanData(record['SÓCIO 1']),
            cpf: processCNPJ(record['CPF SÓCIO 1']),
            nacionalidade: cleanData(record['NACIONALIDADE SÓCIO 1']),
            dataNascimento: cleanData(record['DATA DE NASCIMENTO SÓCIO 1']),
            filiacao: cleanData(record['FILIAÇÃO SÓCIO 1']),
            profissao: cleanData(record['PROFISSÃO SÓCIO 1']),
            estadoCivil: cleanData(record['ESTADO CIVIL SÓCIO 1']),
            endereco: cleanData(record['ENDEREÇO SÓCIO 1']),
            telefone: processPhone(record['TELEFONE SÓCIO 1']),
            email: cleanData(record['E-MAIL SÓCIO 1']),
            rg: cleanData(record['RG SÓCIO 1'])
          }] : []
        };

        // Inserir no banco
        await db.insert(clientes).values(clienteData);
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`Importados ${imported} clientes...`);
        }
        
      } catch (error) {
        console.error(`Erro ao importar cliente ${record['RAZÃO SOCIAL']}:`, error.message);
      }
    }
    
    console.log(`\nImportação concluída! Total de clientes importados: ${imported}`);
    
  } catch (error) {
    console.error('Erro durante a importação:', error);
  }
}

// Executar importação
importClientes().then(() => {
  console.log('Script finalizado');
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});