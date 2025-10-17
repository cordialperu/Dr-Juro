import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaseDocument, InsertCaseDocument } from "@shared/schema";

export function useCaseDocuments(caseId: string | undefined) {
  return useQuery<CaseDocument[]>({
    queryKey: ["/api/cases", caseId, "documents"],
    enabled: !!caseId,
  });
}

export function useAddCaseDocument(caseId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<InsertCaseDocument, "caseId">) => {
      const response = await fetch(`/api/cases/${caseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al agregar documento");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "documents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "process"],
      });
    },
  });
}

export function useUpdateDocumentNotes(caseId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentId, notes }: { documentId: string; notes: string }) => {
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar notas");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "documents"],
      });
    },
  });
}

export function useDeleteCaseDocument(caseId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/cases/${caseId}/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al eliminar documento");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "documents"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "process"],
      });
    },
  });
}
