import React, { useState } from "react";

import { Check, X, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export interface LedgerItem {
  id: string;
  type: "income" | "expense";
  description: string;
  value: number;
  account?: string;
}

interface ReconcileModalProps {
  setIsOpen: (value: boolean) => void;
  item: any;
}

export default function ReconcileModal({
  setIsOpen,
  item,
}: ReconcileModalProps) {
  const [error, setError] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [date, setDate] = useState("");

  const bankAccounts = [];

  return (
    <div
      id="modal-dar-baixa"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Liquidação / Dar Baixa</h3>
          </div>
          <button
            onClick={() => {
              setIsOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={() => {}} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400 flex items-start gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Lançamento
              </span>
              <span className="text-[10px] font-mono text-slate-300 font-bold">
                {item.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Tipo
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-1.5 rounded-full ${
                  item.type === "income"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {item.type === "income"
                  ? "Contas a Receber (Crédito)"
                  : "Contas a Pagar (Débito)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Descrição
              </span>
              <span className="text-xs text-slate-200 font-semibold">
                {item.description}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Valor Original
              </span>
              <span className="text-sm font-extrabold text-slate-100 font-mono">
                R${" "}
                {item.value.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              {item.type === "income"
                ? "CONTA DE DEPÓSITO (CRÉDITO)"
                : "CONTA DE ORIGEM (DÉBITO)"}
            </label>
            <select
              required
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="">Selecione a conta...</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Saldo: R${" "}
                  {b.balance.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  )
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              DATA DE LIQUIDAÇÃO
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Confirmar Baixa
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
