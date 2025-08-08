// Script para testar o acesso da conta de serviço ao Drive
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testarAcesso() {
  try {
    console.log('🧪 Testando acesso da conta de serviço ao Drive...');
    
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

    console.log('📂 Testando acesso ao Drive Compartilhado...');
    
    // Tentar listar arquivos no Drive Compartilhado
    const response = await drive.files.list({
      q: `parents in "${SHARED_DRIVE_ID}"`,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      pageSize: 10
    });

    console.log('✅ SUCESSO! Conta de serviço tem acesso ao Drive');
    console.log(`📊 Encontrados ${response.data.files.length} arquivos/pastas`);
    
    if (response.data.files.length > 0) {
      console.log('📁 Primeiros arquivos encontrados:');
      response.data.files.slice(0, 3).forEach(file => {
        console.log(`  - ${file.name} (${file.mimeType})`);
      });
    }

    // Testar criação de pasta (necessário para funcionários)
    console.log('\n🧪 Testando criação de pasta...');
    
    const testFolder = await drive.files.create({
      resource: {
        name: 'TESTE_SISTEMA_' + Date.now(),
        mimeType: 'application/vnd.google-apps.folder',
        parents: [SHARED_DRIVE_ID]
      },
      supportsAllDrives: true
    });

    console.log('✅ SUCESSO! Pasta de teste criada:', testFolder.data.name);
    
    // Remover pasta de teste
    await drive.files.delete({
      fileId: testFolder.data.id,
      supportsAllDrives: true
    });
    
    console.log('🧹 Pasta de teste removida');
    
    return {
      success: true,
      message: 'Acesso ao Drive funcionando perfeitamente!',
      filesCount: response.data.files.length
    };
    
  } catch (error) {
    console.error('❌ ERRO no teste:', error.message);
    
    if (error.code === 403) {
      console.log('🚨 Ainda sem permissão. Aguarde alguns minutos para as alterações propagarem.');
    } else if (error.code === 404) {
      console.log('🚨 Drive não encontrado. Verifique o ID do Drive Compartilhado.');
    }
    
    throw error;
  }
}

// Executar teste
testarAcesso()
  .then(result => {
    console.log('\n🎉 DRIVE CONFIGURADO COM SUCESSO!');
    console.log('✅ O formulário de contratação funcionará automaticamente');
    console.log('✅ Pastas serão criadas para cada funcionário');
    console.log('✅ Documentos serão organizados automaticamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n⏰ Aguarde alguns minutos e tente novamente');
    console.error('💡 As permissões do Google podem demorar para se propagar');
    process.exit(1);
  });