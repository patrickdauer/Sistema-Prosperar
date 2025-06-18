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
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string): Promise<User | null>;
  
  // Business registration
  createBusinessRegistration(registration: InsertBusinessRegistration): Promise<BusinessRegistration>;
  getBusinessRegistration(id: number): Promise<BusinessRegistration | undefined>;
  getAllBusinessRegistrations(): Promise<BusinessRegistration[]>;
  
  // Task management
  createTasksForRegistration(registrationId: number): Promise<Task[]>;
  getTasksByRegistration(registrationId: number): Promise<Task[]>;
  getTasksByUser(userId: number): Promise<Task[]>;
  updateTaskStatus(taskId: number, status: string, userId: number): Promise<Task>;
  assignTask(taskId: number, userId: number): Promise<Task>;
  
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
