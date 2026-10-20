import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { LoggedUserContext } from "../context/LoggedUserContext";
import { useSession } from "../utils/queries";
import { GuestRoute } from "./GuestRoute";
import { ProtectedRoute } from "./ProtectedRoutes";

vi.mock("../utils/queries", () => ({ useSession: vi.fn() }));
vi.mock("../components/modals/TrocaSenhaObrigatoriaModal", () => ({
  TrocaSenhaObrigatoriaModal: ({ usuario }: { usuario: { nome: string } }) => (
    <p>Troca obrigatória de {usuario.nome}</p>
  ),
}));

const usuario = {
  id: 1,
  nome: "Admin",
  email: "admin@ecogestor.test",
  cargoID: 1,
  permissoes: ["read:pedido"],
  trocaSenhaObrigatoria: false,
};

type EstadoSessao = "carregando" | "valida" | "invalida";

function simularSessao(estado: EstadoSessao) {
  (useSession as Mock).mockReturnValue({
    isPending: estado === "carregando",
    isSuccess: estado === "valida",
    isError: estado === "invalida",
    data: estado === "valida" ? usuario : undefined,
  });
}

function Login() {
  const location = useLocation();
  const origem = (location.state as { from?: string } | null)?.from;
  return <p>Tela de login{origem ? ` (origem: ${origem})` : ""}</p>;
}

const setUser = vi.fn();
const logout = vi.fn();

function renderizar(caminho: string) {
  return render(
    <LoggedUserContext.Provider
      value={{ user: null, setUser, logout, isAuthenticated: false }}
    >
      <MemoryRouter initialEntries={[caminho]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<p>Painel</p>} />
            <Route path="/pedidos" element={<p>Pedidos</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </LoggedUserContext.Provider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    setUser.mockClear();
    logout.mockClear();
  });

  it("aguarda a validação da sessão", () => {
    simularSessao("carregando");
    renderizar("/pedidos");
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByText("Pedidos")).not.toBeInTheDocument();
  });

  it("exibe a página e guarda o usuário quando a sessão é válida", () => {
    simularSessao("valida");
    renderizar("/pedidos");
    expect(screen.getByText("Pedidos")).toBeInTheDocument();
    expect(setUser).toHaveBeenCalledWith(usuario);
  });

  it("exibe só a troca obrigatória quando a senha precisa ser trocada", () => {
    const pendente = { ...usuario, trocaSenhaObrigatoria: true };
    (useSession as Mock).mockReturnValue({
      isPending: false,
      isSuccess: true,
      isError: false,
      data: pendente,
    });
    renderizar("/pedidos");
    expect(screen.getByText("Troca obrigatória de Admin")).toBeInTheDocument();
    expect(screen.queryByText("Pedidos")).not.toBeInTheDocument();
    expect(setUser).toHaveBeenCalledWith(pendente);
  });

  it("leva ao login, lembrando a origem, quando a sessão é inválida", () => {
    simularSessao("invalida");
    renderizar("/pedidos");
    expect(
      screen.getByText("Tela de login (origem: /pedidos)"),
    ).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });
});

describe("GuestRoute", () => {
  beforeEach(() => {
    setUser.mockClear();
    logout.mockClear();
  });

  it("aguarda a validação da sessão", () => {
    simularSessao("carregando");
    renderizar("/");
    expect(screen.getByText("...Carregando")).toBeInTheDocument();
  });

  it("envia ao painel quem já está autenticado", () => {
    simularSessao("valida");
    renderizar("/");
    expect(screen.getByText("Painel")).toBeInTheDocument();
    expect(setUser).toHaveBeenCalledWith(usuario);
  });

  it("exibe o login para quem não tem sessão", () => {
    simularSessao("invalida");
    renderizar("/");
    expect(screen.getByText("Tela de login")).toBeInTheDocument();
    expect(logout).toHaveBeenCalled();
  });

  it("não renderiza nada em um estado inesperado", () => {
    (useSession as Mock).mockReturnValue({
      isPending: false,
      isSuccess: false,
      isError: false,
    });
    const { container } = renderizar("/");
    expect(container).toBeEmptyDOMElement();
  });
});
