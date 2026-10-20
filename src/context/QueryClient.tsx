import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type QueryKey,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  ehRecusaDeAutorizacao,
  ehSessaoInvalida,
  ehTrocaSenhaObrigatoria,
} from "../utils/autorizacao";

const CHAVE_SESSAO = ["auth", "session"] as const;

// Login, validação, logout e troca de senha tratam o próprio 401.
const ehChaveDeAutenticacao = (chave: QueryKey | undefined) =>
  chave?.[0] === "auth";

/**
 * Um 401 em qualquer rota indica sessão ausente ou expirada. A sessão é
 * revalidada; se a API confirmar a recusa, `ProtectedRoute` leva ao login.
 * O 403 `TrocaSenhaObrigatoria` também revalida a sessão, que passa a indicar
 * a troca pendente, e `ProtectedRoute` exibe a troca obrigatória.
 * O 403 por falta de permissão não passa por aqui: cada tela exibe a mensagem.
 */
function revalidarSessaoSeNecessario(
  erro: unknown,
  chave: QueryKey | undefined,
) {
  const exigeRevalidacao =
    ehSessaoInvalida(erro) || ehTrocaSenhaObrigatoria(erro);
  if (!exigeRevalidacao || ehChaveDeAutenticacao(chave)) return;
  if (queryClient.isFetching({ queryKey: CHAVE_SESSAO }) > 0) return;
  void queryClient.invalidateQueries({ queryKey: CHAVE_SESSAO });
}

const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (erro, query) => revalidarSessaoSeNecessario(erro, query.queryKey),
  }),
  mutationCache: new MutationCache({
    onError: (erro, _variaveis, _contexto, mutacao) =>
      revalidarSessaoSeNecessario(erro, mutacao.options.mutationKey),
  }),
  defaultOptions: {
    queries: {
      // 401 e 403 não se resolvem com novas tentativas.
      retry: (falhas, erro) => !ehRecusaDeAutorizacao(erro) && falhas < 3,
    },
  },
});

export const ProviderQueryClient = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
