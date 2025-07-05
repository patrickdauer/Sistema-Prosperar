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
} from "@shared/schema";
import {
  contratacaoFuncionarios,
  type ContratacaoFuncionario,
  type InsertContratacaoFuncionario,
} from "@shared/contratacao-schema";
import { db } from "./db";
import { eq, and, desc, asc, or, ilike } from "drizzle-orm";
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
  
  // Gerenciamento de clientes
  createCliente(cliente: InsertCliente): Promise<Cliente>;
  getCliente(id: number): Promise<Cliente | undefined>;
  getAllClientes(): Promise<Cliente[]>;
  updateCliente(id: number, data: Partial<Cliente>): Promise<Cliente>;
  deleteCliente(id: number): Promise<void>;
  searchClientes(searchTerm: string): Promise<Cliente[]>;
  promoverClienteFromRegistration(registrationId: number, clienteData: Partial<InsertCliente>): Promise<Cliente>;
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
    
    return registrationsWithTasks;
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

    // Log activity (only if userId is provided)
    if (userId) {
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
    
    const validFields = ['status', 'observacao', 'data_lembrete', 'cnpj', 'title', 'description'];
    if (!validFields.includes(field)) {
      throw new Error(`Campo inválido: ${field}`);
    }
    
    const updateData: any = {};
    
    // Handle date fields conversion - ensure proper format
    if (field === 'data_lembrete' && value) {
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

  // Métodos de gerenciamento de clientes
  async createCliente(cliente: InsertCliente): Promise<Cliente> {
    const [newCliente] = await db
      .insert(clientes)
      .values(cliente)
      .returning();
    return newCliente;
  }

  async getCliente(id: number): Promise<Cliente | undefined> {
    const [cliente] = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, id));
    return cliente || undefined;
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
    const updateData = { ...data, updatedAt: new Date() };
    const [updatedCliente] = await db
      .update(clientes)
      .set(updateData)
      .where(eq(clientes.id, id))
      .returning();
    return updatedCliente;
  }

  async deleteCliente(id: number): Promise<void> {
    await db.delete(clientes).where(eq(clientes.id, id));
  }

  async searchClientes(searchTerm: string): Promise<any[]> {
    const result = await db.execute(`
      SELECT id, razao_social, nome_fantasia, cnpj, email_empresa, telefone_empresa, 
             contato, celular, status, created_at 
      FROM clientes 
      WHERE razao_social ILIKE '%${searchTerm}%'
         OR nome_fantasia ILIKE '%${searchTerm}%'
         OR cnpj ILIKE '%${searchTerm}%'
         OR email_empresa ILIKE '%${searchTerm}%'
      ORDER BY created_at DESC
    `);
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
}

export const storage = new DatabaseStorage();
