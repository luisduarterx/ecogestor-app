import { useState, type FormEvent } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import {
  useFinancialAccounts,
  useSettleFinancialEntry,
} from "../../utils/queries";

export interface LedgerItem {
  id: number;
  type: "income" | "expense";
  description: string;
  value: number;
  account?: string;
}

interface ReconcileModalProps {
  setIsOpen: (value: boolean) => void;
  item: LedgerItem;
}

export default function ReconcileModal({
  setIsOpen,
  item,
}: ReconcileModalProps) {
  const accountsQuery = useFinancialAccounts();
  const settleEntry = useSettleFinancialEntry();
  const [error, setError] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!bankAccountId) {
      setError("Selecione a conta financeira da liquidação.");
      return;
    }
    try {
      await settleEntry.mutateAsync({
        entryID: item.id,
        accountID: Number(bankAccountId),
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
          "Não foi possível dar baixa no título.",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Liquidação / Dar baixa</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400 flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-mono text-slate-500">LANÇAMENTO</span>
              <span className="font-mono font-bold text-slate-300">#{item.id}</span>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-slate-500">Descrição</span>
              <span className="text-right font-semibold text-slate-200">{item.description}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Valor</span>
              <span className="font-mono text-sm font-extrabold text-slate-100">
                R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {item.type === "income" ? "Conta de depósito" : "Conta de origem"}
            <select
              required
              value={bankAccountId}
              onChange={(event) => setBankAccountId(event.target.value)}
              disabled={accountsQuery.isPending || settleEntry.isPending}
              className="mt-1.5 w-full bg-slate-950/40 text-slate-100 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="">Selecione a conta...</option>
              {(accountsQuery.data ?? []).map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome} — R$ {account.saldo_atual.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </option>
              ))}
            </select>
          </label>

          <p className="text-[10px] leading-relaxed text-slate-500">
            A data da baixa será registrada automaticamente pela API no momento da confirmação.
          </p>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} disabled={settleEntry.isPending} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={settleEntry.isPending || accountsQuery.isPending} className="px-5 py-2 bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase disabled:opacity-50">
              {settleEntry.isPending ? "Processando..." : "Confirmar baixa"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
