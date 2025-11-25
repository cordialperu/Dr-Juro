import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Client, InsertClient } from "@shared/schema";
import { createClient, getClients } from "@/lib/api";

export const clientsKeys = {
  all: ["clients"] as const,
  paginated: (page: number, limit: number) => ["clients", "paginated", page, limit] as const,
};

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useClientsQuery(page = 1, limit = 50) {
  // For UI components that expect a simple client array, return Client[].
  return useQuery<Client[]>({
    queryKey: clientsKeys.all,
    queryFn: async () => {
      const response = await fetch(`/api/clients?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Error cargando clientes');
      const data = await response.json();
      // Si la respuesta tiene estructura paginada, extraer el array
      return Array.isArray(data) ? data : data.data || [];
    },
  });
}

// Mantener hook simple para retrocompatibilidad
export function useAllClientsQuery() {
  return useQuery<Client[]>({
    queryKey: clientsKeys.all,
    queryFn: async () => {
      // getClients() returns Client[]; return directly.
      return getClients();
    },
  });
}

export function useClientQuery(clientId?: string) {
  return useQuery<Client | null>({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error('Error cargando cliente');
      return response.json();
    },
    enabled: !!clientId,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation<Client, Error, InsertClient>({
    mutationFn: createClient,
    onSuccess: () => {
      // Invalidar todas las queries de clientes para refrescar
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation<Client, Error, { id: string; data: Partial<Client> }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error actualizando cliente');
      }
      return response.json();
    },
    onSuccess: (updatedClient) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client", updatedClient.id] });
    },
  });
}
