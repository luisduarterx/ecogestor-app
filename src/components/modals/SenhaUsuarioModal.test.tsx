import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import {
  MENSAGEM_ACESSO_NEGADO,
  NOME_ACESSO_NEGADO,
} from "../../utils/autorizacao";
import {
  useExigirTrocaSenhaUsuario,
  useRedefinirSenhaUsuario,
} from "../../utils/queries";
import SenhaUsuarioModal, { type AcaoSenhaUsuario } from "./SenhaUsuarioModal";

vi.mock("../../utils/queries", () => ({
  useRedefinirSenhaUsuario: vi.fn(),
  useExigirTrocaSenhaUsuario: vi.fn(),
}));

const redefinir = vi.fn();
const exigir = vi.fn();
const onClose = vi.fn();
const onConcluido = vi.fn();

function simularMutacoes(enviando = false) {
  (useRedefinirSenhaUsuario as Mock).mockReturnValue({
    mutateAsync: redefinir,
    isPending: enviando,
  });
  (useExigirTrocaSenhaUsuario as Mock).mockReturnValue({
    mutateAsync: exigir,
    isPending: false,
  });
}

function renderizar(acao: AcaoSenhaUsuario) {
  return render(
    <SenhaUsuarioModal
      acao={acao}
      usuario={{
        id: 9,
        nome: "ROBERTO LIMA RAMOS",
        email: "operador@ecogestor.test",
      }}
      onClose={onClose}
      onConcluido={onConcluido}
    />,
  );
}

async function definirSenha(senha: string, confirmacao = senha) {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Senha provisória"), senha);
  await usuario.type(
    screen.getByLabelText("Confirmar senha provisória"),
    confirmacao,
  );
  await usuario.click(
    screen.getByRole("button", { name: "Definir senha provisória" }),
  );
}

describe("SenhaUsuarioModal", () => {
  beforeEach(() => {
    redefinir.mockReset();
    exigir.mockReset();
    onClose.mockReset();
    onConcluido.mockReset();
    simularMutacoes();
  });

  describe("definir senha provisória", () => {
    it("valida a senha antes de enviar", async () => {
      renderizar("redefinir");

      await definirSenha("curta");

      expect(screen.getByRole("alert")).toHaveTextContent(
        "A senha provisória deve ter pelo menos 10 caracteres.",
      );
      expect(redefinir).not.toHaveBeenCalled();
    });

    it("envia a senha e informa o sucesso", async () => {
      redefinir.mockResolvedValue({ id: 9, trocaSenhaObrigatoria: true });
      renderizar("redefinir");

      await definirSenha("provisoria-123");

      expect(redefinir).toHaveBeenCalledWith({
        userID: 9,
        senhaProvisoria: "provisoria-123",
      });
      expect(onConcluido).toHaveBeenCalledWith(
        "Senha provisória definida para ROBERTO LIMA RAMOS. Repasse a senha ao usuário.",
      );
    });

    it.each([
      [
        "a mensagem da API no 400",
        {
          nome: "ValidationError",
          mensagem: "A senha provisória não pode ser igual ao e-mail.",
          statusCode: 400,
        },
        "A senha provisória não pode ser igual ao e-mail.",
      ],
      [
        "o aviso de permissão no 403",
        {
          nome: NOME_ACESSO_NEGADO,
          mensagem: "Acesso negado",
          statusCode: 403,
        },
        MENSAGEM_ACESSO_NEGADO,
      ],
      [
        "usuário não encontrado no 404",
        { nome: "NotFound", mensagem: "x", statusCode: 404 },
        "Usuário não encontrado.",
      ],
      [
        "uma mensagem padrão para falhas sem mensagem",
        new Error("falha"),
        "Não foi possível concluir a operação. Tente novamente.",
      ],
    ])("exibe %s", async (_caso, falha, mensagem) => {
      redefinir.mockRejectedValue(falha);
      renderizar("redefinir");

      await definirSenha("provisoria-123");

      expect(await screen.findByRole("alert")).toHaveTextContent(mensagem);
      expect(onConcluido).not.toHaveBeenCalled();
    });

    it("bloqueia os botões durante o envio", () => {
      simularMutacoes(true);
      renderizar("redefinir");
      expect(
        screen.getByRole("button", { name: "Salvando..." }),
      ).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    });
  });

  describe("exigir troca de senha", () => {
    it("pede apenas a confirmação e informa o sucesso", async () => {
      exigir.mockResolvedValue({ id: 9, trocaSenhaObrigatoria: true });
      renderizar("exigir");
      expect(
        screen.getByRole("dialog", { name: "Exigir troca de senha" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByLabelText("Senha provisória"),
      ).not.toBeInTheDocument();

      await userEvent.click(
        screen.getByRole("button", { name: "Exigir troca" }),
      );

      expect(exigir).toHaveBeenCalledWith(9);
      expect(onConcluido).toHaveBeenCalledWith(
        "ROBERTO LIMA RAMOS precisará trocar a senha para continuar usando o sistema.",
      );
    });

    it("exibe a recusa da API", async () => {
      exigir.mockRejectedValue({
        nome: NOME_ACESSO_NEGADO,
        mensagem: "Acesso negado",
        statusCode: 403,
      });
      renderizar("exigir");

      await userEvent.click(
        screen.getByRole("button", { name: "Exigir troca" }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        MENSAGEM_ACESSO_NEGADO,
      );
    });
  });

  it.each(["Cancelar", "Fechar"])("fecha pelo botão %s", async (nome) => {
    renderizar("exigir");
    await userEvent.click(screen.getByRole("button", { name: nome }));
    expect(onClose).toHaveBeenCalled();
  });
});
