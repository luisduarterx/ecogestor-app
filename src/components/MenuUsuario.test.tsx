import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { MenuUsuario } from "./MenuUsuario";

function renderizar(onSair = vi.fn()) {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <p>Fora do menu</p>
      <MenuUsuario nome="ROBERTO LIMA" iniciais="RL" onSair={onSair} />
      <Routes>
        <Route path="/dashboard" element={<p>Painel</p>} />
        <Route path="/perfil" element={<p>Página de perfil</p>} />
      </Routes>
    </MemoryRouter>,
  );
  return onSair;
}

const abrir = () =>
  userEvent.click(
    screen.getByRole("button", { name: "Menu do usuário ROBERTO LIMA" }),
  );

describe("MenuUsuario", () => {
  it("abre o menu e leva ao perfil", async () => {
    renderizar();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await abrir();
    expect(
      screen.getByRole("button", { name: "Menu do usuário ROBERTO LIMA" }),
    ).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("menuitem", { name: "Meu perfil" }));

    expect(screen.getByText("Página de perfil")).toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("sai do sistema pelo menu", async () => {
    const onSair = renderizar();
    await abrir();

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Sair do sistema" }),
    );

    expect(onSair).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha ao clicar fora, mas não ao clicar dentro", async () => {
    renderizar();
    await abrir();

    await userEvent.click(screen.getByRole("menu"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.click(screen.getByText("Fora do menu"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha com Esc e ignora outras teclas", async () => {
    renderizar();
    await abrir();

    await userEvent.keyboard("a");
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("alterna pelo próprio botão", async () => {
    renderizar();
    await abrir();
    await abrir();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
