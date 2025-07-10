import {
  businessRegistrations,
  users,
  tasks,
  taskTemplates,
  taskFiles,
  activities,
  type BusinessRegistration,
  type InsertBusinessRegistration,
  type User,
  type InsertUser,
  type Task,
  type InsertTask,
  type TaskTemplate,
  type TaskFile,
  type InsertTaskFile,
  type Activity,
  type InsertActivity,
  clientes,
  type Cliente,
  type InsertCliente,
  irHistorico,
  type IrHistorico,
  type InsertIrHistorico,
} from "@shared/schema";
import {
  contratacaoFuncionarios,
  type ContratacaoFuncionario,
  type InsertContratacaoFuncionario,
} from "@shared/contratacao-schema";
import { db, pool } from "./db";
import { eq, and, desc, asc, or, ilike, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management - Traditional auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  
  // Business registration
  createBusinessRegistration(registration: InsertBusinessRegistration): Promise<BusinessRegistration>;
  getBusinessRegistration(id: number): Promise<BusinessRegistration | undefined>;
  getAllBusinessRegistrations(): Promise<BusinessRegistration[]>;
  getAllBusinessRegistrationsWithTasks(): Promise<any[]>;
  updateBusinessRegistration(id: number, data: Partial<BusinessRegistration>): Promise<BusinessRegistration>;
  deleteBusinessRegistration(id: number): Promise<void>;
  
  // Task management
  createTasksForRegistration(registrationId: number): Promise<Task[]>;
  getTasksByRegistration(registrationId: number): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  updateTaskStatus(taskId: number, status: string, userId: number): Promise<Task>;
  assignTask(taskId: number, userId: number): Promise<Task>;
  deleteTask(taskId: number): Promise<void>;
  createTask(task: Omit<InsertTask, 'id' | 'createdAt' | 'templateId'>): Promise<Task>;
  updateTaskField(taskId: number, field: string, value: any): Promise<Task>;
  
  // Task management for clients
  createTasksForClient(clienteId: number): Promise<Task[]>;
  getTasksByClient(clienteId: number): Promise<Task[]>;
  getAllClientsWithTasks(): Promise<any[]>;
  
  // Task templates
  getTaskTemplates(): Promise<TaskTemplate[]>;
  createTaskTemplate(template: Omit<TaskTemplate, 'id'>): Promise<TaskTemplate>;
  
  // File management
  createTaskFile(file: InsertTaskFile): Promise<TaskFile>;
  getTaskFiles(taskId: number): Promise<TaskFile[]>;
  getTaskFileById(fileId: number): Promise<TaskFile | undefined>;
  deleteTaskFile(fileId: number): Promise<void>;
  
  // Activity log
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(registrationId: number): Promise<Activity[]>;
  
  // Contratação de funcionários
  createContratacaoFuncionario(contratacao: InsertContratacaoFuncionario): Promise<ContratacaoFuncionario>;
  updateContratacaoFuncionario(id: number, data: Partial<ContratacaoFuncionario>): Promise<ContratacaoFuncionario>;
  getContratacao(id: number): Promise<ContratacaoFuncionario | undefined>;
  getAllContratacoes(): Promise<ContratacaoFuncionario[]>;
  
  // Gerenciamento de clientes
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  getCliente(id: number): Promise<Cliente | undefined>;
  getAllClientes(): Promise<Cliente[]>;
  updateCliente(id: number, data: Partial<Cliente>): Promise<Cliente>;
  deleteCliente(id: number): Promise<void>;
  searchClientes(searchTerm: string): Promise<Cliente[]>;
  promoverClienteFromRegistration(registrationId: number, clienteData: Partial<InsertCliente>): Promise<Cliente>;
  
  // IR History management
  saveIrToHistory(clienteId: number): Promise<void>;
  getIrHistory(clienteId: number): Promise<any[]>;
  updateIrHistoryYear(clienteId: number, ano: number, data: any): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User management - Traditional auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
    };
    
    // Don't hash password here - it should be hashed in routes before calling this function
    // This prevents double hashing

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Business registration
  async createBusinessRegistration(insertRegistration: InsertBusinessRegistration): Promise<BusinessRegistration> {
    const [registration] = await db
      .insert(businessRegistrations)
      .values(insertRegistration)
      .returning();
    
    // Create initial tasks for the registration
    await this.createTasksForRegistration(registration.id);
    
    return registration;
  }

  async getBusinessRegistration(id: number): Promise<BusinessRegistration | undefined> {
    const [registration] = await db.select().from(businessRegistrations).where(eq(businessRegistrations.id, id));
    return registration || undefined;
  }

  async getAllBusinessRegistrations(): Promise<BusinessRegistration[]> {
    return await db.select().from(businessRegistrations).orderBy(desc(businessRegistrations.createdAt));
  }

  async getAllBusinessRegistrationsWithTasks(): Promise<any[]> {
    const registrations = await db.select().from(businessRegistrations).orderBy(desc(businessRegistrations.createdAt));
    
    const registrationsWithTasks = await Promise.all(
      registrations.map(async (registration) => {
        const registrationTasks = await db
          .select()
          .from(tasks)
          .where(eq(tasks.businessRegistrationId, registration.id))
          .orderBy(asc(tasks.order));
        
        return {
          ...registration,
          tasks: registrationTasks
        };
      })
    );
    
    // Buscar tarefas de clientes que não estão vinculadas a registrações
    const clientTasks = await db
      .select({
        task: tasks,
        cliente: {
          id: clientes.id,
          razaoSocial: clientes.razaoSocial,
          nomeFantasia: clientes.nomeFantasia,
          emailEmpresa: clientes.emailEmpresa,
          telefoneEmpresa: clientes.telefoneEmpresa,
          createdAt: clientes.createdAt
        }
      })
      .from(tasks)
      .leftJoin(clientes, eq(tasks.clienteId, clientes.id))
      .where(and(
        isNull(tasks.businessRegistrationId),
        isNotNull(tasks.clienteId)
      ))
      .orderBy(asc(tasks.order));

    // Agrupar tarefas por cliente e criar registros virtuais
    const clientTaskGroups = clientTasks.reduce((groups, item) => {
      const clienteId = item.task.clienteId;
      if (!clienteId) return groups;
      
      if (!groups[clienteId]) {
        groups[clienteId] = {
          id: `cliente_${clienteId}`,
          razaoSocial: item.cliente?.razaoSocial || 'Cliente Desconhecido',
          nomeFantasia: item.cliente?.nomeFantasia,
          emailEmpresa: item.cliente?.emailEmpresa,
          telefoneEmpresa: item.cliente?.telefoneEmpresa,
          createdAt: item.cliente?.createdAt || new Date(),
          socios: [],
          status: 'pending',
          isClienteTask: true,
          clienteId: clienteId,
          tasks: []
        };
      }
      groups[clienteId].tasks.push(item.task);
      return groups;
    }, {} as Record<number, any>);

    // Adicionar grupos de clientes às registrações
    const clientRegistrations = Object.values(clientTaskGroups);
    
    console.log('📊 Client tasks found:', clientTasks.length);
    console.log('📊 Client registrations created:', clientRegistrations.length);
    console.log('📊 Sample client registration:', clientRegistrations[0]);
    
    return [...registrationsWithTasks, ...clientRegistrations];
  }

  async updateBusinessRegistration(id: number, data: Partial<BusinessRegistration>): Promise<BusinessRegistration> {
    // Map frontend field names to database field names
    const allowedFields: any = {};
    
    if (data.razaoSocial !== undefined) allowedFields.razaoSocial = data.razaoSocial;
    if (data.nomeFantasia !== undefined) allowedFields.nomeFantasia = data.nomeFantasia;
    if (data.cnpj !== undefined) allowedFields.cnpj = data.cnpj;
    if (data.endereco !== undefined) allowedFields.endereco = data.endereco;
    if (data.emailEmpresa !== undefined) allowedFields.emailEmpresa = data.emailEmpresa;
    if (data.telefoneEmpresa !== undefined) allowedFields.telefoneEmpresa = data.telefoneEmpresa;
    if (data.capitalSocial !== undefined) allowedFields.capitalSocial = data.capitalSocial;
    if (data.atividadePrincipal !== undefined) allowedFields.atividadePrincipal = data.atividadePrincipal;
    if (data.socios !== undefined) allowedFields.socios = data.socios;
    if (data.status !== undefined) allowedFields.status = data.status;

    console.log('Updating with mapped data:', allowedFields);

    const [updatedRegistration] = await db
      .update(businessRegistrations)
      .set(allowedFields)
      .where(eq(businessRegistrations.id, id))
      .returning();
    
    if (!updatedRegistration) {
      throw new Error('Empresa não encontrada');
    }
    
    return updatedRegistration;
  }

  async deleteBusinessRegistration(id: number): Promise<void> {
    // Delete related tasks first
    await db.delete(tasks).where(eq(tasks.businessRegistrationId, id));
    
    // Delete related activities
    await db.delete(activities).where(eq(activities.businessRegistrationId, id));
    
    // Delete the registration
    await db.delete(businessRegistrations).where(eq(businessRegistrations.id, id));
  }

  // Task management
  async createTasksForRegistration(registrationId: number): Promise<Task[]> {
    const templates = await this.getTaskTemplates();
    const tasksToCreate = templates.map(template => ({
      businessRegistrationId: registrationId,
      templateId: template.id,
      title: template.title,
      description: template.description,
      department: template.department,
      status: 'pending' as const,
      order: template.order,
      dueDate: new Date(Date.now() + (template.estimatedDays || 3) * 24 * 60 * 60 * 1000),
    }));

    const createdTasks = await db.insert(tasks).values(tasksToCreate).returning();
    return createdTasks;
  }

  async getTasksByRegistration(registrationId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.businessRegistrationId, registrationId))
      .orderBy(asc(tasks.order));
  }

  async getTasksByUser(userId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.assignedTo, userId))
      .orderBy(asc(tasks.dueDate));
  }

  async updateTaskStatus(taskId: number, status: string, userId: number): Promise<Task> {
    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    // Log activity (only if userId is provided and has business registration)
    if (userId && updatedTask.businessRegistrationId) {
      await this.createActivity({
        businessRegistrationId: updatedTask.businessRegistrationId,
        taskId: taskId,
        userId: userId,
        action: status === 'completed' ? 'task_completed' : 'task_updated',
        description: `Tarefa "${updatedTask.title}" foi ${status === 'completed' ? 'concluída' : 'atualizada'}`,
        metadata: { previousStatus: status, newStatus: status }
      });
    }

    return updatedTask;
  }

  async assignTask(taskId: number, userId: number): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ assignedTo: userId, status: 'in_progress' })
      .where(eq(tasks.id, taskId))
      .returning();

    return updatedTask;
  }

  async deleteTask(taskId: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, taskId));
  }

  async updateTaskField(taskId: number, field: string, value: any): Promise<Task> {
    console.log(`Updating task ${taskId} field ${field} with value:`, value);
    
    const validFields = ['status', 'observacao', 'data_lembrete', 'cnpj', 'title', 'description', 'multiple'];
    if (!validFields.includes(field)) {
      throw new Error(`Campo inválido: ${field}`);
    }
    
    const updateData: any = {};
    
    if (field === 'multiple') {
      // Handle multiple fields update
      Object.assign(updateData, value);
    } else if (field === 'data_lembrete' && value) {
      // Convert date string to proper date format
      updateData['data_lembrete'] = new Date(value + 'T00:00:00.000Z');
    } else {
      updateData[field] = value;
    }
    
    console.log('Update data:', updateData);
    
    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();
    
    if (!updatedTask) {
      throw new Error('Tarefa não encontrada');
    }
    
    console.log('Updated task:', updatedTask);
    return updatedTask;
  }

  async createTask(task: Omit<InsertTask, 'id' | 'createdAt' | 'templateId'>): Promise<Task> {
    const [newTask] = await db
      .insert(tasks)
      .values({
        ...task,
        templateId: null,
        createdAt: new Date()
      })
      .returning();
    return newTask;
  }

  // Task templates
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return await db.select().from(taskTemplates).orderBy(asc(taskTemplates.order));
  }

  async createTaskTemplate(template: Omit<TaskTemplate, 'id'>): Promise<TaskTemplate> {
    const [created] = await db.insert(taskTemplates).values(template).returning();
    return created;
  }

  // File management
  async createTaskFile(file: InsertTaskFile): Promise<TaskFile> {
    const [created] = await db.insert(taskFiles).values(file).returning();
    return created;
  }

  async getTaskFiles(taskId: number): Promise<TaskFile[]> {
    return await db.select().from(taskFiles).where(eq(taskFiles.taskId, taskId));
  }

  async getTaskFileById(fileId: number): Promise<TaskFile | undefined> {
    const [file] = await db.select().from(taskFiles).where(eq(taskFiles.id, fileId));
    return file;
  }

  async deleteTaskFile(fileId: number): Promise<void> {
    await db.delete(taskFiles).where(eq(taskFiles.id, fileId));
  }

  async getTaskById(taskId: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
    return task;
  }

  // Activity log
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [created] = await db.insert(activities).values(activity).returning();
    return created;
  }

  async getActivities(registrationId: number): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.businessRegistrationId, registrationId))
      .orderBy(desc(activities.createdAt));
  }

  // Contratação de funcionários
  async createContratacaoFuncionario(contratacao: InsertContratacaoFuncionario): Promise<ContratacaoFuncionario> {
    const [created] = await db.insert(contratacaoFuncionarios).values(contratacao).returning();
    return created;
  }

  async updateContratacaoFuncionario(id: number, data: Partial<ContratacaoFuncionario>): Promise<ContratacaoFuncionario> {
    const [updated] = await db
      .update(contratacaoFuncionarios)
      .set(data)
      .where(eq(contratacaoFuncionarios.id, id))
      .returning();
    return updated;
  }

  async getContratacao(id: number): Promise<ContratacaoFuncionario | undefined> {
    const [contratacao] = await db.select().from(contratacaoFuncionarios).where(eq(contratacaoFuncionarios.id, id));
    return contratacao || undefined;
  }

  async getAllContratacoes(): Promise<ContratacaoFuncionario[]> {
    return await db.select().from(contratacaoFuncionarios).orderBy(desc(contratacaoFuncionarios.createdAt));
  }

  async getAllContratacoes(): Promise<ContratacaoFuncionario[]> {
    return await db.select().from(contratacaoFuncionarios).orderBy(desc(contratacaoFuncionarios.createdAt));
  }

  // Métodos de gerenciamento de clientes
  async createCliente(cliente: InsertCliente): Promise<Cliente> {
    const [newCliente] = await db
      .insert(clientes)
      .values(cliente)
      .returning();
    return newCliente;
  }

  async getCliente(id: number): Promise<any | undefined> {
    const result = await db.execute(`
      SELECT * FROM clientes WHERE id = ${id}
    `);
    return result.rows[0] || undefined;
  }

  async getAllClientes(): Promise<any[]> {
    const result = await db.execute(`
      SELECT id, razao_social, nome_fantasia, cnpj, email_empresa, telefone_empresa, 
             contato, celular, status, created_at 
      FROM clientes 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async updateCliente(id: number, data: Partial<Cliente>): Promise<Cliente> {
    try {
      // Lista de campos padrão conhecidos na tabela
      const knownFields = [
        'id', 'data_abertura', 'cliente_desde', 'razao_social', 'nome_fantasia', 'cnpj', 'regime_tributario', 
        'inscricao_estadual', 'inscricao_municipal', 'endereco', 'numero', 'cidade', 'estado', 'cep', 'bairro', 
        'complemento', 'telefone_empresa', 'email_empresa', 'contato', 'celular', 'contato_2', 'celular_2',
        'atividade_principal', 'atividades_secundarias', 'capital_social', 'metragem_ocupada',
        'certificado_digital_empresa', 'senha_certificado_digital_empresa', 'validade_certificado_digital_empresa',
        'procuracao_cnpj_contabilidade', 'procuracao_cnpj_cpf', 'valor_mensalidade', 'data_vencimento',
        'status', 'socios', 'created_at', 'updated_at', 'email', 'telefone_comercial',
        'socio_1', 'cpf_socio_1', 'senha_gov_socio_1', 'certificado_socio_1', 'senha_certificado_socio_1',
        'validade_certificado_socio_1', 'procuracao_socio_1', 'nacionalidade_socio_1', 'nascimento_socio_1',
        'filiacao_socio_1', 'profissao_socio_1', 'estado_civil_socio_1', 'endereco_socio_1',
        'telefone_socio_1', 'email_socio_1', 'cnh_socio_1', 'rg_socio_1', 'certidao_casamento_socio_1',
        'tem_debitos', 'tem_parcelamento', 'tem_divida_ativa', 'mensalidade_com_faturamento', 'mensalidade_sem_faturamento',
        'certificado_empresa', 'senha_certificado_empresa', 'status_das', 'status_envio', 'link_mei',
        'imposto_renda', 'nire', 'nota_servico', 'nota_venda'
      ];

      // Separar campos conhecidos de campos customizados
      const knownUpdates: any = {};
      const customFields: any = {};
      
      Object.keys(data).forEach(key => {
        if (knownFields.includes(key)) {
          knownUpdates[key] = data[key as keyof Cliente];
        } else {
          customFields[key] = data[key as keyof Cliente];
        }
      });

      // Para campos customizados, primeiro verificar se a coluna existe, se não, adicionar
      for (const [fieldName, fieldValue] of Object.entries(customFields)) {
        try {
          // Tentar verificar se a coluna existe
          const checkColumnQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'clientes' AND column_name = $1
          `;
          const columnExists = await pool.query(checkColumnQuery, [fieldName]);
          
          if (columnExists.rows.length === 0) {
            // Coluna não existe, criar ela
            const addColumnQuery = `ALTER TABLE clientes ADD COLUMN "${fieldName}" TEXT`;
            await pool.query(addColumnQuery);
            console.log(`✅ Coluna customizada '${fieldName}' adicionada à tabela clientes`);
          }
          
          // Adicionar campo customizado aos updates conhecidos
          knownUpdates[fieldName] = fieldValue;
        } catch (error) {
          console.error(`❌ Erro ao adicionar campo customizado '${fieldName}':`, error);
        }
      }

      // Construir query de update dinâmicamente
      const updateFields = Object.keys(knownUpdates).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
      if (updateFields.length === 0) {
        const cliente = await this.getCliente(id);
        return cliente as Cliente;
      }

      const setClause = updateFields.map((field, index) => `"${field}" = $${index + 2}`).join(', ');
      const values = [id, ...updateFields.map(field => knownUpdates[field])];
      
      const updateQuery = `
        UPDATE clientes 
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      console.log(`🔄 Atualizando cliente ${id} com campos:`, updateFields);
      const result = await pool.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new Error('Cliente não encontrado');
      }

      // Check if any IR field was updated and save to history
      const irFields = ['ir_ano_referencia', 'ir_status', 'ir_data_entrega', 'ir_valor_pagar', 'ir_valor_restituir', 'ir_observacoes', 'imposto_renda'];
      const hasIrUpdate = updateFields.some(field => irFields.includes(field));
      
      if (hasIrUpdate) {
        try {
          await this.saveIrToHistory(id);
          console.log(`📊 IR data saved to history for client ${id}`);
        } catch (error) {
          console.error('❌ Failed to save IR to history:', error);
          // Don't fail the main update if history saving fails
        }
      }

      console.log(`✅ Cliente ${id} atualizado com sucesso`);
      return result.rows[0] as Cliente;
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      throw error;
    }
  }

  async deleteCliente(id: number): Promise<void> {
    await db.delete(clientes).where(eq(clientes.id, id));
  }

  async searchClientes(searchTerm?: string, filters?: any): Promise<any[]> {
    console.log('🔍 Filtros recebidos:', JSON.stringify(filters, null, 2));
    let whereConditions = [];
    
    // Busca por texto
    if (searchTerm) {
      whereConditions.push(`(
        razao_social ILIKE '%${searchTerm}%'
        OR nome_fantasia ILIKE '%${searchTerm}%'
        OR cnpj ILIKE '%${searchTerm}%'
        OR email_empresa ILIKE '%${searchTerm}%'
        OR contato ILIKE '%${searchTerm}%'
      )`);
    }
    
    // Filtros específicos
    if (filters?.cidade) {
      whereConditions.push(`cidade ILIKE '%${filters.cidade}%'`);
    }
    
    if (filters?.regimeTributario) {
      whereConditions.push(`regime_tributario ILIKE '%${filters.regimeTributario}%'`);
    }
    
    if (filters?.dataAberturaInicio) {
      console.log('📅 Data abertura início:', filters.dataAberturaInicio);
      whereConditions.push(`data_abertura IS NOT NULL AND data_abertura >= '${filters.dataAberturaInicio}'`);
    }
    
    if (filters?.dataAberturaFim) {
      console.log('📅 Data abertura fim:', filters.dataAberturaFim);
      whereConditions.push(`data_abertura IS NOT NULL AND data_abertura <= '${filters.dataAberturaFim}'`);
    }
    
    if (filters?.clienteDesdeInicio) {
      console.log('📅 Cliente desde início:', filters.clienteDesdeInicio);
      whereConditions.push(`cliente_desde IS NOT NULL AND cliente_desde >= '${filters.clienteDesdeInicio}'`);
    }
    
    if (filters?.clienteDesdeFim) {
      console.log('📅 Cliente desde fim:', filters.clienteDesdeFim);
      whereConditions.push(`cliente_desde IS NOT NULL AND cliente_desde <= '${filters.clienteDesdeFim}'`);
    }
    
    if (filters?.possuiFuncionarios) {
      console.log('👥 Possui funcionários:', filters.possuiFuncionarios);
      whereConditions.push(`possui_funcionarios = ${filters.possuiFuncionarios}`);
    }
    
    if (filters?.possuiProLabore) {
      console.log('💰 Possui pró-labore:', filters.possuiProLabore);
      whereConditions.push(`possui_pro_labore = ${filters.possuiProLabore}`);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    const query = `
      SELECT id, razao_social, nome_fantasia, cnpj, email_empresa, telefone_empresa, 
             contato, celular, status, created_at, cidade, regime_tributario, 
             data_abertura, cliente_desde, possui_funcionarios, quantidade_funcionarios,
             observacoes_funcionarios, possui_pro_labore
      FROM clientes 
      ${whereClause}
      ORDER BY created_at DESC
    `;
    
    console.log('🔍 Query final:', query);
    const result = await db.execute(query);
    return result.rows;
  }

  async promoverClienteFromRegistration(registrationId: number, clienteData: Partial<InsertCliente>): Promise<Cliente> {
    const registration = await this.getBusinessRegistration(registrationId);
    if (!registration) {
      throw new Error('Registration not found');
    }

    // Mapear dados do registro para cliente
    const dadosCliente: InsertCliente = {
      razaoSocial: registration.razaoSocial,
      nomeFantasia: registration.nomeFantasia,
      endereco: registration.endereco,
      telefoneComercial: registration.telefoneEmpresa,
      email: registration.emailEmpresa,
      atividadePrincipal: registration.atividadePrincipal,
      atividadesSecundarias: registration.atividadesSecundarias,
      capitalSocial: registration.capitalSocial ? registration.capitalSocial : undefined,
      socios: registration.socios as any,
      origem: 'website',
      status: 'ativo',
      ...clienteData
    };

    const novoCliente = await this.createCliente(dadosCliente);
    
    // Atualizar status do registro para 'concluída'
    await this.updateBusinessRegistration(registrationId, { status: 'concluida' });
    
    return novoCliente;
  }

  // IR History methods
  async saveIrToHistory(clienteId: number): Promise<void> {
    try {
      // Get current client IR data
      const cliente = await this.getCliente(clienteId);
      if (!cliente) return;

      // Extract IR data from client
      const ano = cliente.irAnoReferencia || new Date().getFullYear().toString();
      
      const historyData: InsertIrHistorico = {
        clienteId: clienteId,
        ano: parseInt(ano),
        status: cliente.irStatus || null,
        dataEntrega: cliente.irDataEntrega || null,
        valorPagar: cliente.irValorPagar || null,
        valorRestituir: cliente.irValorRestituir || null,
        observacoes: cliente.irObservacoes || null,
      };

      // Use UPSERT to insert or update the history record
      await db
        .insert(irHistorico)
        .values(historyData)
        .onConflictDoUpdate({
          target: [irHistorico.clienteId, irHistorico.ano],
          set: {
            status: historyData.status,
            dataEntrega: historyData.dataEntrega,
            valorPagar: historyData.valorPagar,
            valorRestituir: historyData.valorRestituir,
            observacoes: historyData.observacoes,
            updatedAt: new Date(),
          },
        });

      console.log(`✅ IR data saved to history for client ${clienteId}, year ${ano}`);
    } catch (error) {
      console.error('❌ Error saving IR to history:', error);
      throw error;
    }
  }

  async getIrHistory(clienteId: number): Promise<any[]> {
    try {
      const history = await db
        .select()
        .from(irHistorico)
        .where(eq(irHistorico.clienteId, clienteId))
        .orderBy(desc(irHistorico.ano));
      
      return history;
    } catch (error) {
      console.error('❌ Error getting IR history:', error);
      throw error;
    }
  }

  async updateIrHistoryYear(clienteId: number, ano: number, data: any): Promise<void> {
    try {
      await db
        .update(irHistorico)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(irHistorico.clienteId, clienteId),
            eq(irHistorico.ano, ano)
          )
        );
      
      console.log(`✅ IR history updated for client ${clienteId}, year ${ano}`);
    } catch (error) {
      console.error('❌ Error updating IR history:', error);
      throw error;
    }
  }

  // Task management for clients
  async createTasksForClient(clienteId: number): Promise<Task[]> {
    const templates = await this.getTaskTemplates();
    const createdTasks: Task[] = [];

    for (const template of templates) {
      const task = await this.createTask({
        title: template.title,
        description: template.description,
        status: 'pending',
        priority: template.priority,
        department: template.department,
        estimatedHours: template.estimatedHours,
        businessRegistrationId: null, // Cliente não tem registration ID
        clienteId: clienteId, // Novo campo para relacionar com cliente
        dueDate: template.defaultDueDays ? new Date(Date.now() + template.defaultDueDays * 24 * 60 * 60 * 1000) : null,
        order: template.order || 0
      });
      createdTasks.push(task);
    }

    return createdTasks;
  }

  async getTasksByClient(clienteId: number): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(eq(tasks.clienteId, clienteId))
      .orderBy(asc(tasks.order));
  }

  async getAllClientsWithTasks(): Promise<any[]> {
    const clients = await this.getAllClientes();
    
    const clientsWithTasks = await Promise.all(
      clients.map(async (client) => {
        const clientTasks = await this.getTasksByClient(client.id);
        
        return {
          ...client,
          tasks: clientTasks
        };
      })
    );
    
    return clientsWithTasks;
  }
}

export const storage = new DatabaseStorage();
