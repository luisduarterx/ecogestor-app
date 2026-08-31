import { Edit3, X } from "lucide-react";
import { motion } from "motion/react";
import { useState, type FormEvent } from "react";
import { useUpdateMaterialCategory } from "../../utils/queries";
import type { ApiError, MaterialCategoryResponse } from "../../utils/types";

interface EditMaterialCategoryModalProps {
  category: MaterialCategoryResponse;
  onClose: () => void;
}

export default function EditMaterialCategoryModal({
  category,
  onClose,
}: EditMaterialCategoryModalProps) {
  const [name, setName] = useState(category.nome);
  const [error, setError] = useState("");
  const updateCategory = useUpdateMaterialCategory();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedName = name.trim();
    if (normalizedName.length < 3) {
      setError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        nome: normalizedName,
      });
      onClose();
    } catch (requestError) {
      setError(
        (requestError as ApiError).mensagem ??
          "Não foi possível atualizar a categoria.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Atualizar Categoria</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar edição de categoria"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nome da categoria
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={90}
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateCategory.isPending}
              className="cursor-pointer rounded-xl bg-emerald-400 px-5 py-2 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updateCategory.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
