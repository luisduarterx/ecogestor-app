import { useMutation, useQuery } from "@tanstack/react-query";
import { type UserAuthenticated, type LoginReponse } from "./types";
import { api } from "./api";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; senha: string }) => {
      const { data } = await api.post<LoginReponse>("auth/signin", credentials);
      return data;
    },
  });
};
export function useSession(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "session"],
    enabled,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.post<UserAuthenticated>("auth/validate");

      return data;
    },
  });
}
