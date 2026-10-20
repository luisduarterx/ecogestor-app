import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { LoggedUserContext } from "../../context/LoggedUserContext";
import {
  useDeleteRole,
  useDeleteUser,
  usePermissions,
  useRoleDetails,
  useRoles,
  useUsers,
} from "../../utils/queries";
import type { UserAuthenticated } from "../../utils/types";
import { Usuarios } from "./index";

vi.mock("../../utils/queries", () => ({
  useDeleteRole: vi.fn(),
  useDeleteUser: vi.fn(),
  usePermissions: vi.fn(),
  useRoleDetails: vi.fn(),
  useRoles: vi.fn(),
  useUsers: vi.fn(),
}));
vi.mock("../../components/LayoutBase", () => ({
  LayoutBase: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("../../components/modals/SenhaUsuarioModal", () => ({
  default: ({
    acao,
    usuario,
    onConcluido,
  }: {
    acao: string;
    usuario: { nome: string };
    onConcluido: (mensagem: string) => void;
  }) => (
    <div role="dialog">
      <p>
        Modal {acao} de {usuario.nome}
      </p>
      <button type="button" onClick={() => onConcluido("Ação concluída.")}>
        Concluir
      </button>
    </div>
  ),
}));

const consulta = <T,>(data: T) => ({
  data,
  isPending: false,
  isError: false,
  refetch: vi.fn(),
});

const admin: UserAuthenticated = {
  id: 1,
  nome: "ADMINISTRADOR",
  email: "admin@ecogestor.test",
  cargoID: 1,
  permissoes: ["read:usuarios", "update:senha_usuario"],
  trocaSenhaObrigatoria: false,
};

function renderizar(usuarioLogado: UserAuthenticated = admin) {
  return render(
    <LoggedUserContext.Provider
      value={{
        user: usuarioLogado,
        setUser: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: true,
      }}
    >
      <Usuarios />
    </LoggedUserContext.Provider>,
  );
}

const linhaDe = (nome: string) =>
  screen.getByText(nome, { exact: false }).closest("tr") as HTMLElement;

describe("Usuarios — ações de senha", () => {
  beforeEach(() => {
    (useUsers as Mock).mockReturnValue(
      consulta([
        {
          id: 1,
          nome: "ADMINISTRADOR",
          email: "admin@ecogestor.test",
          telefone: null,
          cargoID: 1,
        },
        {
          id: 9,
          nome: "ROBERTO LIMA RAMOS",
          email: "operador@ecogestor.test",
          telefone: null,
          cargoID: 1,
        },
      ]),
    );
    (useRoles as Mock).mockReturnValue(consulta([{ id: 1, nome: "ADMIN" }]));
    (useRoleDetails as Mock).mockReturnValue(consulta([]));
    (usePermissions as Mock).mockReturnValue(consulta([]));
    (useDeleteUser as Mock).mockReturnValue({ isPending: false });
    (useDeleteRole as Mock).mockReturnValue({ isPending: false });
  });

  it("oferece as ações para outros usuários, mas não para o próprio administrador", () => {
    renderizar();

    const outro = within(linhaDe("ROBERTO LIMA RAMOS"));
    expect(
      outro.getByRole("button", {
        name: "Definir senha provisória de ROBERTO LIMA RAMOS",
      }),
    ).toBeInTheDocument();
    expect(
      outro.getByRole("button", {
        name: "Exigir troca de senha de ROBERTO LIMA RAMOS",
      }),
    ).toBeInTheDocument();

    const proprio = within(linhaDe("admin@ecogestor.test"));
    expect(
      proprio.queryByRole("button", { name: /senha/ }),
    ).not.toBeInTheDocument();
  });

  it("oculta as ações sem a permissão update:senha_usuario", () => {
    renderizar({ ...admin, permissoes: ["read:usuarios"] });
    expect(
      screen.queryByRole("button", { name: /Definir senha provisória/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Exigir troca de senha/ }),
    ).not.toBeInTheDocument();
  });

  it.each([
    ["Definir senha provisória", "redefinir"],
    ["Exigir troca de senha", "exigir"],
  ])(
    "abre o modal de %s e exibe o retorno ao concluir",
    async (rotulo, acao) => {
      renderizar();

      await userEvent.click(
        screen.getByRole("button", { name: `${rotulo} de ROBERTO LIMA RAMOS` }),
      );
      expect(
        screen.getByText(`Modal ${acao} de ROBERTO LIMA RAMOS`),
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole("button", { name: "Concluir" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Ação concluída.")).toBeInTheDocument();
    },
  );
});
