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
      { department: 'societario', title: 'Emitir Alvará de Funcionamento', description: 'Solicitar e obter alvará de funcionamento junto aos órgãos competentes', order: 1, estimatedDays: 5, isRequired: true },
      { department: 'societario', title: 'Emitir Alvará Sanitário', description: 'Solicitar alvará sanitário quando aplicável', order: 2, estimatedDays: 7, isRequired: false },
      { department: 'societario', title: 'Registro na Junta Comercial', description: 'Protocolar documentos na Junta Comercial', order: 3, estimatedDays: 10, isRequired: true },
      { department: 'societario', title: 'Obter CNPJ', description: 'Solicitar CNPJ junto à Receita Federal', order: 4, estimatedDays: 3, isRequired: true },
    ];

    // Departamento Fiscal
    const fiscalTasks = [
      { department: 'fiscal', title: 'Solicitar Simples Nacional', description: 'Fazer opção pelo Simples Nacional se aplicável', order: 1, estimatedDays: 2, isRequired: false },
      { department: 'fiscal', title: 'Fazer Procuração PF', description: 'Elaborar procurações dos sócios pessoa física', order: 2, estimatedDays: 1, isRequired: true },
      { department: 'fiscal', title: 'Inscrição Estadual', description: 'Obter inscrição estadual quando necessário', order: 3, estimatedDays: 5, isRequired: false },
      { department: 'fiscal', title: 'Inscrição Municipal', description: 'Registrar empresa na prefeitura local', order: 4, estimatedDays: 3, isRequired: true },
    ];

    // Departamento Pessoal
    const pessoalTasks = [
      { department: 'pessoal', title: 'Enviar Declaração Sem Funcionário', description: 'Protocolar declaração de não possuir funcionários', order: 1, estimatedDays: 1, isRequired: true },
      { department: 'pessoal', title: 'Cadastro no eSocial', description: 'Realizar cadastro inicial no eSocial', order: 2, estimatedDays: 2, isRequired: true },
      { department: 'pessoal', title: 'Configurar Folha de Pagamento', description: 'Preparar estrutura inicial da folha de pagamento', order: 3, estimatedDays: 3, isRequired: false },
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