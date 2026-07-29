import React, { useState } from "react";
import { Wallet, X } from "lucide-react";
import { motion } from "motion/react";

interface BankModalProps {
  setIsOpen: (value: boolean) => void;
}

export default function BankModal({ setIsOpen }: BankModalProps) {
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [color, setColor] = useState("");
  const [error, setError] = useState("s");

  return (
    <div
      id="modal-criar-banco"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">
              Criar Novo Banco / Conta
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={() => {}} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Identificador da Conta
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Ex: Itaú Operacional, Caixa Físico Principal"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome da Instituição / Banco
            </label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ex: Itaú Unibanco S.A., Dinheiro em Espécie"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Saldo Inicial (R$)
            </label>
            <input
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Preset Visual de Cor (Borda)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  class: "bg-emerald-50 text-emerald-800 border-emerald-200",
                  name: "Esmeralda",
                },
                {
                  class: "bg-blue-50 text-blue-800 border-blue-200",
                  name: "Azul",
                },
                {
                  class: "bg-orange-50 text-orange-800 border-orange-200",
                  name: "Laranja",
                },
                {
                  class: "bg-yellow-50 text-yellow-800 border-yellow-200",
                  name: "Amarelo",
                },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setColor(preset.class)}
                  className={`p-2.5 rounded-xl border text-[10px] font-bold text-center transition-all cursor-pointer ${
                    color === preset.class
                      ? "ring-2 ring-emerald-400 border-emerald-400"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full mr-1.5 ${preset.class.split(" ")[0]}`}
                  ></span>
                  {preset.name}
                </button>
              ))}
            </div>
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
              Criar Conta
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
