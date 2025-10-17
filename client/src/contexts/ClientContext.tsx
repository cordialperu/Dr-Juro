import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Client {
  id: string;
  name: string;
  contactInfo?: string;
  createdAt?: Date;
  [key: string]: any;
}

interface ClientContextType {
  selectedClient: Client | null;
  selectedClientId: string | null;
  setSelectedClient: (client: Client | null) => void;
  clearSelectedClient: () => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

const STORAGE_KEY = 'drjuro_selected_client';

export function ClientProvider({ children }: { children: ReactNode }) {
  const [selectedClient, setSelectedClientState] = useState<Client | null>(() => {
    // Recuperar del localStorage al iniciar
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setSelectedClient = (client: Client | null) => {
    setSelectedClientState(client);
    
    // Persistir en localStorage
    if (client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearSelectedClient = () => {
    setSelectedClientState(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: ClientContextType = {
    selectedClient,
    selectedClientId: selectedClient?.id || null,
    setSelectedClient,
    clearSelectedClient,
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
}

export function useSelectedClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useSelectedClient must be used within a ClientProvider');
  }
  return context;
}
