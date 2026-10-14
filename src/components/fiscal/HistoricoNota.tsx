import { ChevronDown, History, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  ROTULOS_ORIGEM_EVENTO,
  ROTULOS_STATUS_NOTA,
  ROTULOS_TIPO_EVENTO,
  formatarDataHoraFiscal,
  mensagemErroFiscal,
} from "../../utils/fiscal";
import { useEventosNotaFiscal } from "../../utils/queries";
import type { EventoNotaFiscal } from "../../utils/types";

const CORES_EVENTO: Record<EventoNotaFiscal["tipo"], string> = {
  EMISSAO_SOLICITADA: "bg-sky-400",
  FALHA_COMUNICACAO: "bg-amber-400",
  STATUS_ATUALIZADO: "bg-emerald-400",
  CANCELAMENTO_SOLICITADO: "bg-rose-400",
  CANCELAMENTO_RECUSADO: "bg-orange-400",
  CARTA_CORRECAO_REGISTRADA: "bg-violet-400",
  CARTA_CORRECAO_RECUSADA: "bg-orange-400",
};

/** Linha do tempo dos eventos da nota, carregada ao abrir. */
export default function HistoricoNota({ notaID }: { notaID: number }) {
  const [aberto, setAberto] = useState(false);
  const eventosQuery = useEventosNotaFiscal(notaID, aberto);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between gap-2 p-5 text-sm font-semibold text-slate-100"
      >
        <span className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          Histórico da nota
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <div className="border-t border-slate-800 p-5 text-xs">
          {eventosQuery.isPending ? (
            <p className="flex items-center gap-2 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              Carregando histórico...
            </p>
          ) : eventosQuery.isError ? (
            <div className="flex flex-wrap items-center justify-between gap-2 text-rose-300">
              {mensagemErroFiscal(
                eventosQuery.error,
                "Não foi possível carregar o histórico.",
              )}
              <button
                type="button"
                onClick={() => void eventosQuery.refetch()}
                className="rounded-lg bg-rose-400 px-3 py-1.5 font-bold uppercase text-slate-950"
              >
                Tentar novamente
              </button>
            </div>
          ) : eventosQuery.data.length === 0 ? (
            <p className="text-slate-500">Nenhum evento registrado.</p>
          ) : (
            <ol className="space-y-4 border-l border-slate-800 pl-5">
              {eventosQuery.data.map((evento) => (
                <ItemHistorico key={evento.id} evento={evento} />
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

function ItemHistorico({ evento }: { evento: EventoNotaFiscal }) {
  const mudancaStatus =
    evento.tipo === "STATUS_ATUALIZADO" &&
    evento.statusAnterior &&
    evento.statusNovo
      ? `: ${ROTULOS_STATUS_NOTA[evento.statusAnterior]} → ${ROTULOS_STATUS_NOTA[evento.statusNovo]}`
      : "";
  const possuiDetalhes =
    evento.respostaFocus !== null && evento.respostaFocus !== undefined;

  return (
    <li className="relative">
      <span
        className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-slate-900 ${CORES_EVENTO[evento.tipo]}`}
        aria-hidden="true"
      />
      <p className="font-semibold text-slate-100">
        {ROTULOS_TIPO_EVENTO[evento.tipo]}
        {mudancaStatus}
      </p>
      <p className="text-[11px] text-slate-500">
        {formatarDataHoraFiscal(evento.criadoEm)} ·{" "}
        {ROTULOS_ORIGEM_EVENTO[evento.origem]}
        {evento.usuario ? ` · ${evento.usuario.nome}` : ""}
      </p>
      {evento.mensagem && (
        <p className="mt-1 text-slate-300">{evento.mensagem}</p>
      )}
      {possuiDetalhes && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[11px] text-slate-500 hover:text-slate-300">
            Ver detalhes técnicos
          </summary>
          <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-slate-950/60 p-3 font-mono text-[10px] text-slate-400">
            {JSON.stringify(evento.respostaFocus, null, 2)}
          </pre>
        </details>
      )}
    </li>
  );
}
