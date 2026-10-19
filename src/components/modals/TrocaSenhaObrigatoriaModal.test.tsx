import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { LoggedUserContext } from "../../context/LoggedUserContext";
import { useAlterarSenha, useLogout } from "../../utils/queries";
import { TrocaSenhaObrigatoriaModal } from "./TrocaSenhaObrigatoriaModal";

vi.mock("../../utils/queries", () => ({
  useAlterarSenha: vi.fn(),
  useLogout: vi.fn(),
}));

const alterarSenha = vi.fn();
const sair = vi.fn();
const logout = vi.fn();

function simularMutacoes({
  alterando = false,
  saindo = false,
}: { alterando?: boolean; saindo?: boolean } = {}) {
  (useAlterarSenha as Mock).mockReturnValue({
    mutateAsync: alterarSenha,
    isPending: alterando,
  });
  (useLogout as Mock).mockReturnValue({
    mutateAsync: sair,
    isPending: saindo,
  });
}

function Login() {
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  return <p>Tela de login{aviso ? `: ${aviso}` : ""}</p>;
}

function renderizar() {
  return render(
    <LoggedUserContext.Provider
      value={{ user: null, setUser: vi.fn(), logout, isAuthenticated: false }}
    >
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <TrocaSenhaObrigatoriaModal
                usuario={{
                  nome: "Roberto Lima Ramos",
                  email: "operador@ecogestor.test",
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </LoggedUserContext.Provider>,
  );
}

async function preencher(
  senhaAtual: string,
  novaSenha: string,
  confirmacao = novaSenha,
) {
  const usuario = userEvent.setup();
  await usuario.type(
    screen.getByLabelText("1. Senha atual ou provisória"),
    senhaAtual,
  );
  await usuario.type(screen.getByLabelText("2. Nova senha pessoal"), novaSenha);
  await usuario.type(
    screen.getByLabelText("3. Confirmar nova senha"),
    confirmacao,
  );
  return usuario;
}

const botaoConfirmar = () =>
  screen.getByRole("button", { name: /Confirmar e acessar o sistema/ });

describe("TrocaSenhaObrigatoriaModal", () => {
  beforeEach(() => {
    alterarSenha.mockReset();
    sair.mockReset();
    logout.mockReset();
    simularMutacoes();
  });

  it("identifica o usuário e não preenche a senha atual", () => {
    renderizar();
    expect(
      screen.getByRole("dialog", { name: "Alteração Obrigatória de Senha" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Roberto Lima Ramos")).toBeInTheDocument();
    expect(screen.getByText("operador@ecogestor.test")).toBeInTheDocument();
    expect(screen.getByText("RL")).toBeInTheDocument();
    expect(screen.getByLabelText("1. Senha atual ou provisória")).toHaveValue(
      "",
    );
  });

  it("marca os requisitos conforme a nova senha é digitada", async () => {
    renderizar();
    expect(screen.getByText("Mín. 10 caracteres")).toHaveTextContent(
      "(pendente)",
    );

    await preencher("provisoria-123", "nova-senha-segura");

    for (const requisito of [
      "Mín. 10 caracteres",
      "Diferente da atual",
      "Diferente do e-mail",
      "Senhas coincidem",
    ]) {
      expect(screen.getByText(requisito)).toHaveTextContent("(atendido)");
    }
  });

  it("alterna a visibilidade da senha", async () => {
    renderizar();
    const campo = screen.getByLabelText("2. Nova senha pessoal");
    expect(campo).toHaveAttribute("type", "password");

    await userEvent.click(
      screen.getByRole("button", { name: "Mostrar nova senha pessoal" }),
    );
    expect(campo).toHaveAttribute("type", "text");

    await userEvent.click(
      screen.getByRole("button", { name: "Ocultar nova senha pessoal" }),
    );
    expect(campo).toHaveAttribute("type", "password");
  });

  it("não envia uma nova senha fora das regras", async () => {
    renderizar();
    const usuario = await preencher("provisoria-123", "curta");

    await usuario.click(botaoConfirmar());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "A nova senha deve ter pelo menos 10 caracteres.",
    );
    expect(alterarSenha).not.toHaveBeenCalled();
  });

  it("envia a troca e mantém o usuário na tela quando entra de novo", async () => {
    alterarSenha.mockResolvedValue({ usuario: { id: 7 } });
    renderizar();
    const usuario = await preencher("provisoria-123", "nova-senha-segura");

    await usuario.click(botaoConfirmar());

    expect(alterarSenha).toHaveBeenCalledWith({
      email: "operador@ecogestor.test",
      senhaAtual: "provisoria-123",
      novaSenha: "nova-senha-segura",
    });
    expect(logout).not.toHaveBeenCalled();
    expect(screen.queryByText(/Tela de login/)).not.toBeInTheDocument();
  });

  it("leva ao login com aviso quando o novo login falha", async () => {
    alterarSenha.mockResolvedValue({ usuario: null });
    renderizar();
    const usuario = await preencher("provisoria-123", "nova-senha-segura");

    await usuario.click(botaoConfirmar());

    expect(
      await screen.findByText(
        "Tela de login: Senha alterada com sucesso. Entre novamente com a nova senha.",
      ),
    ).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });

  it("exibe a recusa da API e mantém o usuário na troca", async () => {
    alterarSenha.mockRejectedValue({
      nome: "ValidationError",
      mensagem: "A senha atual informada está incorreta.",
      statusCode: 400,
    });
    renderizar();
    const usuario = await preencher("senha-errada", "nova-senha-segura");

    await usuario.click(botaoConfirmar());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A senha atual informada está incorreta.",
    );
  });

  it("usa uma mensagem padrão quando a recusa não tem mensagem", async () => {
    alterarSenha.mockRejectedValue(new Error("falha"));
    renderizar();
    const usuario = await preencher("provisoria-123", "nova-senha-segura");

    await usuario.click(botaoConfirmar());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível alterar a senha. Tente novamente.",
    );
  });

  it("sai da conta e volta ao login", async () => {
    sair.mockResolvedValue(undefined);
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByText("Tela de login")).toBeInTheDocument();
    expect(sair).toHaveBeenCalled();
    expect(logout).toHaveBeenCalled();
  });

  it("avisa quando não consegue sair", async () => {
    sair.mockRejectedValue(new Error("falha"));
    renderizar();

    await userEvent.click(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível sair. Tente novamente.",
    );
    expect(logout).not.toHaveBeenCalled();
  });

  it("bloqueia os botões enquanto a troca é enviada", () => {
    simularMutacoes({ alterando: true });
    renderizar();
    expect(
      screen.getByRole("button", { name: /Alterando senha/ }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Sair" })).toBeDisabled();
  });

  it("indica a saída em andamento", () => {
    simularMutacoes({ saindo: true });
    renderizar();
    expect(screen.getByRole("button", { name: "Saindo..." })).toBeDisabled();
  });
});
