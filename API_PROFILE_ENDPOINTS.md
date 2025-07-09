# API de Perfil do Usuário

Esta documentação descreve os endpoints seguros para gerenciar perfis de usuário no sistema.

## Endpoints Disponíveis

### 1. GET /api/user/profile

**Descrição:** Retorna informações do perfil do usuário autenticado

**Autenticação:** Obrigatória (JWT Bearer Token)

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "username": "admin",
  "name": "Administrador",
  "email": "admin@prosperarcontabilidade.com.br",
  "role": "admin",
  "department": "contabilidade",
  "isActive": true,
  "createdAt": "2025-01-09T18:00:00.000Z",
  "updatedAt": "2025-01-09T18:00:00.000Z"
}
```

**Erros Possíveis:**
- 401: Usuário não autenticado
- 403: Usuário inativo
- 404: Usuário não encontrado

### 2. PUT /api/user/profile

**Descrição:** Atualiza informações do perfil do usuário autenticado

**Autenticação:** Obrigatória (JWT Bearer Token)

**Corpo da Requisição:**
```json
{
  "name": "Novo Nome",
  "email": "novo@email.com",
  "department": "fiscal",
  "currentPassword": "senha_atual",  // Opcional - apenas se alterar senha
  "newPassword": "nova_senha"        // Opcional - apenas se alterar senha
}
```

**Resposta de Sucesso (200):**
```json
{
  "id": 1,
  "username": "admin",
  "name": "Novo Nome",
  "email": "novo@email.com",
  "role": "admin",
  "department": "fiscal",
  "isActive": true,
  "createdAt": "2025-01-09T18:00:00.000Z",
  "updatedAt": "2025-01-09T21:30:00.000Z"
}
```

**Erros Possíveis:**
- 400: Dados inválidos ou senha atual incorreta
- 401: Usuário não autenticado
- 404: Usuário não encontrado

## Recursos de Segurança

### Autenticação
- Todos os endpoints requerem autenticação JWT
- Token deve ser enviado no header `Authorization: Bearer <token>`
- Tokens expiram em 24 horas

### Validações
- Verificação de usuário ativo
- Validação de dados de entrada
- Senha atual obrigatória para alterações de senha
- Nova senha deve ter pelo menos 6 caracteres

### Proteção de Dados
- Senhas nunca são retornadas nas respostas
- Hash seguro de senhas com bcrypt
- Dados sensíveis filtrados antes do retorno

## Campos Editáveis

### ✅ Permitidos para Auto-Edição:
- `name`: Nome completo do usuário
- `email`: Email do usuário
- `department`: Departamento do usuário
- `password`: Senha (requer senha atual)

### ❌ Não Permitidos para Auto-Edição:
- `username`: Nome de usuário (identificador único)
- `role`: Função do usuário (apenas admins podem alterar)
- `isActive`: Status ativo (apenas admins podem alterar)
- `id`: ID do usuário (imutável)
- `createdAt`: Data de criação (imutável)

## Exemplos de Uso

### JavaScript/TypeScript

```javascript
// Buscar perfil do usuário
const getProfile = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/user/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Atualizar perfil
const updateProfile = async (data) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

### cURL

```bash
# Buscar perfil
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Atualizar perfil
curl -X PUT http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Nome",
    "email": "novo@email.com",
    "department": "fiscal"
  }'
```

## Hooks React (Disponíveis)

O sistema inclui hooks React prontos para uso:

### useUserProfile()
```typescript
import { useUserProfile } from '@/hooks/useUserProfile';

const { data: profile, isLoading, error } = useUserProfile();
```

### useUpdateProfile()
```typescript
import { useUpdateProfile } from '@/hooks/useUserProfile';

const updateProfile = useUpdateProfile();
const handleUpdate = async (data) => {
  await updateProfile.mutateAsync(data);
};
```

## Componentes React (Disponíveis)

### UserProfileCard
Exibe informações do perfil com opção de edição

### UserProfileForm
Formulário completo para edição de perfil com validação

### Exemplo de Uso
```typescript
import { UserProfileCard } from '@/components/UserProfileCard';
import { UserProfileForm } from '@/components/UserProfileForm';

// Ver exemplo completo em: client/src/pages/user-profile-example.tsx
```

## Departamentos Disponíveis

- contabilidade
- fiscal
- departamento_pessoal
- societario
- financeiro

## Funções (Roles) do Sistema

- admin: Administrador com acesso total
- manager: Gerente com acesso parcial
- user: Usuário padrão com acesso limitado

---

**Nota:** Este sistema foi desenvolvido seguindo as melhores práticas de segurança e está totalmente integrado com a autenticação JWT existente.