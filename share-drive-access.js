// Script para dar acesso ao Drive Compartilhado
const { google } = require('googleapis');
const path = require('path');

async function shareSharedDriveAccess(userEmail) {
  try {
    const serviceAccountPath = path.join(process.cwd(), 'tanamao-464721-fabfbca1450e.json');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });
    const SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA';

    // Adicionar permissão para o usuário
    const permission = {
      type: 'user',
      role: 'organizer', // ou 'writer' para editor, 'reader' para visualizador
      emailAddress: userEmail
    };

    const response = await drive.permissions.create({
      fileId: SHARED_DRIVE_ID,
      resource: permission,
      supportsAllDrives: true,
      sendNotificationEmail: true,
      emailMessage: 'Acesso liberado ao Drive Compartilhado da Prosperar Contabilidade'
    });

    console.log(`✅ Acesso concedido para ${userEmail}`);
    console.log(`Permission ID: ${response.data.id}`);
    console.log(`Link direto: https://drive.google.com/drive/folders/${SHARED_DRIVE_ID}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Erro ao conceder acesso:', error);
    throw error;
  }
}

// Para executar: node share-drive-access.js
// shareSharedDriveAccess('seu-email@gmail.com');

module.exports = { shareSharedDriveAccess };