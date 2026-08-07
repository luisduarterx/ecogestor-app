import { motion } from "motion/react";
import { Printer, X } from "lucide-react";
import { useId } from "react";
import { useOrder } from "../../utils/queries";
import {
  DEFAULT_ORDER_RECEIPT_TEMPLATE,
  orderToReceiptData,
  type OrderReceiptData,
  type OrderReceiptTemplate,
} from "./orderReceiptModel";

interface PrintModalOrderProps {
  orderId: number;
  onClose: () => void;
  template?: OrderReceiptTemplate;
}

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function Receipt({
  data,
  template,
  receiptId,
}: {
  data: OrderReceiptData;
  template: OrderReceiptTemplate;
  receiptId: string;
}) {
  const isPurchase = data.type === "COMPRA";

  return (
    <article
      id={receiptId}
      className="receipt bg-white p-4 font-mono text-[10px] leading-tight text-black shadow-sm"
      style={{ width: `${template.paperWidthMm}mm` }}
    >
      <header className="receipt-center">
        <h1 className="receipt-company">{template.companyName}</h1>
        {template.legalName && <div>{template.legalName}</div>}
        {template.document && <div>CNPJ/CPF: {template.document}</div>}
        {template.address && <div>{template.address}</div>}
        {template.phone && <div>Telefone: {template.phone}</div>}
      </header>

      <div className="receipt-separator" />
      <h2 className="receipt-title">
        {isPurchase ? "CUPOM DE COMPRA" : "CUPOM DE VENDA"}
      </h2>

      <section>
        <div>PEDIDO: #{data.id}</div>
        <div>EMISSÃO: {formatDate(data.issuedAt)}</div>
        {data.finalizedAt && (
          <div>FINALIZAÇÃO: {formatDate(data.finalizedAt)}</div>
        )}
        <div>STATUS: {data.status}</div>
        <div>
          {isPurchase ? "FORNECEDOR" : "CLIENTE"}: {data.partnerName}
        </div>
        {data.partnerDocument && <div>DOCUMENTO: {data.partnerDocument}</div>}
        <div>OPERADOR: {data.operatorName}</div>
      </section>

      <div className="receipt-separator" />
      <section>
        <div className="receipt-row receipt-strong">
          <span>DESCRIÇÃO</span>
          <span>TOTAL</span>
        </div>
        {data.items.length === 0 ? (
          <div className="receipt-center receipt-empty">
            Nenhum item lançado
          </div>
        ) : (
          data.items.map((item) => (
            <div className="receipt-item" key={item.id}>
              <div className="receipt-strong">
                {item.description.toUpperCase()}
              </div>
              <div className="receipt-row">
                <span>
                  {numberFormatter.format(item.quantity)} kg ×{" "}
                  {moneyFormatter.format(item.unitPrice)}
                </span>
                <span>{moneyFormatter.format(item.total)}</span>
              </div>
            </div>
          ))
        )}
      </section>

      <div className="receipt-separator" />
      <div className="receipt-row receipt-total">
        <span>TOTAL</span>
        <span>{moneyFormatter.format(data.total)}</span>
      </div>
      <div className="receipt-separator" />

      <footer className="receipt-center receipt-footer">
        {template.footerLines.map((line) => (
          <div key={line}>{line}</div>
        ))}
        <div className="receipt-code">
          PED-{String(data.id).padStart(8, "0")}
        </div>
      </footer>
    </article>
  );
}

function getReceiptCss(paperWidthMm: number, forPrint = false) {
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

export default function PrintModalOrder({
  orderId,
  onClose,
  template = DEFAULT_ORDER_RECEIPT_TEMPLATE,
}: PrintModalOrderProps) {
  const orderQuery = useOrder(orderId);
  const receiptId = `order-receipt-${useId().replaceAll(":", "")}`;
  const data = orderQuery.data ? orderToReceiptData(orderQuery.data) : null;

  function printReceipt() {
    const receipt = document.getElementById(receiptId);
    if (!receipt || !data) return;

    const printWindow = window.open("", "_blank", "width=420,height=720");
    if (!printWindow) {
      window.alert("Permita pop-ups para imprimir o cupom.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Cupom do pedido ${data.id}</title><style>${getReceiptCss(template.paperWidthMm, true)}</style></head><body>${receipt.outerHTML}</body></html>`,
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 150);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/30 px-5 py-3.5">
          <span
            id="receipt-modal-title"
            className="flex items-center gap-2 text-xs font-bold text-slate-300"
          >
            <Printer className="h-4 w-4 text-emerald-400" />
            Cupom do pedido #{orderId}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar cupom"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 justify-center overflow-y-auto bg-slate-950 p-4">
          <style>{getReceiptCss(template.paperWidthMm)}</style>
          {orderQuery.isPending && (
            <div className="py-16 text-sm text-slate-400">
              Carregando dados do pedido...
            </div>
          )}
          {orderQuery.isError && (
            <div className="my-auto rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-sm text-rose-300">
              Não foi possível carregar o pedido.
              <button
                type="button"
                onClick={() => orderQuery.refetch()}
                className="mt-3 block w-full rounded-lg bg-rose-400 px-3 py-2 font-bold text-slate-950"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {data && (
            <Receipt data={data} template={template} receiptId={receiptId} />
          )}
        </div>

        <div className="border-t border-slate-800 bg-slate-950 p-4">
          <button
            type="button"
            onClick={printReceipt}
            disabled={!data}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold uppercase text-slate-950 transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Imprimir cupom
          </button>
        </div>
      </motion.div>
    </div>
  );
}
