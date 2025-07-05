import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function cleanData(value) {
  if (!value || value.trim() === '') return null;
  return value.trim();
}

function processCNPJ(cnpj) {
  if (!cnpj) return null;
  return cnpj.replace(/[^\d]/g, ''); // Remove todos os caracteres não numéricos
}

async function importAllColumns() {
  try {
    const csvData = await readFile('attached_assets/CLIENTES PROSPERAR CONTABILIDADE - CLIENTE_1751717065440.csv', 'utf-8');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      delimiter: ','
    });

    console.log(`Importando ${records.length} registros...`);

    for (const record of records) {
      const insertQuery = `
        INSERT INTO clientes (
          data_abertura, cliente_desde, razao_social, nome_fantasia, imposto_renda, cnpj, regime_tributario,
          nire, inscricao_estadual, inscricao_municipal, telefone_empresa, email_empresa, contato, celular,
          contato_2, celular_2, cep, endereco, numero, complemento, bairro, cidade, estado,
          nota_servico, nota_venda, metragem_ocupada, capital_social, atividade_principal, atividades_secundarias,
          certificado_digital_empresa, senha_certificado_digital_empresa, validade_certificado_digital_empresa,
          procuracao_cnpj_contabilidade, procuracao_cnpj_cpf, socio_1, cpf_socio_1, senha_gov_socio_1,
          certificado_socio_1, senha_certificado_socio_1, validade_certificado_socio_1, procuracao_socio_1,
          nacionalidade_socio_1, nascimento_socio_1, filiacao_socio_1, profissao_socio_1, estado_civil_socio_1,
          endereco_socio_1, telefone_socio_1, email_socio_1, cnh_socio_1, rg_socio_1, certidao_casamento_socio_1,
          tem_debitos, tem_parcelamento, tem_divida_ativa, mensalidade_com_faturamento, mensalidade_sem_faturamento,
          certificado_empresa, senha_certificado_empresa, valor_mensalidade, data_vencimento, status_das,
          status_envio, link_mei, email, telefone_comercial
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38,
          $39, $40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56,
          $57, $58, $59, $60, $61, $62, $63, $64, $65
        )
      `;

      const values = [
        cleanData(record['DATA ABERTURA']),
        cleanData(record['CLIENTE DESDE']),
        cleanData(record['RAZÃO SOCIAL']),
        cleanData(record['NOME FANTASIA']),
        cleanData(record['IMPOSTO DE RENDA']),
        processCNPJ(record['CNPJ']),
        cleanData(record['REGIME TRIBUTÁRIO']),
        cleanData(record['NIRE']),
        cleanData(record['INSCRIÇÃO ESTADUAL']),
        cleanData(record['INSCRIÇÃO MUNICIPAL']),
        cleanData(record['TELEFONE EMPRESA']),
        cleanData(record['EMAIL EMPRESA']),
        cleanData(record['CONTATO']),
        cleanData(record['CELULAR']),
        cleanData(record['CONTATO 2']),
        cleanData(record['CELULAR 2']),
        cleanData(record['CEP.']),
        cleanData(record['ENDEREÇO']),
        cleanData(record['NUMERO']),
        cleanData(record['COMPLEMENTO']),
        cleanData(record['BAIRRO']),
        cleanData(record['CIDADE']),
        cleanData(record['ESTADO']),
        cleanData(record['NOTA DE SERVIÇO']),
        cleanData(record['NOTA DE VENDA']),
        cleanData(record['METRAGEM OCUPADA']),
        cleanData(record['CAPITAL SOCIAL']),
        cleanData(record['ATIVIDADE PRINCIPAL']),
        cleanData(record['ATIVIDADES SECUNDÁRIAS']),
        cleanData(record['CERTIFICADO DIGITAL EMPRESA']),
        cleanData(record['SENHA CERTIFICADO DIGITAL EMPRESA']),
        cleanData(record['VALIDADE CERTIFICADO DIGITAL EMPRESA']),
        cleanData(record['PROCURAÇÃO CNPJ X CONTABILIDADE']),
        cleanData(record['PROCURAÇÃO CNPJ X CPF']),
        cleanData(record['SÓCIO 1']),
        cleanData(record['CPF SÓCIO 1']),
        cleanData(record['SENHA GOV SÓCIO 1']),
        cleanData(record['CERTIFICADO SÓCIO 1']),
        cleanData(record['SENHA CERTIFICADO SÓCIO 1']),
        cleanData(record['VALIDADE CERTIFICADO SÓCIO 1']),
        cleanData(record['PROCURAÇÃO SÓCIO 1']),
        cleanData(record['NACIONALIDADE SÓCIO 1']),
        cleanData(record['DATA DE NASCIMENTO SÓCIO 1']),
        cleanData(record['FILIAÇÃO SÓCIO 1']),
        cleanData(record['PROFISSÃO SÓCIO 1']),
        cleanData(record['ESTADO CIVIL SÓCIO 1']),
        cleanData(record['ENDEREÇO SÓCIO 1']),
        cleanData(record['TELEFONE SÓCIO 1']),
        cleanData(record['E-MAIL SÓCIO 1']),
        cleanData(record['CNH SÓCIO 1']),
        cleanData(record['RG SÓCIO 1']),
        cleanData(record['CERTIDÃO DE CASAMENTO SÓCIO 1']),
        cleanData(record['TEM DÉBITOS DE IMPOSTOS']),
        cleanData(record['TEM PARCELAMENTO']),
        cleanData(record['TEM DÍVIDA ATIVA']),
        cleanData(record['MENSALIDADE COM FATURAMENTO']),
        cleanData(record['MENSALIDADE SEM FATURAMENTO']),
        cleanData(record['CERTIFICADO DA EMPRESA']),
        cleanData(record['SENHA CERTIFICADO DA EMPRESA']),
        cleanData(record['VALOR MENSALIDADE']),
        cleanData(record['DATA VENCIMENTO DAS']),
        cleanData(record['STATUS DAS']),
        cleanData(record['STATUS ENVIO']),
        cleanData(record['LINK MEI']),
        cleanData(record['EMAIL EMPRESA']), // email para compatibilidade
        cleanData(record['TELEFONE EMPRESA']) // telefone_comercial para compatibilidade
      ];

      await pool.query(insertQuery, values);
    }

    console.log(`Importação concluída: ${records.length} registros inseridos`);
  } catch (error) {
    console.error('Erro na importação:', error);
  } finally {
    await pool.end();
  }
}

importAllColumns();