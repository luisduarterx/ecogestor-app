import { motion } from "motion/react";
import { ArrowRightLeft, ShieldCheck, Unlock, X } from "lucide-react";
import { use, useState } from "react";
interface CashOpenModalProps {
  setIsOpen: (value: boolean) => void;
}
export default function CashOpenModal({ setIsOpen }: CashOpenModalProps) {
  function handleOpenCashRegister() {}
  function handleOpeningAccountChange() {}
  const [cashOpenInitialBalance, setCashOpenInitialBalance] = useState("");

  const [cashOpenOperator, setCashOpenOperator] = useState("");
  const [cashOpenBankAccountId, setCashOpenBankAccountId] = useState("");
  const bankAccounts = [];

  return (
    <div
      id="modal-abrir-caixa"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Unlock className="h-5 w-5 text-emerald-400 animate-pulse" />
            <h3 className="font-bold text-slate-100">
              Abertura de Caixa Diário
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleOpenCashRegister} className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-emerald-500/5 border border-emerald-500/20 p-3.5 rounded-xl">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-emerald-200">
                Abertura de Turno Operacional
              </p>
              <p className="leading-relaxed">
                Declare o saldo físico inicial da gaveta. Todas as transações
                realizadas na conta selecionada hoje serão monitoradas nesta
                sessão.
              </p>
            </div>
          </div>

          {/* Account selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Gaveta / Conta de Caixa Associada
            </label>
            <select
              required
              value={cashOpenBankAccountId}
              onChange={(e) => handleOpeningAccountChange(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-medium"
            >
              <option value="" disabled className="bg-slate-900">
                Selecione uma conta...
              </option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900">
                  {b.name} ({b.bankName || "Caixa"}) - Saldo: R${" "}
                  {b.balance.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </option>
              ))}
            </select>
          </div>

          {/* Operator */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Operador do Sistema
            </label>
            <input
              type="text"
              required
              value={cashOpenOperator}
              onChange={(e) => setCashOpenOperator(e.target.value)}
              placeholder="Nome do operador de caixa"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {/* Initial balance */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Saldo Físico Inicial Declarado (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={cashOpenInitialBalance}
              onChange={(e) => setCashOpenInitialBalance(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Ajustar caso o valor físico em gaveta divirja do saldo do sistema.
            </span>
          </div>

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
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Confirmar Abertura
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
