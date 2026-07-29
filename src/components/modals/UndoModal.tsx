import React, { useState } from "react";
import { RotateCcw, X, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export interface LedgerItem {
  id: string;
  type: "income" | "expense";
  description: string;
  value: number;
  account?: string;
}

interface UndoModalProps {
  setIsOpen: (value: boolean) => void;
  item: any;
}

export default function UndoModal({ setIsOpen, item }: UndoModalProps) {
  const [error, setError] = useState("");

  return (
    <div
      id="modal-desfazer"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold text-slate-100">Estornar Operação</h3>
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
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {error}
            </div>
          )}

          <div className="flex items-start gap-2.5 text-xs text-slate-400 bg-rose-500/5 border border-rose-500/20 p-3.5 rounded-xl">
            <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1">
              <p className="font-bold text-rose-200">Reversão de Lançamento!</p>
              <p className="leading-relaxed">
                Esta ação removerá definitivamente o lançamento e ajustará o
                saldo da conta associada de volta ao estado anterior.
              </p>
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Identificador
              </span>
              <span className="text-slate-300 font-mono font-bold">
                {item.id}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Fluxo
              </span>
              <span
                className={`font-bold uppercase px-1.5 rounded-full text-[9px] ${
                  item.type === "income"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-rose-500/15 text-rose-400"
                }`}
              >
                {item.type === "income" ? "Crédito" : "Débito"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Descrição
              </span>
              <span className="text-slate-200 font-bold">
                {item.description}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Conta Associada
              </span>
              <span className="text-slate-300 font-bold font-mono">
                {item.account || "Nenhuma (Pendente)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                Valor do Lançamento
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

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Confirmar Estorno
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
