import { use, useState } from "react";
import { motion } from "motion/react";
import { RefreshCw, X } from "lucide-react";
interface InventoryConversionModalProps {
  setIsConversionModalOpen: (value: boolean) => void;
  onClose: () => void;
}
export default function InventoryConversionModal({
  setIsConversionModalOpen,
  onClose,
}: InventoryConversionModalProps) {
  async function handleProcessConversion() {
    alert("processado");
    onClose();
  }
  const [conversionError, setConversionError] = useState("");
  const [sourceMatId, setSourceMatId] = useState("");
  const [sourceQty, setSourceQty] = useState("");
  const [materials, setMaterials] = useState([]);
  const [targetMatId, setTargetMatId] = useState("");
  const [targetQty, setTargetQty] = useState("");
  const [conversionNotes, setConversionNotes] = useState("");
  return (
    <div
      id="modal-conversao"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-sky-400" />
            <h3 className="font-bold text-slate-100">
              Conversão & Refinamento de Estoque
            </h3>
          </div>
          <button
            onClick={() => setIsConversionModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleProcessConversion} className="p-6 space-y-4">
          <div className="p-3 bg-sky-500/10 border border-sky-500/25 rounded-xl text-xs text-sky-300">
            <span className="font-bold block mb-1">
              Entenda o Processamento de Estoque:
            </span>
            Utilize este módulo para converter insumos recicláveis brutos em
            fardos refinados ou flakes moídos. O peso original sofrerá dedução e
            o produto final será acrescido.
          </div>

          {conversionError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {conversionError}
            </div>
          )}

          {/* Source Material */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Material de Origem (Méria Bruta)
              </label>
              <select
                value={sourceMatId}
                onChange={(e) => setSourceMatId(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-400"
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
                Peso Original Entrada (kg)
              </label>
              <input
                type="number"
                value={sourceQty}
                onChange={(e) => setSourceQty(e.target.value)}
                placeholder="Ex: 1000"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* Target Material */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Material Destino (Refinado)
              </label>
              <select
                value={targetMatId}
                onChange={(e) => setTargetMatId(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-sky-400"
              >
                <option value="">Selecione...</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Peso Final Processado (kg)
              </label>
              <input
                type="number"
                value={targetQty}
                onChange={(e) => setTargetQty(e.target.value)}
                placeholder="Ex: 950"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>
          </div>

          {/* Output Loss display */}
          {parseFloat(sourceQty) &&
          parseFloat(targetQty) &&
          parseFloat(sourceQty) >= parseFloat(targetQty) ? (
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 flex justify-between items-center font-mono">
              <span>Perda/Refugo Estimado:</span>
              <span className="text-rose-400 font-bold">
                {(parseFloat(sourceQty) - parseFloat(targetQty)).toFixed(1)} kg
                (
                {(
                  (1 - parseFloat(targetQty) / parseFloat(sourceQty)) *
                  100
                ).toFixed(1)}
                %)
              </span>
            </div>
          ) : null}

          {/* Conversion Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Justificativa / Responsável Técnico
            </label>
            <textarea
              value={conversionNotes}
              onChange={(e) => setConversionNotes(e.target.value)}
              placeholder="Ex: Processado no triturador principal. Descarte de rótulos e umidade registrado."
              rows={2}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsConversionModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              Processar Lote
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
