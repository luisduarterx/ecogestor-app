import { useState, type FormEvent } from "react";
import { AlertCircle, RotateCcw, X } from "lucide-react";
import { motion } from "motion/react";
import { useReverseFinancialEntry } from "../../utils/queries";

export interface ReversibleFinancialEntry {
  id: number;
  description: string;
  value: number;
  type: "income" | "expense";
}

interface ReverseFinancialEntryModalProps {
  item: ReversibleFinancialEntry;
  setIsOpen: (open: boolean) => void;
}

export default function ReverseFinancialEntryModal({
  item,
  setIsOpen,
}: ReverseFinancialEntryModalProps) {
  const reverseEntry = useReverseFinancialEntry();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (reason.trim().length < 3) {
      setError("Informe um motivo com pelo menos 3 caracteres.");
      return;
    }
    try {
      await reverseEntry.mutateAsync({
        entryID: item.id,
        reason: reason.trim(),
      });
      setIsOpen(false);
    } catch (requestError) {
      const apiError = requestError as {
        mensagem?: string;
        response?: { data?: { mensagem?: string } };
      };
      setError(
        apiError.mensagem ??
          apiError.response?.data?.mensagem ??
          "Não foi possível estornar o título.",
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold text-slate-100">Estornar título</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="flex gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>
              O estorno criará uma movimentação inversa e retornará o título
              para o status em aberto.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs">
            <p className="font-bold text-slate-200">
              #{item.id} — {item.description}
            </p>
            <p className="mt-1 font-mono text-slate-400">
              R${" "}
              {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Motivo do estorno
            <textarea
              required
              minLength={3}
              maxLength={250}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs normal-case text-slate-100"
            />
          </label>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={reverseEntry.isPending}
              onClick={() => setIsOpen(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300 disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="submit"
              disabled={reverseEntry.isPending}
              className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
            >
              {reverseEntry.isPending ? "Estornando..." : "Confirmar estorno"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
