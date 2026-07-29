import { motion } from "motion/react";
import { ArrowRightLeft, X } from "lucide-react";
import { useState } from "react";
interface FinancesTransferModalProps {
  setIsOpen: (value: boolean) => void;
}
export default function FinancesTransferModal({
  setIsOpen,
}: FinancesTransferModalProps) {
  function handleExecuteTransfer() {}
  const [transferError, setTransferError] = useState("");
  const [sourceBankId, setSourceBankId] = useState("");
  const [targetBankId, setTargetBankId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");
  const bankAccounts = [];
  return (
    <div
      id="modal-transferencia"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">
              Transferência entre Contas
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4">
          {transferError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {transferError}
            </div>
          )}

          {/* Source & Destination bank selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Conta de Origem (Débito)
              </label>
              <select
                value={sourceBankId}
                onChange={(e) => setSourceBankId(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">Selecione...</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (R${" "}
                    {b.balance.toLocaleString("pt-BR", {
                      maximumFractionDigits: 0,
                    })}
                    )
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Conta Destino (Crédito)
              </label>
              <select
                value={targetBankId}
                onChange={(e) => setTargetBankId(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">Selecione...</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (R${" "}
                    {b.balance.toLocaleString("pt-BR", {
                      maximumFractionDigits: 0,
                    })}
                    )
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Valor da Transferência (R$)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Finalidade / Descrição da Operação
            </label>
            <textarea
              value={transferDesc}
              onChange={(e) => setTransferDesc(e.target.value)}
              placeholder="Ex: Reforço de saldo para liquidação de faturas de compras no balcão."
              rows={2}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
            />
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
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Confirmar Envio
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
