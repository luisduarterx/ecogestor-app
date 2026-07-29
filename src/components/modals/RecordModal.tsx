import React, { useState } from "react";

import { Users, Star, X, Check, ShieldAlert, DollarSign } from "lucide-react";
import { motion } from "motion/react";

interface RecordModalProps {
  setIsOpen: (value: boolean) => void;
}

export default function RecordModal({ setIsOpen }: RecordModalProps) {
  const customPriceTables = [
    {
      id: 1,
      name: "TaBela 1",
      isDefault: true,
      buyPrices: [],
    },
  ];
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [type, setType] = useState<"supplier" | "customer" | "both">(
    "supplier",
  );
  const [category, setCategory] = useState<
    "cooperative" | "scrap_yard" | "industrial" | "individual" | "other"
  >("individual");
  const [rating, setRating] = useState<number>(5);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [priceTableId, setPriceTableId] = useState("");
  const [formError, setFormError] = useState("");

  return (
    <div
      id="modal-cadastro"
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">
              Cadastro de Fornecedor / Cliente
            </h3>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={() => {}} className="p-6 space-y-4">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Primary row: name & doc */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Razão Social / Nome Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cooperativa Recicla Oeste"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                CNPJ / CPF *
              </label>
              <input
                type="text"
                required
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Ex: 12.345.678/0001-00"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Contact row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Telefone Comercial
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                E-mail para Notas
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: faturas@parceiro.com"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Location row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Endereço Comercial (Rua, Nº, Bairro)
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Av. Reciclagem, 120 - Setor C"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cidade
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São José"
                  className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Estado
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-2.5 py-2.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Classification Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Vínculo Comercial
              </label>
              <div className="flex gap-2">
                {["supplier", "customer", "both"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t as any)}
                    className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all duration-150 border ${
                      type === t
                        ? "bg-emerald-400 border-transparent text-slate-950"
                        : "bg-slate-950/20 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {t === "supplier"
                      ? "Fornec"
                      : t === "customer"
                        ? "Cliente"
                        : "Ambos"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Categoria do Parceiro
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="cooperative">Cooperativa de Catadores</option>
                <option value="scrap_yard">Depósito / Sucateiro</option>
                <option value="industrial">Indústria de Reciclagem</option>
                <option value="individual">Catador Autônomo / CPF</option>
                <option value="other">Outros Perfis</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Status & Reputação
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>

                <div className="flex items-center justify-center bg-slate-950/30 border border-slate-800 rounded-xl px-2 gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5 hover:scale-115 transition-transform text-amber-400 cursor-pointer"
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-600"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Price Table Association (Only for Suppliers or Both) */}
          {type !== "customer" && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                Tabela de Preços de Compra Associada
              </label>
              <select
                value={priceTableId}
                onChange={(e) => setPriceTableId(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">Tabela Padrão (Preços de Tabela Geral)</option>
                {customPriceTables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.name} (
                    {tbl.isDefault
                      ? "Tarifas Básicas"
                      : `${Object.keys(tbl.buyPrices).length} itens especiais`}
                    )
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Selecione uma tabela diferenciada para preenchimento automático
                das notas de entrada desse parceiro.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações Internas (Restrições de Carga, Acordos)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Acordo especial de frete pago pela usina para cargas acima de 2 toneladas."
              rows={2}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-950/20 px-6 py-4 -mx-6 -mb-6">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              Salvar Cadastro
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
