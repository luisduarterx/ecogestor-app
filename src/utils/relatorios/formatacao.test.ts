import { afterEach, describe, expect, it, vi } from "vitest";
import {
  baixarArquivo,
  calcularTotais,
  formatarCelula,
  formatarDataISO,
  formatarDataHora,
  formatarMoeda,
  formatarPeso,
  formatarQuantidade,
  nomeArquivoRelatorio,
} from "./formatacao";
import type { Relatorio } from "./tipos";

// O Intl usa espaço não separável entre "R$" e o valor.
const normalizarEspacos = (texto: string) => texto.replace(/\s/g, " ");

describe("formatadores", () => {
  it("formata moeda, peso e quantidade no padrão brasileiro", () => {
    expect(normalizarEspacos(formatarMoeda(1234.5))).toBe("R$ 1.234,50");
    expect(formatarPeso(1500)).toBe("1.500,00 kg");
    expect(formatarQuantidade(1500)).toBe("1.500");
  });

  it("formata datas ISO sem conversão de fuso", () => {
    expect(formatarDataISO("2026-01-01")).toBe("01/01/2026");
    expect(formatarDataISO("sem data")).toBe("sem data");
  });

  it("mantém o texto original de datas inválidas", () => {
    expect(formatarDataHora("não é data")).toBe("não é data");
    expect(formatarDataHora(new Date("2026-01-01T12:00:00"))).toBe(
      "01/01/2026, 12:00",
    );
  });
});

describe("formatarCelula", () => {
  it("deixa vazias as células nulas", () => {
    expect(formatarCelula(null, { titulo: "A", tipo: "moeda" }, "pdf")).toBe(
      "",
    );
    expect(formatarCelula("", { titulo: "A", tipo: "texto" }, "pdf")).toBe("");
  });

  it("formata números conforme o tipo e o formato", () => {
    const moeda = { titulo: "Valor", tipo: "moeda" as const };
    const peso = { titulo: "Peso", tipo: "peso" as const };
    expect(normalizarEspacos(formatarCelula(1234.5, moeda, "pdf"))).toBe(
      "R$ 1.234,50",
    );
    expect(formatarCelula(1234.5, peso, "pdf")).toBe("1.234,50");
    // Na planilha, sem separador de milhar para o número ser reconhecido.
    expect(formatarCelula(1234.5, moeda, "csv")).toBe("1234,50");
    expect(formatarCelula(42, { titulo: "Cód.", tipo: "codigo" }, "csv")).toBe(
      "42",
    );
    expect(formatarCelula("texto", moeda, "pdf")).toBe("texto");
  });
});

describe("calcularTotais", () => {
  const relatorio: Relatorio = {
    titulo: "Compras",
    filtros: [],
    resumo: [],
    colunas: [
      { titulo: "Material", tipo: "texto" },
      { titulo: "Peso", tipo: "peso", totalizar: true },
      { titulo: "Valor", tipo: "moeda", totalizar: true },
    ],
    linhas: [
      ["Cobre", 10.5, 100],
      ["Papelão", 2, null],
    ],
  };

  it("soma apenas as colunas totalizáveis e ignora células vazias", () => {
    expect(calcularTotais(relatorio)).toEqual([null, 12.5, 100]);
  });

  it("retorna null quando nenhuma coluna é totalizada", () => {
    expect(
      calcularTotais({
        ...relatorio,
        colunas: relatorio.colunas.map(({ titulo, tipo }) => ({
          titulo,
          tipo,
        })),
      }),
    ).toBeNull();
  });
});

describe("nomeArquivoRelatorio", () => {
  it("remove acentos e símbolos e inclui a data", () => {
    expect(
      nomeArquivoRelatorio(
        "Movimentação de Estoque / Março",
        new Date(2026, 2, 5),
      ),
    ).toBe("movimentacao-de-estoque-marco-2026-03-05");
  });
});

describe("baixarArquivo", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("dispara o download e libera a URL depois", () => {
    vi.useFakeTimers();
    const criar = vi.fn(() => "blob:teste");
    const revogar = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: criar, revokeObjectURL: revogar });
    const clique = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    baixarArquivo(new Blob(["a"]), "arquivo.csv");

    expect(clique).toHaveBeenCalledOnce();
    expect(document.querySelector("a")).toBeNull();
    expect(revogar).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revogar).toHaveBeenCalledWith("blob:teste");
    vi.unstubAllGlobals();
  });
});
