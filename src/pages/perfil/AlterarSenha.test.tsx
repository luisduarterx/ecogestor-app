import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";
import { LoggedUserContext } from "../../context/LoggedUserContext";
import { useAlterarSenha } from "../../utils/queries";
import type { UserAuthenticated } from "../../utils/types";
import { AlterarSenha } from "./AlterarSenha";

vi.mock("../../utils/queries", () => ({ useAlterarSenha: vi.fn() }));

const alterarSenha = vi.fn();
const logout = vi.fn();

const usuarioLogado: UserAuthenticated = {
  id: 7,
  nome: "Roberto Lima Ramos",
  email: "operador@ecogestor.test",
  cargoID: 2,
  permissoes: [],
  trocaSenhaObrigatoria: false,
};

function Login() {
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  return <p>Tela de login: {aviso}</p>;
}

function renderizar(user: UserAuthenticated | null = usuarioLogado) {
  return render(
    <LoggedUserContext.Provider
      value={{ user, setUser: vi.fn(), logout, isAuthenticated: !!user }}
    >
      <MemoryRouter initialEntries={["/perfil"]}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/perfil" element={<AlterarSenha />} />
        </Routes>
      </MemoryRouter>
    </LoggedUserContext.Provider>,
  );
}

async function preencher(novaSenha = "nova-senha-segura") {
  const usuario = userEvent.setup();
  await usuario.type(screen.getByLabelText("Senha atual"), "senha-antiga-123");
  await usuario.type(screen.getByLabelText("Nova senha"), novaSenha);
  await usuario.type(screen.getByLabelText("Confirmar nova senha"), novaSenha);
  await usuario.click(screen.getByRole("button", { name: "Alterar senha" }));
}

describe("AlterarSenha", () => {
  beforeEach(() => {
    alterarSenha.mockReset();
    logout.mockReset();
    (useAlterarSenha as Mock).mockReturnValue({
      mutateAsync: alterarSenha,
      isPending: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("troca a senha, limpa os campos e confirma o sucesso", async () => {
    alterarSenha.mockResolvedValue({ usuario: usuarioLogado });
    renderizar();

    await preencher();

    expect(alterarSenha).toHaveBeenCalledWith({
      email: "operador@ecogestor.test",
      senhaAtual: "senha-antiga-123",
      novaSenha: "nova-senha-segura",
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Senha alterada com sucesso. As demais sessões abertas foram encerradas.",
    );
    expect(screen.getByLabelText("Senha atual")).toHaveValue("");
    expect(screen.getByLabelText("Nova senha")).toHaveValue("");
  });

  it("oculta a mensagem de sucesso depois de alguns segundos", async () => {
    alterarSenha.mockResolvedValue({ usuario: usuarioLogado });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderizar();
    await preencher();
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("valida antes de enviar", async () => {
    renderizar();

    await preencher("curta");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "A nova senha deve ter pelo menos 10 caracteres.",
    );
    expect(alterarSenha).not.toHaveBeenCalled();
  });

  it("leva ao login quando a senha mudou mas o novo login falhou", async () => {
    alterarSenha.mockResolvedValue({ usuario: null });
    renderizar();

    await preencher();

    expect(
      await screen.findByText(
        "Tela de login: Senha alterada com sucesso. Entre novamente com a nova senha.",
      ),
    ).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });

  it("exibe a recusa da API", async () => {
    alterarSenha.mockRejectedValue({
      nome: "ValidationError",
      mensagem: "A nova senha deve ser diferente da atual.",
      statusCode: 400,
    });
    renderizar();

    await preencher();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A nova senha deve ser diferente da atual.",
    );
  });

  it("indica o envio em andamento", () => {
    (useAlterarSenha as Mock).mockReturnValue({
      mutateAsync: alterarSenha,
      isPending: true,
    });
    renderizar(null);
    expect(screen.getByRole("button", { name: "Alterando..." })).toBeDisabled();
    expect(screen.getByLabelText("Senha atual")).toBeDisabled();
  });
});
