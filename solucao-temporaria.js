// Solução temporária: verificar status da conta de serviço e testar em intervalos
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testarComRetry() {
  const maxTentativas = 5;
  const intervalo = 30000; // 30 segundos

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    try {
      console.log(`🧪 Tentativa ${tentativa}/${maxTentativas} - Testando acesso...`);
      
      const serviceAccountPath = path.join(__dirname, 'tanamao-464721-fabfbca1450e.json');
      
      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: [
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      const drive = google.drive({ version: 'v3', auth });
      const SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA';

      // Testar acesso
      const response = await drive.files.list({
        q: `parents in "${SHARED_DRIVE_ID}"`,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        pageSize: 5
      });

      console.log('✅ SUCESSO! Acesso ao Drive funcionando');
      console.log(`📂 Encontrados ${response.data.files.length} arquivos/pastas`);
      
      return true;

    } catch (error) {
      console.log(`❌ Tentativa ${tentativa} falhou:`, error.message);
      
      if (tentativa < maxTentativas) {
        console.log(`⏰ Aguardando ${intervalo/1000} segundos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, intervalo));
      }
    }
  }
  
  return false;
}

async function verificarStatusConta() {
  try {
    console.log('📋 INSTRUÇÕES PARA VERIFICAR A CONTA DE SERVIÇO:');
    console.log('1. Acesse: https://console.cloud.google.com/iam-admin/serviceaccounts?project=tanamao-464721');
    console.log('2. Verifique se a conta sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com está ATIVADA');
    console.log('3. Se estiver desabilitada, clique nos 3 pontos → "Habilitar"');
    console.log('4. Verifique se as APIs necessárias estão habilitadas:');
    console.log('   - Google Drive API');
    console.log('   - Google Sheets API (opcional)');
    console.log('\n🔗 Links úteis:');
    console.log('- APIs: https://console.cloud.google.com/apis/dashboard?project=tanamao-464721');
    console.log('- Conta de serviço: https://console.cloud.google.com/iam-admin/serviceaccounts?project=tanamao-464721');
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Executar
console.log('🚀 Iniciando testes com retry...');
testarComRetry()
  .then(sucesso => {
    if (sucesso) {
      console.log('\n🎉 DRIVE CONFIGURADO COM SUCESSO!');
      console.log('✅ O sistema de contratação funcionará automaticamente');
    } else {
      console.log('\n❌ Não foi possível conectar após várias tentativas');
      console.log('💡 Vamos verificar a configuração da conta de serviço...');
      verificarStatusConta();
    }
  })
  .catch(error => {
    console.error('Erro geral:', error.message);
    verificarStatusConta();
  });