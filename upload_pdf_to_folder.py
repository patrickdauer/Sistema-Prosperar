#!/usr/bin/env python3
import sys
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

def upload_pdf_to_folder(file_path, folder_id, file_name):
    """
    Upload any file to a specific folder in Google Drive
    """
    # Nome do arquivo JSON da conta de serviço
    SERVICE_ACCOUNT_FILE = 'tanamao-464721-fabfbca1450e.json'
    SCOPES = ['https://www.googleapis.com/auth/drive']

    # Faz a autenticação com a conta de serviço
    credentials = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES
    )

    # Cria o serviço Google Drive
    service = build('drive', 'v3', credentials=credentials)

    try:
        # Metadados do arquivo
        file_metadata = {
            'name': file_name,
            'parents': [folder_id]
        }

        # Detecta o tipo de arquivo
        import mimetypes
        detected_mimetype, _ = mimetypes.guess_type(file_path)
        if detected_mimetype is None:
            detected_mimetype = 'application/octet-stream'
        
        # Faz o upload do arquivo
        media = MediaFileUpload(file_path, mimetype=detected_mimetype, resumable=True)
        
        file_result = service.files().create(
            body=file_metadata,
            media_body=media,
            supportsAllDrives=True,
            fields='id,parents'
        ).execute()

        print(f'✅ SUCCESS! File uploaded to folder!')
        print(f'File ID: {file_result.get("id")}')
        print(f'Parents: {file_result.get("parents")}')
        print(f'File name: {file_name}')
        print(f'Folder ID: {folder_id}')
        print(f'Detected MIME type: {detected_mimetype}')
        
        return file_result.get('id')
    
    except Exception as e:
        print(f'❌ ERROR uploading file: {str(e)}')
        return None

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print('Usage: python upload_pdf_to_folder.py <file_path> <folder_id> <file_name>')
        sys.exit(1)
    
    file_path = sys.argv[1]
    folder_id = sys.argv[2]
    file_name = sys.argv[3]
    
    # Verifica se o arquivo existe
    if not os.path.exists(file_path):
        print(f'❌ ERROR: File not found: {file_path}')
        sys.exit(1)
    
    # Faz o upload
    result = upload_pdf_to_folder(file_path, folder_id, file_name)
    
    if result:
        sys.exit(0)
    else:
        sys.exit(1)