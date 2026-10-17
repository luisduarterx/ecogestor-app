import { useMutation, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { NOME_ACESSO_NEGADO } from "../utils/autorizacao";

const sessaoExpirada = { nome: "Acesso não Autorizado", statusCode: 401 };
const acessoNegado = { nome: NOME_ACESSO_NEGADO, statusCode: 403 };

function Tela({
  validarSessao,
  buscar,
  salvar,
}: {
  validarSessao: () => Promise<string>;
  buscar: () => Promise<string>;
  salvar: () => Promise<string>;
}) {
  const sessao = useQuery({
    queryKey: ["auth", "session"],
    queryFn: validarSessao,
    retry: false,
  });
  const pedidos = useQuery({ queryKey: ["pedidos"], queryFn: buscar });
  const mutacao = useMutation({ mutationFn: salvar });
  return (
    <>
      <p>{sessao.isSuccess ? "sessão carregada" : "sessão pendente"}</p>
      <p>{pedidos.isError ? "erro nos pedidos" : "pedidos pendentes"}</p>
      <button onClick={() => mutacao.mutate()}>Salvar</button>
      <p>{mutacao.isError ? "erro ao salvar" : ""}</p>
    </>
  );
}

// O cliente é um singleton do módulo; reimportar isola o cache entre testes.
async function renderizar(props: Parameters<typeof Tela>[0]) {
  vi.resetModules();
  const { ProviderQueryClient: Provider } = await import("./QueryClient");
  render(
    <Provider>
      <Tela {...props} />
    </Provider>,
  );
}

describe("ProviderQueryClient", () => {
  it("não repete consultas recusadas com 403 e não revalida a sessão", async () => {
    const validarSessao = vi.fn(async () => "ok");
    const buscar = vi.fn(async () => Promise.reject(acessoNegado));
    await renderizar({ validarSessao, buscar, salvar: vi.fn() });

    expect(await screen.findByText("erro nos pedidos")).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(validarSessao).toHaveBeenCalledTimes(1);
  });

  it("revalida a sessão quando uma consulta recebe 401, sem nova tentativa", async () => {
    const validarSessao = vi.fn(async () => "ok");
    const buscar = vi.fn(async () => Promise.reject(sessaoExpirada));
    await renderizar({ validarSessao, buscar, salvar: vi.fn() });

    expect(await screen.findByText("erro nos pedidos")).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(validarSessao).toHaveBeenCalledTimes(2));
  });

  it("revalida a sessão quando uma mutação recebe 401", async () => {
    const validarSessao = vi.fn(async () => "ok");
    const salvar = vi.fn(async () => Promise.reject(sessaoExpirada));
    await renderizar({
      validarSessao,
      buscar: vi.fn(async () => "pedidos"),
      salvar,
    });
    await screen.findByText("sessão carregada");

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("erro ao salvar")).toBeInTheDocument();
    await waitFor(() => expect(validarSessao).toHaveBeenCalledTimes(2));
  });
});
