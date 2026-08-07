import {
  ArrowDownRight,
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
import { useDashboard } from "../../utils/queries";
import { useNavigate } from "react-router";

export function Dashboard() {
  const navigate = useNavigate();
  const [dashboardMode, setDashboardMode] = useState<"purchases" | "overview">(
    "overview",
  );
  const dataAtual = new Date();
  const dataFormatada = new Intl.DateTimeFormat("en-CA").format(dataAtual);

  const dashboardQuery = useDashboard(dataFormatada);

  const {
    totalStockKg = 0,
    totalPurchasedAmount = 0,
    purchaseInvoicesCount = 0,
    totalExpenses = 0,
    totalBankBalance = 0,
    bankAccountsCount = 0,
  } = dashboardQuery.data ?? {};
  const totalStockTon = totalStockKg / 1000;
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
              {dataAtual.toLocaleString("pt-BR", { month: "long" })} de{" "}
              {dataAtual.toLocaleString("pt-BR", { year: "numeric" })} (Atual)
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
        {dashboardQuery.isPending ? (
          <div
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-sm text-slate-400"
            role="status"
          >
            Carregando resumo operacional...
          </div>
        ) : dashboardQuery.isError ? (
          <div
            className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5"
            role="alert"
          >
            <div>
              <p className="text-sm font-bold text-rose-300">
                Não foi possível carregar o dashboard
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Verifique a conexão com a API e tente novamente.
              </p>
            </div>
            <button
              type="button"
              onClick={() => dashboardQuery.refetch()}
              className="shrink-0 rounded-xl bg-rose-400 px-4 py-2 text-xs font-bold uppercase text-slate-950 transition-colors hover:bg-rose-300"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
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
                  <span>
                    ≈{" "}
                    {totalStockTon.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    toneladas métricas
                  </span>
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
                  <span>
                    {purchaseInvoicesCount.toLocaleString("pt-BR")} faturas de
                    compras registradas
                  </span>
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
                  <span>
                    Disponível em {bankAccountsCount.toLocaleString("pt-BR")}{" "}
                    contas
                  </span>
                </p>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 text-emerald-400">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>
        )}

        {/* QUICK ACTIONS ROW (ONLY ON OVERVIEW MODE) */}
        {dashboardMode === "overview" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ButtonDashboard
              color_icon=""
              cta={true}
              Icon={ShoppingBag}
              description="Registrar entrada física e financeira"
              label="Nova Compra"
              onClick={() => navigate("/pedidos")}
            />

            <ButtonDashboard
              color_icon="text-emerald-400"
              cta={false}
              Icon={Package}
              description="Fazer balanço ou conversão física"
              label="Ajustar Estoque"
              onClick={() => navigate("/estoque")}
            />
            <ButtonDashboard
              color_icon="text-sky-400"
              cta={false}
              Icon={Users}
              description="Cadastrar Fornecedor ou Cliente"
              label="Cadastrar Parceiro"
              onClick={() => navigate("/registros")}
            />
            <ButtonDashboard
              color_icon="text-amber-400"
              cta={false}
              Icon={DollarSign}
              description="Ver extratos bancários e faturas"
              label="Caixa Geral"
              onClick={() => navigate("/financeiro")}
            />
          </div>
        )}
      </div>
    </LayoutBase>
  );
}
