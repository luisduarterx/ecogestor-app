import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dataValida,
  diaNoFuso,
  formatarDia,
  hojeNoFuso,
} from "./dataCompetencia";

describe("dataValida", () => {
  it.each(["2026-01-31", "2024-02-29", "2026-12-01", "2000-02-29"])(
    "aceita a data real %s",
    (dia) => {
      expect(dataValida(dia)).toBe(true);
    },
  );

  it.each([
    ["dia inexistente", "2026-02-30"],
    ["29 de fevereiro fora de ano bissexto", "2026-02-29"],
    ["1900 não é bissexto", "1900-02-29"],
    ["31 em mês de 30 dias", "2026-04-31"],
    ["mês 13", "2026-13-01"],
    ["mês zero", "2026-00-10"],
    ["dia zero", "2026-01-00"],
    ["formato brasileiro", "31/01/2026"],
    ["sem zero à esquerda", "2026-1-5"],
    ["com horário", "2026-01-05T10:00"],
    ["texto vazio", ""],
  ])("recusa %s (%s)", (_motivo, dia) => {
    expect(dataValida(dia)).toBe(false);
  });
});

describe("diaNoFuso", () => {
  it("usa o fuso de São Paulo perto da meia-noite UTC", () => {
    // 02:30 UTC ainda é 23:30 do dia anterior em São Paulo (UTC-3).
    expect(diaNoFuso("2026-03-10T02:30:00Z")).toBe("2026-03-09");
    expect(diaNoFuso("2026-03-10T03:00:00Z")).toBe("2026-03-10");
  });

  it("aceita objetos Date", () => {
    expect(diaNoFuso(new Date("2026-07-01T12:00:00Z"))).toBe("2026-07-01");
  });
});

describe("hojeNoFuso", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("retorna o dia corrente no fuso de operação", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T01:00:00Z"));
    expect(hojeNoFuso()).toBe("2025-12-31");
  });
});

describe("formatarDia", () => {
  it("converte para DD/MM/AAAA sem aplicar fuso", () => {
    expect(formatarDia("2026-01-01")).toBe("01/01/2026");
  });
});
