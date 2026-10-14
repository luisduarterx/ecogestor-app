import type {
  ConfiguracaoSistemaCampos,
  OrderResponse,
  TipoDocumentoEmpresa,
} from "../../utils/types";

/**
 * Modelo editável do cabeçalho e rodapé do cupom.
 * Quando estes dados estiverem disponíveis na API, substitua esta constante
 * pelo retorno da configuração da empresa, sem precisar alterar o layout.
 */
export type OrderReceiptTemplate = {
  companyName: string;
  legalName?: string;
  document?: string;
  address?: string;
  phone?: string;
  /** Rótulo do documento; o padrão é "CNPJ/CPF". */
  documentLabel?: string;
  logoUrl?: string;
  headerLines?: string[];
  /** Exibe o operador no cupom; o padrão é exibir. */
  showOperator?: boolean;
  footerLines: string[];
  paperWidthMm: number;
};

export const DEFAULT_ORDER_RECEIPT_TEMPLATE: OrderReceiptTemplate = {
  companyName: "EcoGestor",
  legalName: "Gestão de materiais recicláveis",
  footerLines: ["Documento sem valor fiscal", "Obrigado pela preferência!"],
  paperWidthMm: 80,
};

type ReceiptItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type OrderReceiptData = {
  id: number;
  type: "COMPRA" | "VENDA";
  status: OrderResponse["status"];
  issuedAt: string;
  finalizedAt?: string;
  partnerName: string;
  partnerDocument?: string;
  operatorName: string;
  items: ReceiptItem[];
  total: number;
};

/** Adaptador isolado: permite trocar ou ampliar a origem dos dados. */
export function orderToReceiptData(order: OrderResponse): OrderReceiptData {
  const registro = order.registro as OrderResponse["registro"] & {
    documento?: string;
    cpf?: string;
    cnpj?: string;
  };

  return {
    id: order.id,
    type: order.tipo,
    status: order.status,
    issuedAt: order.criado_em,
    finalizedAt: order.finalizado_em,
    partnerName:
      order.registro?.nome_razao || order.registro?.apelido || "Não informado",
    partnerDocument:
      registro?.documento || registro?.cpf || registro?.cnpj || undefined,
    operatorName: order.user?.nome || `Usuário #${order.userID}`,
    items: order.items.map((item) => ({
      id: item.id,
      description: item.material.nome,
      quantity: item.quantidade,
      unitPrice: item.preco,
      total: item.subtotal,
    })),
    total: order.valor_total,
  };
}

export const somenteDigitos = (valor: string) => valor.replace(/\D/g, "");

export function formatarDocumentoEmpresa(
  valor: string,
  tipo: TipoDocumentoEmpresa | "" | null,
): string {
  const digitos = somenteDigitos(valor);
  if (tipo === "CPF" || (!tipo && digitos.length <= 11)) {
    return digitos
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return digitos
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export const formatarCep = (valor: string) =>
  somenteDigitos(valor).replace(/^(\d{5})(\d{1,3})$/, "$1-$2");

const LARGURA_PAPEL_MM: Record<
  ConfiguracaoSistemaCampos["formatoImpressaoPadrao"],
  number
> = {
  CUPOM_80MM: 80,
  FOLHA_A4: 210,
};

const linhas = (texto: string | null) =>
  (texto ?? "")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean);

/**
 * Converte as configurações do sistema no modelo do cupom de pedidos.
 * Campos não preenchidos mantêm os valores padrão do modelo (EcoGestor).
 */
export function configuracaoParaModeloCupom(
  configuracao: ConfiguracaoSistemaCampos,
): OrderReceiptTemplate {
  const padrao = DEFAULT_ORDER_RECEIPT_TEMPLATE;
  const exibirEmpresa = configuracao.exibirDadosEmpresa;
  const rua = [configuracao.logradouro, configuracao.numero]
    .filter(Boolean)
    .join(", ");
  const cidade = [configuracao.cidade, configuracao.estado]
    .filter(Boolean)
    .join(" - ");
  const endereco = [
    rua,
    configuracao.complemento,
    configuracao.bairro,
    cidade,
    configuracao.cep ? `CEP ${formatarCep(configuracao.cep)}` : null,
  ]
    .filter(Boolean)
    .join(" - ");
  const rodape = linhas(configuracao.mensagemRodape);

  return {
    companyName: configuracao.nomeFantasia || padrao.companyName,
    legalName: exibirEmpresa
      ? configuracao.razaoSocial || padrao.legalName
      : undefined,
    document:
      exibirEmpresa && configuracao.documento
        ? formatarDocumentoEmpresa(
            configuracao.documento,
            configuracao.tipoDocumento,
          )
        : undefined,
    documentLabel: configuracao.tipoDocumento ?? undefined,
    address: exibirEmpresa && endereco ? endereco : undefined,
    phone: exibirEmpresa ? (configuracao.telefone ?? undefined) : undefined,
    logoUrl: exibirEmpresa
      ? (configuracao.logotipoUrl ?? undefined)
      : undefined,
    headerLines: linhas(configuracao.mensagemCabecalho),
    showOperator: configuracao.exibirOperador,
    footerLines: rodape.length > 0 ? rodape : padrao.footerLines,
    paperWidthMm: LARGURA_PAPEL_MM[configuracao.formatoImpressaoPadrao],
  };
}

export function getReceiptCss(paperWidthMm: number, forPrint = false) {
  return `
  ${forPrint ? '* { box-sizing: border-box; } html, body { margin: 0; padding: 0; background: white; color: black; } body { font-family: "Courier New", Courier, monospace; }' : ""}
  .receipt {
    box-sizing: border-box;
    width: ${paperWidthMm}mm;
    min-height: 110mm;
    padding: 4mm;
    overflow-wrap: anywhere;
    background: #fff;
    color: #000;
    font-family: "Courier New", Courier, monospace;
    font-size: 10px;
    line-height: 1.25;
  }
  .receipt-center { text-align: center; }
  .receipt-logo { display: block; max-width: 60%; max-height: 18mm; margin: 0 auto 4px; object-fit: contain; }
  .receipt-company { margin: 0 0 2px; font-size: 14px; text-transform: uppercase; }
  .receipt-title { margin: 5px 0; text-align: center; font-size: 12px; }
  .receipt-separator { margin: 6px 0; border-top: 1px dashed #000; }
  .receipt-row { display: flex; justify-content: space-between; gap: 8px; }
  .receipt-row span:last-child { flex-shrink: 0; }
  .receipt-strong { font-weight: 700; }
  .receipt-item { margin-top: 6px; page-break-inside: avoid; }
  .receipt-empty { padding: 8px 0; }
  .receipt-total { font-size: 13px; font-weight: 700; }
  .receipt-footer { margin-top: 8px; font-size: 9px; }
  .receipt-code { margin-top: 10px; font-weight: 700; letter-spacing: 2px; }
  ${forPrint ? `@page { size: ${paperWidthMm}mm auto; margin: 0; } .receipt { box-shadow: none; }` : ""}
`;
}
