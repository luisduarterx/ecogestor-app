import { describe, expect, it } from "vitest";
import {
  emailFoiAlterado,
  montarAlteracoesPerfil,
  validarPerfil,
  type FormularioPerfil,
} from "./perfil";

const original = { nome: "ROBERTO LIMA", email: "roberto@ecogestor.test" };

const formulario = (
  parcial: Partial<FormularioPerfil> = {},
): FormularioPerfil => ({
  nome: "ROBERTO LIMA",
  email: "roberto@ecogestor.test",
  senhaAtual: "",
  ...parcial,
});

describe("emailFoiAlterado", () => {
  it("ignora espaços e maiúsculas", () => {
    expect(emailFoiAlterado(original, " Roberto@EcoGestor.test ")).toBe(false);
    expect(emailFoiAlterado(original, "outro@ecogestor.test")).toBe(true);
  });
});

describe("montarAlteracoesPerfil", () => {
  it("não envia nada quando nada mudou", () => {
    expect(
      montarAlteracoesPerfil(original, formulario({ nome: " roberto lima " })),
    ).toBeNull();
  });

  it("envia só o nome quando apenas ele mudou", () => {
    expect(
      montarAlteracoesPerfil(original, formulario({ nome: " Roberto Ramos " })),
    ).toEqual({ nome: "Roberto Ramos" });
  });

  it("envia o e-mail normalizado com a senha atual", () => {
    expect(
      montarAlteracoesPerfil(
        original,
        formulario({ email: " Novo@EcoGestor.test ", senhaAtual: "segredo" }),
      ),
    ).toEqual({ email: "novo@ecogestor.test", senhaAtual: "segredo" });
  });
});

describe("validarPerfil", () => {
  it("aceita dados válidos", () => {
    expect(validarPerfil(original, formulario())).toBeNull();
    expect(
      validarPerfil(
        original,
        formulario({ email: "novo@ecogestor.test", senhaAtual: "segredo" }),
      ),
    ).toBeNull();
  });

  it.each<[string, Partial<FormularioPerfil>, string]>([
    [
      "nome curto",
      { nome: " ab " },
      "O nome deve ter pelo menos 3 caracteres.",
    ],
    [
      "nome longo",
      { nome: "a".repeat(206) },
      "O nome deve ter no máximo 205 caracteres.",
    ],
    ["e-mail inválido", { email: "invalido" }, "Informe um e-mail válido."],
    [
      "troca de e-mail sem senha",
      { email: "novo@ecogestor.test" },
      "Informe a senha atual para alterar o e-mail.",
    ],
  ])("recusa %s", (_caso, parcial, mensagem) => {
    expect(validarPerfil(original, formulario(parcial))).toBe(mensagem);
  });
});
