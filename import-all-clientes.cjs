const fs = require('fs');
const csv = require('csv-parse');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configuração do WebSocket para Neon
neonConfig.webSocketConstructor = ws;

// Configuração do banco de dados
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function cleanValue(value) {
  if (!value || value === '' || value === 'undefined' || value === 'null') {
    return null;
  }
  return value.toString().trim();
}

function processCNPJ(cnpj) {
  if (!cnpj) return null;
  return cnpj.replace(/[^0-9]/g, '').slice(0, 14);
}

function processDate(dateStr) {
  if (!dateStr) return null;
  
  // Se já está no formato YYYY-MM-DD, retorna como está
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Se está no formato DD/MM/YYYY, converte
  if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }
  
  return null;
}

async function importAllClientes() {
  try {
    // Primeiro, limpar a tabela
    console.log('Limpando tabela clientes...');
    await pool.query('DELETE FROM clientes');
    
    // Ler o arquivo CSV
    const csvData = fs.readFileSync('./attached_assets/CLIENTES PROSPERAR CONTABILIDADE - CLIENTE_1751720779272.csv', 'utf8');
    
    const records = [];
    
    // Parse do CSV
    await new Promise((resolve, reject) => {
      csv.parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, data) => {
        if (err) reject(err);
        else {
          records.push(...data);
          resolve();
        }
      });
    });

    console.log(`Processando ${records.length} registros...`);

    let imported = 0;
    let errors = 0;

    for (const record of records) {
      try {
        // Mapear campos do CSV para o banco
        const cliente = {
          data_abertura: processDate(cleanValue(record['DATA ABERTURA'])),
          cliente_desde: processDate(cleanValue(record['CLIENTE DESDE'])),
          razao_social: cleanValue(record['RAZÃO SOCIAL']),
          nome_fantasia: cleanValue(record['NOME FANTASIA']),
          imposto_renda: cleanValue(record['IMPOSTO DE RENDA']),
          cnpj: processCNPJ(cleanValue(record['CNPJ'])),
          regime_tributario: cleanValue(record['REGIME TRIBUTÁRIO']),
          nire: cleanValue(record['NIRE']),
          inscricao_estadual: cleanValue(record['INSCRIÇÃO ESTADUAL']),
          inscricao_municipal: cleanValue(record['INSCRIÇÃO MUNICIPAL']),
          telefone_empresa: cleanValue(record['TELEFONE EMPRESA']),
          email_empresa: cleanValue(record['EMAIL EMPRESA']),
          contato: cleanValue(record['CONTATO']),
          celular: cleanValue(record['CELULAR']),
          contato_2: cleanValue(record['CONTATO 2']),
          celular_2: cleanValue(record['CELULAR 2']),
          cep: cleanValue(record['CEP.']),
          endereco: cleanValue(record['ENDEREÇO']),
          numero: cleanValue(record['NUMERO']),
          complemento: cleanValue(record['COMPLEMENTO']),
          bairro: cleanValue(record['BAIRRO']),
          cidade: cleanValue(record['CIDADE']),
          estado: cleanValue(record['ESTADO']),
          nota_servico: cleanValue(record['NOTA DE SERVIÇO']),
          nota_venda: cleanValue(record['NOTA DE VENDA']),
          metragem_ocupada: cleanValue(record['METRAGEM OCUPADA']),
          capital_social: cleanValue(record['CAPITAL SOCIAL']),
          atividade_principal: cleanValue(record['ATIVIDADE PRINCIPAL']),
          atividades_secundarias: cleanValue(record['ATIVIDADES SECUNDÁRIAS']),
          certificado_digital_empresa: cleanValue(record['CERTIFICADO DIGITAL EMPRESA']),
          senha_certificado_empresa: cleanValue(record['SENHA CERTIFICADO DIGITAL EMPRESA']),
          validade_certificado_empresa: cleanValue(record['VALIDADE CERTIFICADO DIGITAL EMPRESA']),
          status: 'ativo' // Status padrão
        };

        // Verificar se já existe pelo CNPJ
        if (cliente.cnpj) {
          const existing = await pool.query('SELECT id FROM clientes WHERE cnpj = $1', [cliente.cnpj]);
          if (existing.rows.length > 0) {
            console.log(`Cliente com CNPJ ${cliente.cnpj} já existe, pulando...`);
            continue;
          }
        }

        // Inserir no banco
        const query = `
          INSERT INTO clientes (
            data_abertura, cliente_desde, razao_social, nome_fantasia, imposto_renda,
            cnpj, regime_tributario, nire, inscricao_estadual, inscricao_municipal,
            telefone_empresa, email_empresa, contato, celular, contato_2, celular_2,
            cep, endereco, numero, complemento, bairro, cidade, estado,
            nota_servico, nota_venda, metragem_ocupada, capital_social,
            atividade_principal, atividades_secundarias, certificado_digital_empresa,
            senha_certificado_empresa, validade_certificado_empresa, status,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
            $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
            $31, $32, $33, NOW(), NOW()
          )
        `;

        const values = [
          cliente.data_abertura, cliente.cliente_desde, cliente.razao_social,
          cliente.nome_fantasia, cliente.imposto_renda, cliente.cnpj,
          cliente.regime_tributario, cliente.nire, cliente.inscricao_estadual,
          cliente.inscricao_municipal, cliente.telefone_empresa, cliente.email_empresa,
          cliente.contato, cliente.celular, cliente.contato_2, cliente.celular_2,
          cliente.cep, cliente.endereco, cliente.numero, cliente.complemento,
          cliente.bairro, cliente.cidade, cliente.estado, cliente.nota_servico,
          cliente.nota_venda, cliente.metragem_ocupada, cliente.capital_social,
          cliente.atividade_principal, cliente.atividades_secundarias,
          cliente.certificado_digital_empresa, cliente.senha_certificado_empresa,
          cliente.validade_certificado_empresa, cliente.status
        ];

        await pool.query(query, values);
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`Importados ${imported} clientes...`);
        }

      } catch (error) {
        console.error(`Erro ao importar cliente ${record['RAZÃO SOCIAL']}: ${error.message}`);
        errors++;
      }
    }

    console.log(`\nImportação concluída!`);
    console.log(`✓ ${imported} clientes importados com sucesso`);
    console.log(`✗ ${errors} erros encontrados`);
    console.log(`📊 Total de registros processados: ${records.length}`);

  } catch (error) {
    console.error('Erro na importação:', error);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  importAllClientes();
}

module.exports = { importAllClientes };