from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# Nome do arquivo JSON da conta de serviço
SERVICE_ACCOUNT_FILE = 'tanamao-464721-fabfbca1450e.json'
SCOPES = ['https://www.googleapis.com/auth/drive']

# Faz a autenticação com a conta de serviço
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)

# Cria o serviço Google Drive
service = build('drive', 'v3', credentials=credentials)

# Nome do arquivo que você quer enviar (precisa estar no Replit)
file_path = 'exemplo.pdf'
file_metadata = {
    'name': 'teste_shared_drive.pdf'
}

# ID do seu Shared Drive (Unidade Compartilhada)
SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA'

media = MediaFileUpload(file_path, resumable=True)

try:
    # Test 1: Upload to Shared Drive root
    file_metadata_shared = {
        'name': 'teste_shared_drive.pdf',
        'parents': [SHARED_DRIVE_ID]
    }
    
    file1 = service.files().create(
        body=file_metadata_shared,
        media_body=media,
        supportsAllDrives=True,
        fields='id,parents'
    ).execute()
    
    print('✓ SUCCESS! Arquivo enviado para Shared Drive!')
    print('File ID:', file1.get('id'))
    print('Parents:', file1.get('parents'))
    
    # Test 2: Upload to the original shared folder
    file_metadata2 = {
        'name': 'teste_pasta_compartilhada.pdf',
        'parents': ['1bGzY-dEAevVafaAwF_hjLj0g--_A9o_e']
    }
    
    media2 = MediaFileUpload(file_path, resumable=True)
    file2 = service.files().create(
        body=file_metadata2,
        media_body=media2,
        supportsAllDrives=True,
        fields='id,parents'
    ).execute()
    
    print('✓ SUCCESS! Arquivo enviado para pasta compartilhada!')
    print('File ID:', file2.get('id'))
    print('Parents:', file2.get('parents'))
    
    # Test 3: Try uploading to Drive root (should fail)
    file_metadata3 = {
        'name': 'teste_drive_root.pdf'
    }
    
    media3 = MediaFileUpload(file_path, resumable=True)
    try:
        file3 = service.files().create(
            body=file_metadata3,
            media_body=media3,
            fields='id'
        ).execute()
        print('✓ SUCCESS! Arquivo enviado para Drive root!')
        print('File ID:', file3.get('id'))
    except Exception as e3:
        print('✗ EXPECTED ERROR for Drive root:', str(e3))
    
except Exception as e:
    print('✗ ERROR:', str(e))
    if hasattr(e, 'resp'):
        print('Response:', e.resp)