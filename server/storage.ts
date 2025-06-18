import { businessRegistrations, type BusinessRegistration, type InsertBusinessRegistration } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  createBusinessRegistration(registration: InsertBusinessRegistration): Promise<BusinessRegistration>;
  getBusinessRegistration(id: number): Promise<BusinessRegistration | undefined>;
  getAllBusinessRegistrations(): Promise<BusinessRegistration[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private businessRegistrations: Map<number, BusinessRegistration>;
  private currentUserId: number;
  private currentRegistrationId: number;

  constructor() {
    this.users = new Map();
    this.businessRegistrations = new Map();
    this.currentUserId = 1;
    this.currentRegistrationId = 1;
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBusinessRegistration(insertRegistration: InsertBusinessRegistration): Promise<BusinessRegistration> {
    const id = this.currentRegistrationId++;
    const registration: BusinessRegistration = { 
      ...insertRegistration, 
      id,
      createdAt: new Date(),
      status: "pending"
    };
    this.businessRegistrations.set(id, registration);
    return registration;
  }

  async getBusinessRegistration(id: number): Promise<BusinessRegistration | undefined> {
    return this.businessRegistrations.get(id);
  }

  async getAllBusinessRegistrations(): Promise<BusinessRegistration[]> {
    return Array.from(this.businessRegistrations.values());
  }
}

export const storage = new MemStorage();
