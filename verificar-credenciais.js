// Script para verificar e validar as credenciais da conta de serviço
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function verificarCredenciais() {
  try {
    console.log('🔍 Verificando arquivo de credenciais...');
    
    const serviceAccountPath = path.join(__dirname, 'tanamao-464721-fabfbca1450e.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.log('❌ Arquivo de credenciais não encontrado:', serviceAccountPath);
      return false;
    }
    
    const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
    const credentials = JSON.parse(rawData);
    
    console.log('✅ Arquivo encontrado e é um JSON válido');
    console.log('📧 Email da conta:', credentials.client_email);
    console.log('🆔 Project ID:', credentials.project_id);
    console.log('🔑 Private Key ID:', credentials.private_key_id);
    
    // Verificar campos obrigatórios
    const requiredFields = [
      'type', 'project_id', 'private_key_id', 'private_key', 
      'client_email', 'client_id', 'auth_uri', 'token_uri'
    ];
    
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Campos obrigatórios ausentes:', missingFields);
      return false;
    }
    
    console.log('✅ Todos os campos obrigatórios estão presentes');
    
    // Verificar se a chave privada está no formato correto
    if (!credentials.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
      console.log('❌ Chave privada não está no formato correto');
      return false;
    }
    
    console.log('✅ Chave privada está no formato correto');
    
    // Verificar se o tipo é service_account
    if (credentials.type !== 'service_account') {
      console.log('❌ Tipo de credencial incorreto:', credentials.type);
      return false;
    }
    
    console.log('✅ Tipo de credencial correto: service_account');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao verificar credenciais:', error.message);
    return false;
  }
}

function gerarInstrucoes() {
  console.log('\n🔧 SOLUÇÃO RECOMENDADA:');
  console.log('1. O arquivo de credenciais pode estar corrompido ou desatualizado');
  console.log('2. Vamos regenerar as credenciais da conta de serviço');
  console.log('\n📋 PASSOS PARA REGENERAR:');
  console.log('1. Acesse: https://console.cloud.google.com/iam-admin/serviceaccounts');
  console.log('2. Selecione o projeto: tanamao-464721');
  console.log('3. Encontre a conta: sistema-interno-contabilid-169@tanamao-464721.iam.gserviceaccount.com');
  console.log('4. Clique nos 3 pontos → "Gerenciar chaves"');
  console.log('5. Clique em "Adicionar chave" → "Criar nova chave"');
  console.log('6. Selecione "JSON" e baixe');
  console.log('7. Substitua o arquivo tanamao-464721-fabfbca1450e.json pelo novo');
  console.log('\n💡 Ou podemos criar uma nova conta de serviço completamente nova');
}

// Executar verificação
const isValid = verificarCredenciais();

if (!isValid) {
  gerarInstrucoes();
  process.exit(1);
} else {
  console.log('\n✅ CREDENCIAIS VÁLIDAS');
  console.log('🤔 O problema pode ser:');
  console.log('1. As permissões ainda estão se propagando (aguarde 5-10 minutos)');
  console.log('2. A conta de serviço precisa ser reativada no Google Cloud Console');
  console.log('3. O relógio do sistema pode estar dessincronizado');
  
  console.log('\n⏰ Aguarde alguns minutos e teste novamente, ou regenere as credenciais');
  process.exit(0);
}