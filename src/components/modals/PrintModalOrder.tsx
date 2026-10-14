import { motion } from "motion/react";
import { Printer, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  useConfiguracoesSistema,
  useOrder,
  useRecord,
} from "../../utils/queries";
import { imprimirHtml } from "../../utils/impressao";
import type { ApiError, ConfiguracaoSistemaResponse } from "../../utils/types";
import { CupomAjustado } from "../OrderReceipt";
import {
  DEFAULT_ORDER_RECEIPT_TEMPLATE,
  MODELO_CUPOM_VAZIO,
  configuracaoParaModeloCupom,
  getReceiptCss,
  orderToReceiptData,
  type OrderReceiptTemplate,
} from "./orderReceiptModel";

interface PrintModalOrderProps {
  orderId: number;
  onClose: () => void;
  /** Dispara a impressão assim que o cupom estiver pronto. */
  imprimirAoAbrir?: boolean;
}

/**
 * Define o modelo do cupom a partir das configurações do sistema.
 * Retorna null enquanto não for possível decidir o modelo.
 */
function resolverModeloCupom(
  configuracao: ConfiguracaoSistemaResponse | null | undefined,
  erro: ApiError | null,
): OrderReceiptTemplate | null {
  // Sem permissão para ler as configurações, o cupom sai sem dados da empresa.
  if (erro?.statusCode === 403) return MODELO_CUPOM_VAZIO;
  if (erro || configuracao === undefined) return null;
  // Configuração ainda não cadastrada: mantém o modelo padrão do EcoGestor.
  if (configuracao === null) return DEFAULT_ORDER_RECEIPT_TEMPLATE;
  return configuracaoParaModeloCupom(configuracao);
}

export default function PrintModalOrder({
  orderId,
  onClose,
  imprimirAoAbrir = false,
}: PrintModalOrderProps) {
  const orderQuery = useOrder(orderId);
  const configuracaoQuery = useConfiguracoesSistema();
  const receiptId = `order-receipt-${useId().replaceAll(":", "")}`;
  const cadastroQuery = useRecord(orderQuery.data?.regID);
  // O cadastro completo complementa os dados do fornecedor/cliente; se não
  // puder ser lido, o cupom sai apenas com os dados presentes no pedido.
  const cadastroResolvido = !orderQuery.data?.regID || !cadastroQuery.isPending;
  const data =
    orderQuery.data && cadastroResolvido
      ? orderToReceiptData(orderQuery.data, cadastroQuery.data)
      : null;
  const template = resolverModeloCupom(
    configuracaoQuery.data,
    configuracaoQuery.error,
  );
  const erroConfiguracao =
    configuracaoQuery.isError && configuracaoQuery.error.statusCode !== 403;
  const [erroImpressao, setErroImpressao] = useState("");
  const impressaoAutomaticaFeita = useRef(false);
  const pronto = Boolean(data && template);

  async function printReceipt() {
    const receipt = document.getElementById(receiptId);
    if (!receipt || !data || !template) return;

    setErroImpressao("");
    try {
      await imprimirHtml(
        `Cupom do pedido ${data.id}`,
        getReceiptCss(template.paperWidthMm, true),
        receipt.outerHTML,
      );
    } catch {
      setErroImpressao("Não foi possível abrir a impressão do cupom.");
    }
  }

  useEffect(() => {
    if (!imprimirAoAbrir || !pronto || impressaoAutomaticaFeita.current) return;
    impressaoAutomaticaFeita.current = true;
    void printReceipt();
    // printReceipt depende apenas de dados já refletidos em "pronto".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imprimirAoAbrir, pronto]);

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
          {!pronto && !orderQuery.isError && !erroConfiguracao && (
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
          {!orderQuery.isError && erroConfiguracao && (
            <div className="my-auto rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-sm text-rose-300">
              Não foi possível carregar as configurações de impressão.
              <button
                type="button"
                onClick={() => configuracaoQuery.refetch()}
                className="mt-3 block w-full rounded-lg bg-rose-400 px-3 py-2 font-bold text-slate-950"
              >
                Tentar novamente
              </button>
            </div>
          )}
          {data && template && (
            <CupomAjustado
              data={data}
              template={template}
              receiptId={receiptId}
            />
          )}
        </div>

        <div className="space-y-2 border-t border-slate-800 bg-slate-950 p-4">
          {erroImpressao && (
            <p className="text-center text-xs text-rose-300" role="alert">
              {erroImpressao}
            </p>
          )}
          <button
            type="button"
            onClick={() => void printReceipt()}
            disabled={!pronto}
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
