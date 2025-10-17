import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CaseProcessState, InsertCaseProcessState } from "@shared/schema";

interface ProcessStateResponse {
  processState: CaseProcessState | null;
  documents: any[];
}

export function useProcessState(caseId: string | undefined) {
  return useQuery<ProcessStateResponse>({
    queryKey: ["/api/cases", caseId, "process"],
    enabled: !!caseId,
  });
}

export function useSaveProcessState(caseId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<InsertCaseProcessState>) => {
      const response = await fetch(`/api/cases/${caseId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el estado del proceso");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/cases", caseId, "process"],
      });
    },
  });
}
