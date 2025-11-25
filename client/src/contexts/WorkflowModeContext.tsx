import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type WorkflowMode = 'classic' | 'client-centric';

interface WorkflowModeContextType {
  mode: WorkflowMode;
  setMode: (mode: WorkflowMode) => void;
  toggleMode: () => void;
}

const WorkflowModeContext = createContext<WorkflowModeContextType | undefined>(undefined);

const STORAGE_KEY = 'drjuro_workflow_mode';

export function WorkflowModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<WorkflowMode>('classic');

  // Cargar modo desde localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'classic' || stored === 'client-centric') {
      setModeState(stored);
    }
  }, []);

  const setMode = (newMode: WorkflowMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'classic' ? 'client-centric' : 'classic';
    setMode(newMode);
  };

  return (
    <WorkflowModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </WorkflowModeContext.Provider>
  );
}

export function useWorkflowMode() {
  const context = useContext(WorkflowModeContext);
  if (context === undefined) {
    throw new Error('useWorkflowMode must be used within WorkflowModeProvider');
  }
  return context;
}
