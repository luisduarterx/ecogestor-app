import { UFS, somenteDigitos } from "../../utils/fiscal";
import type {
  AtualizarNotaFiscalInput,
  DestinatarioNota,
  IndicadorIE,
  ItemNotaFiscal,
  ItemNotaFiscalInput,
  ModalidadeFrete,
  NotaFiscal,
  TransportadoraNota,
  TributacaoItemNota,
  VeiculoNota,
} from "../../utils/types";

export const LIMITE_TEXTO = 60;
export const LIMITE_INFORMACOES = 5000;
export const LIMITE_ITENS = 990;

type Textos<T> = Record<keyof T, string>;

export type FormularioCabecalho = {
  destinatario: Textos<DestinatarioNota>;
  consumidorFinal: boolean;
  modalidadeFrete: ModalidadeFrete;
  transportadora: Textos<TransportadoraNota>;
  veiculo: Textos<VeiculoNota>;
  informacoesComplementares: string;
};

export type LinhaItem = {
  chave: string;
  materialID: string;
  quantidade: string;
  valorUnitario: string;
  tributacao: Textos<TributacaoItemNota>;
  /** Item já salvo, para exibir NCM, descrição e valor calculado pela API. */
  original?: ItemNotaFiscal;
};

const CAMPOS_TRIBUTACAO: (keyof TributacaoItemNota)[] = [
  "cfop",
  "icmsSituacaoTributaria",
  "icmsAliquota",
  "pisSituacaoTributaria",
  "pisAliquota",
  "cofinsSituacaoTributaria",
  "cofinsAliquota",
];

const CAMPOS_ALIQUOTA = new Set<keyof TributacaoItemNota>([
  "icmsAliquota",
  "pisAliquota",
  "cofinsAliquota",
]);

const paraTexto = (valor: string | number | null | undefined) =>
  valor === null || valor === undefined ? "" : String(valor);

const decimalTexto = (valor: number) => String(valor).replace(".", ",");

function textos<T extends object>(objeto: T): Textos<T> {
  return Object.fromEntries(
    Object.entries(objeto).map(([campo, valor]) => [
      campo,
      paraTexto(valor as string | number | null),
    ]),
  ) as Textos<T>;
}

export function cabecalhoDaNota(nota: NotaFiscal): FormularioCabecalho {
  return {
    destinatario: textos(nota.destinatario),
    consumidorFinal: nota.consumidorFinal,
    modalidadeFrete: nota.modalidadeFrete,
    transportadora: textos(nota.transportadora),
    veiculo: textos(nota.veiculo),
    informacoesComplementares: nota.informacoesComplementares ?? "",
  };
}

let sequencia = 0;
export const novaChave = () => `nova-${++sequencia}`;

export function linhasDaNota(nota: NotaFiscal): LinhaItem[] {
  return nota.itens.map((item) => ({
    chave: `item-${item.id}`,
    materialID: String(item.materialID),
    quantidade: decimalTexto(item.quantidade),
    valorUnitario: decimalTexto(item.valorUnitario),
    tributacao: Object.fromEntries(
      CAMPOS_TRIBUTACAO.map((campo) => [
        campo,
        typeof item[campo] === "number"
          ? decimalTexto(item[campo] as number)
          : paraTexto(item[campo]),
      ]),
    ) as Textos<TributacaoItemNota>,
    original: item,
  }));
}

export function linhaVazia(): LinhaItem {
  return {
    chave: novaChave(),
    materialID: "",
    quantidade: "",
    valorUnitario: "",
    tributacao: Object.fromEntries(
      CAMPOS_TRIBUTACAO.map((campo) => [campo, ""]),
    ) as Textos<TributacaoItemNota>,
  };
}

/**
 * Converte "12,5", "1.250,5" ou "12.5" em número. Com vírgula, o ponto é
 * separador de milhar; sem vírgula, o ponto é decimal. Retorna null se inválido.
 */
export function lerDecimal(texto: string): number | null {
  const bruto = texto.trim();
  const limpo = bruto.includes(",")
    ? bruto.replace(/\./g, "").replace(",", ".")
    : bruto;
  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  return Number(limpo);
}

const normalizarPlaca = (placa: string) =>
  placa.replace(/[\s-]/g, "").toUpperCase();

/** Valor normalizado de um campo de texto do cabeçalho ("" vira null). */
function normalizarCampo(campo: string, valor: string): string | null {
  const limpo = valor.trim();
  if (!limpo) return null;
  if (campo === "documento" || campo === "cep") return somenteDigitos(limpo);
  if (campo === "uf") return limpo.toUpperCase();
  if (campo === "placa") return normalizarPlaca(limpo);
  return limpo;
}

function diferencas<T extends object>(
  formulario: Textos<T>,
  original: T,
): Partial<T> {
  const alteracoes: Record<string, string | null> = {};
  Object.entries(formulario).forEach(([campo, valor]) => {
    const novo = normalizarCampo(campo, valor as string);
    const anterior = (original as Record<string, unknown>)[campo] ?? null;
    if (novo !== anterior) alteracoes[campo] = novo;
  });
  return alteracoes as Partial<T>;
}

/**
 * Campos do cabeçalho que mudaram em relação à nota salva.
 * `ignorar` exclui blocos que serão substituídos pela própria ação
 * (por exemplo, o destinatário ao escolher um Registro).
 */
export function alteracoesCabecalho(
  formulario: FormularioCabecalho,
  nota: NotaFiscal,
  ignorar: ("destinatario" | "transportadora")[] = [],
): AtualizarNotaFiscalInput {
  const alteracoes: AtualizarNotaFiscalInput = {};
  if (!ignorar.includes("destinatario")) {
    const destinatario = diferencas(formulario.destinatario, nota.destinatario);
    if (Object.keys(destinatario).length > 0)
      alteracoes.destinatario = destinatario;
    if (formulario.consumidorFinal !== nota.consumidorFinal)
      alteracoes.consumidorFinal = formulario.consumidorFinal;
  }
  if (formulario.modalidadeFrete !== nota.modalidadeFrete)
    alteracoes.modalidadeFrete = formulario.modalidadeFrete;
  if (!ignorar.includes("transportadora")) {
    const transportadora = diferencas(
      formulario.transportadora,
      nota.transportadora,
    );
    if (Object.keys(transportadora).length > 0)
      alteracoes.transportadora = transportadora;
  }
  const veiculo = diferencas(formulario.veiculo, nota.veiculo);
  if (Object.keys(veiculo).length > 0) alteracoes.veiculo = veiculo;
  const informacoes = formulario.informacoesComplementares.trim() || null;
  if (informacoes !== nota.informacoesComplementares)
    alteracoes.informacoesComplementares = informacoes;
  return alteracoes;
}

/** Itens no formato do PUT. A tributação vazia é omitida (vale a da natureza). */
export function itensParaEnvio(linhas: LinhaItem[]): ItemNotaFiscalInput[] {
  return linhas.map((linha) => {
    const item: ItemNotaFiscalInput = {
      materialID: Number(linha.materialID),
      quantidade: lerDecimal(linha.quantidade) ?? 0,
      valorUnitario: lerDecimal(linha.valorUnitario) ?? 0,
    };
    CAMPOS_TRIBUTACAO.forEach((campo) => {
      const valor = linha.tributacao[campo].trim();
      if (!valor) return;
      if (CAMPOS_ALIQUOTA.has(campo)) {
        (item as Record<string, unknown>)[campo] = lerDecimal(valor);
      } else {
        (item as Record<string, unknown>)[campo] = valor;
      }
    });
    return item;
  });
}

export function itensAlterados(linhas: LinhaItem[], nota: NotaFiscal) {
  return (
    JSON.stringify(itensParaEnvio(linhas)) !==
    JSON.stringify(itensParaEnvio(linhasDaNota(nota)))
  );
}

export type ErrosFormulario = {
  cabecalho: string[];
  /** Mensagens por chave de linha. */
  itens: Record<string, string>;
};

const PLACA = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

function validarTexto(
  erros: string[],
  rotulo: string,
  valor: string,
  limite = LIMITE_TEXTO,
) {
  if (valor.trim().length > limite)
    erros.push(`${rotulo}: use no máximo ${limite} caracteres.`);
}

function validarDocumento(
  erros: string[],
  rotulo: string,
  valor: string,
  tipo?: string,
) {
  const digitos = somenteDigitos(valor);
  if (!digitos) return;
  if (tipo === "FISICA" && digitos.length !== 11)
    erros.push(`${rotulo}: o CPF deve ter 11 dígitos.`);
  else if (tipo === "JURIDICA" && digitos.length !== 14)
    erros.push(`${rotulo}: o CNPJ deve ter 14 dígitos.`);
  else if (digitos.length !== 11 && digitos.length !== 14)
    erros.push(`${rotulo}: informe um CPF (11) ou CNPJ (14 dígitos).`);
}

function validarUf(erros: string[], rotulo: string, valor: string) {
  if (valor.trim() && !UFS.includes(valor.trim().toUpperCase()))
    erros.push(`${rotulo}: UF inválida.`);
}

export function validarFormulario(
  formulario: FormularioCabecalho,
  linhas: LinhaItem[],
): ErrosFormulario {
  const cabecalho: string[] = [];
  const itens: Record<string, string> = {};
  const { destinatario, transportadora, veiculo } = formulario;

  validarTexto(cabecalho, "Nome do destinatário", destinatario.nome);
  validarDocumento(
    cabecalho,
    "Documento do destinatário",
    destinatario.documento,
    destinatario.tipo,
  );
  (
    ["logradouro", "numero", "complemento", "bairro", "municipio"] as const
  ).forEach((campo) =>
    validarTexto(cabecalho, `Destinatário (${campo})`, destinatario[campo]),
  );
  validarUf(cabecalho, "UF do destinatário", destinatario.uf);
  const cep = somenteDigitos(destinatario.cep);
  if (cep && cep.length !== 8)
    cabecalho.push("CEP do destinatário: informe 8 dígitos.");
  if (
    destinatario.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario.email.trim())
  )
    cabecalho.push("E-mail do destinatário inválido.");

  if (formulario.modalidadeFrete !== "SEM_FRETE") {
    validarTexto(cabecalho, "Nome da transportadora", transportadora.nome);
    validarDocumento(
      cabecalho,
      "Documento da transportadora",
      transportadora.documento,
    );
    validarTexto(
      cabecalho,
      "Endereço da transportadora",
      transportadora.endereco,
    );
    validarTexto(
      cabecalho,
      "Município da transportadora",
      transportadora.municipio,
    );
    validarUf(cabecalho, "UF da transportadora", transportadora.uf);
    const placa = normalizarPlaca(veiculo.placa);
    if (placa && !PLACA.test(placa))
      cabecalho.push("Placa do veículo: use ABC1234 ou ABC1D23.");
    if (placa && !veiculo.uf.trim()) cabecalho.push("Informe a UF do veículo.");
    validarUf(cabecalho, "UF do veículo", veiculo.uf);
  }

  if (formulario.informacoesComplementares.length > LIMITE_INFORMACOES)
    cabecalho.push(
      `Informações complementares: use no máximo ${LIMITE_INFORMACOES} caracteres.`,
    );

  if (linhas.length > LIMITE_ITENS)
    cabecalho.push(`A nota pode ter no máximo ${LIMITE_ITENS} itens.`);

  linhas.forEach((linha) => {
    const problemas: string[] = [];
    if (!linha.materialID) problemas.push("escolha o material");
    const quantidade = lerDecimal(linha.quantidade);
    if (quantidade === null || quantidade <= 0)
      problemas.push("quantidade positiva com até 2 casas");
    const valor = lerDecimal(linha.valorUnitario);
    if (valor === null || valor <= 0)
      problemas.push("valor unitário positivo com até 2 casas");
    const cfop = linha.tributacao.cfop.trim();
    if (cfop && !/^[56]\d{3}$/.test(cfop))
      problemas.push("CFOP com 4 dígitos iniciado em 5 ou 6");
    (["icmsAliquota", "pisAliquota", "cofinsAliquota"] as const).forEach(
      (campo) => {
        const texto = linha.tributacao[campo].trim();
        if (!texto) return;
        const aliquota = lerDecimal(texto);
        if (aliquota === null || aliquota > 100)
          problemas.push("alíquotas de 0 a 100");
      },
    );
    if (problemas.length > 0)
      itens[linha.chave] = `Corrija: ${[...new Set(problemas)].join(", ")}.`;
  });

  return { cabecalho, itens };
}

export const possuiErros = (erros: ErrosFormulario) =>
  erros.cabecalho.length > 0 || Object.keys(erros.itens).length > 0;

/** Indicador efetivo: o não contribuinte trava o consumidor final. */
export const consumidorFinalTravado = (indicador: string) =>
  (indicador as IndicadorIE) === "NAO_CONTRIBUINTE";
