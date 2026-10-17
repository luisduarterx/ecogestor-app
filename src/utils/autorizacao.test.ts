import { describe, expect, it } from "vitest";
import {
  NOME_ACESSO_NEGADO,
  ehAcessoNegado,
  ehRecusaDeAutorizacao,
  ehSessaoInvalida,
  temPermissao,
} from "./autorizacao";

const erro = (statusCode: number, nome = "Erro") => ({
  nome,
  mensagem: "mensagem",
  statusCode,
  action: "ação",
});

describe("ehSessaoInvalida", () => {
  it("reconhece apenas o 401", () => {
    expect(ehSessaoInvalida(erro(401))).toBe(true);
    expect(ehSessaoInvalida(erro(403, NOME_ACESSO_NEGADO))).toBe(false);
    expect(ehSessaoInvalida(erro(500))).toBe(false);
  });

  it("tolera valores que não são erros da API", () => {
    expect(ehSessaoInvalida(null)).toBe(false);
    expect(ehSessaoInvalida(undefined)).toBe(false);
    expect(ehSessaoInvalida(new Error("falha"))).toBe(false);
  });
});

describe("ehAcessoNegado", () => {
  it("exige o status 403 e o nome de acesso negado", () => {
    expect(ehAcessoNegado(erro(403, NOME_ACESSO_NEGADO))).toBe(true);
  });

  it("não confunde o 403 do módulo fiscal desligado com falta de permissão", () => {
    expect(ehAcessoNegado(erro(403, "Módulo Fiscal Desativado"))).toBe(false);
  });

  it("ignora outros status com o mesmo nome", () => {
    expect(ehAcessoNegado(erro(401, NOME_ACESSO_NEGADO))).toBe(false);
    expect(ehAcessoNegado(null)).toBe(false);
  });
});

describe("ehRecusaDeAutorizacao", () => {
  it.each([
    [401, true],
    [403, true],
    [400, false],
    [404, false],
    [500, false],
  ])("status %i → %s", (status, esperado) => {
    expect(ehRecusaDeAutorizacao(erro(status))).toBe(esperado);
  });
});

describe("temPermissao", () => {
  const usuario = { permissoes: ["read:pedido", "backdate:pedido"] };

  it("confere a permissão na lista do usuário", () => {
    expect(temPermissao(usuario, "backdate:pedido")).toBe(true);
    expect(temPermissao(usuario, "delete:pedido")).toBe(false);
  });

  it("nega quando não há usuário na sessão", () => {
    expect(temPermissao(null, "read:pedido")).toBe(false);
    expect(temPermissao(undefined, "read:pedido")).toBe(false);
  });
});
