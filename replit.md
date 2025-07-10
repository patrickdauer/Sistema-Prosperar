# Business Registration System

## Overview

This is a comprehensive full-stack business registration application built with React frontend and Express.js backend. The system provides a complete workflow for clients to submit business registration forms with document uploads, automatic file organization in Google Drive, email confirmations, WhatsApp notifications, PDF generation, and an admin dashboard for managing submissions.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for dark/light theme support
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Custom FileUpload component with dropzone functionality
- **Theme System**: Dark mode default with light mode toggle

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16 with Drizzle ORM
- **File Handling**: Multer for multipart form data processing
- **PDF Generation**: Puppeteer for automated PDF creation
- **Email Service**: Nodemailer for automated email confirmations
- **Cloud Storage**: Google Drive API for document organization
- **Build Tool**: ESBuild for production builds

### Build System
- **Frontend Bundler**: Vite with React plugin
- **Backend Bundler**: ESBuild for production builds
- **Development Server**: Vite dev server proxied through Express
- **TypeScript**: Configured for both client and server with path aliases

## Key Features

### Multiple Partners Support
- Add unlimited business partners to registration
- Individual document uploads for each partner
- Complete partner data collection (personal info, documents, contact details)
- Edit/delete partners before submission

### Document Management
- Automatic Google Drive folder creation named by business (e.g., "Razão Social - ID")
- Individual file uploads per partner with proper naming conventions
- Support for JPEG, PNG, and PDF formats (10MB limit)
- Document validation and progress tracking

### Automated Workflows
- **Email Confirmations**: Automatic emails sent to both client and contato@prosperarcontabilidade.com.br
- **PDF Generation**: Professional PDF with all business and partner data
- **WhatsApp Notifications**: Integration with n8n webhook for instant notifications
- **Google Drive Organization**: All files and generated PDF uploaded to dedicated folder

### Admin Dashboard
- View all business registration submissions
- Filter by status (pending, processing, completed)
- Search by business name
- Detailed view of each submission
- PDF download functionality
- Real-time statistics

### Database Schema
The system uses a `business_registrations` table with:
- **Company Data**: Business details, activities, contact information
- **Partners Data**: JSON array of partner objects with complete information
- **File Management**: Document URLs linked to Google Drive
- **Status Tracking**: Workflow status and timestamps

### API Endpoints
- `POST /api/business-registration` - Submit registration with file uploads
- `GET /api/business-registrations` - List all registrations (dashboard)
- `GET /api/business-registration/:id` - Get specific registration
- `GET /api/business-registration/:id/pdf` - Generate and download PDF

### Frontend Pages
- **Business Registration Form (/)**: Public form for clients to submit registration data
- **Dashboard (/dashboard)**: Admin interface for viewing submissions
- **Team Access (/equipe)**: Login page for internal team members
- **Internal Dashboard (/interno)**: Protected Kanban system for authenticated users
- **404 Page**: Custom not found page

## Data Flow

1. **Form Submission**: User completes business and partner information with document uploads
2. **Client Validation**: Comprehensive Zod schema validation
3. **Backend Processing**: Multi-partner data processing and file handling
4. **Database Storage**: Registration data stored in PostgreSQL
5. **Google Drive Upload**: Automatic folder creation and file organization
6. **PDF Generation**: Professional business summary PDF created and uploaded
7. **Email Notifications**: Confirmation emails sent to client and accounting office
8. **WhatsApp Integration**: n8n webhook triggered for instant messaging
9. **Dashboard Updates**: Real-time dashboard reflects new submissions

## External Dependencies

### Core Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm and drizzle-zod for database operations
- **UI**: Comprehensive Radix UI component suite with date-fns
- **Forms**: @hookform/resolvers with Zod validation
- **File Handling**: react-dropzone for file uploads, multer for backend
- **PDF Generation**: puppeteer for document creation
- **Email Service**: nodemailer for automated emails
- **Cloud Storage**: googleapis for Google Drive integration

### Development Tools
- **Build**: Vite for frontend, ESBuild for backend
- **Runtime**: TSX for TypeScript development
- **Styling**: Tailwind CSS with PostCSS and theme support

## Environment Variables Required

### Email Configuration
- `EMAIL_USER`: Gmail account for sending emails
- `EMAIL_PASSWORD`: Gmail app password

### Google Drive Integration
- `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON service account key for Google Drive API

### n8n Integration
- `N8N_WEBHOOK_URL`: Webhook URL for WhatsApp notifications

### Database
- `DATABASE_URL`: PostgreSQL connection string (auto-configured in Replit)

## Deployment Strategy

### Development Environment
- Replit-hosted with PostgreSQL database
- Hot reload enabled for both frontend and backend
- Port 5000 configured for local development
- Dark theme as default with toggle functionality

### Production Build
- Frontend: Vite build to `dist/public`
- Backend: ESBuild bundle to `dist/index.js`
- Database migrations via Drizzle push
- Environment variables required for full functionality

### File Storage Strategy
- Google Drive API integration with service account authentication
- Automatic folder creation per business registration
- Professional PDF generation and upload
- Organized file naming conventions

## Recent Changes

### July 10, 2025 - Sistema de Contratação de Funcionários Completo
- **Banco de Dados**: Criado sistema completo para armazenar todas as informações do formulário de contratação
  - Tabela `contratacao_funcionarios` com todos os campos do formulário
  - Apenas checkbox "Li e estou ciente" é obrigatório, todos outros campos opcionais
  - Suporte a dependentes (filhos) armazenados como JSON
  - Sistema de status para acompanhar o progresso das contratações
- **Formulário Corrigido**: Resolvidos problemas de envio e validação
  - Pergunta sobre carteira de trabalho removida conforme solicitado
  - Upload de arquivos funcionando corretamente
  - Validação simplificada focando apenas no consentimento obrigatório
- **APIs Completas**: Implementadas rotas para gerenciar contratações
  - POST /api/contratacao-funcionarios - Criar nova contratação
  - GET /api/contratacao-funcionarios - Listar todas as contratações
  - GET /api/contratacao-funcionarios/:id - Buscar contratação específica
- **Integração Externa**: Configurado envio automático
  - Emails para contato@prosperarcontabilidade.com.br e empresasdp01@gmail.com
  - Webhook para https://webhook.aquiprospera.com.br/webhook/515d783f-ebad-4f9b-bdfe-dd9c214525a9
  - Upload de arquivos para Google Drive (configurado mas temporariamente desabilitado)
- **Geração de PDF**: Sistema funcional para gerar relatórios das contratações
  - Informações da empresa, funcionário, benefícios e dados bancários
  - Dependentes incluídos no relatório quando presentes

## Recent Changes

### January 09, 2025 - Sistema de Perfil de Usuário com Endpoints Seguros
- **Endpoints de Perfil**: Criados endpoints seguros para gerenciamento de perfil do usuário
  - GET /api/user/profile - Recupera dados do perfil de forma segura
  - PUT /api/user/profile - Atualiza informações do perfil com validação
  - Autenticação JWT obrigatória com verificação de usuário ativo
  - Validação de senha atual para alterações de senha
  - Dados sensíveis nunca retornados nas respostas
- **Hooks React**: Desenvolvidos hooks personalizados para gerenciamento de perfil
  - useUserProfile() - Hook para buscar dados do perfil
  - useUpdateProfile() - Hook para atualizar perfil com cache invalidation
  - useCanEditProfile() - Hook para verificar permissões de edição
- **Componentes React**: Criados componentes completos para interface de perfil
  - UserProfileCard - Exibe informações do perfil com opção de edição
  - UserProfileForm - Formulário completo com validação e alteração de senha
  - Exemplo de uso completo em user-profile-example.tsx
- **Recursos de Segurança**: Implementada proteção completa de dados
  - Hash seguro de senhas com bcrypt
  - Verificação de usuário ativo antes de operações
  - Validação de dados de entrada com mensagens específicas
  - Campos editáveis limitados para auto-edição (nome, email, departamento, senha)
- **Documentação**: Criada documentação completa em API_PROFILE_ENDPOINTS.md
  - Exemplos de uso em JavaScript/TypeScript e cURL
  - Descrição detalhada de segurança e validações
  - Lista de campos editáveis e restrições

### January 05, 2025 - Sistema Completo de Status de Dívidas Tributárias e Observações de Mensalidade
- **Status Dívidas Tributárias**: Criado sistema completo para gerenciamento de status de dívidas tributárias
  - Seção organizada em três subsistemas: Débitos, Parcelamentos e Dívida Ativa
  - Campos de observação individuais para cada tipo de dívida (observacoes_debitos, observacoes_parcelamentos, observacoes_divida_ativa)
  - Interface com bordas e organização visual clara para cada subsistema
- **Observações de Mensalidade**: Adicionado campo para observações sobre negociação e histórico de pagamentos
  - Campo observacoes_mensalidade para documentar negociações com clientes
  - Implementado tanto na página de detalhes quanto no formulário de novo cliente
- **Atualização de Schema**: Adicionados novos campos ao banco de dados e interfaces
  - tem_parcelamentos (corrigido para plural) e campos de observação
  - Validação e integração completa em todas as interfaces
- **Consistência de Interface**: Mantida uniformidade entre formulário de novo cliente e detalhes do cliente

### January 05, 2025 - Reorganização de Campos no Sistema de Clientes
- **Correção de Organização**: Movidos os campos NIRE, Nota de Serviço, Nota de Venda e Observações para dentro da seção "Informações da Empresa"
- **Consistência de Interface**: Atualizado tanto o formulário de novo cliente quanto as páginas de detalhes dos clientes existentes
- **Melhoria da UX**: Campos agora estão logicamente agrupados na seção correta para melhor organização da informação
- **Observações como Textarea**: Campo de observações agora utiliza textarea com múltiplas linhas na seção "Informações da Empresa"

### January 02, 2025 - Expansão do Sistema com Novos Cards e Correções
- **Novos Cards de Ferramentas**: Adicionados três novos cards na página home do sistema interno
  - Prompt Pro: https://prompt-pro-patrickdauer.replit.app/ (ícone Zap)
  - Link Hub Pro: https://link-hub-pro-patrickdauer.replit.app/ (ícone Link)
  - Salão Contrato: https://salao-contrato-patrickdauer.replit.app/ (ícone Scissors)
- **Logo Corrigida**: Aplicado fundo transparente na logo da página de contratação de funcionários
- **API Contratação**: Criada rota /api/contratacao-funcionarios funcional com validação e storage
- **Título Atualizado**: "Sistema Interno" em branco, "Prosperar Contabilidade" em verde no cabeçalho
- **Integração Completa**: Todos os cards abrem em nova aba sem necessidade de novo login

### December 28, 2025 - Sistema CRUD Completo no Dashboard Geral
- **CRUD Completo**: Implementado sistema completo para criar, ler, atualizar e deletar empresas
- **Botões de Status**: Sistema de mudança de status com cores específicas e lógica contextual
  - Pendente: Vermelho (#dc2626) com ícone AlertCircle
  - Em Processamento: Amarelo (#ca8a04) com ícone Clock
  - Concluída: Verde (#16a34a) com ícone CheckCircle
- **Formulário de Edição Completo**: Página de edição com todos os campos do formulário original
  - Dados da empresa (razão social, CNPJ, endereço, atividades, capital social)
  - Gestão completa de sócios (adicionar, remover, editar todos os campos)
  - Interface organizada em seções com validação
- **Layout Otimizado**: Botões organizados em grupos lógicos com espaçamento adequado
- **Criação de Empresas**: Botão redireciona para página /business-registration
- **Padronização Visual**: Página business-registration aplicada com tema escuro consistente
  - Gradiente de fundo cinza escuro como página inicial
  - Cards com fundo #1f2937 e bordas #374151
  - Ícones verdes (#22c55e) para destaques
  - Texto branco e campos com fundo escuro
  - Botões com cores padronizadas (verde para ações principais)
- **Backend Completo**: Rotas implementadas (GET, POST, PUT, PATCH, DELETE)
- **Funcionalidade de Deleção**: Confirmação antes de excluir com feedback visual

### December 28, 2025 - Correção Completa do Sistema PDF
- **Geração de PDF Funcional**: Substituído Puppeteer por PDFKit nativa para compatibilidade total com Replit
- **Layout Organizado**: Corrigida formatação com campos alinhados e espaçamento adequado
- **Estrutura Profissional**: PDF com seções bem definidas (Informações Gerais, Endereço, Atividades, Sócios)
- **Dados Completos**: Todos os campos do formulário incluídos (CNPJ, participação, endereços)
- **Download Funcional**: Botão "Baixar PDF" no Dashboard Geral totalmente operacional
- **Performance Otimizada**: Geração rápida sem dependências de navegador

### December 28, 2025 - Dashboard Geral Completo
- **Página de Detalhes**: Visualização completa de empresas com todos os campos organizados
- **Tema Escuro Consistente**: Aplicado esquema de cores (#0a0a0a, #1a1a1a, #22c55e, #ff8c42) em toda interface
- **Informações dos Sócios**: Detalhes completos incluindo endereço, participação e profissão
- **Seção de Contatos**: Resumo organizado com informações da empresa e sócios
- **Navegação Melhorada**: Botão "Voltar ao Menu" e estrutura intuitiva

### December 28, 2025 - Sistema de Auto-Edição de Perfil do Usuário
- **Página de Perfil**: Criada página `/profile` onde cada usuário pode editar seus próprios dados
- **Auto-Edição**: Usuários podem alterar nome, email, departamentos e senha sem precisar de admin
- **Seleção Múltipla**: Sistema de checkboxes para seleção de múltiplos departamentos por usuário
- **Validação de Senha**: Alteração de senha requer senha atual para segurança
- **Navegação**: Botão "Meu Perfil" no header da home para acesso fácil
- **Backend Seguro**: Rotas modificadas para permitir auto-edição mantendo segurança
- **Correção Crítica**: Resolvido problema de hash duplo de senhas que impedia login após alteração

### December 28, 2025 - Interface Visual com Tema Escuro Personalizado
- **Tema Escuro**: Implementado tema escuro completo na página home do sistema interno
- **Esquema de Cores**: Títulos em verde (#22c55e), ícones em laranja (#ff8c42), textos em branco
- **Cards Modernos**: Fundo escuro (#1a1a1a) com bordas sutis (#333) e efeitos hover
- **Navegação Corrigida**: Dashboard Geral direciona para /dashboard com estatísticas
- **Link Externo**: Simulador de Custos direciona para https://dark-simulador-patrickdauer.replit.app/
- **Visual Profissional**: Layout limpo e moderno mantendo a funcionalidade completa

### December 28, 2025 - Sistema de Navegação com Abas e Botões de Retorno
- **Navegação em Novas Abas**: Todos os links da página home agora abrem em nova janela (_blank)
- **Botão "Voltar ao Menu"**: Implementado componente BackToHomeButton com detecção inteligente
- **Páginas Públicas**: Cadastro Empresarial e Contratação retornam para landing page (/)
- **Páginas Internas**: Sistema administrativo retorna para /home
- **Navegação Inteligente**: Detecta se foi aberto em nova janela e age adequadamente
- **Design Consistente**: Mantido tema escuro com verde principal e texto branco

### December 28, 2025 - Sistema de Gestão de Usuários Completo
- **Gestão de Senhas**: Implementada funcionalidade completa para alterar senhas dos usuários
- **Interface de Usuários**: Botão com ícone de chave (laranja) para alterar senha em cada card de usuário
- **Validação de Senhas**: Verificação de senha mínima de 6 caracteres e confirmação
- **Correção de Hash**: Corrigido problema de hash duplo que impedia login de novos usuários
- **Rota Backend**: Criada rota PATCH /api/users/:id/password para alteração de senhas
- **Navegação Corrigida**: Página de gestão de usuários agora abre na mesma janela

### December 28, 2025 - Conversão para Autenticação Tradicional
- **Sistema de Autenticação**: Completamente convertido do Replit Auth para autenticação tradicional usuário/senha
- **Página de Login**: Criada nova página de login em português com design moderno (tema escuro, verde, texto branco)
- **Banco de Dados**: Atualizada estrutura da tabela users para usar IDs numéricos e campos username/password
- **Tokens JWT**: Implementado sistema de tokens JWT armazenados no localStorage
- **Usuário Admin**: Criado usuário padrão admin/admin123 para acesso ao sistema
- **Credenciais**: Sistema funciona com usuário "admin" e senha "admin123"

### December 28, 2025 - Replit Auth Integration
- **Authentication System**: Completely replaced custom JWT authentication with Replit Auth
- **Landing Page**: Created new landing page with "Sistema de Gestão Prosperar Contabilidade" branding
- **Color Scheme**: Updated to dark theme with green primary color, white text, and orange accents
- **Database Schema**: Modified users table for Replit Auth compatibility (string IDs, OAuth fields)
- **Session Management**: Implemented PostgreSQL session storage for secure authentication
- **Protected Routes**: Set up authentication middleware for internal system access
- **Public Access**: Maintained public access to business registration and employee hiring forms

### December 20, 2025 - Complete System with Search and Export Features
- **Task Management**: Complete CRUD operations for tasks in each department with delete and create functionality
- **Full Company Editing**: All company fields editable including address, capital, activities, and partner data
- **Partner Editing**: Complete partner/socio editing with all personal details (CPF, RG, address, profession, etc.)
- **User Management**: Admin-only functionality to create, edit, delete users and change passwords
- **Search & Filtering**: Real-time search by company name, email with status filtering (pending, in progress, completed)
- **Export Functionality**: Professional Excel and PDF export with complete company and partner data
- **Role-Based Access**: Admin users can manage all users, change roles and departments
- **Security Features**: Password hashing, user authentication, and admin-only user management routes
- **Complete Integration**: Public form seamlessly connects to internal system with pending tasks
- **Professional Interface**: Dark minimalist theme with organized modals and responsive design

### December 19, 2025 - Complete System Redesign
- **New Internal System**: Completely rebuilt the internal dashboard with modern architecture and visual design
- **Custom Status Buttons**: Implemented hardcoded color system with inline styles that cannot be overridden
- **Color Scheme**: Red (Pending), Yellow (In Progress), Green (Completed) with proper contrast
- **Modern UI**: Gradient headers, card-based layout, and improved user experience
- **Enhanced Filtering**: Department-based filtering with visual department indicators
- **Statistics Dashboard**: Real-time task statistics with color-coded metrics
- **Responsive Design**: Mobile-first approach with flexible grid layouts
- **Performance Optimization**: Streamlined component architecture for better loading times

### December 18, 2025 - Complete System Implementation
- **Google Drive Structure**: Implemented correct folder hierarchy - Company folder > DEPTO SOCIETARIO subfolder
- **File Upload Integration**: Files automatically organized in DEPTO SOCIETARIO folder within company-specific directories
- **Email Enhancement**: Added direct Google Drive folder links in confirmation emails for easy access
- **Authentication System**: JWT-based team access with role-based permissions
- **Task Management**: Operational Kanban-style workflow with department filtering
- **Email Notifications**: Enhanced with direct folder access links for both client and internal teams
- **Database Operations**: Full CRUD functionality with PostgreSQL integration
- **User Management**: Admin functions for creating users and password changes

## User Preferences

Preferred communication style: Simple, everyday language.
Project Focus: Professional business registration system with complete automation and document management.