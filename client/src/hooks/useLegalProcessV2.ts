import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Hook para cargar el estado del proceso legal v2
export function useLegalProcessV2(clientId?: string) {
  return useQuery({
    queryKey: ["legalProcessV2", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await fetch(`/api/legal-process/${clientId}`);
      if (!response.ok) {
        if (response.status === 404) return null; // No existe aún
        throw new Error('Error cargando proceso legal');
      }
      return response.json();
    },
    enabled: !!clientId,
  });
}

// Hook para guardar el estado del proceso legal v2
export function useSaveLegalProcessV2(clientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      if (!clientId) throw new Error('Cliente ID requerido');
      
      const response = await fetch(`/api/legal-process/${clientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Error guardando proceso legal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legalProcessV2", clientId] });
    },
  });
}

// Hook para agregar interviniente
export function useAddParticipant(clientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participant: any) => {
      if (!clientId) throw new Error('Cliente ID requerido');
      
      const response = await fetch(`/api/legal-process/${clientId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(participant),
      });

      if (!response.ok) throw new Error('Error agregando interviniente');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legalProcessV2", clientId] });
    },
  });
}

// Hook para agregar hito
export function useAddMilestone(clientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestone: any) => {
      if (!clientId) throw new Error('Cliente ID requerido');
      
      const response = await fetch(`/api/legal-process/${clientId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(milestone),
      });

      if (!response.ok) throw new Error('Error agregando hito');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legalProcessV2", clientId] });
    },
  });
}

// Hook para agregar pago
export function useAddPayment(clientId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payment: any) => {
      if (!clientId) throw new Error('Cliente ID requerido');
      
      const response = await fetch(`/api/legal-process/${clientId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payment),
      });

      if (!response.ok) throw new Error('Error agregando pago');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legalProcessV2", clientId] });
    },
  });
}
