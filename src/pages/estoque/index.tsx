import {
  ArrowRightLeft,
  Database,
  FileText,
  Package,
  Plus,
  Search,
  ShieldAlert,
} from "lucide-react";
import { LayoutBase } from "../../components/LayoutBase";
import { useState } from "react";
import { motion } from "motion/react";
import InventoryMovementModal from "../../components/modals/InventoryMovementModal";
import InventoryConversionModal from "../../components/modals/InventoryConversionModel";

export function Estoque() {
  const [activeSubTab, setActiveSubTab] = useState("statement");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [materials, setMaterials] = useState([]);
  const [totalInventoryWeight] = useState(0);

  const [filteredTransactions] = useState([
    {
      id: "MOV-001",
      materialId: "MAT-001",
      materialName: "PET Transparente (Fardo)",
      type: "entrada",
      quantity: 1200,
      weight: 1200,
      unit: "kg",
      date: "2025-07-01",
      description: "Compra de material de Recicla Vale",
      entityName: "Cooperativa Recicla Vale",
    },
  ]);
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [transactionTypeFilter] = useState("");
  const [filteredMaterials] = useState([
    {
      id: 1,
      stock: 12,
      minStock: 10,
      category: "essa",
      name: "Cobre Mel",
      totalValue: 234,
      averageCost: 2,
      color: "#f1f1f1",
    },
    {
      id: 2,
      stock: 12,
      minStock: 10,
      category: "essa",
      name: "Cobre Mel",
      totalValue: 234,
      averageCost: 2,
      color: "#f1f1f1",
    },
    {
      id: 3,
      stock: 12,
      minStock: 10,
      category: "essa",
      name: "Cobre Mel",
      totalValue: 234,
      averageCost: 2,
      color: "#f1f1f1",
    },
  ]);
  // const []= useState("")

  return (
    <LayoutBase activeTab="dashboard" pageTitle="Dashboard">
      <div className="space-y-6 font-sans">
        {/* Banner / Tab selector */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-400" />
              Controle & Gestão de Estoque
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visualização de inventário em tempo real, emissão de extratos de
              movimentações e refino/conversão industrial.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsConversionModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-sky-500/10 hover:bg-sky-500 hover:text-slate-950 text-sky-400 border border-sky-500/20 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Processar Conversão
            </button>
            <button
              onClick={() => {
                setIsMovementModalOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Ajuste de Saldo
            </button>
          </div>
        </div>

        {/* Sub Tabs Toggle (Levels / Extrato) & Export Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex bg-slate-900/50 border border-slate-800 p-1 rounded-xl max-w-sm w-full sm:w-auto">
            <button
              onClick={() => {
                setActiveSubTab("levels");
              }}
              className={`flex-1 sm:flex-initial sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
                activeSubTab === "levels"
                  ? "bg-emerald-400 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Saldos em Estoque
            </button>
            <button
              onClick={() => {
                setActiveSubTab("statement");
              }}
              className={`flex-1 sm:flex-initial sm:px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
                activeSubTab === "statement"
                  ? "bg-emerald-400 text-slate-950 shadow-md font-extrabold"
                  : "text-slate-400 hover:text-slate-100"
              }`}
            >
              Extrato de Material
            </button>
          </div>

          {/* Quick Exporters */}
          <div className="flex gap-2">
            <button
              onClick={() => {}}
              className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all hover:border-emerald-500/25 select-none"
              title="Exportar dados filtrados para planilha Excel/CSV"
            >
              <FileText className="h-4 w-4 text-emerald-400" />
              Exportar CSV
            </button>
            <button
              onClick={() => {}}
              className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold px-3.5 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all hover:border-rose-500/25 select-none"
              title="Gerar relatório de auditoria em PDF oficial"
            >
              <FileText className="h-4 w-4 text-rose-400" />
              Exportar PDF
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* Search Input */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder={
                activeSubTab === "levels"
                  ? "Filtrar material por nome..."
                  : "Buscar extrato por material, código ou fornecedor..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 text-xs border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="all">Filtro: Todas as Categorias</option>
            <option value="Plásticos">Plásticos (PET, PEAD, PP)</option>
            <option value="Metais">Metais (Alumínio, Cobre, Misto)</option>
            <option value="Papéis">Papéis & Papelão</option>
            <option value="Vidros">Vidro Moído</option>
            <option value="Outros">Outros Materiais</option>
          </select>

          {/* Transaction Type Filter (ONLY on Statement Tab) */}
          {activeSubTab === "statement" ? (
            <select
              value={transactionTypeFilter}
              onChange={(e) => setTransactionTypeFilter(e.target.value as any)}
              className="bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="all">Filtro: Todos os Fluxos</option>
              <option value="entrada">Apenas Entradas (Compras)</option>
              <option value="saída">Apenas Saídas (Vendas)</option>
              <option value="conversão_entrada">
                Apenas Entradas de Processamento
              </option>
              <option value="conversão_saída">
                Apenas Saídas de Processamento
              </option>
            </select>
          ) : (
            <div className="bg-slate-950/20 px-3 py-2 border border-slate-800/80 rounded-lg text-[10px] text-slate-400 flex items-center justify-between font-mono">
              <span>
                Ativos em pátio:{" "}
                <strong className="text-slate-100">
                  {materials.length} itens
                </strong>
              </span>
              <span>
                Estoque total:{" "}
                <strong className="text-emerald-400">
                  {(totalInventoryWeight / 1000).toFixed(1)}t
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* CORE DISPLAY CONTENT */}
        {activeSubTab === "levels" ? (
          /* TAB 1: Saldos em Estoque (Screen 4 equivalent) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.map((m) => {
              const isLowStock = m.stock <= m.minStock;

              return (
                <div
                  key={m.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-700 transition-all duration-150 flex flex-col justify-between"
                >
                  <div>
                    {/* Category Card Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
                      <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                        {m.id}
                      </span>
                      <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-slate-400">
                        {m.category}
                      </span>
                    </div>

                    {/* Material Name & Indicator */}
                    <div className="flex items-start gap-2.5">
                      <span
                        className="h-3 w-3 rounded-full mt-1 shrink-0"
                        style={{ backgroundColor: m.color }}
                      ></span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 leading-tight">
                          {m.name}
                        </h3>
                        {isLowStock && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-400 mt-1 bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                            <ShieldAlert className="h-3 w-3 animate-pulse" />
                            Estoque Crítico (Abaixo do Mínimo)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stocks Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-950/20 p-3 rounded-xl border border-slate-800/60">
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">
                          Saldo Atual
                        </span>
                        <strong className="text-base text-slate-100 font-bold">
                          {m.stock.toLocaleString("pt-BR")} kg
                        </strong>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">
                          Valoração total
                        </span>
                        <strong className="text-base text-emerald-400 font-bold">
                          R${" "}
                          {m.totalValue.toLocaleString("pt-BR", {
                            maximumFractionDigits: 0,
                          })}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: pricing details and safety ranges */}
                  <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div>
                      <span>Custo médio: </span>
                      <strong className="text-slate-200">
                        R$ {m.averageCost.toFixed(2)} / kg
                      </strong>
                    </div>
                    <div>
                      <span>Mín: {m.minStock} kg</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TAB 2: Extrato de Material (Screen 3 equivalent) */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/15 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100">
                  Filtro do Extrato de Inventário
                </h3>
                <p className="text-xs text-slate-400">
                  Total de {filteredTransactions.length} movimentações físicas
                  localizadas.
                </p>
              </div>
              <div className="text-xs bg-slate-800 text-slate-300 font-mono px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                <span>Base Local: Sincronizada</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/10 text-slate-500 font-mono uppercase tracking-wider">
                    <th className="py-3 px-4">Cód Reg</th>
                    <th className="py-3 px-4">Data Ocor</th>
                    <th className="py-3 px-4">Tipo Mov</th>
                    <th className="py-3 px-4">Material</th>
                    <th className="py-3 px-4 text-right">Peso Físico</th>
                    <th className="py-3 px-4">Origem / Destino / Operador</th>
                    <th className="py-3 px-4">Descrição do Loteamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTransactions.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                        {t.id}
                      </td>
                      <td className="py-3.5 px-4">{t.date}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.type === "entrada" ||
                            t.type === "conversão_entrada"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                          }`}
                        >
                          {t.type === "entrada"
                            ? "ENTRADA"
                            : t.type === "conversão_entrada"
                              ? "REFINO: ENTRADA"
                              : t.type === "conversão_saída"
                                ? "REFINO: SAÍDA"
                                : "SAÍDA"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">
                        {t.materialName}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold font-mono ${
                          t.type === "entrada" || t.type === "conversão_entrada"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}
                      >
                        {t.type === "entrada" || t.type === "conversão_entrada"
                          ? "+"
                          : "-"}
                        {t.weight.toLocaleString("pt-BR")} kg
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {t.entityName || "Ajuste Geral de Estoque"}
                      </td>
                      <td
                        className="py-3.5 px-4 text-slate-500 max-w-sm truncate"
                        title={t.description}
                      >
                        {t.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredTransactions.length === 0 && (
              <div className="p-10 text-center">
                <Package className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">
                  Nenhuma transação atende aos critérios informados.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MODAL 1: Conversão de Estoque (Screen 11) */}
        {isConversionModalOpen && (
          <InventoryConversionModal
            onClose={() => {}}
            setIsConversionModalOpen={setIsConversionModalOpen}
          />
        )}

        {/* MODAL 2: Registro de Movimentação Ajuste Manual (Screen 6 equivalent) */}
        {isMovementModalOpen && (
          <InventoryMovementModal
            onClose={() => {}}
            setIsMovementModalOpen={setIsMovementModalOpen}
          />
        )}
      </div>
    </LayoutBase>
  );
}
