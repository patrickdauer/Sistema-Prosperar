// Script para liberar acesso diretamente via API interna
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function shareAccess() {
  try {
    console.log('🔓 Iniciando liberação de acesso ao Drive Compartilhado...');
    
    const serviceAccountPath = path.join(__dirname, 'tanamao-464721-fabfbca1450e.json');
    console.log('📁 Caminho da conta de serviço:', serviceAccountPath);
    
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });
    const SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA';
    const userEmail = 'patrickdauerpalestrante@gmail.com';

    console.log('📧 Email para liberação:', userEmail);
    console.log('🗂️ Drive Compartilhado ID:', SHARED_DRIVE_ID);

    // Adicionar permissão para o usuário
    const permission = {
      type: 'user',
      role: 'organizer',
      emailAddress: userEmail
    };

    console.log('⚙️ Criando permissão...');
    const response = await drive.permissions.create({
      fileId: SHARED_DRIVE_ID,
      resource: permission,
      supportsAllDrives: true,
      sendNotificationEmail: true,
      emailMessage: 'Acesso liberado ao Drive Compartilhado da Prosperar Contabilidade - Sistema de Gestão'
    });

    console.log('✅ SUCESSO! Acesso concedido');
    console.log('📧 Email:', userEmail);
    console.log('🔑 Permission ID:', response.data.id);
    console.log('📂 Role:', permission.role);
    console.log('🔗 Link do Drive:', `https://drive.google.com/drive/folders/${SHARED_DRIVE_ID}`);
    
    return {
      success: true,
      email: userEmail,
      permissionId: response.data.id,
      driveLink: `https://drive.google.com/drive/folders/${SHARED_DRIVE_ID}`
    };
    
  } catch (error) {
    console.error('❌ ERRO ao conceder acesso:', error);
    console.error('📝 Detalhes do erro:', error.message);
    
    if (error.code === 400) {
      console.log('🚨 Possível problema: Conta de serviço não tem permissão para gerenciar o Drive Compartilhado');
      console.log('💡 Solução: Adicione a conta de serviço sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com como Organizador do Drive');
    } else if (error.code === 404) {
      console.log('🚨 Possível problema: Drive Compartilhado não encontrado ou sem acesso');
      console.log('💡 Verificar se o ID do Drive está correto:', SHARED_DRIVE_ID);
    }
    
    throw error;
  }
}

// Executar
shareAccess()
  .then(result => {
    console.log('\n🎉 ACESSO LIBERADO COM SUCESSO!');
    console.log('📧 Verifique seu email para confirmação');
    console.log('🔗 Acesse:', result.driveLink);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 FALHA na liberação de acesso');
    process.exit(1);
  });