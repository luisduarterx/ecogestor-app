import { useState } from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Scale, X } from "lucide-react";

interface InventoryMovementModalProps {
  setIsMovementModalOpen: (value: boolean) => void;
  onClose: () => void;
}
export default function InventoryMovementModal({
  setIsMovementModalOpen,
  onClose,
}: InventoryMovementModalProps) {
  async function handleProcessMovement() {
    alert("processado");
    onClose();
  }
  const [moveNotes, setMoveNotes] = useState("");
  const [moveError, setMoveError] = useState("");
  const [moveType, setMoveType] = useState("");
  const [moveMatId, setMoveMatId] = useState("");
  const [moveQty, setMoveQty] = useState("");
  const [moveEntity, setMoveEntity] = useState("");
  const [materials, setMaterials] = useState([]);
  return (
    <div
      id="modal-movimentacao"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">
              Ajuste de Balanço de Inventário
            </h3>
          </div>
          <button
            onClick={() => setIsMovementModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleProcessMovement} className="p-6 space-y-4">
          {moveError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {moveError}
            </div>
          )}

          {/* Type Select */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Sentido do Ajuste
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMoveType("entrada")}
                className={`py-2 rounded-xl text-xs font-bold uppercase border tracking-wider flex items-center justify-center gap-1.5 ${
                  moveType === "entrada"
                    ? "bg-emerald-400 border-transparent text-slate-950"
                    : "bg-slate-950/20 border-slate-800 text-slate-400"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
                Entrada (Acréscimo)
              </button>
              <button
                type="button"
                onClick={() => setMoveType("saída")}
                className={`py-2 rounded-xl text-xs font-bold uppercase border tracking-wider flex items-center justify-center gap-1.5 ${
                  moveType === "saída"
                    ? "bg-rose-500 text-slate-950 border-transparent"
                    : "bg-slate-950/20 border-slate-800 text-slate-400"
                }`}
              >
                <ArrowDownRight className="h-4 w-4" />
                Saída (Dedução)
              </button>
            </div>
          </div>

          {/* Material select & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Material de Ajuste
              </label>
              <select
                value={moveMatId}
                onChange={(e) => setMoveMatId(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">Selecione...</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.stock} kg)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Peso de Ajuste (kg)
              </label>
              <input
                type="number"
                value={moveQty}
                onChange={(e) => setMoveQty(e.target.value)}
                placeholder="Ex: 50"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Entity details */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Setor Solicitante ou Operador Autorizado
            </label>
            <input
              type="text"
              value={moveEntity}
              onChange={(e) => setMoveEntity(e.target.value)}
              placeholder="Ex: Auditoria Física Anual / Operação Triagem"
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {/* Move Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Justificativa de Ajuste
            </label>
            <textarea
              value={moveNotes}
              onChange={(e) => setMoveNotes(e.target.value)}
              placeholder="Ex: Desvio de umidade pós-chuva na área externa de estocagem de papelão."
              rows={2}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsMovementModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Salvar Ajuste
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
