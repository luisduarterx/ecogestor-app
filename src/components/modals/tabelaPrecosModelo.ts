export type PrecoImpresso = {
  id: number;
  nome: string;
  categoria: string;
  precoCompra: number;
  precoVenda: number;
};

export type OpcoesTabelaPrecos = {
  mostrarVenda: boolean;
};

export const LARGURA_A4_RETRATO_MM = 210;

export const AVISO_TABELA_PRECOS =
  "Os valores podem variar de acordo com qualidade, umidade, impurezas e condições do lote.";

export const formatarPreco = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);

/** Agrupa os preços por categoria (usado no texto do WhatsApp). */
export function agruparPorCategoria(precos: PrecoImpresso[]) {
  const grupos = new Map<string, PrecoImpresso[]>();
  precos.forEach((preco) =>
    grupos.set(preco.categoria, [
      ...(grupos.get(preco.categoria) ?? []),
      preco,
    ]),
  );
  return [...grupos.entries()];
}

/** Estilos da tabela de preços em folha A4 retrato. */
export function getCssTabelaA4(paraImpressao = false) {
  return `
  ${paraImpressao ? "* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: #fff; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }" : ""}
  .tabela-a4 {
    box-sizing: border-box;
    width: ${LARGURA_A4_RETRATO_MM}mm;
    min-height: 297mm;
    padding: 14mm;
    background: #fff;
    color: #0f172a;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    line-height: 1.35;
  }
  .tabela-a4 h1, .tabela-a4 h2 { color: inherit; font-family: inherit; letter-spacing: normal; line-height: 1.2; margin: 0; }
  .tabela-a4-cabecalho { display: flex; align-items: center; gap: 6mm; padding-bottom: 4mm; border-bottom: 2px solid #047857; }
  .tabela-a4-logo { flex-shrink: 0; max-width: 55mm; max-height: 18mm; object-fit: contain; }
  .tabela-a4-empresa { flex: 1; min-width: 0; color: #475569; font-size: 9.5px; }
  .tabela-a4-empresa h1 { color: #0f172a; font-size: 17px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
  .tabela-a4-emissao { flex-shrink: 0; text-align: right; color: #475569; font-size: 9.5px; }
  .tabela-a4-selo { display: inline-block; margin-bottom: 4px; padding: 3px 8px; background: #047857; color: #fff; font-size: 9px; font-weight: 700; letter-spacing: 1px; }
  .tabela-a4-titulo { margin: 6mm 0 4mm; }
  .tabela-a4-titulo h2 { font-size: 16px; font-weight: 700; text-transform: uppercase; }
  .tabela-a4-titulo p { margin: 2px 0 0; color: #64748b; }
  .tabela-a4 table { width: auto; margin: 0 auto; border-collapse: collapse; }
  .tabela-a4 th:first-child, .tabela-a4 td:first-child { min-width: 70mm; }
  .tabela-a4 th { padding: 6px 16px; background: #047857; color: #fff; font-size: 9.5px; text-transform: uppercase; text-align: right; }
  .tabela-a4 td { padding: 6px 16px; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap; }
  .tabela-a4 th:first-child, .tabela-a4 td:first-child { text-align: left; white-space: normal; }
  .tabela-a4 tr { page-break-inside: avoid; }
  .tabela-a4 .tabela-a4-compra { color: #047857; font-weight: 700; }
  .tabela-a4 .tabela-a4-venda { color: #0369a1; font-weight: 700; }
  .tabela-a4-observacoes { margin-top: 6mm; color: #64748b; font-size: 9.5px; text-align: center; }
  .tabela-a4-rodape { margin-top: 6mm; padding-top: 3mm; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9px; text-align: center; }
  .tabela-a4-rodape strong { color: #0f172a; }
  ${paraImpressao ? "@page { size: A4 portrait; margin: 12mm; } .tabela-a4 { width: 100%; min-height: 0; padding: 0; }" : ""}
`;
}
