import { storage } from './storage';

export async function seedTaskTemplates() {
  try {
    // Check if templates already exist
    const existingTemplates = await storage.getTaskTemplates();
    if (existingTemplates.length > 0) {
      console.log('Task templates already exist, skipping seed');
      return;
    }

    // Departamento Societário
    const societarioTasks = [
      { department: 'Societário', title: 'CNPJ', description: 'Solicitação e obtenção do CNPJ da empresa', order: 1, estimatedDays: 5, isRequired: true },
      { department: 'Societário', title: 'Alvará de Licença', description: 'Obtenção do alvará de licença para funcionamento', order: 2, estimatedDays: 10, isRequired: true },
      { department: 'Societário', title: 'Alvará Sanitário', description: 'Obtenção do alvará sanitário quando necessário', order: 3, estimatedDays: 15, isRequired: false },
      { department: 'Societário', title: 'Alvará do Bombeiro', description: 'Obtenção do alvará do corpo de bombeiros', order: 4, estimatedDays: 20, isRequired: false },
      { department: 'Societário', title: 'Registro na Junta Comercial', description: 'Registro da empresa na Junta Comercial', order: 5, estimatedDays: 7, isRequired: true },
      { department: 'Societário', title: 'Registro no Cartório', description: 'Registro no cartório (apenas para Igreja, Associação ou Fundação)', order: 6, estimatedDays: 10, isRequired: false },
    ];

    // Departamento Fiscal
    const fiscalTasks = [
      { department: 'Fiscal', title: 'Solicitar Simples Nacional', description: 'Solicitação de enquadramento no Simples Nacional', order: 1, estimatedDays: 3, isRequired: true },
      { department: 'Fiscal', title: 'Fazer Procuração PF', description: 'Elaboração de procuração pessoa física', order: 2, estimatedDays: 1, isRequired: true },
      { department: 'Fiscal', title: 'Fazer Procuração PJ', description: 'Elaboração de procuração pessoa jurídica', order: 3, estimatedDays: 1, isRequired: true },
      { department: 'Fiscal', title: 'Solicitar Certificado Digital PJ Modelo A1', description: 'Solicitação do certificado digital A1 para pessoa jurídica', order: 4, estimatedDays: 5, isRequired: true },
    ];

    // Departamento Pessoal
    const pessoalTasks = [
      { department: 'Pessoal', title: 'Cadastrar Empresa no Sistema Domínio', description: 'Cadastro da empresa no sistema de domínio', order: 1, estimatedDays: 1, isRequired: true },
      { department: 'Pessoal', title: 'Configurar Folha no Sistema se Houver', description: 'Configuração da folha de pagamento no sistema', order: 2, estimatedDays: 2, isRequired: false },
      { department: 'Pessoal', title: 'Cadastro no E-social', description: 'Cadastro da empresa no eSocial', order: 3, estimatedDays: 2, isRequired: true },
      { department: 'Pessoal', title: 'Enviar Declaração sem Funcionário', description: 'Envio da declaração para empresa sem funcionários', order: 4, estimatedDays: 1, isRequired: true },
    ];

    // Create all templates
    const allTasks = [...societarioTasks, ...fiscalTasks, ...pessoalTasks];
    
    for (const task of allTasks) {
      await storage.createTaskTemplate(task);
    }

    console.log(`✓ Created ${allTasks.length} task templates`);
  } catch (error) {
    console.error('Error seeding task templates:', error);
  }
}

export async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await storage.getUserByUsername('admin');
    if (existingAdmin) {
      console.log('Admin user already exists, skipping creation');
      return;
    }

    // Create admin user
    const adminUser = await storage.createUser({
      username: 'admin',
      password: 'admin123', // This will be hashed
      name: 'Administrador',
      email: 'admin@prosperarcontabilidade.com.br',
      role: 'admin',
      department: null,
      isActive: true,
    });

    console.log('✓ Created admin user (username: admin, password: admin123)');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}