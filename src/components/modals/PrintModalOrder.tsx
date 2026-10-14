import { motion } from "motion/react";
import { Printer, X } from "lucide-react";
import { useId } from "react";
import { useOrder } from "../../utils/queries";
import OrderReceipt from "../OrderReceipt";
import {
  DEFAULT_ORDER_RECEIPT_TEMPLATE,
  getReceiptCss,
  orderToReceiptData,
  type OrderReceiptTemplate,
} from "./orderReceiptModel";

interface PrintModalOrderProps {
  orderId: number;
  onClose: () => void;
  template?: OrderReceiptTemplate;
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
            <OrderReceipt
              data={data}
              template={template}
              receiptId={receiptId}
            />
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
