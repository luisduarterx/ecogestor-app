import { useState, type FormEvent } from "react";

import { ArrowUpRight, X } from "lucide-react";
import { motion } from "motion/react";

import {
  useCreateFinancialEntry,
  useFinancialAccounts,
  useFinancialCategories,
} from "../../utils/queries";
import type { ApiError } from "../../utils/types";

interface IncomeModalProps {
  setIsOpen: (value: boolean) => void;
}

export default function IncomeModal({ setIsOpen }: IncomeModalProps) {
  const accountsQuery = useFinancialAccounts();
  const categoriesQuery = useFinancialCategories("RECEITA");
  const createEntry = useCreateFinancialEntry();
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [value, setValue] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState("Pix");
  const [status, setStatus] = useState<"recebido" | "pendente">("recebido");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (
      description.trim().length < 3 ||
      Number(value) <= 0 ||
      !category ||
      !date ||
      (status === "recebido" && !bankAccountId)
    ) {
      setError(
        "Preencha descrição, valor, categoria, data e conta quando recebido.",
      );
      return;
    }
    try {
      await createEntry.mutateAsync({
        valor: Number(value),
        descricao: `${description.trim()} — ${method}`.slice(0, 250),
        titulo: description.trim().slice(0, 100),
        tipo: "RECEBER",
        categoria_id: Number(category),
        vencimento: date,
        baixar_agora: status === "recebido",
        ...(status === "recebido"
          ? { conta_id: Number(bankAccountId) }
          : {}),
      });
      setIsOpen(false);
    } catch (requestError) {
      setError(
        (requestError as ApiError).mensagem ??
          "Não foi possível lançar a receita.",
      );
    }
  }

  return (
    <div
      id="modal-receita"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Lançar Nova Receita</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Descrição do Lançamento
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Faturamento de lote triturado"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Valor da Receita (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Categoria da Entrada
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">Selecione...</option>
                {(categoriesQuery.data ?? []).map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Conta para Crédito
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                disabled={status === "pendente"}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">Selecione a conta...</option>
                {(accountsQuery.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nome} (R$ {b.saldo_atual.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Meio de Recebimento
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="Pix">Pix imediato</option>
                <option value="Dinheiro">Dinheiro Físico</option>
                <option value="Boleto Bancário">Boleto Bancário</option>
                <option value="Transferência Bancária">
                  Transferência Eletrônica
                </option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Vencimento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Situação atual
              </label>
              <select
                value={status}
                onChange={(event) => {
                  const newStatus = event.target.value as
                    | "recebido"
                    | "pendente";
                  setStatus(newStatus);
                  if (newStatus === "pendente") setBankAccountId("");
                }}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="recebido">Recebido (dar baixa agora)</option>
                <option value="pendente">A receber (sem baixa)</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createEntry.isPending}
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              {createEntry.isPending ? "Lançando..." : "Lançar Receita"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
