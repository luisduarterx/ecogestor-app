import {
  AlertCircle,
  ArrowUpRight,
  Check,
  DollarSign,
  Edit3,
  FolderPlus,
  Package,
  Plus,
  Printer,
  Save,
  Search,
  Sliders,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { LayoutBase } from "../../components/LayoutBase";
export function Precos() {
  const handlePriceOverrideChange = (matName: string, value: string) => {
    setTablePricesEdit((prev) => ({
      ...prev,
      [matName]: value,
    }));
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [editBuyPrice, setEditBuyPrice] = useState("");
  const [editSellPrice, setEditSellPrice] = useState("");
  const [editMinQty, setEditMinQty] = useState("");
  const [editError, setEditError] = useState("");
  const [priceTable, setPriceTable] = useState([]);
  const [activeTable, setActiveTable] = useState({});
  const [filteredPrices, setFilteredPrices] = useState([
    {
      sellPrice: 12,
      buyPrice: 23,
      id: 2,
      materialName: "MATERIAL",
      category: "CATEGORIO",
      minQty: 2,
      lastUpdated: "232323",
    },
  ]);
  const handleOpenEditModal = (item) => {
    setSelectedItemId(item.id);
    setEditBuyPrice(item.buyPrice.toString());
    setEditSellPrice(item.sellPrice.toString());
    setEditMinQty(item.minQty.toString());
    setEditError("");
    setIsEditModalOpen(true);
  };
  const [activeSubTab, setActiveSubTab] = useState<
    "tariffs" | "materials" | "customTables"
  >("tariffs");

  // Export/Print Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printIsCustom, setPrintIsCustom] = useState(false);

  // Search and general filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const handleSavePrices = (e: React.FormEvent) => {
    e.preventDefault();

    setIsEditModalOpen(false);
  };
  const [newMatName, setNewMatName] = useState("");
  const [newMatCategory, setNewMatCategory] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [newMatMinStock, setNewMatMinStock] = useState("500");
  const [newMatUnit, setNewMatUnit] = useState<"kg" | "ton">("kg");
  const [newMatColor, setNewMatColor] = useState("#10b981"); // Emerald 500 default
  const [materialFormError, setMaterialFormError] = useState("");
  const [materialFormSuccess, setMaterialFormSuccess] = useState("");
  const [uniqueCategories, setUniqueCategories] = useState([]);

  // Category creation states
  const [newCategoryNameInput, setNewCategoryNameInput] = useState("");
  const [categoryFormError, setCategoryFormError] = useState("");
  const [categoryFormSuccess, setCategoryFormSuccess] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("TAB-001");
  const [newTableName, setNewTableName] = useState("");
  const [newTableDesc, setNewTableDesc] = useState("");
  const [tablePricesEdit, setTablePricesEdit] = useState<
    Record<string, string>
  >({});
  const [materials, setMaterials] = useState([
    {
      id: 2,
      name: "MATERIAL",
      category: "teste",
      buyPrice: 23,
      minStock: 234,
      unity: "KG",
    },
  ]);
  const [customPriceTables, setCustomPriceTables] = useState([
    {
      name: "padrao",
      isDefault: false,
      description: "FERRO VELHO",
      id: 12,
      buyPrices: [],
    },
    {
      name: "padrao",
      isDefault: true,
      description: "FERRO VELHO",
      id: 13,
      buyPrices: [],
    },
  ]);
  const [tableEditMsg, setTableEditMsg] = useState("");
  return (
    <LayoutBase activeTab="precos" pageTitle="PRECOS">
      <div className="space-y-6 font-sans">
        {/* Dynamic Main Header Banner */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              Precificação & Gestão de Catálogo
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Cadastre novos materiais, gerencie categorias personalizadas e
              configure tabelas de compra exclusivas por fornecedor.
            </p>
          </div>

          {/* Beautiful Sub-tab Selectors */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveSubTab("tariffs")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === "tariffs"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Tabela Geral (Pátio)
            </button>
            <button
              onClick={() => setActiveSubTab("materials")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeSubTab === "materials"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Plus className="h-3.5 w-3.5" /> Materiais & Categoria
            </button>
            <button
              onClick={() => setActiveSubTab("customTables")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                activeSubTab === "customTables"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" /> Tabelas Fornecedores
            </button>
          </div>
        </div>

        {/* ========================================================================================= */}
        {/* SUBTAB 1: GENERAL TARIFFS */}
        {/* ========================================================================================= */}
        {activeSubTab === "tariffs" && (
          <div className="space-y-6">
            {/* Toolbar filters */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
              {/* Search */}
              <div className="relative md:col-span-2">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar tarifas por nome de material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 text-xs border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                />
              </div>

              {/* Dynamic Category Select */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="all">Todas as Categorias</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing List Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-100">
                    Margens Operacionais & Tarifas do Pátio
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md mt-1 inline-block">
                    Preços vigentes para público geral
                  </span>
                </div>
                <button
                  onClick={() => {
                    setPrintIsCustom(false);
                    setIsPrintModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all border border-slate-700 hover:border-slate-600 select-none cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-emerald-400" />
                  Compartilhar / Imprimir
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/10 text-slate-500 font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Material Comercial</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-right">
                        Compra (Entrada) / kg
                      </th>
                      <th className="py-3 px-4 text-right">
                        Venda (Saída) / kg
                      </th>
                      <th className="py-3 px-4 text-center">Margem Lucro</th>
                      <th className="py-3 px-4 text-right">Qtd Lote Mín</th>
                      <th className="py-3 px-4 text-center">Última Revisão</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredPrices.map((item) => {
                      const profitMargin = item.sellPrice - item.buyPrice;

                      const marginPercent =
                        item.sellPrice > 0
                          ? ((profitMargin / item.sellPrice) * 100).toFixed(0)
                          : "0";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/10 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-slate-500 font-bold">
                            {item.id}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-200">
                            {item.materialName}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right text-emerald-400 font-bold font-mono">
                            R$ {item.buyPrice.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-sky-400 font-bold font-mono">
                            R$ {item.sellPrice.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <ArrowUpRight className="h-3 w-3" />
                              +R$ {profitMargin.toFixed(2)} ({marginPercent}%)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            {item.minQty.toLocaleString("pt-BR")} kg
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500">
                            {item.lastUpdated}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => () => {}}
                              className="p-1.5 hover:bg-emerald-400/10 text-slate-500 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                              title="Revisar Tarifa"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredPrices.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-8 text-center text-slate-500 text-xs"
                        >
                          Nenhum material encontrado para os filtros ativos.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* SUBTAB 2: ADD MATERIALS & DYNAMIC CATEGORIES */}
        {/* ========================================================================================= */}
        {activeSubTab === "materials" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column containing Forms */}
            <div className="space-y-6 self-start">
              {/* Form 1: Novo Material Comercial */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800/60 pb-3">
                  <Package className="h-4 w-4 text-emerald-400" />
                  Novo Material Comercial
                </h3>

                {materialFormError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{materialFormError}</span>
                  </div>
                )}

                {materialFormSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400 flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{materialFormSuccess}</span>
                  </div>
                )}

                <form onSubmit={() => {}} className="space-y-4 text-xs">
                  {/* Material Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nome Comercial do Material *
                    </label>
                    <input
                      type="text"
                      required
                      value={newMatName}
                      onChange={(e) => setNewMatName(e.target.value)}
                      placeholder="Ex: PET Azul Limpo (Fardo)"
                      className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Category selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Categoria de Materiais *
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsNewCategory(!isNewCategory)}
                        className="text-[10px] text-emerald-400 font-bold hover:underline"
                      >
                        {isNewCategory
                          ? "Escolher Existente"
                          : "+ Criar Nova Categoria"}
                      </button>
                    </div>

                    {isNewCategory ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={customCategoryName}
                          onChange={(e) =>
                            setCustomCategoryName(e.target.value)
                          }
                          placeholder="Nova categoria (Ex: Metais Nobres)"
                          className="flex-1 bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        />
                      </div>
                    ) : (
                      <select
                        value={newMatCategory}
                        onChange={(e) => setNewMatCategory(e.target.value)}
                        className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      >
                        {uniqueCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Unit & Min stock */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Unidade de Medida
                      </label>
                      <select
                        value={newMatUnit}
                        onChange={(e) => setNewMatUnit(e.target.value as any)}
                        className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      >
                        <option value="kg">Quilos (kg)</option>
                        <option value="ton">Tonelada (ton)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Estoque Mínimo Alerta (kg)
                      </label>
                      <input
                        type="number"
                        value={newMatMinStock}
                        onChange={(e) => setNewMatMinStock(e.target.value)}
                        placeholder="Ex: 500"
                        className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Color label */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Identificador Visual (Cor do Gráfico)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={newMatColor}
                        onChange={(e) => setNewMatColor(e.target.value)}
                        className="w-10 h-10 bg-transparent border-0 rounded-lg cursor-pointer"
                      />
                      <span className="text-[10px] font-mono text-slate-500 uppercase">
                        {newMatColor}
                      </span>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="h-4 w-4" /> Cadastrar Material
                  </button>
                </form>
              </div>

              {/* Form 2: Nova Categoria de Materiais */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800/60 pb-3">
                  <FolderPlus className="h-4 w-4 text-emerald-400" />
                  Nova Categoria de Materiais
                </h3>

                {categoryFormError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-xs text-rose-400 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{categoryFormError}</span>
                  </div>
                )}

                {categoryFormSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs text-emerald-400 flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{categoryFormSuccess}</span>
                  </div>
                )}

                <form onSubmit={() => {}} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nome da Categoria *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCategoryNameInput}
                      onChange={(e) => setNewCategoryNameInput(e.target.value)}
                      placeholder="Ex: Metais Nobres, Plásticos Especiais"
                      className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="h-4 w-4" /> Criar Categoria
                  </button>
                </form>
              </div>
            </div>

            {/* Current Catalogue Grid (Right Column, spans 2) */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/15 flex items-center justify-between">
                <h3 className="font-bold text-slate-100">
                  Catálogo de Materiais Cadastrados
                </h3>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-1 rounded-md">
                  {materials.length} materiais cadastrados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/10 text-slate-500 font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Nome do Material</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-center">Unid.</th>
                      <th className="py-3 px-4 text-right">Estoque Mínimo</th>
                      <th className="py-3 px-4 text-center">Cor Ativa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {materials.map((m) => (
                      <tr
                        key={m.id}
                        className="hover:bg-slate-800/10 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-500 font-bold">
                          {m.id}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">
                          {m.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                            {m.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono uppercase">
                          {m.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {m.minStock.toLocaleString("pt-BR")} kg
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className="inline-block w-4 h-4 rounded-full border border-slate-800"
                            style={{ backgroundColor: m.color }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================================= */}
        {/* SUBTAB 3: DIFFERENTIATED SUPPLIER PRICING */}
        {/* ========================================================================================= */}
        {activeSubTab === "customTables" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tables Registry (Left Column) */}
            <div className="space-y-6 self-start">
              {/* Create Table Card */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 border-b border-slate-800/60 pb-3">
                  <FolderPlus className="h-4 w-4 text-emerald-400" />
                  Criar Nova Tabela Especial
                </h3>

                <form onSubmit={() => {}} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nome Comercial da Tabela *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      placeholder="Ex: Tabela Fornecedores Grandes"
                      className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Descrição / Justificativa Comercial
                    </label>
                    <textarea
                      value={newTableDesc}
                      onChange={(e) => setNewTableDesc(e.target.value)}
                      placeholder="Ex: Aplicada a parceiros com faturamento acima de 10 toneladas por mês."
                      rows={2}
                      className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Criar Tabela
                  </button>
                </form>
              </div>

              {/* Select/View Existing Custom Tables */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tabelas Disponíveis
                </h3>

                <div className="space-y-2">
                  {customPriceTables.map((tbl) => (
                    <button
                      key={tbl.id}
                      onClick={() => setSelectedTableId(tbl.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer ${
                        selectedTableId === tbl.id
                          ? "bg-slate-950 border-emerald-500/50 ring-1 ring-emerald-500/10"
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-slate-200">
                          {tbl.name}
                        </span>
                        <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded-md text-slate-400 font-bold">
                          {tbl.isDefault ? "PADRÃO" : tbl.id}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {tbl.description}
                      </p>
                      <span className="text-[10px] text-emerald-400 font-bold mt-1">
                        {tbl.isDefault
                          ? "Preço Padrão do Pátio"
                          : `${Object.keys(tbl.buyPrices).length} tarifas especiais configuradas`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Overrides Matrix (Right Column, spans 2) */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                {/* Card Header with table description */}
                <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/15">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider font-mono">
                        Gerenciador de Tarifas Especiais
                      </span>
                      <h3 className="text-md font-bold text-slate-100 mt-0.5">
                        {activeTable?.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        {activeTable?.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                      {/* Save feedback */}
                      {tableEditMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-xs text-emerald-400 flex items-center gap-1.5">
                          <Check className="h-4 w-4 animate-bounce" />
                          <span>{tableEditMsg}</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setPrintIsCustom(true);
                          setIsPrintModalOpen(true);
                        }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-2 transition-all border border-slate-700 hover:border-slate-600 select-none cursor-pointer"
                      >
                        <Printer className="h-4 w-4 text-emerald-400" />
                        Compartilhar / Imprimir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overrides Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/10 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="py-3 px-4">Material de Compra</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4 text-right">
                          Tarifa Base Pátio
                        </th>
                        <th className="py-3 px-4 text-center">
                          Tarifa Personalizada (R$ / kg)
                        </th>
                        <th className="py-3 px-4 text-center">
                          Status de Preço
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {materials.map((mat) => {
                        const basePriceItem = priceTable.find(
                          (p) => p.materialName === mat.name,
                        );
                        const basePrice = basePriceItem
                          ? basePriceItem.buyPrice
                          : 1.0;

                        const overridePriceValue =
                          tablePricesEdit[mat.name] || "";
                        const hasOverride = overridePriceValue.trim() !== "";

                        return (
                          <tr
                            key={mat.id}
                            className="hover:bg-slate-800/10 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-slate-200">
                              {mat.name}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                                {mat.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-400">
                              R$ {basePrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {activeTable?.isDefault ? (
                                <span className="text-slate-500 text-[11px] italic">
                                  Imutável na tabela base
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <span className="text-slate-500 text-xs">
                                    R$
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder={basePrice.toFixed(2)}
                                    value={overridePriceValue}
                                    onChange={(e) =>
                                      handlePriceOverrideChange(
                                        mat.name,
                                        e.target.value,
                                      )
                                    }
                                    className="w-24 text-center bg-slate-950/40 text-emerald-400 border border-slate-800 rounded-xl px-2 py-1.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {activeTable?.isDefault ? (
                                <span className="text-slate-500">Padrão</span>
                              ) : hasOverride ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  Preço Especial
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-500">
                                  Usar Base Pátio
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Button Footer */}
              {!activeTable?.isDefault && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/15 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" /> Salvar Alterações da Tabela
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EDIT STANDARD TARIFF MODAL (Maintained from original Price Table tab) */}
        {isEditModalOpen && (
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
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-bold text-slate-100">
                    Atualizar Preços Praticados
                  </h3>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSavePrices} className="p-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-200">
                  Material:{" "}
                  <span className="text-emerald-400">
                    {
                      priceTable.find((p) => p.id === selectedItemId)
                        ?.materialName
                    }
                  </span>
                </h4>

                {editError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-lg text-xs text-rose-400">
                    {editError}
                  </div>
                )}

                {/* Buy Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Preço Máximo de Compra (R$ / kg)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={editBuyPrice}
                      onChange={(e) => setEditBuyPrice(e.target.value)}
                      className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                    />
                  </div>
                </div>

                {/* Sell Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Preço Alvo de Venda Industrial (R$ / kg)
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

                {/* Min Qty */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Lote Mínimo de Faturamento (kg)
                  </label>
                  <input
                    type="number"
                    value={editMinQty}
                    onChange={(e) => setEditMinQty(e.target.value)}
                    className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                  />
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer"
                  >
                    Confirmar Ajuste
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* EXPORT AND PRINT PRICE TABLE MODAL */}
      </div>
    </LayoutBase>
  );
}
