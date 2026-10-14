import { motion } from "motion/react";
import { AlertCircle, AlertTriangle, FilePen, Loader2, X } from "lucide-react";
import { useState } from "react";
import { mensagemErroFiscal } from "../../utils/fiscal";
import { useRegistrarCartaCorrecao } from "../../utils/queries";
import type { ApiError, CartaCorrecao } from "../../utils/types";

interface CartaCorrecaoModalProps {
  notaID: number;
  /** Texto da última carta, usado para pré-preencher a nova. */
  ultimaCorrecao: string | null;
  onClose: () => void;
  onRegistrada: (carta: CartaCorrecao) => void;
}

const CORRECAO_MINIMA = 15;
const CORRECAO_MAXIMA = 1000;

/** Registro de uma nova carta de correção para nota autorizada. */
export default function CartaCorrecaoModal({
  notaID,
  ultimaCorrecao,
  onClose,
  onRegistrada,
}: CartaCorrecaoModalProps) {
  const registrar = useRegistrarCartaCorrecao(notaID);
  const [correcao, setCorrecao] = useState(ultimaCorrecao ?? "");
  const [erro, setErro] = useState("");

  const texto = correcao.trim();
  const tamanhoValido =
    texto.length >= CORRECAO_MINIMA && texto.length <= CORRECAO_MAXIMA;

  async function enviar() {
    setErro("");
    try {
      onRegistrada(await registrar.mutateAsync(texto));
    } catch (caught) {
      const apiErro = caught as ApiError;
      setErro(
        apiErro.statusCode >= 500
          ? "Não foi possível confirmar a carta de correção. Tente novamente; vale sempre a última carta registrada."
          : mensagemErroFiscal(
              apiErro,
              "Não foi possível registrar a carta de correção.",
            ),
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="carta-correcao-titulo"
      onMouseDown={(evento) =>
        evento.target === evento.currentTarget &&
        !registrar.isPending &&
        onClose()
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <FilePen className="h-5 w-5 text-violet-400" />
            <h3 id="carta-correcao-titulo" className="font-bold text-slate-100">
              Nova carta de correção
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={registrar.isPending}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-6 text-xs">
          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">
            <p className="flex items-start gap-2 font-semibold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />A carta de
              correção não pode alterar valores, base de cálculo ou alíquotas;
              dados que mudem o remetente ou o destinatário; nem datas de
              emissão ou saída.
            </p>
            <p className="pl-6">
              Vale sempre a última carta enviada. Escreva todas as correções
              necessárias
              {ultimaCorrecao
                ? "; o texto da carta anterior já foi copiado abaixo."
                : "."}
            </p>
          </div>

          <label className="block text-[10px] font-bold uppercase text-slate-400">
            <span className="flex justify-between">
              Correção
              <span
                className={`font-mono normal-case ${
                  texto.length > 0 && !tamanhoValido
                    ? "text-rose-400"
                    : "text-slate-500"
                }`}
              >
                {texto.length}/{CORRECAO_MAXIMA}
              </span>
            </span>
            <textarea
              rows={7}
              maxLength={CORRECAO_MAXIMA}
              value={correcao}
              disabled={registrar.isPending}
              onChange={(evento) => {
                setCorrecao(evento.target.value);
                setErro("");
              }}
              placeholder="Onde se lê ..., leia-se ..."
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs normal-case text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <span className="mt-1 block font-normal normal-case text-slate-500">
              Entre {CORRECAO_MINIMA} e {CORRECAO_MAXIMA} caracteres. Modelo:
              “Onde se lê ..., leia-se ...”.
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
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-800 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={registrar.isPending}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={
              !tamanhoValido ||
              registrar.isPending ||
              texto === (ultimaCorrecao ?? "").trim()
            }
            title={
              texto === (ultimaCorrecao ?? "").trim() && ultimaCorrecao
                ? "O texto é igual ao da última carta"
                : undefined
            }
            onClick={() => void enviar()}
            className="flex items-center gap-2 rounded-xl bg-violet-400 px-4 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-violet-300 disabled:opacity-50"
          >
            {registrar.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {registrar.isPending ? "Enviando..." : "Enviar à SEFAZ"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
