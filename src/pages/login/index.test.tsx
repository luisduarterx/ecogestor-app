import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { LoggedUserContext } from "../../context/LoggedUserContext";
import { useLogin } from "../../utils/queries";
import { Login } from "./index";

vi.mock("../../utils/queries", () => ({ useLogin: vi.fn() }));

function renderizar(estado?: unknown) {
  return render(
    <LoggedUserContext.Provider
      value={{
        user: null,
        setUser: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: false,
      }}
    >
      <MemoryRouter initialEntries={[{ pathname: "/", state: estado }]}>
        <Routes>
          <Route path="/" element={<Login />} />
        </Routes>
      </MemoryRouter>
    </LoggedUserContext.Provider>,
  );
}

describe("Login", () => {
  beforeEach(() => {
    (useLogin as Mock).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it("exibe o aviso recebido ao voltar da troca de senha", () => {
    renderizar({ aviso: "Senha alterada com sucesso." });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Senha alterada com sucesso.",
    );
  });

  it("não exibe aviso no acesso normal", () => {
    renderizar();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
