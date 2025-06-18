import { businessRegistrations, type BusinessRegistration, type InsertBusinessRegistration } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  createBusinessRegistration(registration: InsertBusinessRegistration): Promise<BusinessRegistration>;
  getBusinessRegistration(id: number): Promise<BusinessRegistration | undefined>;
  getAllBusinessRegistrations(): Promise<BusinessRegistration[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<any | undefined> {
    const [user] = await db.select().from(businessRegistrations).where(eq(businessRegistrations.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return undefined; // Not implemented for business registration
  }

  async createUser(insertUser: any): Promise<any> {
    return insertUser; // Not implemented for business registration
  }

  async createBusinessRegistration(insertRegistration: InsertBusinessRegistration): Promise<BusinessRegistration> {
    const [registration] = await db
      .insert(businessRegistrations)
      .values(insertRegistration)
      .returning();
    return registration;
  }

  async getBusinessRegistration(id: number): Promise<BusinessRegistration | undefined> {
    const [registration] = await db.select().from(businessRegistrations).where(eq(businessRegistrations.id, id));
    return registration || undefined;
  }

  async getAllBusinessRegistrations(): Promise<BusinessRegistration[]> {
    return await db.select().from(businessRegistrations);
  }
}

export const storage = new DatabaseStorage();
