import { 
  templates, 
  type Template, 
  type InsertTemplate,
  users,
  type User,
  type InsertUser 
} from "@shared/schema";

// Storage interface definition
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Template operations
  getTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: number): Promise<boolean>;
  searchTemplates(query: string): Promise<Template[]>;
  getTemplatesByType(type: string): Promise<Template[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private templates: Map<number, Template>;
  private userCurrentId: number;
  private templateCurrentId: number;

  constructor() {
    this.users = new Map();
    this.templates = new Map();
    this.userCurrentId = 1;
    this.templateCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.templateCurrentId++;
    const template: Template = { ...insertTemplate, id, wikified: false };
    this.templates.set(id, template);
    return template;
  }

  async updateTemplate(id: number, templateUpdate: Partial<Template>): Promise<Template | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...templateUpdate };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  async searchTemplates(query: string): Promise<Template[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(
      template => 
        template.name.toLowerCase().includes(lowerQuery) || 
        template.startNation.toLowerCase().includes(lowerQuery)
    );
  }

  async getTemplatesByType(type: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(
      template => template.type === type
    );
  }
}

export const storage = new MemStorage();
