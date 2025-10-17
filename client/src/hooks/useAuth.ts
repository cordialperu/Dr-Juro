import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthProfile, LoginInput, getProfile, login, logout, register } from "@/lib/api";

export const authKeys = {
  profile: ["auth", "profile"] as const,
};

export function useAuthQuery() {
  return useQuery<AuthProfile, Error>({
    queryKey: authKeys.profile,
    queryFn: getProfile,
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation<AuthProfile, Error, LoginInput>({
    mutationFn: login,
    onSuccess: (profile) => {
      queryClient.setQueryData(authKeys.profile, profile);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation<AuthProfile, Error, LoginInput>({
    mutationFn: register,
    onSuccess: (profile) => {
      queryClient.setQueryData(authKeys.profile, profile);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile });
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: authKeys.profile });
      queryClient.invalidateQueries();
    },
  });
}
