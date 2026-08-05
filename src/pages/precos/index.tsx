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
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { LayoutBase } from "../../components/LayoutBase";
import PriceTablePrintModal from "../../components/modals/PriceTablePrintModal";
import {
  useCreateMaterial,
  useCreateMaterialCategory,
  useCreateTable,
  useDeleteTable,
  useMaterialCategories,
  useMaterials,
  useTable,
  useTables,
  useUpdateTable,
} from "../../utils/queries";
import type { ApiError } from "../../utils/types";
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
  const [printTableId, setPrintTableId] = useState<number | null>(null);

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
  const [newMatBuyPrice, setNewMatBuyPrice] = useState("");
  const [newMatSellPrice, setNewMatSellPrice] = useState("");
  const [materialFormError, setMaterialFormError] = useState("");
  const [materialFormSuccess, setMaterialFormSuccess] = useState("");

  // Category creation states
  const [newCategoryNameInput, setNewCategoryNameInput] = useState("");
  const [categoryFormError, setCategoryFormError] = useState("");
  const [categoryFormSuccess, setCategoryFormSuccess] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [newTableName, setNewTableName] = useState("");
  const [editingTableName, setEditingTableName] = useState("");
  const [tableFormError, setTableFormError] = useState("");
  const [deleteTableConfirmationOpen, setDeleteTableConfirmationOpen] =
    useState(false);
  const [tablePricesEdit, setTablePricesEdit] = useState<
    Record<string, string>
  >({});
  const [tableEditMsg, setTableEditMsg] = useState("");
  const [catalogView, setCatalogView] = useState<"materials" | "categories">(
    "materials",
  );
  const categoriesQuery = useMaterialCategories();
  const catalogMaterialsQuery = useMaterials();
  const createCategory = useCreateMaterialCategory();
  const createMaterial = useCreateMaterial();
  const tablesQuery = useTables();
  const defaultTable = tablesQuery.data?.find((table) => table.padrao);
  const defaultTableQuery = useTable(defaultTable?.id);
  const selectedTableQuery = useTable(selectedTableId ?? undefined);
  const createTable = useCreateTable();
  const updateTable = useUpdateTable(selectedTableId ?? undefined);
  const deleteTable = useDeleteTable();
  const managedTables = tablesQuery.data ?? [];
  const selectedTable = managedTables.find(
    (table) => table.id === selectedTableId,
  );

  useEffect(() => {
    if (!selectedTableQuery.data || !catalogMaterialsQuery.data) return;

    setEditingTableName(selectedTableQuery.data.nome);
    setTablePricesEdit(
      Object.fromEntries(
        catalogMaterialsQuery.data.map((material) => {
          const customPrice = selectedTableQuery.data?.materiais.find(
            (price) => price.materialID === material.id,
          )?.preco_compra;
          const basePrice = defaultTableQuery.data?.materiais.find(
            (price) => price.materialID === material.id,
          )?.preco_compra;
          return [material.id, String(customPrice ?? basePrice ?? "")];
        }),
      ),
    );
  }, [
    catalogMaterialsQuery.data,
    defaultTableQuery.data,
    selectedTableQuery.data,
  ]);

  const defaultTablePrices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");

    return (defaultTableQuery.data?.materiais ?? [])
      .map((tablePrice) => {
        const material = catalogMaterialsQuery.data?.find(
          (item) => item.id === tablePrice.materialID,
        );
        if (!material) return null;

        return {
          id: material.id,
          materialName: material.nome,
          category: material.categoria.nome,
          buyPrice: tablePrice.preco_compra,
          sellPrice: material.preco_venda,
          lastUpdated: new Intl.DateTimeFormat("pt-BR").format(
            new Date(material.editado_em),
          ),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .filter(
        (item) =>
          !normalizedSearch ||
          item.materialName
            .toLocaleLowerCase("pt-BR")
            .includes(normalizedSearch),
      )
      .filter(
        (item) => categoryFilter === "all" || item.category === categoryFilter,
      );
  }, [
    catalogMaterialsQuery.data,
    categoryFilter,
    defaultTableQuery.data,
    searchTerm,
  ]);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryFormError("");
    setCategoryFormSuccess("");

    if (newCategoryNameInput.trim().length < 3) {
      setCategoryFormError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    try {
      const category = await createCategory.mutateAsync(
        newCategoryNameInput.trim(),
      );
      setNewCategoryNameInput("");
      setNewMatCategory(String(category.id));
      setCategoryFormSuccess(`Categoria ${category.nome} criada com sucesso.`);
    } catch (error) {
      setCategoryFormError(
        (error as ApiError).mensagem ?? "Não foi possível criar a categoria.",
      );
    }
  }

  async function handleCreateMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMaterialFormError("");
    setMaterialFormSuccess("");

    try {
      let categoryID = Number(newMatCategory);
      if (isNewCategory) {
        if (customCategoryName.trim().length < 3) {
          setMaterialFormError("Informe o nome da nova categoria.");
          return;
        }
        const category = await createCategory.mutateAsync(
          customCategoryName.trim(),
        );
        categoryID = category.id;
      }

      if (
        !categoryID ||
        newMatName.trim().length < 3 ||
        Number(newMatBuyPrice) < 0 ||
        Number(newMatSellPrice) < 0 ||
        newMatBuyPrice === "" ||
        newMatSellPrice === ""
      ) {
        setMaterialFormError(
          "Preencha nome, categoria, preço de compra e preço de venda.",
        );
        return;
      }

      const material = await createMaterial.mutateAsync({
        catID: categoryID,
        nome: newMatName.trim(),
        preco_compra: Number(newMatBuyPrice),
        preco_venda: Number(newMatSellPrice),
      });

      setNewMatName("");
      setNewMatBuyPrice("");
      setNewMatSellPrice("");
      setCustomCategoryName("");
      setIsNewCategory(false);
      setMaterialFormSuccess(`Material ${material.nome} criado com sucesso.`);
    } catch (error) {
      setMaterialFormError(
        (error as ApiError).mensagem ?? "Não foi possível criar o material.",
      );
    }
  }

  function tableMaterialsPayload() {
    return (catalogMaterialsQuery.data ?? []).map((material) => ({
      id: material.id,
      preco_compra: Number(tablePricesEdit[String(material.id)]),
    }));
  }

  async function handleCreateTable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTableFormError("");
    setTableEditMsg("");

    if (newTableName.trim().length < 3) {
      setTableFormError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }

    const initialPrices = (catalogMaterialsQuery.data ?? [])
      .map((material) => {
        const price = defaultTableQuery.data?.materiais.find(
          (item) => item.materialID === material.id,
        )?.preco_compra;
        return price && price > 0
          ? { id: material.id, preco_compra: price }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    try {
      const table = await createTable.mutateAsync({
        nome: newTableName.trim(),
        padrao: !defaultTable,
        materiais: initialPrices,
      });
      setNewTableName("");
      setSelectedTableId(table.id);
      setTableEditMsg(`Tabela ${table.nome} criada com sucesso.`);
    } catch (error) {
      setTableFormError(
        (error as ApiError).mensagem ?? "Não foi possível criar a tabela.",
      );
    }
  }

  async function handleSaveTable() {
    setTableFormError("");
    setTableEditMsg("");
    const tableMaterials = tableMaterialsPayload();

    if (
      selectedTableId === null ||
      editingTableName.trim().length < 3 ||
      tableMaterials.some(
        (material) =>
          !Number.isFinite(material.preco_compra) ||
          material.preco_compra <= 0,
      )
    ) {
      setTableFormError(
        "Informe o nome e um preço de compra positivo para todos os materiais.",
      );
      return;
    }

    try {
      await updateTable.mutateAsync({
        nome: editingTableName.trim(),
        materiais: tableMaterials,
      });
      setTableEditMsg("Tabela e preços atualizados com sucesso.");
    } catch (error) {
      setTableFormError(
        (error as ApiError).mensagem ?? "Não foi possível atualizar a tabela.",
      );
    }
  }

  async function handleDeleteTable() {
    if (selectedTableId === null) return;
    if (selectedTable?.padrao) {
      setTableFormError("A tabela padrão não pode ser excluída.");
      return;
    }
    setTableFormError("");
    setTableEditMsg("");

    try {
      await deleteTable.mutateAsync(selectedTableId);
      setSelectedTableId(null);
      setEditingTableName("");
      setTablePricesEdit({});
      setDeleteTableConfirmationOpen(false);
    } catch (error) {
      setTableFormError(
        (error as ApiError).mensagem ?? "Não foi possível excluir a tabela.",
      );
      setDeleteTableConfirmationOpen(false);
    }
  }

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
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.id} value={category.nome}>
                    {category.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing List Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-100">
                    {defaultTable?.nome ?? "Tabela Padrão do Pátio"}
                  </h3>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md mt-1 inline-block">
                    Preços vigentes para público geral
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (defaultTable) setPrintTableId(defaultTable.id);
                  }}
                  disabled={!defaultTable}
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
                    {defaultTablePrices.map((item) => {
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
                            —
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

                    {!tablesQuery.isPending &&
                      !defaultTableQuery.isPending &&
                      defaultTablePrices.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-8 text-center text-slate-500 text-xs"
                        >
                          {defaultTable
                            ? "Nenhum material encontrado para os filtros ativos."
                            : "Nenhuma tabela padrão foi encontrada."}
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

                <form
                  onSubmit={(event) => void handleCreateMaterial(event)}
                  className="space-y-4 text-xs"
                >
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
                        required
                        value={newMatCategory}
                        onChange={(e) => setNewMatCategory(e.target.value)}
                        className="w-full bg-slate-950/40 text-slate-300 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      >
                        <option value="">Selecione...</option>
                        {(categoriesQuery.data ?? []).map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Preço de compra (R$ / kg) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={newMatBuyPrice}
                        onChange={(e) => setNewMatBuyPrice(e.target.value)}
                        className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Preço de venda (R$ / kg) *
                      </label>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={newMatSellPrice}
                        onChange={(e) => setNewMatSellPrice(e.target.value)}
                        className="w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                      />
                    </div>
                  </div>

                  {/* Unit & Min stock */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Unidade de Medida
                      </label>
                      <select
                        value={newMatUnit}
                        onChange={(e) =>
                          setNewMatUnit(e.target.value as "kg" | "ton")
                        }
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
                    disabled={
                      createMaterial.isPending || createCategory.isPending
                    }
                    className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="h-4 w-4" />
                    {createMaterial.isPending
                      ? "Cadastrando..."
                      : "Cadastrar Material"}
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

                <form
                  onSubmit={(event) => void handleCreateCategory(event)}
                  className="space-y-4 text-xs"
                >
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
                    disabled={createCategory.isPending}
                    className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Plus className="h-4 w-4" />
                    {createCategory.isPending
                      ? "Criando..."
                      : "Criar Categoria"}
                  </button>
                </form>
              </div>
            </div>

            {/* Current Catalogue Grid (Right Column, spans 2) */}
            <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-100">
                    Catálogo de Materiais Cadastrados
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {catalogView === "materials"
                      ? `${catalogMaterialsQuery.data?.length ?? 0} materiais cadastrados`
                      : `${categoriesQuery.data?.length ?? 0} categorias cadastradas`}
                  </span>
                </div>
                <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-1">
                  <button
                    type="button"
                    onClick={() => setCatalogView("materials")}
                    className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                      catalogView === "materials"
                        ? "bg-emerald-400 text-slate-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Materiais
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogView("categories")}
                    className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                      catalogView === "categories"
                        ? "bg-emerald-400 text-slate-950"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Categorias
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {catalogView === "materials" ? (
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/10 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Nome do Material</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4 text-right">Preço Compra</th>
                        <th className="py-3 px-4 text-right">Preço Venda</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(catalogMaterialsQuery.data ?? []).map((material) => (
                        <tr
                          key={material.id}
                          className="hover:bg-slate-800/10 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono text-slate-500 font-bold">
                            {material.id}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200">
                            {material.nome}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                              {material.categoria.nome}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            R$ {material.preco_compra.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-400">
                            R$ {material.preco_venda.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                              ATIVO
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/10 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Nome da Categoria</th>
                        <th className="py-3 px-4 text-right">Materiais</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {(categoriesQuery.data ?? []).map((category) => (
                        <tr
                          key={category.id}
                          className="hover:bg-slate-800/10 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">
                            {category.id}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-200">
                            {category.nome}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-300">
                            {(catalogMaterialsQuery.data ?? []).filter(
                              (material) =>
                                material.categoria.id === category.id,
                            ).length}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
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
                  Criar Nova Tabela
                </h3>

                <form
                  onSubmit={(event) => void handleCreateTable(event)}
                  className="space-y-4 text-xs"
                >
                  {tableFormError && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
                      {tableFormError}
                    </div>
                  )}
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
                  <button
                    type="submit"
                    disabled={createTable.isPending}
                    className="w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    {createTable.isPending ? "Criando..." : "Criar Tabela"}
                  </button>
                </form>
              </div>

              {/* Select/View Existing Custom Tables */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Tabelas Disponíveis
                </h3>

                <div className="space-y-2">
                  {managedTables.map((tbl) => (
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
                          {tbl.nome}
                        </span>
                        <span className="text-[9px] font-mono bg-slate-800 px-2 py-0.5 rounded-md text-slate-400 font-bold">
                          {tbl.padrao ? "PADRÃO" : `#${tbl.id}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold mt-1">
                        {tbl.padrao ? "Tabela geral do pátio" : "Tabela de fornecedor"}
                        {" · "}
                        {new Intl.DateTimeFormat("pt-BR").format(new Date(tbl.updatedAt))}
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
                        Gerenciador de Tabelas e Tarifas
                      </span>
                      {selectedTableId !== null ? (
                        <input
                          value={editingTableName}
                          onChange={(event) =>
                            setEditingTableName(event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm font-bold text-slate-100"
                        />
                      ) : (
                        <h3 className="mt-1 text-sm font-bold text-slate-400">
                          Selecione uma tabela para gerenciar
                        </h3>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                      {/* Save feedback */}
                      {tableEditMsg && (
                        <div className="bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-xs text-emerald-400 flex items-center gap-1.5">
                          <Check className="h-4 w-4 animate-bounce" />
                          <span>{tableEditMsg}</span>
                        </div>
                      )}

                      {selectedTableId !== null && !selectedTable?.padrao && (
                        <button
                          type="button"
                          onClick={() => setDeleteTableConfirmationOpen(true)}
                          disabled={deleteTable.isPending}
                          className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-slate-950 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" /> Excluir
                        </button>
                      )}

                      {selectedTableId !== null && (
                        <button
                          type="button"
                          onClick={() => setPrintTableId(selectedTableId)}
                          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
                        >
                          <Printer className="h-4 w-4 text-emerald-400" />
                          Compartilhar / Imprimir
                        </button>
                      )}
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
                      {(catalogMaterialsQuery.data ?? []).map((mat) => {
                        const basePrice =
                          defaultTableQuery.data?.materiais.find(
                            (price) => price.materialID === mat.id,
                          )?.preco_compra ?? 0;

                        const overridePriceValue =
                          tablePricesEdit[String(mat.id)] || "";
                        const hasOverride = overridePriceValue.trim() !== "";

                        return (
                          <tr
                            key={mat.id}
                            className="hover:bg-slate-800/10 transition-colors"
                          >
                            <td className="py-3 px-4 font-bold text-slate-200">
                              {mat.nome}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono">
                                {mat.categoria.nome}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-400">
                              R$ {basePrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {selectedTableId === null ? (
                                <span className="text-slate-500 text-[11px] italic">
                                  Selecione uma tabela
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
                                        String(mat.id),
                                        e.target.value,
                                      )
                                    }
                                    className="w-24 text-center bg-slate-950/40 text-emerald-400 border border-slate-800 rounded-xl px-2 py-1.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {selectedTable?.padrao ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Preço Padrão
                                </span>
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
              {selectedTableId !== null && (
                <div className="p-4 border-t border-slate-800 bg-slate-950/15 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void handleSaveTable()}
                    disabled={updateTable.isPending}
                    className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateTable.isPending
                      ? "Salvando..."
                      : "Salvar Alterações da Tabela"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {deleteTableConfirmationOpen && selectedTable && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-table-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="delete-table-title"
                    className="text-base font-bold text-slate-100"
                  >
                    Excluir tabela?
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    A tabela <strong className="text-slate-200">{selectedTable.nome}</strong>{" "}
                    e todos os preços de compra vinculados a ela serão
                    removidos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteTableConfirmationOpen(false)}
                  disabled={deleteTable.isPending}
                  aria-label="Fechar confirmação"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTableConfirmationOpen(false)}
                  disabled={deleteTable.isPending}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDeleteTable()}
                  disabled={deleteTable.isPending}
                  className="flex items-center gap-2 rounded-xl bg-rose-400 px-4 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-rose-300 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteTable.isPending ? "Excluindo..." : "Excluir tabela"}
                </button>
              </div>
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
        {printTableId !== null && (
          <PriceTablePrintModal
            tableId={printTableId}
            materials={catalogMaterialsQuery.data ?? []}
            baseTable={defaultTableQuery.data}
            onClose={() => setPrintTableId(null)}
          />
        )}
      </div>
    </LayoutBase>
  );
}
