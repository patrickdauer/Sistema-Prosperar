# Como Resolver a Limitação do Google Drive

## Problema Atual
Service Accounts não têm cota de armazenamento própria, por isso o upload de arquivos falha com erro 403.

## Solução Definitiva: Shared Drive

### Passo 1: Criar Shared Drive
1. Acesse o Google Drive com uma conta Google Workspace (G Suite)
2. Clique em "Novo" > "Mais" > "Shared Drive"
3. Nomeie o Shared Drive (ex: "Prosperar Contabilidade")
4. Anote o ID do Shared Drive criado

### Passo 2: Dar Acesso à Conta de Serviço
1. No Shared Drive criado, clique em "Gerenciar membros"
2. Adicione o email da conta de serviço: `upload-empresas@automacao-contabilidade.iam.gserviceaccount.com`
3. Defina permissão como "Editor" ou "Gerenciador de conteúdo"

### Passo 3: Modificar o Código
Alterar o código para usar o ID do Shared Drive:

```typescript
// No arquivo server/routes.ts
const SHARED_DRIVE_ID = 'SEU_SHARED_DRIVE_ID_AQUI';

// Modificar upload para usar supportsAllDrives
const result = await googleDriveService.uploadFile(
  fileName, 
  file.buffer, 
  file.mimetype, 
  SHARED_DRIVE_ID,
  { supportsAllDrives: true }
);
```

### Passo 4: Testar
Após implementar, os uploads funcionarão sem erro 403.

## Alternativas Mais Simples

### Opção A: Manter Como Está
- Sistema funciona 95% (emails, webhook, banco funcionam)
- Apenas upload de arquivos não funciona
- Usuários podem fazer upload manual na pasta

### Opção B: Usar Outro Serviço
- Dropbox Business API
- AWS S3
- Azure Blob Storage
- Google Cloud Storage

## Recomendação
Para resolver definitivamente e manter o Google Drive, implemente o **Shared Drive** conforme os passos acima.