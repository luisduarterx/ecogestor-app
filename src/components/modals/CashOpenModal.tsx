import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { ShieldCheck, Unlock, X } from "lucide-react";
import { useLoggedUser } from "../../context/useLoggedUser";
import { useFinancialAccounts, useOpenCash } from "../../utils/queries";
import type { ApiError } from "../../utils/types";

interface CashOpenModalProps {
  setIsOpen: (value: boolean) => void;
}

export default function CashOpenModal({ setIsOpen }: CashOpenModalProps) {
  const [observacao, setObservacao] = useState("");
  const [error, setError] = useState("");
  const { user } = useLoggedUser();
  const accountsQuery = useFinancialAccounts();
  const openCash = useOpenCash();
  const defaultAccount = accountsQuery.data?.find(
    (account) => account.conta_padrao,
  );

  async function handleOpenCashRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await openCash.mutateAsync({
        ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
      });
      setIsOpen(false);
    } catch (requestError) {
      setError(
        (requestError as ApiError).mensagem ??
          "Não foi possível abrir o caixa.",
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
            <Unlock className="h-5 w-5 animate-pulse text-emerald-400" />
            <h3 className="font-bold text-slate-100">
              Abertura de Caixa Diário
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
          onSubmit={(event) => void handleOpenCashRegister(event)}
          className="space-y-4 p-6"
        >
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400" />
            <p>
              A API abrirá o caixa na conta padrão ativa e usará seu saldo atual
              como saldo inicial.
            </p>
          </div>
          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs">
            <span className="block text-[10px] font-bold uppercase text-slate-500">
              Conta padrão
            </span>
            <strong className="mt-1 block text-slate-200">
              {defaultAccount?.nome ?? "Carregando conta padrão..."}
            </strong>
            {defaultAccount && (
              <span className="font-mono text-emerald-400">
                Saldo: R${" "}
                {defaultAccount.saldo_atual.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            )}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-xs">
            <span className="block text-[10px] font-bold uppercase text-slate-500">
              Operador
            </span>
            <strong className="mt-1 block text-slate-200">
              {user?.nome ?? "Usuário autenticado"}
            </strong>
          </div>
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Observação da abertura
            <textarea
              maxLength={150}
              rows={3}
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
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
              disabled={
                openCash.isPending || accountsQuery.isPending || !defaultAccount
              }
              className="rounded-xl bg-emerald-400 px-5 py-2 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
            >
              {openCash.isPending ? "Abrindo..." : "Confirmar Abertura"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
