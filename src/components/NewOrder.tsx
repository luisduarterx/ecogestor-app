import { useState } from "react";
import {
  AlertCircle,
  Check,
  DollarSign,
  Plus,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";

interface NewOrderProps {
  type: "purchase" | "sale";
}
export default function NewOrder({ type }: NewOrderProps) {
  const [saleSuccess, setSaleSucess] = useState(true);
  const [saleError, setSaleError] = useState(true);
  const [selectedCustomerId, setSelectedCustomerId] = useState();
  const [suppliers, setSuppliers] = useState([
    {
      id: 213,
      name: "LUIS CLAUDIO",
      category: "industrial",
      status: "active",
      type: "supplid",
      document: 1231231231123,
      city: "Rio de Janeiro",
      state: "RJ",
      phone: "21993808030",
    },
  ]);
  const [materials, setMaterials] = useState([
    { id: 23, name: "Cobre mel", stock: 23 },
    { id: 23, name: "Aluminio Lata", stock: 23 },
  ]);
  const [saleMatId, setSaleMatId] = useState("");
  const [saleQty, setSaleQty] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [saleCart, setSaleCart] = useState([]);
  const [saleSubtotal, setSaleSubtotal] = useState("");
  const [saleDiscount, setSaleDiscount] = useState("");
  const [saleTotal, setSaleTotal] = useState("");
  const [salePaymentMethod, setSalePaymentMethod] = useState("");
  let salePaymentTerms;
  const [saleNotes, setSalesNotes] = useState("");
  const [orderTareWeight, setOrderTareWeight] = useState("");
  const [orderImpurities, setOrderImpurities] = useState("");
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isSaleMatDropdownOpen, setIsSaleMatDropdownOpen] = useState(false);
  const [saleMatSearch, setSaleMatSearch] = useState("");
  const handleSaleMaterialChange = (matId: string) => {
    setSaleMatId(matId);
    if (!matId) {
      setSalePrice("");
      return;
    }
  };
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };
  const handleCustomerSearchChange = (val: string) => {
    setCustomerSearch(val);
    setIsCustomerDropdownOpen(true);
    if (!val.trim()) {
      setSelectedCustomerId("");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cart & Customer choice (Left & center columns) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Success / Error feedbacks */}
        {saleSuccess && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 p-4 rounded-xl text-sm text-emerald-400 flex items-center gap-2.5">
            <Check className="h-5 w-5 animate-bounce shrink-0" />
            <span>{saleSuccess}</span>
          </div>
        )}
        {saleError && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-sm text-rose-400 flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{saleError}</span>
          </div>
        )}

        {/* Step 1: Customer */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800/60 pb-2.5">
            <User className="h-4 w-4 text-emerald-400" />
            1. Cliente Destinatário do Lote
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Cliente Adquirente
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => handleCustomerSearchChange(e.target.value)}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder="Digite para buscar cliente..."
                  className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 pr-8 font-medium"
                />
                {customerSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomerId("");
                      setCustomerSearch("");
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isCustomerDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsCustomerDropdownOpen(false)}
                  />
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl divide-y divide-slate-800/40">
                    {suppliers
                      .filter(
                        (s) => s.type !== "supplier" && s.status === "active",
                      )
                      .filter((s) =>
                        s.name
                          .toLowerCase()
                          .includes(customerSearch.toLowerCase()),
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            handleCustomerChange(c.id);
                            setCustomerSearch(c.name);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-emerald-400 transition-colors font-medium flex justify-between items-center"
                        >
                          <span>{c.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono">
                            {c.category === "industrial"
                              ? "Indústria"
                              : "Parceiro"}
                          </span>
                        </button>
                      ))}
                    {suppliers
                      .filter(
                        (s) => s.type !== "supplier" && s.status === "active",
                      )
                      .filter((s) =>
                        s.name
                          .toLowerCase()
                          .includes(customerSearch.toLowerCase()),
                      ).length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-500 italic text-center">
                        Nenhum cliente encontrado para "{customerSearch}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {selectedCustomerId ? (
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>
                  CNPJ/CPF:{" "}
                  <strong className="text-slate-200">
                    {
                      suppliers.find((s) => s.id === selectedCustomerId)
                        ?.document
                    }
                  </strong>
                </p>
                <p>
                  Cidade / UF:{" "}
                  <strong className="text-slate-200">
                    {suppliers.find((s) => s.id === selectedCustomerId)?.city} -{" "}
                    {suppliers.find((s) => s.id === selectedCustomerId)?.state}
                  </strong>
                </p>
                <p>
                  Contato:{" "}
                  <strong className="text-slate-200">
                    {suppliers.find((s) => s.id === selectedCustomerId)?.phone}
                  </strong>
                </p>
              </div>
            ) : (
              <div className="bg-slate-950/10 p-4 border border-slate-800 border-dashed rounded-xl flex items-center justify-center text-xs text-slate-500">
                Selecione um cliente acima para habilitar o faturamento.
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Weight and Price */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800/60 pb-2.5">
            <ShoppingBag className="h-4 w-4 text-emerald-400" />
            2. Balança - Listagem de materiais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2 relative">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Material de Estoque
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={saleMatSearch}
                  onChange={(e) => {
                    setSaleMatSearch(e.target.value);
                    setIsSaleMatDropdownOpen(true);
                    if (!e.target.value.trim()) {
                      setSaleMatId("");
                      setSalePrice("");
                    }
                  }}
                  onFocus={() => setIsSaleMatDropdownOpen(true)}
                  placeholder="Digite para buscar material..."
                  className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 pr-8 font-medium"
                />
                {saleMatSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setSaleMatId("");
                      setSaleMatSearch("");
                      setSalePrice("");
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isSaleMatDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSaleMatDropdownOpen(false)}
                  />
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl divide-y divide-slate-800/40">
                    {materials
                      .filter((m) =>
                        m.name
                          .toLowerCase()
                          .includes(saleMatSearch.toLowerCase()),
                      )
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            handleSaleMaterialChange(m.id);
                            setSaleMatSearch(m.name);
                            setIsSaleMatDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-emerald-400 transition-colors font-medium flex justify-between items-center"
                        >
                          <span>{m.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Saldo: {m.stock.toLocaleString("pt-BR")} kg
                          </span>
                        </button>
                      ))}
                    {materials.filter((m) =>
                      m.name
                        .toLowerCase()
                        .includes(saleMatSearch.toLowerCase()),
                    ).length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-500 italic text-center">
                        Nenhum material encontrado para "{saleMatSearch}"
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Quantidade (kg)
              </label>
              <input
                type="number"
                value={saleQty}
                onChange={(e) => setSaleQty(e.target.value)}
                placeholder="Ex: 1500"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                TARA
              </label>
              <input
                type="number"
                value={orderTareWeight}
                onChange={(e) => setOrderTareWeight(e.target.value)}
                placeholder="Ex: 1500"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Impureza (%)
              </label>
              <input
                type="number"
                value={orderImpurities}
                onChange={(e) => setOrderImpurities(e.target.value)}
                placeholder="Ex: 1500"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Preço Praticado (R$ / kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/10 px-4 py-2 rounded-xl text-xs font-bold uppercase cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Incluir no Pedido
            </button>
          </div>

          {/* Staged Cart list */}
          <div className="border border-slate-800 rounded-xl overflow-hidden mt-4">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/30 text-slate-500 font-mono">
                  <th className="p-3">Material Vendido</th>
                  <th className="p-3 text-right">Peso Despachado</th>
                  <th className="p-3 text-right">Preço por kg</th>
                  <th className="p-3 text-right">Valor Líquido</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {saleCart.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-800/10">
                    <td className="p-3 text-slate-200 font-semibold">
                      {item.name}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-100">
                      {item.quantity.toLocaleString("pt-BR")} kg
                    </td>
                    <td className="p-3 text-right font-mono">
                      R$ {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      R${" "}
                      {item.total.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => {}}
                        className="p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {saleCart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      Nenhum material adicionado à carga de venda. Utilize a
                      barra superior.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Checkout column (Right) */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 h-fit space-y-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-800/60 pb-2.5">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          3. Faturamento & Recebimento
        </h3>

        {/* Calculations Card */}
        <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-800">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Subtotal Lote:</span>
            <span className="font-mono font-bold text-slate-200">
              R${" "}
              {saleSubtotal.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5">
            <span>Conceder Desconto (R$):</span>
            <input
              type="number"
              value={saleDiscount}
              onChange={(e) => setSaleDiscount(e.target.value)}
              className="w-24 bg-slate-900 border border-slate-800 text-slate-100 rounded-lg px-2 py-1 text-right font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="flex justify-between text-sm font-bold border-t border-slate-800/60 pt-2 text-slate-200 mt-2">
            <span>Total Faturado:</span>
            <span className="font-mono text-emerald-400 text-base">
              R${" "}
              {saleTotal.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        <form onSubmit={() => {}} className="space-y-4">
          {/* Payment Method */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Meio de Recebimento
            </label>
            <select
              value={salePaymentMethod}
              onChange={(e) => setSalePaymentMethod(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="Pix">Pix Sincronizado</option>
              <option value="Boleto Bancário">Boleto Bancário</option>
              <option value="Transferência Bancária">
                Transferência TED / Pix
              </option>
              <option value="Dinheiro">Dinheiro Espécie (Escritório)</option>
            </select>
          </div>

          {/* Payment terms */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Prazo de Faturamento
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "vista", label: "À Vista" },
                { id: "30d", label: "30 Dias" },
                { id: "60d", label: "60 Dias" },
              ].map((term) => (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => {}}
                  className={`py-2 rounded-lg text-[10px] font-bold uppercase transition-colors border ${
                    salePaymentTerms === term.id
                      ? "bg-emerald-400 border-transparent text-slate-950"
                      : "bg-slate-950/20 border-slate-800 text-slate-400"
                  }`}
                >
                  {term.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bank accounts list */}
          {salePaymentTerms === "vista" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Liquidar na Conta
              </label>
              <select
                value={saleBankSelect}
                onChange={(e) => setSaleBankSelect(e.target.value)}
                className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
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
          )}

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Observações / Romaneio
            </label>
            <textarea
              value={saleNotes}
              onChange={(e) => setSaleNotes(e.target.value)}
              placeholder="Informar número do caminhão, placa do veículo ou dados complementares do romaneio."
              rows={2}
              className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="h-4.5 w-4.5" />
            Confirmar e Faturar Venda
          </button>
        </form>
      </div>
    </div>
  );
}
