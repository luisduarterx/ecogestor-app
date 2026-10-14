import type { OrderReceiptTemplate } from "../../components/modals/orderReceiptModel";

export type FormatoRelatorio = "pdf" | "csv";

/** Limite de linhas por formato, para não travar o navegador. */
export const LIMITE_LINHAS: Record<FormatoRelatorio, number> = {
  pdf: 5_000,
  csv: 50_000,
};

/**
 * Tipo da coluna: define formatação, alinhamento e se pode ser totalizada.
 * Datas são informadas como texto ISO.
 */
export type TipoColuna = "texto" | "codigo" | "data" | "peso" | "moeda";

export type ColunaRelatorio = {
  titulo: string;
  tipo: TipoColuna;
  /** Soma a coluna na linha de total (apenas peso e moeda). */
  totalizar?: boolean;
};

export type CelulaRelatorio = string | number | null;

export type ItemRelatorio = { rotulo: string; valor: string };

export type Relatorio = {
  titulo: string;
  filtros: ItemRelatorio[];
  resumo: ItemRelatorio[];
  colunas: ColunaRelatorio[];
  linhas: CelulaRelatorio[][];
};

export type ContextoEmissao = {
  empresa: OrderReceiptTemplate;
  usuario: string;
  emitidoEm: Date;
};
