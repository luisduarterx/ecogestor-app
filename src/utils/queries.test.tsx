import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { api } from "./api";
import {
  useAlterarSenha,
  useAtualizarPerfil,
  useExigirTrocaSenhaUsuario,
  usePerfil,
  useRedefinirSenhaUsuario,
  useSession,
} from "./queries";

vi.mock("./api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const post = api.post as Mock;
const patch = api.patch as Mock;
const get = api.get as Mock;

const usuario = {
  id: 7,
  nome: "Roberto Lima Ramos",
  email: "operador@ecogestor.test",
  cargoID: 2,
  permissoes: ["read:pedidos"],
  trocaSenhaObrigatoria: false,
};

function criarAmbiente() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

beforeEach(() => {
  post.mockReset();
  patch.mockReset();
});

describe("useSession", () => {
  it("repassa a indicação de troca de senha pendente", async () => {
    post.mockResolvedValue({
      data: {
        id: 7,
        nome: "Roberto Lima Ramos",
        email: "operador@ecogestor.test",
        telefone: null,
        cargo: { id: 2, nome: "OPERADOR" },
        permissoes: ["read:pedidos"],
        trocaSenhaObrigatoria: true,
      },
    });
    const { wrapper } = criarAmbiente();

    const { result } = renderHook(() => useSession(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(post).toHaveBeenCalledWith("auth/validate");
    expect(result.current.data).toEqual({
      ...usuario,
      trocaSenhaObrigatoria: true,
    });
  });
});

describe("useAlterarSenha", () => {
  const entrada = {
    email: "operador@ecogestor.test",
    senhaAtual: "provisoria-123",
    novaSenha: "nova-senha-segura",
  };

  it("troca a senha, entra de novo e atualiza a sessão em cache", async () => {
    patch.mockResolvedValue({ data: "" });
    post.mockResolvedValue({ data: { user: usuario, expiresAt: "" } });
    const { queryClient, wrapper } = criarAmbiente();
    queryClient.setQueryData(["auth", "session"], {
      ...usuario,
      trocaSenhaObrigatoria: true,
    });

    const { result } = renderHook(() => useAlterarSenha(), { wrapper });
    let resposta: Awaited<ReturnType<typeof result.current.mutateAsync>>;
    await act(async () => {
      resposta = await result.current.mutateAsync(entrada);
    });

    expect(patch).toHaveBeenCalledWith("auth/senha", {
      senhaAtual: "provisoria-123",
      novaSenha: "nova-senha-segura",
    });
    expect(post).toHaveBeenCalledWith("auth/signin", {
      email: "operador@ecogestor.test",
      senha: "nova-senha-segura",
    });
    expect(resposta!).toEqual({ usuario });
    expect(queryClient.getQueryData(["auth", "session"])).toEqual(usuario);
  });

  it("remove a sessão em cache quando o novo login falha", async () => {
    patch.mockResolvedValue({ data: "" });
    post.mockRejectedValue({ nome: "Erro", statusCode: 500 });
    const { queryClient, wrapper } = criarAmbiente();
    queryClient.setQueryData(["auth", "session"], usuario);

    const { result } = renderHook(() => useAlterarSenha(), { wrapper });
    let resposta: Awaited<ReturnType<typeof result.current.mutateAsync>>;
    await act(async () => {
      resposta = await result.current.mutateAsync(entrada);
    });

    expect(resposta!).toEqual({ usuario: null });
    expect(queryClient.getQueryData(["auth", "session"])).toBeUndefined();
  });

  it("não tenta entrar de novo quando a API recusa a troca", async () => {
    const recusa = {
      nome: "ValidationError",
      mensagem: "A senha atual informada está incorreta.",
      statusCode: 400,
    };
    patch.mockRejectedValue(recusa);
    const { queryClient, wrapper } = criarAmbiente();
    queryClient.setQueryData(["auth", "session"], usuario);

    const { result } = renderHook(
      () => ({
        alterar: useAlterarSenha(),
        sessao: useQuery({ queryKey: ["auth", "session"], enabled: false }),
      }),
      { wrapper },
    );

    await act(async () => {
      await expect(result.current.alterar.mutateAsync(entrada)).rejects.toBe(
        recusa,
      );
    });
    expect(post).not.toHaveBeenCalled();
    expect(result.current.sessao.data).toEqual(usuario);
  });
});

describe("ações de senha do administrador", () => {
  it("define a senha provisória e invalida só o detalhe do usuário", async () => {
    post.mockResolvedValue({ data: { id: 9, trocaSenhaObrigatoria: true } });
    const { queryClient, wrapper } = criarAmbiente();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useRedefinirSenhaUsuario(), {
      wrapper,
    });
    let resposta: Awaited<ReturnType<typeof result.current.mutateAsync>>;
    await act(async () => {
      resposta = await result.current.mutateAsync({
        userID: 9,
        senhaProvisoria: "provisoria-123",
      });
    });

    expect(post).toHaveBeenCalledWith("/usuarios/9/redefinir-senha", {
      senhaProvisoria: "provisoria-123",
    });
    expect(resposta!).toEqual({ id: 9, trocaSenhaObrigatoria: true });
    expect(invalidar).toHaveBeenCalledTimes(1);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["usuario", 9] });
  });

  it("exige a troca sem enviar corpo e invalida só o detalhe do usuário", async () => {
    post.mockResolvedValue({ data: { id: 9, trocaSenhaObrigatoria: true } });
    const { queryClient, wrapper } = criarAmbiente();
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useExigirTrocaSenhaUsuario(), {
      wrapper,
    });
    await act(async () => {
      await result.current.mutateAsync(9);
    });

    expect(post).toHaveBeenCalledWith("/usuarios/9/exigir-troca-senha");
    expect(invalidar).toHaveBeenCalledTimes(1);
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["usuario", 9] });
  });
});

describe("perfil do próprio usuário", () => {
  const perfil = {
    id: 7,
    nome: "ROBERTO RAMOS",
    email: "novo@ecogestor.test",
    telefone: null,
    cargo: { id: 2, nome: "OPERADOR" },
  };

  it("busca o perfil em auth/perfil", async () => {
    get.mockResolvedValue({ data: perfil });
    const { wrapper } = criarAmbiente();

    const { result } = renderHook(() => usePerfil(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledWith("auth/perfil");
    expect(result.current.data).toEqual(perfil);
  });

  it("atualiza o perfil, a sessão em cache e invalida os usuários", async () => {
    patch.mockResolvedValue({ data: perfil });
    const { queryClient, wrapper } = criarAmbiente();
    queryClient.setQueryData(["auth", "session"], usuario);
    const invalidar = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useAtualizarPerfil(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({
        email: "novo@ecogestor.test",
        senhaAtual: "segredo",
      });
    });

    expect(patch).toHaveBeenCalledWith("auth/perfil", {
      email: "novo@ecogestor.test",
      senhaAtual: "segredo",
    });
    expect(queryClient.getQueryData(["perfil"])).toEqual(perfil);
    expect(queryClient.getQueryData(["auth", "session"])).toEqual({
      ...usuario,
      nome: "ROBERTO RAMOS",
      email: "novo@ecogestor.test",
    });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["usuarios"] });
    expect(invalidar).toHaveBeenCalledWith({ queryKey: ["usuario", 7] });
  });

  it("não cria sessão em cache quando não havia uma", async () => {
    patch.mockResolvedValue({ data: perfil });
    const { queryClient, wrapper } = criarAmbiente();

    const { result } = renderHook(() => useAtualizarPerfil(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ nome: "Roberto Ramos" });
    });

    expect(queryClient.getQueryData(["auth", "session"])).toBeUndefined();
  });
});
