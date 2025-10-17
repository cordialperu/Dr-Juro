import { useQuery, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { Doctrina, InsertDoctrina } from "@shared/schema";
import { createDoctrina, getDoctrinas, type DoctrinaQuery } from "@/lib/api";

const baseKey = ["doctrinas"] as const;

const buildListKey = (params?: DoctrinaQuery): QueryKey => {
  if (!params || Object.keys(params).length === 0) {
    return baseKey;
  }
  return [...baseKey, params];
};

export const doctrinasKeys = {
  all: baseKey,
  list: buildListKey,
};

export function useDoctrinasQuery(params?: DoctrinaQuery, options?: { enabled?: boolean }) {
  return useQuery<Doctrina[], Error>({
    queryKey: doctrinasKeys.list(params),
    queryFn: () => getDoctrinas(params),
    enabled: options?.enabled ?? true,
  });
}

export function useCreateDoctrinaMutation(params?: DoctrinaQuery) {
  const queryClient = useQueryClient();

  return useMutation<Doctrina, Error, InsertDoctrina>({
    mutationFn: createDoctrina,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctrinasKeys.all });
      queryClient.invalidateQueries({ queryKey: doctrinasKeys.list(params) });
    },
  });
}
