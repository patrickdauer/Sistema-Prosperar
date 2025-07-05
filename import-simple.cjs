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
        // Inserir no banco com apenas as colunas principais
        const query = `
          INSERT INTO clientes (
            data_abertura, cliente_desde, razao_social, nome_fantasia, imposto_renda,
            cnpj, regime_tributario, telefone_empresa, email_empresa, contato, celular,
            endereco, numero, complemento, bairro, cidade, estado,
            status, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW()
          )
        `;

        const values = [
          processDate(cleanValue(record['DATA ABERTURA'])),
          processDate(cleanValue(record['CLIENTE DESDE'])),
          cleanValue(record['RAZÃO SOCIAL']),
          cleanValue(record['NOME FANTASIA']),
          cleanValue(record['IMPOSTO DE RENDA']),
          processCNPJ(cleanValue(record['CNPJ'])),
          cleanValue(record['REGIME TRIBUTÁRIO']),
          cleanValue(record['TELEFONE EMPRESA']),
          cleanValue(record['EMAIL EMPRESA']),
          cleanValue(record['CONTATO']),
          cleanValue(record['CELULAR']),
          cleanValue(record['ENDEREÇO']),
          cleanValue(record['NUMERO']),
          cleanValue(record['COMPLEMENTO']),
          cleanValue(record['BAIRRO']),
          cleanValue(record['CIDADE']),
          cleanValue(record['ESTADO']),
          'ativo' // Status padrão
        ];

        await pool.query(query, values);
        imported++;
        
        if (imported % 20 === 0) {
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