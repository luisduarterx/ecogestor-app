import { useState } from "react";
import { motion } from "motion/react";
import { Edit3, X } from "lucide-react";

import {
  useMaterial,
  useMaterialCategories,
  useUpdateMaterial,
} from "../../utils/queries";
import type {
  ApiError,
  MaterialResponse,
  UpdateMaterialInput,
} from "../../utils/types";

interface EditMaterialModalProps {
  setIsOpen: (value: boolean) => void;
  materialID: number;
}
export default function EditMaterialModal({
  setIsOpen,
  materialID,
}: EditMaterialModalProps) {
  const materialQuery = useMaterial(materialID);

  if (materialQuery.isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">
          Carregando dados do registro...
        </div>
      </div>
    );
  }
  if (materialQuery.isError || !materialQuery.data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
        <div className="rounded-2xl border border-rose-500/20 bg-slate-900 p-6 text-center">
          <p className="text-sm text-rose-400">
            Não foi possível carregar o registro.
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <EditMaterialForm
      key={materialID}
      material={materialQuery.data}
      setIsOpen={setIsOpen}
    />
  );
}

interface EditMaterialFormProps {
  material: MaterialResponse;
  setIsOpen: (value: boolean) => void;
}

function EditMaterialForm({ material, setIsOpen }: EditMaterialFormProps) {
  const categoriesQuery = useMaterialCategories();
  const [editMaterialName, setEditMaterialName] = useState(material.nome);
  const [editMaterialCategory, setEditMaterialCategory] = useState(
    String(material.categoria.id),
  );

  const [editSellPrice, setEditSellPrice] = useState(
    String(material.preco_venda),
  );
  const [editMinStock, setEditMinStock] = useState(
    String(material.est_min ?? 0),
  );
  const [editMaxStock, setEditMaxStock] = useState(
    String(material.est_max ?? 0),
  );
  const [editUnit, setEditUnit] = useState(material.unidade);
  const [editMaterialStatus, setEditMaterialStatus] = useState(material.status);
  const [editError, setEditError] = useState("");
  const updateMaterial = useUpdateMaterial(material.id);

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    if (
      editMaterialName.trim().length < 3 ||
      !Number(editMaterialCategory) ||
      editSellPrice === "" ||
      Number(editSellPrice) < 0 ||
      editMinStock === "" ||
      editMaxStock === "" ||
      Number(editMinStock) < 0 ||
      Number(editMaxStock) < Number(editMinStock) ||
      !editUnit
    ) {
      setEditError("Preencha nome, categoria e preços válidos.");
      return;
    }

    const name = editMaterialName.trim();
    const categoryID = Number(editMaterialCategory);
    const sellPrice = Number(editSellPrice);
    const minStock = Number(editMinStock);
    const maxStock = Number(editMaxStock);
    const changes: UpdateMaterialInput = {};

    if (name !== material.nome) changes.nome = name;
    if (categoryID !== material.categoria.id) changes.catID = categoryID;
    if (sellPrice !== material.preco_venda) changes.preco_venda = sellPrice;
    if (minStock !== (material.est_min ?? 0)) changes.est_min = minStock;
    if (maxStock !== (material.est_max ?? 0)) changes.est_max = maxStock;
    if (editUnit !== material.unidade) changes.unidade = editUnit;
    if (editMaterialStatus !== material.status) {
      changes.status = editMaterialStatus;
    }

    if (Object.keys(changes).length === 0) {
      setIsOpen(false);
      return;
    }

    try {
      await updateMaterial.mutateAsync(changes);
      setIsOpen(false);
    } catch (error) {
      setEditError(
        (error as ApiError).mensagem ??
          "Não foi possível atualizar o material.",
      );
    }
  };

  return (
    <div
      id="modal-preco"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">Atualizar Material</h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSaveMaterial} className="p-6 space-y-4">
          {editError && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Nome do material
            </label>
            <input
              type="text"
              value={editMaterialName}
              onChange={(e) => setEditMaterialName(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Categoria
            </label>
            <select
              value={editMaterialCategory}
              onChange={(e) => setEditMaterialCategory(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {(categoriesQuery.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Preço de venda (R$ / kg)
            </label>
            <div className="relative rounded-md shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={editSellPrice}
                onChange={(e) => setEditSellPrice(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Unidade
              </label>
              <select
                value={editUnit}
                onChange={(e) =>
                  setEditUnit(e.target.value as "KG" | "LT" | "UN")
                }
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="KG">Quilos (kg)</option>
                <option value="LT">Litros (L)</option>
                <option value="UN">Unidades (un)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Estoque mínimo
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editMinStock}
                onChange={(e) => setEditMinStock(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Estoque máximo
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editMaxStock}
                onChange={(e) => setEditMaxStock(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/30 p-3">
            <div>
              <p className="text-xs font-bold text-slate-200">Material ativo</p>
              <p className="text-[10px] text-slate-500">
                Disponível para novas operações.
              </p>
            </div>
            <input
              type="checkbox"
              checked={editMaterialStatus}
              onChange={(e) => setEditMaterialStatus(e.target.checked)}
              className="h-4 w-4 accent-emerald-400"
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
              disabled={updateMaterial.isPending}
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
            >
              {updateMaterial.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
