import { readFileSync } from 'fs';
import { execSync } from 'child_process';

function cleanValue(value) {
  if (!value || value.trim() === '' || value === 'undefined') return null;
  return value.trim().replace(/'/g, "''"); // Escape single quotes for SQL
}

function processCNPJ(cnpj) {
  if (!cnpj) return null;
  return cnpj.replace(/[^\d]/g, '');
}

// Lê o arquivo CSV
const csvContent = readFileSync('attached_assets/CLIENTES PROSPERAR CONTABILIDADE - CLIENTE_1751718159655.csv', 'utf-8');
const lines = csvContent.split('\n');
const headers = lines[0].split(',');

console.log(`Processando ${lines.length - 1} registros...`);

// Processa cada linha (pula o cabeçalho)
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue; // Pula linhas vazias
  
  const values = [];
  let inQuotes = false;
  let currentValue = '';
  let charIndex = 0;
  
  // Parser manual para CSV com aspas
  while (charIndex < lines[i].length) {
    const char = lines[i][charIndex];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(currentValue);
      currentValue = '';
      charIndex++;
      continue;
    } else {
      currentValue += char;
    }
    charIndex++;
  }
  values.push(currentValue); // Adiciona o último valor
  
  // Se não temos valores suficientes, pula
  if (values.length < 10) continue;
  
  const insertSQL = `
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
      '${cleanValue(values[0] || '')}', '${cleanValue(values[1] || '')}', '${cleanValue(values[2] || '')}', 
      '${cleanValue(values[3] || '')}', '${cleanValue(values[4] || '')}', '${processCNPJ(values[5] || '')}', 
      '${cleanValue(values[6] || '')}', '${cleanValue(values[7] || '')}', '${cleanValue(values[8] || '')}', 
      '${cleanValue(values[9] || '')}', '${cleanValue(values[10] || '')}', '${cleanValue(values[11] || '')}', 
      '${cleanValue(values[12] || '')}', '${cleanValue(values[13] || '')}', '${cleanValue(values[14] || '')}', 
      '${cleanValue(values[15] || '')}', '${cleanValue(values[16] || '')}', '${cleanValue(values[17] || '')}', 
      '${cleanValue(values[18] || '')}', '${cleanValue(values[19] || '')}', '${cleanValue(values[20] || '')}', 
      '${cleanValue(values[21] || '')}', '${cleanValue(values[22] || '')}', '${cleanValue(values[23] || '')}', 
      '${cleanValue(values[24] || '')}', '${cleanValue(values[25] || '')}', '${cleanValue(values[26] || '')}', 
      '${cleanValue(values[27] || '')}', '${cleanValue(values[28] || '')}', '${cleanValue(values[29] || '')}', 
      '${cleanValue(values[30] || '')}', '${cleanValue(values[31] || '')}', '${cleanValue(values[32] || '')}', 
      '${cleanValue(values[33] || '')}', '${cleanValue(values[34] || '')}', '${cleanValue(values[35] || '')}', 
      '${cleanValue(values[36] || '')}', '${cleanValue(values[37] || '')}', '${cleanValue(values[38] || '')}', 
      '${cleanValue(values[39] || '')}', '${cleanValue(values[40] || '')}', '${cleanValue(values[41] || '')}', 
      '${cleanValue(values[42] || '')}', '${cleanValue(values[43] || '')}', '${cleanValue(values[44] || '')}', 
      '${cleanValue(values[45] || '')}', '${cleanValue(values[46] || '')}', '${cleanValue(values[47] || '')}', 
      '${cleanValue(values[48] || '')}', '${cleanValue(values[49] || '')}', '${cleanValue(values[50] || '')}', 
      '${cleanValue(values[51] || '')}', '${cleanValue(values[52] || '')}', '${cleanValue(values[53] || '')}', 
      '${cleanValue(values[54] || '')}', '${cleanValue(values[55] || '')}', '${cleanValue(values[56] || '')}', 
      '${cleanValue(values[57] || '')}', '${cleanValue(values[58] || '')}', '${cleanValue(values[59] || '')}', 
      '${cleanValue(values[60] || '')}', '${cleanValue(values[61] || '')}', '${cleanValue(values[62] || '')}', 
      '${cleanValue(values[11] || '')}', '${cleanValue(values[10] || '')}'
    );
  `;
  
  try {
    execSync(`echo "${insertSQL.replace(/"/g, '\\"')}" | psql "${process.env.DATABASE_URL}"`, { stdio: 'pipe' });
    console.log(`Linha ${i} inserida: ${cleanValue(values[2] || 'N/A')}`);
  } catch (error) {
    console.error(`Erro na linha ${i}:`, error.message);
  }
}

console.log('Importação concluída!');