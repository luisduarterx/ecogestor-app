import type { OrderResponse } from "../../utils/types";

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
