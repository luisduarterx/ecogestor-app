import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  DollarSign,
  Package,
  Scale,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { LayoutBase } from "../../components/LayoutBase";
import { useState } from "react";
import ButtonDashboard from "../../components/ButtonDashboard";

export function Dashboard() {
  const [dashboardMode, setDashboardMode] = useState<"purchases" | "overview">(
    "overview",
  );
  function fetchFunction() {
    const totalStockKg = 0;
    const totalStockTon = 0;
    const totalPurchasedAmount = 0;
    const totalExpenses = 0;
    const totalBankBalance = 0;

    return {
      totalStockKg,
      totalStockTon,
      totalPurchasedAmount,
      totalExpenses,
      totalBankBalance,
    };
  }
  const {
    totalStockKg,
    totalStockTon,
    totalPurchasedAmount,
    totalExpenses,
    totalBankBalance,
  } = fetchFunction();
  return (
    <LayoutBase activeTab="dashboard" pageTitle="Dashboard">
      <div className="space-y-6 font-sans">
        {/* Upper Banner / Welcome bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <p className="text-xs font-mono text-emerald-400 font-semibold tracking-widest uppercase">
              Operação Ecogestor
            </p>
            <h2 className="text-2xl font-bold text-slate-100 mt-1 flex items-center gap-2">
              Olá, Administrador
              <span className="text-xs bg-emerald-400/10 text-emerald-400 font-normal px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                Módulo Gestor
              </span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Aqui está o consolidado das operações de reciclagem e fluxo
              financeiro de hoje.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-950/40 px-3 py-2 rounded-xl border border-slate-800">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <span>Filtro de Período:</span>
            <span className="font-semibold text-slate-100">
              Julho de 2025 (Atual)
            </span>
          </div>
        </div>

        {/* Mode Selector Tabs (Screen 14 vs Screen 2) */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1.5 rounded-xl max-w-md">
          <button
            onClick={() => setDashboardMode("overview")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
              dashboardMode === "overview"
                ? "bg-emerald-400 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            Visão Geral (Administrador)
          </button>
          <button
            onClick={() => setDashboardMode("purchases")}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
              dashboardMode === "purchases"
                ? "bg-emerald-400 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-100"
            }`}
          >
            Compras & Fornecedores
          </button>
        </div>

        {/* KPI METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Peso Total Estocado
              </span>
              <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
                {totalStockKg.toLocaleString("pt-BR")}{" "}
                <span className="text-sm font-medium text-slate-400">kg</span>
              </h3>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1.5">
                <Scale className="h-3 w-3" />
                <span>≈ {totalStockTon} Toneladas métricas</span>
              </p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
              <Package className="h-6 w-6" />
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Compras Efetuadas
              </span>
              <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
                R${" "}
                {totalPurchasedAmount.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1.5">
                <span>{0} faturas de compras registradas</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShoppingBag className="h-6 w-6" />
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Despesas de Operação
              </span>
              <h3 className="text-3xl font-extrabold text-slate-100 tracking-tight mt-1">
                R${" "}
                {totalExpenses.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-rose-400 font-medium flex items-center gap-1 mt-1.5">
                <ArrowDownRight className="h-4 w-4" />
                <span>Folha de triagem, fretes e utilidades</span>
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-400">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Saldo em Contas
              </span>
              <h3 className="text-3xl font-extrabold text-emerald-400 tracking-tight mt-1">
                R${" "}
                {totalBankBalance.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
              <p className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1.5">
                <ArrowUpRight className="h-4 w-4" />
                <span>Disponível em 30 bancos</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS ROW (ONLY ON OVERVIEW MODE) */}
        {dashboardMode === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ButtonDashboard
              color_icon=""
              cta={true}
              Icon={ShoppingBag}
              description="Registrar entrada física e financeira"
              label="Nova Compra"
              onClick={() => {}}
            />

            <ButtonDashboard
              color_icon="text-emerald-400"
              cta={false}
              Icon={Package}
              description="Fazer balanço ou conversão física"
              label="Ajustar Estoque"
              onClick={() => {}}
            />
            <ButtonDashboard
              color_icon="text-sky-400"
              cta={false}
              Icon={Users}
              description="Cadastrar Fornecedor ou Cliente"
              label="Cadastrar Parceiro"
              onClick={() => {}}
            />
            <ButtonDashboard
              color_icon="text-amber-400"
              cta={false}
              Icon={DollarSign}
              description="Ver extratos bancários e faturas"
              label="Caixa Geral"
              onClick={() => {}}
            />
          </div>
        )}

        {/* SYSTEM NOTIFICATIONS OR CRITICAL ALERTS 
        {lowStockAlerts.length > 0 && dashboardMode === "overview" && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 shrink-0 mt-0.5">
              <ShieldAlert className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                Alerta de Estoque Mínimo Atingido
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Os seguintes materiais estão operando abaixo do nível mínimo de
                segurança operacional:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStockAlerts.map((m) => (
                  <span
                    key={m.id}
                    className="text-xs bg-slate-950 text-amber-400 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono"
                  >
                    {m.name}:{" "}
                    <strong className="font-bold">
                      {m.stock.toLocaleString("pt-BR")} kg
                    </strong>{" "}
                    (Mín: {m.minStock} kg)
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
*/}
        {/* DETAILED WORKSPACE SECTION 
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Charts Component (Left & Center Columns) 
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="font-bold text-slate-100">
                  {dashboardMode === "overview"
                    ? "Distribuição de Estoque por Categoria"
                    : "Relação de Compras de Materiais"}
                </h3>
                <p className="text-xs text-slate-400">
                  Análise de pesagem e volume financeiro
                </p>
              </div>
              <span className="text-[10px] uppercase font-mono tracking-wider bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md">
                Atualizado em tempo real
              </span>
            </div>
            */}

        {/* CUSTOM HIGH-QUALITY SVG INTERACTIVE CHART 
            {dashboardMode === "overview" ? (
              <div className="space-y-6">
                */}
        {/* Category Weight Bars 
                <div className="space-y-4">
                  {Object.entries(categoryWeights).map(([category, weight]) => {
                    const percentage =
                      totalStockKg > 0 ? (weight / totalStockKg) * 100 : 0;
                    let colorClass = "bg-sky-500";
                    if (category === "Metais") colorClass = "bg-emerald-500";
                    if (category === "Papéis") colorClass = "bg-yellow-500";
                    if (category === "Vidros") colorClass = "bg-teal-500";
                    if (category === "Outros") colorClass = "bg-purple-500";

                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-300 flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${colorClass}`}
                            ></span>
                            {category}
                          </span>
                          <span className="text-slate-400">
                            <strong className="text-slate-200">
                              {weight.toLocaleString("pt-BR")} kg
                            </strong>{" "}
                            ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
*/}
        {/* Monthly Flow Chart (Simulated in SVG) 
                <div className="pt-4 border-t border-slate-800">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3 font-mono">
                    Histórico de Movimentações (6 Meses)
                  </span>
                  <div className="h-44 flex items-end justify-between gap-2 pt-6 px-2 relative">
                  */}
        {/* Grid lines 
                    <div className="absolute inset-x-0 top-6 border-t border-slate-800/60 text-[10px] font-mono text-slate-600 pt-1">
                      30 Ton
                    </div>
                    <div className="absolute inset-x-0 top-20 border-t border-slate-800/60 text-[10px] font-mono text-slate-600 pt-1">
                      15 Ton
                    </div>
                    <div className="absolute inset-x-0 bottom-0 border-t border-slate-800 text-[10px] font-mono text-slate-600">
                      0 Ton
                    </div>
*/}
        {/* Bars representing simulated monthly weight recycled 
                    {[
                      {
                        month: "Jan",
                        weight: 14200,
                        color: "bg-emerald-500/65",
                      },
                      {
                        month: "Fev",
                        weight: 18500,
                        color: "bg-emerald-500/65",
                      },
                      {
                        month: "Mar",
                        weight: 22100,
                        color: "bg-emerald-500/65",
                      },
                      {
                        month: "Abr",
                        weight: 26800,
                        color: "bg-emerald-500/65",
                      },
                      {
                        month: "Mai",
                        weight: 31200,
                        color: "bg-emerald-500/65",
                      },
                      {
                        month: "Jun",
                        weight: totalStockKg,
                        color: "bg-emerald-400",
                      },
                    ].map((d, i) => {
                      const barHeight = Math.min(100, (d.weight / 35000) * 100);
                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center gap-2 z-10"
                        >
                          <span className="text-[10px] font-bold text-emerald-400 font-mono">
                            {(d.weight / 1000).toFixed(1)}t
                          </span>
                          <div className="w-full max-w-10 bg-slate-800 rounded-t-lg h-24 flex items-end overflow-hidden border border-slate-800">
                            <div
                              className={`w-full ${d.color} rounded-t-lg transition-all duration-500`}
                              style={{ height: `${barHeight}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {d.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Compras Mode Supplier & Material Chart Breakdown
              <div className="space-y-6">
                <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400">
                      Total Pago para Fornecedores
                    </p>
                    <p className="text-xl font-bold text-slate-100">
                      R${" "}
                      {totalPurchasedAmount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 text-right">
                      Preço Médio / kg
                    </p>
                    <p className="text-xl font-bold text-sky-400 text-right">
                      R${" "}
                      {(totalPurchasedAmount / (totalStockKg || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
*/}
        {/* Material prices dynamic breakdown list 
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">
                    Top Materiais Comprados (por Valor)
                  </span>
                  {materials.slice(0, 4).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-800/40 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: m.color }}
                        ></span>
                        <span className="text-sm font-semibold text-slate-200">
                          {m.name}
                        </span>
                      </div>
                      <div className="text-right text-xs">
                        <span className="font-bold text-slate-100">
                          R${" "}
                          {m.totalValue.toLocaleString("pt-BR", {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono">
                          Custo Médio: R$ {m.averageCost.toFixed(2)}/kg
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
*/}
        {/* Purchase statuses 
                <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">
                      Quitadas
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {purchases.filter((p) => p.status === "pago").length}{" "}
                      Notas
                    </span>
                  </div>
                  <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">
                      A Pagar / Pendentes
                    </span>
                    <span className="text-sm font-bold text-amber-400">
                      {purchases.filter((p) => p.status === "pendente").length}{" "}
                      Notas
                    </span>
                  </div>
                  <div className="bg-slate-950/20 p-3 rounded-xl border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-500 font-mono block uppercase">
                      Canceladas
                    </span>
                    <span className="text-sm font-bold text-rose-400">
                      {purchases.filter((p) => p.status === "cancelado").length}{" "}
                      Notas
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
*/}
        {/* Sidebar Widgets (Right Column) 
          <div className="space-y-6">
          */}
        {/* Top Suppliers List (Screen 2 feature) 
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h4 className="font-bold text-slate-100 flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-emerald-400" />
                  Fornecedores Líderes
                </h4>
                <button
                  onClick={() => setActiveTab("suppliers")}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  Ver todos
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="space-y-3.5">
                {sortedSuppliersByVolume.map((sup) => (
                  <div
                    key={sup.id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-800 rounded-lg flex items-center justify-center font-bold text-xs text-emerald-400 border border-slate-700">
                        {sup.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors block leading-tight">
                          {sup.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" />
                          {sup.city} - {sup.state}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-100 block">
                        R${" "}
                        {sup.totalSpent.toLocaleString("pt-BR", {
                          maximumFractionDigits: 0,
                        })}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-sm bg-slate-950 text-slate-500">
                        {sup.category === "cooperative"
                          ? "COOP"
                          : sup.category === "scrap_yard"
                            ? "SUCATA"
                            : "INDÚST"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
*/}
        {/* Operational Metrics (Logistics & Load) 
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xs">
              <h4 className="font-bold text-slate-100 flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                <Truck className="h-4.5 w-4.5 text-sky-400" />
                Operações de Coleta de Hoje
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-slate-950/20 p-3 rounded-xl border border-slate-800/60">
                  <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-400 mt-0.5">
                    <CheckCircle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      Rotas Concluídas
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      3 rotas de coleta finalizadas no Vale do Paraíba.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-950/20 p-3 rounded-xl border border-slate-800/60">
                  <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 mt-0.5">
                    <Truck className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200">
                      A Caminho da Usina
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      1 caminhão de sucata mista pesada previsto para 16:30.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
*/}
        {/* RECENT MOVEMENTS INVENTORY LIST 
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="font-bold text-slate-100">
                Fluxo Recente de Materiais
              </h3>
              <p className="text-xs text-slate-400">
                Últimas movimentações físicas registradas em balança
              </p>
            </div>
            <button
              onClick={() => setActiveTab("inventory")}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Ver Extrato
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 font-mono uppercase tracking-wider">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Material</th>
                  <th className="py-2.5 px-3 text-right">Peso</th>
                  <th className="py-2.5 px-3">Origem/Destino</th>
                  <th className="py-2.5 px-3">Descrição</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {transactions.slice(0, 5).map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="py-3 px-3 font-mono text-slate-400 font-bold">
                      {t.id}
                    </td>
                    <td className="py-3 px-3">{t.date}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.type === "entrada" || t.type === "conversão_entrada"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {t.type === "entrada"
                          ? "Entrada (Compra)"
                          : t.type === "conversão_entrada"
                            ? "Entrada (Processamento)"
                            : t.type === "conversão_saída"
                              ? "Saída (Processamento)"
                              : "Saída"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {t.materialName}
                    </td>
                    <td
                      className={`py-3 px-3 text-right font-bold font-mono ${
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
                    <td className="py-3 px-3 text-slate-300 max-w-[150px] truncate">
                      {t.entityName || "Usina de Processamento"}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-[200px] truncate">
                      {t.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        */}
      </div>
    </LayoutBase>
  );
}
