import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Case, InsertCase } from "@shared/schema";
import { createCase, deleteCase, getCases, updateCase } from "@/lib/api";

export const casesKeys = {
  all: ["cases"] as const,
  detail: (id: string) => ["cases", id] as const,
};

export function useCasesQuery() {
  return useQuery<Case[]>({
    queryKey: casesKeys.all,
    queryFn: getCases,
  });
}

export function useCreateCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation<Case, Error, InsertCase>({
    mutationFn: createCase,
    onSuccess: (created) => {
      queryClient.setQueryData<Case[]>(casesKeys.all, (existing) =>
        existing ? [created, ...existing] : [created],
      );
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: casesKeys.all });
    },
  });
}

export function useUpdateCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation<Case, Error, { id: string; data: Parameters<typeof updateCase>[1] }>({
    mutationFn: ({ id, data }) => updateCase(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<Case[]>(casesKeys.all, (existing) =>
        existing ? existing.map((item) => (item.id === updated.id ? updated : item)) : [updated],
      );
      queryClient.setQueryData(casesKeys.detail(updated.id), updated);
    },
  });
}

export function useDeleteCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: deleteCase,
    onSuccess: (_response, id) => {
      queryClient.setQueryData<Case[]>(casesKeys.all, (existing) =>
        existing ? existing.filter((item) => item.id !== id) : existing,
      );
      queryClient.removeQueries({ queryKey: casesKeys.detail(id) });
    },
  });
}
