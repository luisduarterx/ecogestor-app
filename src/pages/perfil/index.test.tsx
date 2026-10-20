import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { usePerfil } from "../../utils/queries";
import { Perfil } from "./index";

vi.mock("../../utils/queries", () => ({ usePerfil: vi.fn() }));
vi.mock("../../components/LayoutBase", () => ({
  LayoutBase: ({
    children,
    pageTitle,
  }: {
    children: ReactNode;
    pageTitle: string;
  }) => (
    <main>
      <h1>{pageTitle}</h1>
      {children}
    </main>
  ),
}));
vi.mock("./DadosPessoais", () => ({
  DadosPessoais: ({ perfil }: { perfil: { nome: string } }) => (
    <p>Dados de {perfil.nome}</p>
  ),
}));
vi.mock("./AlterarSenha", () => ({
  AlterarSenha: () => <p>Formulário de senha</p>,
}));

const refetch = vi.fn();

function simular(estado: Record<string, unknown>) {
  (usePerfil as Mock).mockReturnValue({
    isPending: false,
    isError: false,
    refetch,
    ...estado,
  });
}

describe("Perfil", () => {
  beforeEach(() => {
    refetch.mockReset();
  });

  it("exibe os dados e a troca de senha", () => {
    simular({ data: { nome: "ROBERTO" } });
    render(<Perfil />);
    expect(screen.getByRole("heading", { name: "Meu perfil" })).toBeVisible();
    expect(screen.getByText("Dados de ROBERTO")).toBeInTheDocument();
    expect(screen.getByText("Formulário de senha")).toBeInTheDocument();
  });

  it("indica o carregamento", () => {
    simular({ isPending: true });
    render(<Perfil />);
    expect(screen.getByText("Carregando seus dados...")).toBeInTheDocument();
  });

  it("exibe o erro e permite tentar de novo", async () => {
    simular({ isError: true, error: { mensagem: "Falha ao carregar." } });
    render(<Perfil />);

    expect(screen.getByRole("alert")).toHaveTextContent("Falha ao carregar.");
    await userEvent.click(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetch).toHaveBeenCalled();
  });

  it("usa uma mensagem padrão quando o erro não tem mensagem", () => {
    simular({ isError: true, error: {} });
    render(<Perfil />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Não foi possível carregar seus dados.",
    );
  });
});
