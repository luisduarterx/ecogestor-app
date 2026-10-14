import type {
  CelulaRelatorio,
  ColunaRelatorio,
  FormatoRelatorio,
  Relatorio,
} from "./tipos";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatadorDecimal = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Planilhas leem melhor números sem separador de milhar.
const formatadorPlanilha = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

const formatadorData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export const formatarMoeda = (valor: number) => formatadorMoeda.format(valor);
export const formatarPeso = (valor: number) =>
  `${formatadorDecimal.format(valor)} kg`;
export const formatarQuantidade = (valor: number) =>
  valor.toLocaleString("pt-BR");

export function formatarDataHora(valor: string | Date) {
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime())
    ? String(valor)
    : formatadorData.format(data);
}

/** Formata uma data "AAAA-MM-DD" sem conversão de fuso horário. */
export function formatarDataISO(valor: string) {
  const [ano, mes, dia] = valor.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

export function formatarCelula(
  valor: CelulaRelatorio,
  coluna: ColunaRelatorio,
  formato: FormatoRelatorio,
): string {
  if (valor === null || valor === "") return "";
  if (coluna.tipo === "data") return formatarDataHora(String(valor));
  if (typeof valor !== "number") return valor;
  if (coluna.tipo === "codigo") return String(valor);
  if (formato === "csv") return formatadorPlanilha.format(valor);
  return coluna.tipo === "moeda"
    ? formatadorMoeda.format(valor)
    : formatadorDecimal.format(valor);
}

/** Soma das colunas marcadas para totalização; null nas demais. */
export function calcularTotais(relatorio: Relatorio): (number | null)[] | null {
  if (!relatorio.colunas.some((coluna) => coluna.totalizar)) return null;
  return relatorio.colunas.map((coluna, indice) =>
    coluna.totalizar
      ? relatorio.linhas.reduce(
          (total, linha) =>
            total + (typeof linha[indice] === "number" ? linha[indice] : 0),
          0,
        )
      : null,
  );
}

export function nomeArquivoRelatorio(titulo: string, emitidoEm: Date) {
  const data = new Intl.DateTimeFormat("en-CA").format(emitidoEm);
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${base}-${data}`;
}

export function baixarArquivo(conteudo: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(conteudo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
