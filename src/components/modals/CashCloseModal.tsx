import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { Lock, X } from "lucide-react";
import { useCashReconciliation, useCloseCash } from "../../utils/queries";
import type { ApiError } from "../../utils/types";

interface CashCloseModalProps {
  setIsOpen: (value: boolean) => void;
}

export default function CashCloseModal({ setIsOpen }: CashCloseModalProps) {
  const [actualBalance, setActualBalance] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const reconciliationQuery = useCashReconciliation();
  const closeCash = useCloseCash();
  const reconciliation = reconciliationQuery.data;
  const informedBalance = Number(actualBalance);
  const difference = reconciliation
    ? informedBalance - reconciliation.valor_esperado
    : 0;

  async function handleCloseCashRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!reconciliation || actualBalance === "" || informedBalance < 0) {
      setError("Informe um saldo contado válido.");
      return;
    }
    if (difference !== 0 && reason.trim().length < 3) {
      setError("Informe o motivo da divergência encontrada.");
      return;
    }
    try {
      await closeCash.mutateAsync({
        saldo_informado: informedBalance,
        ...(difference !== 0 ? { motivo: reason.trim() } : {}),
        ...(notes.trim() ? { observacao: notes.trim() } : {}),
      });
      setIsOpen(false);
    } catch (requestError) {
      setError(
        (requestError as ApiError).mensagem ??
          "Não foi possível fechar o caixa.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold text-slate-100">
              Fechamento & Conferência
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={(event) => void handleCloseCashRegister(event)}
          className="space-y-4 p-6"
        >
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}
          {reconciliationQuery.isPending ? (
            <p className="text-xs text-slate-400">
              Conferindo movimentações...
            </p>
          ) : (
            reconciliation && (
              <div className="space-y-2.5 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs">
                <h4 className="border-b border-slate-800 pb-1.5 text-[10px] font-bold uppercase text-slate-500">
                  Resumo da Movimentação
                </h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Saldo inicial</span>
                  <span className="font-mono text-slate-200">
                    R${" "}
                    {reconciliation.valor_abertura.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-400">Total de créditos</span>
                  <span className="font-mono text-emerald-400">
                    + R${" "}
                    {reconciliation.total_creditos.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-rose-400">Total de débitos</span>
                  <span className="font-mono text-rose-400">
                    - R${" "}
                    {reconciliation.total_debitos.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
                  <span className="text-slate-200">Saldo esperado</span>
                  <span className="font-mono text-slate-100">
                    R${" "}
                    {reconciliation.valor_esperado.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            )
          )}
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Saldo real contado (R$)
            <input
              required
              min="0"
              step="0.01"
              type="number"
              value={actualBalance}
              onChange={(event) => setActualBalance(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-sm font-bold text-slate-100"
            />
          </label>
          {actualBalance !== "" && reconciliation && (
            <div
              className={`flex justify-between rounded-xl border p-3 text-xs font-bold ${difference === 0 ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" : "border-rose-500/20 bg-rose-500/5 text-rose-400"}`}
            >
              <span>Divergência:</span>
              <span className="font-mono">
                R${" "}
                {difference.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          )}
          {difference !== 0 && actualBalance !== "" && (
            <label className="block text-[10px] font-bold uppercase text-slate-400">
              Motivo da divergência
              <input
                required
                minLength={3}
                maxLength={250}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-100"
              />
            </label>
          )}
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Observações
            <textarea
              maxLength={250}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-100"
            />
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={closeCash.isPending || !reconciliation}
              className="rounded-xl bg-rose-500 px-5 py-2 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
            >
              {closeCash.isPending ? "Fechando..." : "Confirmar Fechamento"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
