import { beforeEach, describe, expect, it, vi } from "vitest";
import { gerarCsvRelatorio } from "./csv";
import type { Relatorio } from "./tipos";

const baixarArquivo = vi.hoisted(() => vi.fn());

vi.mock("./formatacao", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./formatacao")>()),
  baixarArquivo,
}));

async function conteudoGerado(relatorio: Relatorio) {
  gerarCsvRelatorio(relatorio, new Date(2026, 0, 15));
  const [blob, nome] = baixarArquivo.mock.calls[0] as [Blob, string];
  const bytes = new Uint8Array(await blob.arrayBuffer());
  // O TextDecoder descarta o BOM; os bytes iniciais são conferidos à parte.
  return {
    bom: Array.from(bytes.slice(0, 3)),
    texto: new TextDecoder().decode(bytes),
    nome,
    tipo: blob.type,
  };
}

const base: Relatorio = {
  titulo: "Vendas",
  filtros: [],
  resumo: [],
  colunas: [
    { titulo: "Cliente", tipo: "texto" },
    { titulo: "Valor", tipo: "moeda", totalizar: true },
    { titulo: "Obs.", tipo: "texto" },
  ],
  linhas: [
    ["Ferro Velho", 1500.5, null],
    ['Loja "Central"', 10, "Pago"],
  ],
};

describe("gerarCsvRelatorio", () => {
  beforeEach(() => {
    baixarArquivo.mockClear();
  });

  it("gera CSV com BOM, ponto e vírgula e linha de total", async () => {
    const { bom, texto, nome, tipo } = await conteudoGerado(base);
    // BOM UTF-8, para o Excel reconhecer a acentuação.
    expect(bom).toEqual([0xef, 0xbb, 0xbf]);
    expect(nome).toBe("vendas-2026-01-15.csv");
    expect(tipo).toBe("text/csv;charset=utf-8;");
    expect(texto).toBe(
      [
        '"Cliente";"Valor";"Obs."',
        '"Ferro Velho";"1500,50";""',
        '"Loja ""Central""";"10,00";"Pago"',
        '"TOTAL";"1510,50";""',
      ].join("\n"),
    );
  });

  it("neutraliza células que seriam lidas como fórmula", async () => {
    const { texto } = await conteudoGerado({
      ...base,
      colunas: [{ titulo: "Cliente", tipo: "texto" }],
      linhas: [["=HYPERLINK(1)"], ["+1"], ["-1"], ["@SOMA"], ["Normal"]],
    });
    expect(texto.split("\n").slice(1)).toEqual([
      `"'=HYPERLINK(1)"`,
      `"'+1"`,
      `"'-1"`,
      `"'@SOMA"`,
      '"Normal"',
    ]);
  });
});
