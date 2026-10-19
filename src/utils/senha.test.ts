import { describe, expect, it } from "vitest";
import {
  iniciaisDoNome,
  requisitosNovaSenha,
  validarTrocaSenha,
  type DadosTrocaSenha,
} from "./senha";

const dados = (parcial: Partial<DadosTrocaSenha> = {}): DadosTrocaSenha => ({
  senhaAtual: "provisoria-123",
  novaSenha: "nova-senha-segura",
  confirmacao: "nova-senha-segura",
  email: "operador@ecogestor.test",
  ...parcial,
});

const atendidos = (entrada: DadosTrocaSenha) =>
  Object.fromEntries(
    requisitosNovaSenha(entrada).map(({ id, atendido }) => [id, atendido]),
  );

describe("requisitosNovaSenha", () => {
  it("marca todos os requisitos quando a nova senha é válida", () => {
    expect(atendidos(dados())).toEqual({
      tamanho: true,
      diferenteAtual: true,
      diferenteEmail: true,
      coincidem: true,
    });
  });

  it("não marca nada enquanto a nova senha está vazia", () => {
    expect(atendidos(dados({ novaSenha: "", confirmacao: "" }))).toEqual({
      tamanho: false,
      diferenteAtual: false,
      diferenteEmail: false,
      coincidem: false,
    });
  });

  it("exige no mínimo 10 caracteres", () => {
    const requisitos = requisitosNovaSenha(dados({ novaSenha: "123456789" }));
    expect(requisitos[0]).toEqual({
      id: "tamanho",
      rotulo: "Mín. 10 caracteres",
      atendido: false,
    });
  });

  it("aponta senha igual à atual, igual ao e-mail ou sem confirmação", () => {
    expect(
      atendidos(dados({ novaSenha: "provisoria-123" })).diferenteAtual,
    ).toBe(false);
    expect(
      atendidos(dados({ novaSenha: " OPERADOR@ecogestor.test" }))
        .diferenteEmail,
    ).toBe(true);
    expect(
      atendidos(dados({ novaSenha: "OPERADOR@ecogestor.test" })).diferenteEmail,
    ).toBe(false);
    expect(atendidos(dados({ confirmacao: "outra" })).coincidem).toBe(false);
  });
});

describe("validarTrocaSenha", () => {
  it("aceita uma troca válida", () => {
    expect(validarTrocaSenha(dados())).toBeNull();
  });

  it.each<[string, Partial<DadosTrocaSenha>, string]>([
    ["senha atual vazia", { senhaAtual: "" }, "Informe a senha atual."],
    [
      "nova senha curta",
      { novaSenha: "curta", confirmacao: "curta" },
      "A nova senha deve ter pelo menos 10 caracteres.",
    ],
    [
      "nova senha acima de 72 bytes",
      // 37 caracteres acentuados ocupam 74 bytes em UTF-8.
      { novaSenha: "é".repeat(37), confirmacao: "é".repeat(37) },
      "A nova senha deve ter no máximo 72 bytes.",
    ],
    [
      "nova senha igual à atual",
      { novaSenha: "provisoria-123", confirmacao: "provisoria-123" },
      "A nova senha deve ser diferente da atual.",
    ],
    [
      "nova senha igual ao e-mail",
      {
        novaSenha: "Operador@EcoGestor.test",
        confirmacao: "Operador@EcoGestor.test",
      },
      "A nova senha não pode ser igual ao e-mail.",
    ],
    [
      "confirmação diferente",
      { confirmacao: "nova-senha-errada" },
      "A confirmação não corresponde à nova senha.",
    ],
  ])("recusa %s", (_caso, parcial, mensagem) => {
    expect(validarTrocaSenha(dados(parcial))).toBe(mensagem);
  });
});

describe("iniciaisDoNome", () => {
  it.each([
    ["Roberto Lima Ramos", "RL"],
    ["  ana  ", "A"],
    ["maria da silva", "MD"],
    ["", "?"],
  ])("%s → %s", (nome, esperado) => {
    expect(iniciaisDoNome(nome)).toBe(esperado);
  });
});
