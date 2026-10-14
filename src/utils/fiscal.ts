import type {
  ApiError,
  DadosFiscaisMaterial,
  IndicadorIE,
  ModalidadeFrete,
  OrigemMercadoria,
  StatusNotaFiscal,
  RegimeTributario,
} from "./types";

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

export const ROTULOS_ORIGEM_MERCADORIA: Record<OrigemMercadoria, string> = {
  NACIONAL: "0 — Nacional",
  ESTRANGEIRA_IMPORTACAO_DIRETA: "1 — Estrangeira, importação direta",
  ESTRANGEIRA_MERCADO_INTERNO: "2 — Estrangeira, adquirida no mercado interno",
  NACIONAL_IMPORTADO_40_70:
    "3 — Nacional, conteúdo de importação entre 40% e 70%",
  NACIONAL_PROCESSO_BASICO:
    "4 — Nacional, produção conforme processo produtivo básico",
  NACIONAL_IMPORTADO_ATE_40: "5 — Nacional, conteúdo de importação até 40%",
  ESTRANGEIRA_DIRETA_SEM_SIMILAR:
    "6 — Estrangeira, importação direta, sem similar nacional",
  ESTRANGEIRA_INTERNO_SEM_SIMILAR:
    "7 — Estrangeira, mercado interno, sem similar nacional",
  NACIONAL_IMPORTADO_ACIMA_70:
    "8 — Nacional, conteúdo de importação acima de 70%",
};

export const ORIGENS_MERCADORIA = Object.keys(
  ROTULOS_ORIGEM_MERCADORIA,
) as OrigemMercadoria[];

export const ROTULOS_INDICADOR_IE: Record<IndicadorIE, string> = {
  CONTRIBUINTE: "Contribuinte do ICMS (tem IE)",
  ISENTO: "Contribuinte isento de inscrição",
  NAO_CONTRIBUINTE: "Não contribuinte (consumidor final)",
};

export const INDICADORES_IE = Object.keys(
  ROTULOS_INDICADOR_IE,
) as IndicadorIE[];

export const somenteDigitos = (valor: string) => valor.replace(/\D/g, "");

/** NCM: 8 dígitos exibidos como 0000.00.00. */
export const formatarNcm = (valor: string) =>
  somenteDigitos(valor)
    .slice(0, 8)
    .replace(/^(\d{4})(\d)/, "$1.$2")
    .replace(/^(\d{4})\.(\d{2})(\d)/, "$1.$2.$3");

/** CEST: 7 dígitos exibidos como 00.000.00. */
export const formatarCest = (valor: string) =>
  somenteDigitos(valor)
    .slice(0, 7)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");

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

/** Valida os dados fiscais do material; vazios são aceitos no cadastro. */
export function validarDadosFiscaisMaterial(dados: DadosFiscaisMaterial) {
  if (dados.ncm && dados.ncm.length !== 8) return "O NCM deve ter 8 dígitos.";
  if (dados.cest && dados.cest.length !== 7)
    return "O CEST deve ter 7 dígitos.";
  return null;
}

export const ROTULOS_STATUS_NOTA: Record<StatusNotaFiscal, string> = {
  RASCUNHO: "Rascunho",
  PROCESSANDO: "Processando",
  AUTORIZADA: "Autorizada",
  REJEITADA: "Rejeitada",
  DENEGADA: "Denegada",
  CANCELADA: "Cancelada",
};

export const STATUS_NOTA = Object.keys(
  ROTULOS_STATUS_NOTA,
) as StatusNotaFiscal[];

/** Classes do selo de status, nas cores sugeridas pelo guia da API. */
export const CLASSES_STATUS_NOTA: Record<StatusNotaFiscal, string> = {
  RASCUNHO: "border-slate-600 bg-slate-800 text-slate-300",
  PROCESSANDO: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  AUTORIZADA: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  REJEITADA: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  DENEGADA: "border-rose-500/30 bg-rose-500/10 text-rose-400",
  CANCELADA: "border-rose-900/60 bg-rose-950/40 text-rose-300 line-through",
};

/** A nota só pode ser editada nesses status. */
export const notaEditavel = (status: StatusNotaFiscal) =>
  status === "RASCUNHO" || status === "REJEITADA";

export const ROTULOS_MODALIDADE_FRETE: Record<ModalidadeFrete, string> = {
  EMITENTE: "Por conta do emitente (CIF)",
  DESTINATARIO: "Por conta do destinatário (FOB)",
  TERCEIROS: "Por conta de terceiros",
  PROPRIO_EMITENTE: "Transporte próprio do emitente",
  PROPRIO_DESTINATARIO: "Transporte próprio do destinatário",
  SEM_FRETE: "Sem frete",
};

export const MODALIDADES_FRETE = Object.keys(
  ROTULOS_MODALIDADE_FRETE,
) as ModalidadeFrete[];

export const UFS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

/** Formata CPF (11 dígitos) ou CNPJ (14 dígitos). */
export function formatarCpfCnpj(valor: string | null) {
  const digitos = somenteDigitos(valor ?? "");
  if (digitos.length === 11)
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digitos.length === 14)
    return digitos.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  return valor ?? "";
}

export const formatarMoedaFiscal = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const formatarDataHoraFiscal = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(valor))
    : "—";
