# 🔧 SOLUÇÃO: Criar Nova Conta de Serviço

O problema "Invalid JWT Signature" indica que as credenciais atuais estão corrompidas ou desatualizadas. 

## 📋 PASSOS PARA RESOLVER:

### 1. Criar Nova Conta de Serviço
1. Acesse: https://console.cloud.google.com/iam-admin/serviceaccounts?project=tanamao-464721
2. Clique em **"Criar conta de serviço"**
3. Configure:
   - **Nome**: `drive-automation-service`
   - **Descrição**: `Conta para automação do Google Drive - Sistema Prosperar`
   - **ID**: deixe o Google gerar automaticamente

### 2. Configurar Permissões
1. Após criar, clique na nova conta
2. Vá em **"Chaves"** → **"Adicionar chave"** → **"Criar nova chave"**
3. Selecione **"JSON"** e baixe o arquivo
4. Renomeie o arquivo para: `nova-conta-servico.json`

### 3. Habilitar APIs Necessárias
1. Acesse: https://console.cloud.google.com/apis/dashboard?project=tanamao-464721
2. Verifique se estão habilitadas:
   - **Google Drive API** ✅
   - **Google Sheets API** ✅ (opcional)

### 4. Adicionar ao Drive Compartilhado
1. Copie o email da nova conta de serviço (algo como: `drive-automation-service@tanamao-464721.iam.gserviceaccount.com`)
2. Vá ao Drive Compartilhado: https://drive.google.com/drive/folders/0APe1WRUeIBtMUk9PVA
3. Adicione a nova conta como **"Organizador"**

### 5. Substituir no Código
1. Faça upload do novo arquivo JSON para o projeto
2. Atualize o código para usar o novo arquivo

## 🎯 ALTERNATIVA RÁPIDA:
Se preferir, posso configurar o sistema para funcionar sem o Google Drive temporariamente, salvando os arquivos localmente até resolvermos o problema das credenciais.

## ❓ QUAL OPÇÃO PREFERE?
1. **Criar nova conta de serviço** (recomendado)
2. **Configurar armazenamento local temporário**
3. **Aguardar e tentar novamente mais tarde**