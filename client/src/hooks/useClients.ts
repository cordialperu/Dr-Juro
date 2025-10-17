import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Client, InsertClient } from "@shared/schema";
import { createClient, getClients } from "@/lib/api";

export const clientsKeys = {
  all: ["clients"] as const,
};

export function useClientsQuery() {
  return useQuery<Client[]>({
    queryKey: clientsKeys.all,
    queryFn: getClients,
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation<Client, Error, InsertClient>({
    mutationFn: createClient,
    onSuccess: (client) => {
      queryClient.setQueryData<Client[]>(clientsKeys.all, (existing) =>
        existing ? [client, ...existing] : [client],
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: clientsKeys.all });
    },
  });
}
