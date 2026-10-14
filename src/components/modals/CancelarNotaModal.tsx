import { motion } from "motion/react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  formatarDataHoraFiscal,
  formatarNumeroNota,
  mensagemErroFiscal,
} from "../../utils/fiscal";
import { useCancelarNotaFiscal } from "../../utils/queries";
import type { ApiError, NotaFiscal } from "../../utils/types";

interface CancelarNotaModalProps {
  nota: NotaFiscal;
  onClose: () => void;
  onCancelada: () => void;
  onRecarregar: () => void;
}

const JUSTIFICATIVA_MINIMA = 15;
const JUSTIFICATIVA_MAXIMA = 255;
const PRAZO_CANCELAMENTO_HORAS = 24;

/** Cancelamento de nota autorizada, com justificativa e aviso de prazo. */
export default function CancelarNotaModal({
  nota,
  onClose,
  onCancelada,
  onRecarregar,
}: CancelarNotaModalProps) {
  const cancelar = useCancelarNotaFiscal(nota.id);
  const [justificativa, setJustificativa] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState("");
  const [horasDesdeAutorizacao] = useState(() =>
    nota.emissao.autorizadaEm
      ? (Date.now() - new Date(nota.emissao.autorizadaEm).getTime()) / 3_600_000
      : 0,
  );

  const texto = justificativa.trim();
  const tamanhoValido =
    texto.length >= JUSTIFICATIVA_MINIMA &&
    texto.length <= JUSTIFICATIVA_MAXIMA;
  const foraDoPrazo = horasDesdeAutorizacao > PRAZO_CANCELAMENTO_HORAS;

  async function confirmar() {
    setErro("");
    try {
      await cancelar.mutateAsync(texto);
      onCancelada();
    } catch (caught) {
      const apiErro = caught as ApiError;
      setConfirmando(false);
      if (apiErro.statusCode === 409) onRecarregar();
      setErro(
        apiErro.statusCode >= 500
          ? "Não foi possível confirmar o cancelamento. Feche esta janela e use “Atualizar situação” para conferir se a nota foi cancelada."
          : mensagemErroFiscal(apiErro, "Não foi possível cancelar a nota."),
      );
      if (apiErro.statusCode >= 500) onRecarregar();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancelar-nota-titulo"
      onMouseDown={(evento) =>
        evento.target === evento.currentTarget &&
        !cancelar.isPending &&
        onClose()
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-rose-400" />
            <h3 id="cancelar-nota-titulo" className="font-bold text-slate-100">
              Cancelar NF-e nº{" "}
              {nota.emissao.numero !== null
                ? formatarNumeroNota(nota.emissao.numero)
                : nota.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={cancelar.isPending}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6 text-xs">
          {foraDoPrazo ? (
            <p className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 font-semibold text-rose-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Autorizada em {formatarDataHoraFiscal(nota.emissao.autorizadaEm)}.
              O prazo legal de cancelamento pode ter expirado. A SEFAZ pode
              recusar; nesse caso, procure seu contador.
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 text-slate-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />O
              cancelamento é permitido em até 24 horas após a autorização
              (autorizada em {formatarDataHoraFiscal(nota.emissao.autorizadaEm)}
              ).
            </p>
          )}

          <label className="block text-[10px] font-bold uppercase text-slate-400">
            <span className="flex justify-between">
              Justificativa
              <span
                className={`font-mono normal-case ${
                  texto.length > 0 && !tamanhoValido
                    ? "text-rose-400"
                    : "text-slate-500"
                }`}
              >
                {texto.length}/{JUSTIFICATIVA_MAXIMA}
              </span>
            </span>
            <textarea
              rows={4}
              maxLength={JUSTIFICATIVA_MAXIMA}
              value={justificativa}
              disabled={cancelar.isPending}
              onChange={(evento) => {
                setJustificativa(evento.target.value);
                setConfirmando(false);
                setErro("");
              }}
              placeholder="Explique o motivo do cancelamento"
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs normal-case text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <span className="mt-1 block font-normal normal-case text-slate-500">
              Entre {JUSTIFICATIVA_MINIMA} e {JUSTIFICATIVA_MAXIMA} caracteres.
              O texto é enviado à SEFAZ.
            </span>
          </label>

          {erro && (
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-300"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {erro}
            </div>
          )}

          {confirmando && (
            <p
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 font-semibold text-rose-300"
              role="alert"
            >
              Esta ação não pode ser desfeita. Confirme para cancelar a nota na
              SEFAZ.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 px-6 py-4">
          <button
            type="button"
            onClick={confirmando ? () => setConfirmando(false) : onClose}
            disabled={cancelar.isPending}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 disabled:opacity-50"
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={!tamanhoValido || cancelar.isPending}
            onClick={() =>
              confirmando ? void confirmar() : setConfirmando(true)
            }
            className="flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold uppercase text-white hover:bg-rose-400 disabled:opacity-50"
          >
            {cancelar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {cancelar.isPending
              ? "Cancelando..."
              : confirmando
                ? "Confirmar cancelamento"
                : "Cancelar nota"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
