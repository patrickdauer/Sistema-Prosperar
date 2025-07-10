from google.oauth2 import service_account
from googleapiclient.discovery import build

# Nome do arquivo JSON da conta de serviço
SERVICE_ACCOUNT_FILE = 'tanamao-464721-fabfbca1450e.json'
SCOPES = ['https://www.googleapis.com/auth/drive']

# Faz a autenticação com a conta de serviço
credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES
)

# Cria o serviço Google Drive
service = build('drive', 'v3', credentials=credentials)

# ID do Shared Drive
SHARED_DRIVE_ID = '0APe1WRUeIBtMUk9PVA'

# Teste 1: Criar pasta no Shared Drive
folder_name = 'TESTE_PASTA_FUNCIONARIO_PYTHON'
folder_metadata = {
    'name': folder_name,
    'mimeType': 'application/vnd.google-apps.folder',
    'parents': [SHARED_DRIVE_ID]
}

try:
    folder = service.files().create(
        body=folder_metadata,
        fields='id',
        supportsAllDrives=True
    ).execute()
    
    print(f'✅ SUCCESS! Pasta criada no Shared Drive!')
    print(f'Nome da pasta: {folder_name}')
    print(f'ID da pasta: {folder.get("id")}')
    print(f'Link da pasta: https://drive.google.com/drive/folders/{folder.get("id")}')
    
    # Teste 2: Fazer upload de arquivo na pasta criada
    file_metadata = {
        'name': 'arquivo_teste_na_pasta.pdf',
        'parents': [folder.get('id')]
    }
    
    from googleapiclient.http import MediaFileUpload
    media = MediaFileUpload('exemplo.pdf', resumable=True)
    
    file_result = service.files().create(
        body=file_metadata,
        media_body=media,
        supportsAllDrives=True,
        fields='id,parents'
    ).execute()
    
    print(f'✅ SUCCESS! Arquivo enviado para a pasta!')
    print(f'ID do arquivo: {file_result.get("id")}')
    print(f'Parents do arquivo: {file_result.get("parents")}')
    
except Exception as e:
    print(f'❌ ERROR: {str(e)}')
    if hasattr(e, 'resp'):
        print(f'Response: {e.resp}')