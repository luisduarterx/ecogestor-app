import type { ApiError, RegimeTributario } from "./types";

/** Código fiscal com descrição e indicação de suporte na emissão da V1. */
export type CodigoFiscal = {
  codigo: string;
  descricao: string;
  emiteNaV1: boolean;
};

export const ROTULOS_REGIME: Record<RegimeTributario, string> = {
  SIMPLES_NACIONAL: "Simples Nacional",
  SIMPLES_EXCESSO_SUBLIMITE:
    "Simples Nacional — excesso de sublimite de receita bruta",
  REGIME_NORMAL: "Regime Normal (Lucro Presumido ou Real)",
  MEI: "MEI",
};

export const REGIMES = Object.keys(ROTULOS_REGIME) as RegimeTributario[];

/** CSOSN: Simples Nacional e MEI. */
export const CSOSN: CodigoFiscal[] = [
  {
    codigo: "101",
    descricao: "Tributada com permissão de crédito",
    emiteNaV1: false,
  },
  {
    codigo: "102",
    descricao: "Tributada sem permissão de crédito",
    emiteNaV1: true,
  },
  {
    codigo: "103",
    descricao: "Isenção para faixa de receita bruta",
    emiteNaV1: true,
  },
  {
    codigo: "201",
    descricao: "Com permissão de crédito e cobrança do ICMS por ST",
    emiteNaV1: false,
  },
  {
    codigo: "202",
    descricao: "Sem permissão de crédito e com cobrança do ICMS por ST",
    emiteNaV1: false,
  },
  {
    codigo: "203",
    descricao: "Isenção para faixa de receita bruta e cobrança do ICMS por ST",
    emiteNaV1: false,
  },
  { codigo: "300", descricao: "Imune", emiteNaV1: true },
  {
    codigo: "400",
    descricao: "Não tributada pelo Simples Nacional",
    emiteNaV1: true,
  },
  {
    codigo: "500",
    descricao: "ICMS cobrado anteriormente por ST ou antecipação",
    emiteNaV1: false,
  },
  { codigo: "900", descricao: "Outros", emiteNaV1: false },
];

/** CST do ICMS: Regime Normal e Simples com excesso de sublimite. */
export const CST_ICMS: CodigoFiscal[] = [
  { codigo: "00", descricao: "Tributada integralmente", emiteNaV1: false },
  {
    codigo: "02",
    descricao: "Tributação monofásica própria (combustíveis)",
    emiteNaV1: false,
  },
  {
    codigo: "10",
    descricao: "Tributada e com cobrança do ICMS por ST",
    emiteNaV1: false,
  },
  {
    codigo: "15",
    descricao: "Monofásica própria e com retenção (combustíveis)",
    emiteNaV1: false,
  },
  {
    codigo: "20",
    descricao: "Com redução de base de cálculo",
    emiteNaV1: false,
  },
  {
    codigo: "30",
    descricao: "Isenta/não tributada e com cobrança do ICMS por ST",
    emiteNaV1: false,
  },
  { codigo: "40", descricao: "Isenta", emiteNaV1: true },
  { codigo: "41", descricao: "Não tributada", emiteNaV1: true },
  { codigo: "50", descricao: "Suspensão", emiteNaV1: false },
  { codigo: "51", descricao: "Diferimento", emiteNaV1: false },
  {
    codigo: "53",
    descricao: "Monofásica com recolhimento diferido (combustíveis)",
    emiteNaV1: false,
  },
  {
    codigo: "60",
    descricao: "ICMS cobrado anteriormente por ST",
    emiteNaV1: false,
  },
  {
    codigo: "61",
    descricao: "Monofásica cobrada anteriormente (combustíveis)",
    emiteNaV1: false,
  },
  {
    codigo: "70",
    descricao: "Com redução de base de cálculo e cobrança do ICMS por ST",
    emiteNaV1: false,
  },
  { codigo: "90", descricao: "Outras", emiteNaV1: false },
];

/** CST de PIS e COFINS para naturezas de saída. */
export const CST_PIS_COFINS: CodigoFiscal[] = [
  {
    codigo: "01",
    descricao: "Operação tributável com alíquota básica",
    emiteNaV1: false,
  },
  {
    codigo: "02",
    descricao: "Operação tributável com alíquota diferenciada",
    emiteNaV1: false,
  },
  {
    codigo: "03",
    descricao: "Operação tributável com alíquota por unidade de medida",
    emiteNaV1: false,
  },
  {
    codigo: "04",
    descricao: "Operação tributável monofásica — revenda a alíquota zero",
    emiteNaV1: true,
  },
  {
    codigo: "05",
    descricao: "Operação tributável por substituição tributária",
    emiteNaV1: true,
  },
  {
    codigo: "06",
    descricao: "Operação tributável a alíquota zero",
    emiteNaV1: true,
  },
  {
    codigo: "07",
    descricao: "Operação isenta da contribuição",
    emiteNaV1: true,
  },
  {
    codigo: "08",
    descricao: "Operação sem incidência da contribuição",
    emiteNaV1: true,
  },
  {
    codigo: "09",
    descricao: "Operação com suspensão da contribuição",
    emiteNaV1: true,
  },
  { codigo: "49", descricao: "Outras operações de saída", emiteNaV1: true },
  { codigo: "99", descricao: "Outras operações", emiteNaV1: false },
];

/** Regimes do Simples usam CSOSN; os demais usam CST. */
export const usaCsosn = (regime: RegimeTributario) =>
  regime === "SIMPLES_NACIONAL" || regime === "MEI";

/** Opções de situação do ICMS conforme o regime (ambas sem regime definido). */
export function opcoesIcms(regime: RegimeTributario | null) {
  if (!regime) return [...CSOSN, ...CST_ICMS];
  return usaCsosn(regime) ? CSOSN : CST_ICMS;
}

export function descreverCodigo(lista: CodigoFiscal[], codigo: string) {
  const item = lista.find((opcao) => opcao.codigo === codigo);
  return item ? `${item.codigo} — ${item.descricao}` : codigo;
}

export const emiteNaV1 = (lista: CodigoFiscal[], codigo: string) =>
  lista.find((opcao) => opcao.codigo === codigo)?.emiteNaV1 ?? false;

export function formatarAliquota(valor: number | null) {
  return valor === null
    ? null
    : `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

/**
 * Mensagem de erro das rotas fiscais. A API responde 401 tanto sem sessão
 * quanto sem permissão; nos dois casos a mensagem da API é exibida.
 */
export function mensagemErroFiscal(erro: unknown, padrao: string) {
  const apiErro = erro as ApiError | undefined;
  if (apiErro?.statusCode === 401) {
    return (
      apiErro.mensagem ?? "Você não tem permissão para realizar esta ação."
    );
  }
  return apiErro?.mensagem ?? padrao;
}
