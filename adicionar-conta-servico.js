// Script para adicionar a conta de serviço ao Drive Compartilhado
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function adicionarContaServico() {
  try {
    console.log('🔧 Adicionando conta de serviço ao Drive Compartilhado...');
    
    // Usar as suas credenciais pessoais (OAuth) para adicionar a conta de serviço
    const SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA';
    const SERVICE_ACCOUNT_EMAIL = 'sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com';
    
    console.log('📧 Conta de serviço:', SERVICE_ACCOUNT_EMAIL);
    console.log('🗂️ Drive Compartilhado ID:', SHARED_DRIVE_ID);
    
    // Mostrar instruções manuais já que você é o proprietário
    console.log('\n📋 INSTRUÇÕES PARA O PROPRIETÁRIO:');
    console.log('1. Acesse: https://drive.google.com/drive/folders/' + SHARED_DRIVE_ID);
    console.log('2. Clique no ícone de configurações (⚙️) no canto superior direito');
    console.log('3. Selecione "Gerenciar membros"');
    console.log('4. Clique em "Adicionar membros"');
    console.log('5. Cole este email: ' + SERVICE_ACCOUNT_EMAIL);
    console.log('6. Defina a permissão como "Organizador"');
    console.log('7. Desmarque "Notificar pessoas" (não precisa enviar email)');
    console.log('8. Clique em "Enviar"');
    
    console.log('\n✅ Após fazer isso, o sistema funcionará automaticamente!');
    console.log('💡 A conta de serviço precisa ser "Organizador" para criar pastas e fazer uploads');
    
    return {
      success: true,
      message: 'Instruções fornecidas para o proprietário',
      serviceAccountEmail: SERVICE_ACCOUNT_EMAIL,
      driveUrl: `https://drive.google.com/drive/folders/${SHARED_DRIVE_ID}`
    };
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

// Executar
adicionarContaServico()
  .then(result => {
    console.log('\n🎯 PRÓXIMOS PASSOS:');
    console.log('1. Siga as instruções acima como proprietário do Drive');
    console.log('2. Teste o sistema após adicionar a conta de serviço');
    console.log('3. O formulário de contratação funcionará automaticamente');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Erro ao processar:', error.message);
    process.exit(1);
  });