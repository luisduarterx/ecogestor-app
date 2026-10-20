import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { useAtualizarPerfil } from "../../utils/queries";
import type { PerfilResponse } from "../../utils/types";
import { DadosPessoais } from "./DadosPessoais";

vi.mock("../../utils/queries", () => ({ useAtualizarPerfil: vi.fn() }));

const atualizar = vi.fn();

const perfil: PerfilResponse = {
  id: 7,
  nome: "ROBERTO LIMA",
  email: "roberto@ecogestor.test",
  telefone: null,
  cargo: { id: 2, nome: "OPERADOR" },
};

function simular(enviando = false) {
  (useAtualizarPerfil as Mock).mockReturnValue({
    mutateAsync: atualizar,
    isPending: enviando,
  });
}

const campoNome = () => screen.getByLabelText("Nome");
const campoEmail = () => screen.getByLabelText("E-mail");
const salvar = () =>
  userEvent.click(screen.getByRole("button", { name: "Salvar dados" }));

async function substituir(campo: HTMLElement, valor: string) {
  await userEvent.clear(campo);
  if (valor) await userEvent.type(campo, valor);
}

describe("DadosPessoais", () => {
  beforeEach(() => {
    atualizar.mockReset();
    simular();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exibe os dados atuais e o cargo só para leitura", () => {
    render(<DadosPessoais perfil={perfil} />);
    expect(campoNome()).toHaveValue("ROBERTO LIMA");
    expect(campoEmail()).toHaveValue("roberto@ecogestor.test");
    expect(screen.getByText("OPERADOR")).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
  });

  it("salva só o nome alterado e confirma o sucesso", async () => {
    atualizar.mockResolvedValue({ ...perfil, nome: "ROBERTO RAMOS" });
    render(<DadosPessoais perfil={perfil} />);

    await substituir(campoNome(), "Roberto Ramos");
    await salvar();

    expect(atualizar).toHaveBeenCalledWith({ nome: "Roberto Ramos" });
    expect(campoNome()).toHaveValue("ROBERTO RAMOS");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Dados atualizados com sucesso.",
    );
  });

  it("pede a senha atual quando o e-mail muda", async () => {
    const atualizado = { ...perfil, email: "novo@ecogestor.test" };
    atualizar.mockResolvedValue(atualizado);
    const { rerender } = render(<DadosPessoais perfil={perfil} />);

    await substituir(campoEmail(), "novo@ecogestor.test");
    await salvar();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Informe a senha atual para alterar o e-mail.",
    );
    expect(atualizar).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText("Senha atual"), "segredo");
    await salvar();

    expect(atualizar).toHaveBeenCalledWith({
      email: "novo@ecogestor.test",
      senhaAtual: "segredo",
    });
    // A página repassa o perfil atualizado pela query.
    rerender(<DadosPessoais perfil={atualizado} />);
    expect(screen.queryByLabelText("Senha atual")).not.toBeInTheDocument();
  });

  it("avisa quando não há alterações", async () => {
    render(<DadosPessoais perfil={perfil} />);
    await salvar();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Nenhuma alteração para salvar.",
    );
    expect(atualizar).not.toHaveBeenCalled();
  });

  it.each([
    [
      "a mensagem da API",
      {
        nome: "ConflictError",
        mensagem: "Esse e-mail já está sendo utilizado por outro usuário.",
        statusCode: 409,
      },
      "Esse e-mail já está sendo utilizado por outro usuário.",
    ],
    [
      "uma mensagem padrão",
      new Error("falha"),
      "Não foi possível salvar os dados. Tente novamente.",
    ],
  ])("exibe %s quando a API recusa", async (_caso, falha, mensagem) => {
    atualizar.mockRejectedValue(falha);
    render(<DadosPessoais perfil={perfil} />);

    await substituir(campoNome(), "Outro Nome");
    await salvar();

    expect(await screen.findByRole("alert")).toHaveTextContent(mensagem);
  });

  it("oculta a mensagem de sucesso depois de alguns segundos", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    atualizar.mockResolvedValue({ ...perfil, nome: "OUTRO NOME" });
    render(<DadosPessoais perfil={perfil} />);

    await substituir(campoNome(), "Outro Nome");
    await salvar();
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("bloqueia o formulário durante o envio", () => {
    simular(true);
    render(<DadosPessoais perfil={perfil} />);
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(campoNome()).toBeDisabled();
  });
});
