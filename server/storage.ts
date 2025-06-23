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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  updateUserPassword(userId: number, newPassword: string): Promise<void>;
  
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
  
  // Activity log
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivities(registrationId: number): Promise<Activity[]>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.name));
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const updateData: any = { ...data };
    
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    
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
    const [updatedRegistration] = await db
      .update(businessRegistrations)
      .set(data)
      .where(eq(businessRegistrations.id, id))
      .returning();
    
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

    // Log activity
    await this.createActivity({
      businessRegistrationId: updatedTask.businessRegistrationId,
      taskId: taskId,
      userId: userId,
      action: status === 'completed' ? 'task_completed' : 'task_updated',
      description: `Tarefa "${updatedTask.title}" foi ${status === 'completed' ? 'concluída' : 'atualizada'}`,
      metadata: { previousStatus: status, newStatus: status }
    });

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
    const updateData: any = {};
    updateData[field] = value;
    
    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();
    
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
}

export const storage = new DatabaseStorage();
