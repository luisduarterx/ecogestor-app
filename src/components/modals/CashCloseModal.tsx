import { motion } from "motion/react";
import { ArrowRightLeft, Lock, ShieldCheck, Unlock, X } from "lucide-react";
import { use, useState } from "react";
interface CashCloseModalProps {
  setIsOpen: (value: boolean) => void;
}
export default function CashCloseModal({ setIsOpen }: CashCloseModalProps) {
  function handleCloseCashRegister() {}
  const [cashCloseError, setCashCloseError] = "";
  const [activeSession, setActiveSession] = useState({
    id: 2,
    openedAt: 21233,
    openedBy: "LUIS",
    initialBalance: 2009,
  });
  const totalCashIn = 0;
  const totalCashOut = 0;
  const [cashCloseActualBalance, setCashCloseActualBalance] = useState("");
  const currentExpectedBalance = [];
  const [cashCloseNotes, setCashCloseNotes] = useState("");

  return (
    <div
      id="modal-fechar-caixa"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold text-slate-100">
              Fechamento & Conferência
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCloseCashRegister} className="p-6 space-y-4">
          {cashCloseError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {cashCloseError}
            </div>
          )}

          {/* Dynamic audit flow ledger summary */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2.5 text-xs">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-800 pb-1.5">
              Resumo da Movimentação
            </h4>
            <div className="flex justify-between">
              <span className="text-slate-400">Saldo Inicial de Abertura</span>
              <span className="font-mono text-slate-200">
                R${" "}
                {activeSession.initialBalance.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-400">
                Total de Entradas em Dinheiro
              </span>
              <span className="font-mono text-emerald-400">
                + R${" "}
                {totalCashIn.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-400">Total de Saídas em Dinheiro</span>
              <span className="font-mono text-rose-400">
                - R${" "}
                {totalCashOut.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-800/80 pt-2 font-bold text-sm">
              <span className="text-slate-200">Saldo Final Esperado</span>
              <span className="font-mono text-slate-100">
                R${" "}
                {currentExpectedBalance.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Actual counted input */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Saldo Real Contado em Caixa (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={cashCloseActualBalance}
              onChange={(e) => setCashCloseActualBalance(e.target.value)}
              placeholder="Informe o valor em dinheiro físico na gaveta"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono text-sm font-bold"
            />
          </div>

          {/* Discrepancy indicator badge */}
          {cashCloseActualBalance &&
            !isNaN(parseFloat(cashCloseActualBalance)) && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between font-bold ${
                  parseFloat(cashCloseActualBalance) -
                    currentExpectedBalance ===
                  0
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                    : parseFloat(cashCloseActualBalance) -
                          currentExpectedBalance >
                        0
                      ? "bg-sky-500/5 border-sky-500/20 text-sky-400"
                      : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                }`}
              >
                <span>Divergência apurada:</span>
                <span className="font-mono font-black text-sm">
                  {parseFloat(cashCloseActualBalance) -
                    currentExpectedBalance ===
                  0
                    ? "R$ 0,00 (Caixa Perfeito)"
                    : `${parseFloat(cashCloseActualBalance) - currentExpectedBalance > 0 ? "Sobra de" : "Quebra de"} R$ ${Math.abs(parseFloat(cashCloseActualBalance) - currentExpectedBalance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                </span>
              </div>
            )}

          {/* Justification Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações / Justificativas
            </label>
            <textarea
              value={cashCloseNotes}
              onChange={(e) => setCashCloseNotes(e.target.value)}
              placeholder="Descreva observações relevantes sobre o fechamento (ex: sobra decorrente de troco não retirado pelo cliente)."
              rows={2.5}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none leading-relaxed"
            />
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
              className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Confirmar Fechamento
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
