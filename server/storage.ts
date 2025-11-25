import {
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Case,
  type InsertCase,
  type Doctrina,
  type InsertDoctrina,
  type Task,
  type InsertTask,
  type CaseProcessState,
} from "@shared/schema";
import { randomUUID } from "crypto";

// Tipo interno para crear cliente con userId (ya que InsertClient omite userId)
type InsertClientWithUserId = InsertClient & { userId: string };

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getClients(): Promise<Client[]>;
  createClient(client: InsertClientWithUserId): Promise<Client>;
  updateClient(id: string, update: Partial<Client>): Promise<Client | null>;
  deleteClient(id: string): Promise<boolean>;
  deleteClientsByName(name: string): Promise<{ deleted: number; keptIds: string[] }>;
  deduplicateClients(): Promise<{
    removed: Array<{ id: string; name: string }>;
    kept: Array<{ id: string; name: string }>;
  }>;
  getClientPhaseState(clientId: string, phase: string): Promise<{
    data: Record<string, string>;
    updatedAt: Date;
  } | undefined>;
  saveClientPhaseState(
    clientId: string,
    phase: string,
    data: Record<string, string>,
  ): Promise<{
    data: Record<string, string>;
    updatedAt: Date;
  }>;
  getCase(id: string): Promise<Case | undefined>;
  getCases(): Promise<Case[]>;
  createCase(caseInput: InsertCase): Promise<Case>;
  updateCase(id: string, update: Partial<Case>): Promise<Case | null>;
  deleteCase(id: string): Promise<boolean>;
  upsertCaseProcessState(input: {
    caseId: string;
    currentPhase: string;
    completionPercentage?: string | number;
    clientInfo?: unknown;
    investigationProgress?: unknown;
    caseStrategy?: unknown;
    clientMeeting?: unknown;
    followUp?: unknown;
  }): Promise<CaseProcessState>;
  getCaseProcessState(caseId: string): Promise<CaseProcessState | undefined>;
  getAllCaseProcessStates(): Promise<CaseProcessState[]>;
  getDoctrinas(): Promise<Doctrina[]>;
  createDoctrina(doctrina: InsertDoctrina): Promise<Doctrina>;
  getTasks(): Promise<Task[]>;
  createTask(taskInput: InsertTask): Promise<Task>;
  updateTask(id: string, update: Partial<Task>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private cases: Map<string, Case>;
  private caseProcessStates: Map<string, CaseProcessState>;
  private clientPhases: Map<string, Map<string, { data: Record<string, string>; updatedAt: Date }>>;
  private doctrinas: Map<string, Doctrina>;
  private tasks: Map<string, Task>;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.cases = new Map();
    this.caseProcessStates = new Map();
    this.clientPhases = new Map();
    this.doctrinas = new Map();
    this.tasks = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: 'abogado', // Default role for memory storage
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | null> {
    return this.clients.get(id) ?? null;
  }

  async createClient(insertClient: InsertClientWithUserId): Promise<Client> {
    const id = randomUUID();
    const client: Client = {
      id,
      userId: insertClient.userId,
      name: insertClient.name,
      email: insertClient.email,
      whatsappPrimary: insertClient.whatsappPrimary,
      contactInfo: insertClient.contactInfo ?? null,
      createdAt: new Date(),
      phonePrimary: insertClient.phonePrimary ?? null,
      phoneSecondary: insertClient.phoneSecondary ?? null,
      whatsappAssistant: insertClient.whatsappAssistant ?? null,
      emailAssistant: insertClient.emailAssistant ?? null,
      emailSecondary: insertClient.emailSecondary ?? null,
      assistantName: insertClient.assistantName ?? null,
      imputadoName: insertClient.imputadoName ?? null,
      imputadoDni: insertClient.imputadoDni ?? null,
      imputadoRelation: insertClient.imputadoRelation ?? null,
      imputadoContact: insertClient.imputadoContact ?? null,
      imputadoEmail: insertClient.imputadoEmail ?? null,
      notifyClient: insertClient.notifyClient ?? 'true',
      notifyAssistant: insertClient.notifyAssistant ?? 'false',
      notifyImputado: insertClient.notifyImputado ?? 'false',
      preferredContactMethod: insertClient.preferredContactMethod ?? 'whatsapp',
      timezone: insertClient.timezone ?? 'America/Lima',
      language: insertClient.language ?? 'es',
      notes: insertClient.notes ?? null,
    };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(id: string, update: Partial<Client>): Promise<Client | null> {
    const existing = this.clients.get(id);
    if (!existing) {
      return null;
    }

    const updated: Client = {
      ...existing,
      ...update,
    };

    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    // limpiar fases y progreso asociados
    this.caseProcessStates.delete(id);
    this.clientPhases.delete(id);
    return this.clients.delete(id);
  }

  async deleteClientsByName(name: string): Promise<{ deleted: number; keptIds: string[] }> {
    const lowered = name.trim().toLowerCase();
    let deleted = 0;
    const kept: string[] = [];

    for (const [id, client] of Array.from(this.clients.entries())) {
      if ((client.name ?? "").trim().toLowerCase() === lowered) {
        if (kept.length === 0) {
          kept.push(id);
          continue;
        }
        await this.deleteClient(id);
        deleted += 1;
      }
    }

    return { deleted, keptIds: kept };
  }

  async deduplicateClients(): Promise<{
    removed: Array<{ id: string; name: string }>;
    kept: Array<{ id: string; name: string }>;
  }> {
    const buckets = new Map<string, Array<Client>>();

    for (const client of Array.from(this.clients.values())) {
      const key = (client.name ?? "").trim().toLowerCase();
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key)!.push(client);
    }

    const removed: Array<{ id: string; name: string }> = [];
    const kept: Array<{ id: string; name: string }> = [];

    for (const group of Array.from(buckets.values())) {
      if (group.length === 0) continue;
      if (group.length === 1) {
        kept.push({ id: group[0].id, name: group[0].name });
        continue;
      }

      const sorted = [...group].sort((a: Client, b: Client) => {
        const timeA = new Date(a.createdAt ?? 0).getTime();
        const timeB = new Date(b.createdAt ?? 0).getTime();
        if (timeA !== timeB) return timeA - timeB;
        return a.id.localeCompare(b.id);
      });

      const primary = sorted[0];
      kept.push({ id: primary.id, name: primary.name });

      for (let i = 1; i < sorted.length; i++) {
        const duplicate = sorted[i];
        await this.deleteClient(duplicate.id);
        removed.push({ id: duplicate.id, name: duplicate.name });
      }
    }

    return { removed, kept };
  }

  async getCase(id: string): Promise<Case | undefined> {
    return this.cases.get(id);
  }

  async getCases(): Promise<Case[]> {
    return Array.from(this.cases.values());
  }

  async createCase(insertCase: InsertCase): Promise<Case> {
    const id = randomUUID();
    const now = new Date();
    const caseRecord: Case = {
      ...insertCase,
      id,
      status: insertCase.status ?? "active",
      description: insertCase.description ?? null,
      clientId: insertCase.clientId ?? null,
      userId: insertCase.userId ?? null,
      createdAt: now,
      updatedAt: now,
      category: insertCase.category ?? null,
      priority: insertCase.priority ?? null,
      tags: insertCase.tags ?? [],
    };
    this.cases.set(id, caseRecord);
    return caseRecord;
  }

  async updateCase(id: string, update: Partial<Case>): Promise<Case | null> {
    const existing = this.cases.get(id);
    if (!existing) {
      return null;
    }

    const sanitized: Partial<Case> = {
      ...update,
      status: update.status ?? existing.status,
      description: update.description ?? existing.description,
      clientId: update.clientId ?? existing.clientId,
      userId: update.userId ?? existing.userId,
    };

    const updated: Case = {
      ...existing,
      ...sanitized,
      updatedAt: new Date(),
    };

    this.cases.set(id, updated);
    return updated;
  }

  async deleteCase(id: string): Promise<boolean> {
    return this.cases.delete(id);
  }

  async upsertCaseProcessState(input: {
    caseId: string;
    currentPhase: string;
    completionPercentage?: string | number;
    clientInfo?: unknown;
    investigationProgress?: unknown;
    caseStrategy?: unknown;
    clientMeeting?: unknown;
    followUp?: unknown;
  }): Promise<CaseProcessState> {
    const existing = this.caseProcessStates.get(input.caseId);
    const now = new Date();

    const completion =
      typeof input.completionPercentage === "number"
        ? String(Math.max(0, Math.min(100, Math.round(input.completionPercentage))))
        : input.completionPercentage ?? existing?.completionPercentage ?? "0";

    const record = {
      id: existing?.id ?? randomUUID(),
      caseId: input.caseId,
      currentPhase: input.currentPhase || existing?.currentPhase || "client-info",
      completionPercentage: completion,
      clientInfo: input.clientInfo ?? existing?.clientInfo ?? {},
      investigationProgress: input.investigationProgress ?? existing?.investigationProgress ?? {},
      caseStrategy: input.caseStrategy ?? existing?.caseStrategy ?? {},
      clientMeeting: input.clientMeeting ?? existing?.clientMeeting ?? {},
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      followUp: input.followUp ?? (existing as Record<string, unknown> | undefined)?.followUp ?? {},
    } as CaseProcessState & { followUp?: unknown };

    this.caseProcessStates.set(input.caseId, record);
    return record;
  }

  async getCaseProcessState(caseId: string): Promise<CaseProcessState | undefined> {
    return this.caseProcessStates.get(caseId);
  }

  async getAllCaseProcessStates(): Promise<CaseProcessState[]> {
    return Array.from(this.caseProcessStates.values());
  }

  async getClientPhaseState(clientId: string, phase: string) {
    const phases = this.clientPhases.get(clientId);
    return phases?.get(phase);
  }

  async saveClientPhaseState(clientId: string, phase: string, data: Record<string, string>) {
    if (!this.clientPhases.has(clientId)) {
      this.clientPhases.set(clientId, new Map());
    }
    const phases = this.clientPhases.get(clientId)!;
    const record = {
      data,
      updatedAt: new Date(),
    };
    phases.set(phase, record);
    return record;
  }

  async getDoctrinas(): Promise<Doctrina[]> {
    return Array.from(this.doctrinas.values());
  }

  async createDoctrina(insertDoctrina: InsertDoctrina): Promise<Doctrina> {
    const id = randomUUID();
    const doctrina: Doctrina = {
      ...insertDoctrina,
      id,
      autor: insertDoctrina.autor ?? null,
      obra: insertDoctrina.obra ?? null,
      ano: insertDoctrina.ano ?? null,
      extracto: insertDoctrina.extracto ?? null,
      palabras_clave: insertDoctrina.palabras_clave ?? [],
      link_repositorio: insertDoctrina.link_repositorio ?? null,
      createdAt: new Date(),
    };
    this.doctrinas.set(id, doctrina);
    return doctrina;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      ...insertTask,
      id,
      description: insertTask.description ?? null,
      status: insertTask.status ?? "pending",
      priority: insertTask.priority ?? "medium",
      dueDate: insertTask.dueDate ?? null,
      caseId: insertTask.caseId ?? null,
      assignedTo: insertTask.assignedTo ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, update: Partial<Task>): Promise<Task | null> {
    const existing = this.tasks.get(id);
    if (!existing) {
      return null;
    }

    const updated: Task = {
      ...existing,
      ...update,
      status: update.status ?? existing.status,
      priority: update.priority ?? existing.priority,
      description: update.description ?? existing.description,
      dueDate: update.dueDate === undefined ? existing.dueDate : update.dueDate,
      caseId: update.caseId === undefined ? existing.caseId : update.caseId,
      assignedTo: update.assignedTo === undefined ? existing.assignedTo : update.assignedTo,
      updatedAt: new Date(),
    };

    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
