import { useEffect } from 'react';
import { useClient } from '@/contexts/ClientContext';

// Paleta de colores predefinidos
const CLIENT_COLORS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#a855f7', // Violet
  '#ef4444', // Red
];

// Genera un color consistente basado en el ID del cliente
function getClientColor(clientId: string, savedColor?: string | null): string {
  if (savedColor) return savedColor;
  
  // Hash simple del clientId
  let hash = 0;
  for (let i = 0; i < clientId.length; i++) {
    hash = clientId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % CLIENT_COLORS.length;
  return CLIENT_COLORS[index];
}

// Hook para aplicar el color del tema del cliente
export function useClientTheme() {
  const { client } = useClient();

  useEffect(() => {
    if (!client) return;

    const color = getClientColor(client.id, client.themeColor);
    
    // Convertir hex a RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Aplicar CSS variables
    document.documentElement.style.setProperty('--client-color', color);
    document.documentElement.style.setProperty('--client-color-rgb', `${r}, ${g}, ${b}`);
    document.documentElement.style.setProperty('--client-primary', color);

    // Cleanup
    return () => {
      document.documentElement.style.removeProperty('--client-color');
      document.documentElement.style.removeProperty('--client-color-rgb');
      document.documentElement.style.removeProperty('--client-primary');
    };
  }, [client]);
}

// Hook para obtener solo el color sin efectos
export function useClientColor(): string | null {
  const { client } = useClient();
  
  if (!client) return null;
  
  return getClientColor(client.id, client.themeColor);
}
