import { Request, Response } from 'express';
import { googleDriveSharedService } from '../services/googledrive-shared';
import { google } from 'googleapis';
import path from 'path';

export async function shareDriveAccess(req: Request, res: Response) {
  try {
    const { userEmail } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email do usuário é obrigatório' });
    }

    console.log(`Compartilhando acesso do Drive para: ${userEmail}`);
    
    // Usar o serviço já configurado
    const serviceAccountPath = path.join(process.cwd(), 'tanamao-464721-fabfbca1450e.json');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: serviceAccountPath,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });
    const SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA';

    // Adicionar permissão para o usuário
    const permission = {
      type: 'user',
      role: 'organizer', // Máxima permissão para o proprietário
      emailAddress: userEmail
    };

    const response = await drive.permissions.create({
      fileId: SHARED_DRIVE_ID,
      resource: permission,
      supportsAllDrives: true,
      sendNotificationEmail: true,
      emailMessage: 'Acesso liberado ao Drive Compartilhado da Prosperar Contabilidade - Sistema de Gestão'
    });

    console.log(`✅ Acesso concedido para ${userEmail}`);
    console.log(`Permission ID: ${response.data.id}`);
    
    return res.json({
      success: true,
      message: `Acesso concedido para ${userEmail}`,
      permissionId: response.data.id,
      driveLink: `https://drive.google.com/drive/folders/${SHARED_DRIVE_ID}`,
      role: 'organizer'
    });
    
  } catch (error) {
    console.error('❌ Erro ao conceder acesso ao Drive:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao conceder acesso ao Drive',
      details: error.message,
      solution: 'Verifique se a conta de serviço tem permissões adequadas no Drive Compartilhado'
    });
  }
}