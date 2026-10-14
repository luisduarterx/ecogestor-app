import { motion } from "motion/react";
import {
  AlertCircle,
  ClipboardList,
  Info,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  formatarDataHoraFiscal,
  formatarMoedaFiscal,
  mensagemErroFiscal,
} from "../../utils/fiscal";
import {
  useImportarPedidoNotaFiscal,
  useNaturezasOperacao,
  useOrders,
} from "../../utils/queries";
import type { NotaFiscal } from "../../utils/types";

interface ImportarPedidoModalProps {
  onClose: () => void;
  onImportada: (nota: NotaFiscal) => void;
}

const CLASSE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none";

/** Cria um rascunho de nota a partir de um pedido de venda fechado. */
export default function ImportarPedidoModal({
  onClose,
  onImportada,
}: ImportarPedidoModalProps) {
  const pedidosQuery = useOrders({ tipo: "VENDA", status: "FECHADO" });
  const naturezasQuery = useNaturezasOperacao(true);
  const importar = useImportarPedidoNotaFiscal();
  const [busca, setBusca] = useState("");
  const [naturezaID, setNaturezaID] = useState("");
  const [erro, setErro] = useState("");

  const pedidos = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return (pedidosQuery.data ?? []).filter(
      (pedido) =>
        !termo ||
        String(pedido.id).includes(termo) ||
        [pedido.registro?.nome_razao, pedido.registro?.apelido]
          .filter(Boolean)
          .some((nome) =>
            String(nome).toLocaleLowerCase("pt-BR").includes(termo),
          ),
    );
  }, [busca, pedidosQuery.data]);

  async function escolher(pedidoID: number) {
    setErro("");
    try {
      const nota = await importar.mutateAsync({
        pedidoID,
        naturezaOperacaoID: naturezaID ? Number(naturezaID) : undefined,
      });
      onImportada(nota);
    } catch (caught) {
      setErro(
        mensagemErroFiscal(caught, "Não foi possível importar o pedido."),
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="importar-pedido-titulo"
      onMouseDown={(evento) =>
        evento.target === evento.currentTarget &&
        !importar.isPending &&
        onClose()
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-400" />
            <h3
              id="importar-pedido-titulo"
              className="font-bold text-slate-100"
            >
              Importar pedido de venda
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={importar.isPending}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <p className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-xs text-slate-300">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
            Os itens e o cliente do pedido são copiados para um novo rascunho. O
            pedido não é alterado e pode ser importado de novo, gerando outra
            nota.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-[10px] font-bold uppercase text-slate-400">
              Buscar pedido
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 mt-[3px] h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Número ou cliente"
                  className={`${CLASSE_CAMPO} pl-8`}
                />
              </div>
            </label>
            <label className="block text-[10px] font-bold uppercase text-slate-400">
              Natureza de operação
              <select
                value={naturezaID}
                onChange={(evento) => setNaturezaID(evento.target.value)}
                className={`${CLASSE_CAMPO} cursor-pointer`}
              >
                <option value="">Natureza padrão</option>
                {(naturezasQuery.data ?? []).map((natureza) => (
                  <option key={natureza.id} value={natureza.id}>
                    {natureza.descricao}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {erro && (
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {erro}
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-800">
            {pedidosQuery.isPending ? (
              <div className="flex items-center justify-center gap-2 p-8 text-xs text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                Carregando pedidos de venda...
              </div>
            ) : pedidosQuery.isError ? (
              <div className="p-6 text-center text-xs text-rose-300">
                Não foi possível carregar os pedidos.
                <button
                  type="button"
                  onClick={() => void pedidosQuery.refetch()}
                  className="mt-3 block w-full rounded-lg bg-rose-400 px-3 py-2 font-bold text-slate-950"
                >
                  Tentar novamente
                </button>
              </div>
            ) : pedidos.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Nenhum pedido de venda fechado encontrado.
              </div>
            ) : (
              <ul className="max-h-80 divide-y divide-slate-800/60 overflow-y-auto">
                {pedidos.map((pedido) => (
                  <li
                    key={pedido.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-xs hover:bg-slate-800/30"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-100">
                        Pedido #{pedido.id} ·{" "}
                        {pedido.registro?.nome_razao ??
                          pedido.registro?.apelido ??
                          "Sem cliente"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatarDataHoraFiscal(
                          pedido.finalizado_em ?? pedido.criado_em,
                        )}{" "}
                        · {pedido._count.items}{" "}
                        {pedido._count.items === 1 ? "item" : "itens"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-mono font-bold text-slate-100">
                        {formatarMoedaFiscal(pedido.valor_total)}
                      </span>
                      <button
                        type="button"
                        disabled={importar.isPending}
                        onClick={() => void escolher(pedido.id)}
                        className="rounded-lg bg-emerald-400 px-3 py-1.5 text-[11px] font-bold uppercase text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
                      >
                        {importar.isPending &&
                        importar.variables?.pedidoID === pedido.id
                          ? "Importando..."
                          : "Importar"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
