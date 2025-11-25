import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface Client {
  id: string;
  name: string;
  // Contacto del CLIENTE (quien contrata/paga) - OBLIGATORIOS
  email: string; // OBLIGATORIO
  whatsappPrimary: string; // OBLIGATORIO para notificaciones
  // Contacto del ASISTENTE del cliente - OPCIONALES
  emailAssistant?: string | null;
  whatsappAssistant?: string | null;
  assistantName?: string | null;
  // Datos del IMPUTADO (quien tiene cargo penal) - OPCIONALES
  // Si el cliente ES el imputado, estos campos están vacíos
  imputadoName?: string | null;
  imputadoDni?: string | null;
  imputadoRelation?: string | null; // Relación con cliente (hijo, cónyuge, etc.)
  imputadoContact?: string | null;
  imputadoEmail?: string | null;
  // Configuración de notificaciones
  notifyClient?: string | boolean; // "true"/"false" o boolean
  notifyAssistant?: string | boolean;
  notifyImputado?: string | boolean;
  // Campos adicionales
  contactInfo?: string | null;
  notes?: string | null;
  // Legacy (mantener por compatibilidad)
  phonePrimary?: string | null;
  phoneSecondary?: string | null;
  emailSecondary?: string | null;
  preferredContactMethod?: string | null;
  timezone?: string | null;
  language?: string | null;
  createdAt: Date | string;
  [key: string]: any;
}

export interface Case {
  id: string;
  title: string;
  description?: string;
  status: string;
  createdAt: Date | string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date | string;
  caseId?: string;
}

export interface WorkspaceData {
  cases: Case[];
  tasks: Task[];
  casesCount: number;
  tasksCount: number;
  documentsCount: number;
  lastActivity?: Date;
}

interface ClientContextType {
  client: Client | null;
  setClient: (client: Client | null) => void;
  clearClient: () => void;
  workspace: WorkspaceData | null;
  isLoadingWorkspace: boolean;
  refreshWorkspace: () => Promise<void>;
  // Helper methods V3
  getCases: () => Case[];
  getTasks: () => Task[];
  getActiveCases: () => Case[];
  getPendingTasks: () => Task[];
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const STORAGE_KEY = 'drjuro_client_v3';

async function loadWorkspaceData(clientId: string): Promise<WorkspaceData> {
  try {
    const [casesRes, tasksRes] = await Promise.all([
      fetch(`/api/clients/${clientId}/cases`).then(async r => {
        if (!r.ok) return [];
        const text = await r.text();
        if (!text || text.startsWith('<!DOCTYPE') || text.startsWith('<html')) return [];
        try { return JSON.parse(text); } catch { return []; }
      }),
      fetch(`/api/clients/${clientId}/tasks`).then(async r => {
        if (!r.ok) return [];
        const text = await r.text();
        if (!text || text.startsWith('<!DOCTYPE') || text.startsWith('<html')) return [];
        try { return JSON.parse(text); } catch { return []; }
      }),
    ]);

    const cases = Array.isArray(casesRes) ? casesRes : [];
    const tasks = Array.isArray(tasksRes) ? tasksRes : [];

    return {
      cases,
      tasks,
      casesCount: cases.length,
      tasksCount: tasks.length,
      documentsCount: 0,
      lastActivity: new Date(),
    };
  } catch (error) {
    console.error('Error loading workspace data:', error);
    return {
      cases: [],
      tasks: [],
      casesCount: 0,
      tasksCount: 0,
      documentsCount: 0,
    };
  }
}

export function ClientProvider({ children }: { children: ReactNode }) {
  const [client, setClientState] = useState<Client | null>(() => {
    // Cargar del localStorage al iniciar
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = useState(false);

  // Persistir cliente en localStorage
  useEffect(() => {
    if (client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setWorkspace(null);
    }
  }, [client]);

  // Cargar workspace data cuando cambia el cliente
  useEffect(() => {
    if (client?.id) {
      refreshWorkspace();
    } else {
      setWorkspace(null);
    }
  }, [client?.id]);

  const refreshWorkspace = async () => {
    if (!client?.id) return;
    
    setIsLoadingWorkspace(true);
    try {
      const data = await loadWorkspaceData(client.id);
      setWorkspace(data);
    } catch (error) {
      console.error('Error refreshing workspace:', error);
    } finally {
      setIsLoadingWorkspace(false);
    }
  };

  const setClient = (newClient: Client | null) => {
    setClientState(newClient);
  };

  const clearClient = () => {
    setClientState(null);
  };

  // Helper methods V3
  const getCases = (): Case[] => {
    return workspace?.cases || [];
  };

  const getTasks = (): Task[] => {
    return workspace?.tasks || [];
  };

  const getActiveCases = (): Case[] => {
    return getCases().filter(c => c.status !== 'closed' && c.status !== 'archived');
  };

  const getPendingTasks = (): Task[] => {
    return getTasks().filter(t => t.status === 'pending' || t.status === 'in-progress');
  };

  const value: ClientContextType = {
    client,
    setClient,
    clearClient,
    workspace,
    isLoadingWorkspace,
    refreshWorkspace,
    getCases,
    getTasks,
    getActiveCases,
    getPendingTasks,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within ClientProvider');
  }
  return context;
}
