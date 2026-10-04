import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  DollarSign,
  Package,
  RefreshCw,
  Scale,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import ButtonDashboard from "../../components/ButtonDashboard";
import { LayoutBase } from "../../components/LayoutBase";
import { useLoggedUser } from "../../context/useLoggedUser";
import {
  useDashboard,
  useFinancialEntries,
  useInventoryBalances,
  useOrders,
} from "../../utils/queries";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function inputDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA").format(date);
}

function localDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function previousPeriod(start: string, end: string) {
  const first = localDate(start);
  const last = localDate(end);
  const days = Math.max(
    1,
    Math.round((last.getTime() - first.getTime()) / 86_400_000) + 1,
  );
  const previousEnd = new Date(first);
  previousEnd.setDate(previousEnd.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousStart.getDate() - days + 1);
  return { start: inputDate(previousStart), end: inputDate(previousEnd) };
}

function variation(current: number, previous: number) {
  if (!previous) return current ? null : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function Kpi({
  label,
  value,
  detail,
  icon,
  tone = "emerald",
  change,
  invert = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: "emerald" | "blue" | "amber" | "rose";
  change?: number | null;
  invert?: boolean;
}) {
  const tones = {
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    rose: "bg-rose-500/10 border-rose-500/20 text-rose-400",
  };
  const up = change !== null && change !== undefined && change >= 0;
  const favorable = invert ? !up : up;

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-extrabold tracking-tight text-slate-100">
            {value}
          </p>
        </div>
        <div className={`rounded-xl border p-3 ${tones[tone]}`}>{icon}</div>
      </div>
      <div className="mt-3 flex min-h-5 items-center gap-1.5 text-xs">
        {change !== undefined && (
          <span
            className={`flex items-center gap-0.5 font-bold ${favorable ? "text-emerald-400" : "text-rose-400"}`}
          >
            {up ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            {change === null ? "novo" : `${Math.abs(change).toFixed(1)}%`}
          </span>
        )}
        <span className="truncate text-slate-500">{detail}</span>
      </div>
    </article>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useLoggedUser();
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [mode, setMode] = useState<"overview" | "purchases">("overview");
  const [startDate, setStartDate] = useState(inputDate(firstDay));
  const [endDate, setEndDate] = useState(inputDate(today));
  const previous = useMemo(
    () => previousPeriod(startDate, endDate),
    [startDate, endDate],
  );

  const dashboard = useDashboard(startDate, endDate);
  const previousDashboard = useDashboard(previous.start, previous.end);
  const purchases = useOrders({ tipo: "COMPRA", status: "FECHADO" });
  const inventory = useInventoryBalances();
  const payables = useFinancialEntries({
    tipo: "PAGAR",
    dataInicial: startDate,
    dataFinal: endDate,
  });
  const summary = dashboard.data;
  const oldSummary = previousDashboard.data;

  const periodPurchases = useMemo(() => {
    const start = localDate(startDate).getTime();
    const end = new Date(`${endDate}T23:59:59`).getTime();
    return (purchases.data ?? []).filter((order) => {
      const timestamp = new Date(
        order.finalizado_em ?? order.criado_em,
      ).getTime();
      return timestamp >= start && timestamp <= end;
    });
  }, [endDate, purchases.data, startDate]);

  const timeline = useMemo(() => {
    const totals = new Map<string, number>();
    periodPurchases.forEach((order) => {
      const key = inputDate(new Date(order.finalizado_em ?? order.criado_em));
      totals.set(key, (totals.get(key) ?? 0) + order.valor_total);
    });
    return [...totals]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-10)
      .map(([date, value]) => ({ date, value }));
  }, [periodPurchases]);

  const suppliers = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; value: number; orders: number }
    >();
    periodPurchases.forEach((order) => {
      const key = String(order.registro?.id ?? "unknown");
      const item = grouped.get(key) ?? {
        name:
          order.registro?.apelido ||
          order.registro?.nome_razao ||
          "Sem fornecedor",
        value: 0,
        orders: 0,
      };
      item.value += order.valor_total;
      item.orders += 1;
      grouped.set(key, item);
    });
    return [...grouped.values()].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [periodPurchases]);

  const materials = inventory.data?.dados ?? [];
  const inventoryValue = materials.reduce(
    (total, item) => total + item.valor_estoque_compra,
    0,
  );
  const stockRanking = [...materials]
    .sort((a, b) => b.valor_estoque_compra - a.valor_estoque_compra)
    .slice(0, 5);
  const negativeStock = materials.filter((item) => item.saldo < 0).length;
  const openPayables = (payables.data ?? []).filter(
    (item) => item.status === "ABERTO",
  );
  const overdue = openPayables.filter(
    (item) => new Date(`${item.vencimento}T23:59:59`) < today,
  );
  const pendingValue = openPayables.reduce((sum, item) => sum + item.valor, 0);
  const purchasedValue = periodPurchases.reduce(
    (sum, item) => sum + item.valor_total,
    0,
  );
  const averageTicket = periodPurchases.length
    ? purchasedValue / periodPurchases.length
    : 0;
  const maxTimeline = Math.max(...timeline.map((item) => item.value), 1);
  const maxSupplier = Math.max(...suppliers.map((item) => item.value), 1);
  const maxStock = Math.max(
    ...stockRanking.map((item) => item.valor_estoque_compra),
    1,
  );

  function setPreset(preset: "today" | "month" | "30days") {
    const end = new Date();
    const start = new Date(end);
    if (preset === "month") start.setDate(1);
    if (preset === "30days") start.setDate(start.getDate() - 29);
    setStartDate(inputDate(start));
    setEndDate(inputDate(end));
  }

  function refresh() {
    void Promise.all([
      dashboard.refetch(),
      previousDashboard.refetch(),
      purchases.refetch(),
      inventory.refetch(),
      payables.refetch(),
    ]);
  }

  return (
    <LayoutBase activeTab="dashboard" pageTitle="Dashboard gerencial">
      <div className="space-y-6 font-sans">
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-md">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Central de decisões
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-100">
                Olá, {user?.nome?.split(" ")[0] ?? "Gestor"}
              </h2>
              <p className="mt-1 max-w-xl text-sm text-slate-400">
                Acompanhe caixa, compras, estoque e pendências em uma única
                visão.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                De
                <input
                  type="date"
                  value={startDate}
                  max={endDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1 block rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Até
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={inputDate(today)}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-1 block rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                />
              </label>
              <div className="flex rounded-xl border border-slate-700 bg-slate-950/40 p-1">
                <button
                  onClick={() => setPreset("today")}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                >
                  Hoje
                </button>
                <button
                  onClick={() => setPreset("month")}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                >
                  Mês
                </button>
                <button
                  onClick={() => setPreset("30days")}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                >
                  30 dias
                </button>
              </div>
              <button
                type="button"
                onClick={refresh}
                aria-label="Atualizar dashboard"
                className="rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-slate-400 hover:text-emerald-400"
              >
                <RefreshCw
                  className={`h-4 w-4 ${dashboard.isFetching ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-200">Ações rápidas</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ButtonDashboard
              color_icon=""
              cta
              Icon={ShoppingBag}
              description="Registrar entrada física e financeira"
              label="Nova Compra"
              onClick={() => navigate("/pedidos")}
            />
            <ButtonDashboard
              color_icon="text-emerald-400"
              cta={false}
              Icon={Package}
              description="Balanço ou conversão física"
              label="Ajustar Estoque"
              onClick={() => navigate("/estoque")}
            />
            <ButtonDashboard
              color_icon="text-sky-400"
              cta={false}
              Icon={Users}
              description="Cadastrar fornecedor ou cliente"
              label="Cadastrar Parceiro"
              onClick={() => navigate("/registros")}
            />
            <ButtonDashboard
              color_icon="text-amber-400"
              cta={false}
              Icon={DollarSign}
              description="Extratos, contas e faturas"
              label="Caixa Geral"
              onClick={() => navigate("/financeiro")}
            />
          </div>
        </section>

        {dashboard.isError ? (
          <div
            className="flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5"
            role="alert"
          >
            <div>
              <p className="font-bold text-rose-300">
                Não foi possível carregar o resumo
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Confira a conexão com a API e tente novamente.
              </p>
            </div>
            <button
              onClick={refresh}
              className="rounded-xl bg-rose-400 px-4 py-2 text-xs font-bold uppercase text-slate-950"
            >
              Tentar novamente
            </button>
          </div>
        ) : dashboard.isPending ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-36 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
              />
            ))}
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi
              label="Compras no período"
              value={currency.format(summary?.totalPurchasedAmount ?? 0)}
              detail="vs. período anterior"
              icon={<ShoppingBag className="h-6 w-6" />}
              change={variation(
                summary?.totalPurchasedAmount ?? 0,
                oldSummary?.totalPurchasedAmount ?? 0,
              )}
            />
            <Kpi
              label="Despesas operacionais"
              value={currency.format(summary?.totalExpenses ?? 0)}
              detail={`${summary?.expensesCount ?? 0} lançamentos`}
              icon={<TrendingDown className="h-6 w-6" />}
              tone="rose"
              change={variation(
                summary?.totalExpenses ?? 0,
                oldSummary?.totalExpenses ?? 0,
              )}
              invert
            />
            <Kpi
              label="Saldo disponível"
              value={currency.format(summary?.totalBankBalance ?? 0)}
              detail={`${summary?.bankAccountsCount ?? 0} contas ativas`}
              icon={<WalletCards className="h-6 w-6" />}
            />
            <Kpi
              label="Estoque físico"
              value={`${number.format((summary?.totalStockKg ?? 0) / 1000)} t`}
              detail={`${number.format(summary?.totalStockKg ?? 0)} kg armazenados`}
              icon={<Scale className="h-6 w-6" />}
              tone="blue"
            />
          </section>
        )}

        <div className="flex w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900/70 p-1.5">
          <button
            onClick={() => setMode("overview")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider ${mode === "overview" ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:text-slate-100"}`}
          >
            Visão geral
          </button>
          <button
            onClick={() => setMode("purchases")}
            className={`flex-1 rounded-lg py-2 text-xs font-bold uppercase tracking-wider ${mode === "purchases" ? "bg-emerald-400 text-slate-950" : "text-slate-400 hover:text-slate-100"}`}
          >
            Compras e fornecedores
          </button>
        </div>

        {mode === "overview" ? (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-100">
                      Saúde financeira
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Compromissos e liquidez do período selecionado
                    </p>
                  </div>
                  <CircleDollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <Metric
                    label="Despesas pagas"
                    value={currency.format(summary?.paidExpenses ?? 0)}
                    color="text-emerald-400"
                  />
                  <Metric
                    label="A pagar"
                    value={currency.format(
                      summary?.pendingExpenses ?? pendingValue,
                    )}
                    color="text-amber-400"
                  />
                  <Metric
                    label="Cobertura de caixa"
                    value={
                      pendingValue
                        ? `${((summary?.totalBankBalance ?? 0) / pendingValue).toFixed(1)}x`
                        : "Sem pendências"
                    }
                  />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{
                      width: `${Math.min(100, ((summary?.paidExpenses ?? 0) / Math.max(summary?.totalExpenses ?? 0, 1)) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                  <span>Percentual já liquidado</span>
                  <span>
                    {(
                      ((summary?.paidExpenses ?? 0) /
                        Math.max(summary?.totalExpenses ?? 0, 1)) *
                      100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-100">
                      Pontos de atenção
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Itens que pedem ação
                    </p>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="mt-5 space-y-3">
                  <Attention
                    icon={<DollarSign className="h-4 w-4 text-amber-400" />}
                    title={`${overdue.length} títulos vencidos`}
                    detail={currency.format(
                      overdue.reduce((sum, item) => sum + item.valor, 0),
                    )}
                    onClick={() => navigate("/financeiro")}
                  />
                  <Attention
                    icon={<Boxes className="h-4 w-4 text-rose-400" />}
                    title={`${Math.max(negativeStock, summary?.negativeMaterialsCount ?? 0)} saldos negativos`}
                    detail="Revisar inventário"
                    onClick={() => navigate("/estoque")}
                  />
                  <Attention
                    icon={<ShoppingBag className="h-4 w-4 text-blue-400" />}
                    title={`${summary?.purchaseInvoicesCount ?? 0} compras concluídas`}
                    detail={`Ticket médio ${currency.format(averageTicket)}`}
                    onClick={() => navigate("/pedidos")}
                  />
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RankingCard
                title="Capital em estoque"
                subtitle="Materiais com maior valor imobilizado"
                total={currency.format(inventoryValue)}
                items={stockRanking.map((item) => ({
                  id: item.id,
                  name: item.nome,
                  value: item.valor_estoque_compra,
                }))}
                max={maxStock}
                color="bg-blue-400"
              />
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-sm font-bold text-slate-100">
                  Compras ao longo do período
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Últimos dias com movimentação
                </p>
                <div className="mt-6 flex h-44 items-end gap-2 border-b border-slate-800 px-1">
                  {timeline.length ? (
                    timeline.map((item) => (
                      <div
                        key={item.date}
                        className="group flex h-full min-w-0 flex-1 flex-col justify-end"
                      >
                        <div className="mb-2 hidden text-center text-[9px] text-slate-400 group-hover:block">
                          {currency.format(item.value)}
                        </div>
                        <div
                          className="min-h-1 rounded-t bg-emerald-400/80 group-hover:bg-emerald-300"
                          style={{
                            height: `${Math.max(4, (item.value / maxTimeline) * 100)}%`,
                          }}
                        />
                        <span className="mt-2 truncate text-center text-[9px] text-slate-500">
                          {shortDate.format(localDate(item.date))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                      Sem compras concluídas neste período.
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-2">
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-100">
                    Principais fornecedores
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Concentração do valor comprado no período
                  </p>
                </div>
                <Users className="h-5 w-5 text-blue-400" />
              </div>
              <div className="mt-5 space-y-4">
                {suppliers.length ? (
                  suppliers.map((supplier, index) => (
                    <div
                      key={`${supplier.name}-${index}`}
                      className="grid grid-cols-[28px_1fr_auto] items-center gap-3"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-[11px] font-bold text-slate-400">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="mb-1.5 flex justify-between gap-3">
                          <span className="truncate text-xs font-bold text-slate-300">
                            {supplier.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {supplier.orders} compras
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${(supplier.value / maxSupplier) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        {currency.format(supplier.value)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-12 text-center text-xs text-slate-500">
                    Nenhuma compra concluída no período.
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-4">
              <Kpi
                label="Ticket médio"
                value={currency.format(averageTicket)}
                detail={`${periodPurchases.length} compras analisadas`}
                icon={<TrendingUp className="h-6 w-6" />}
              />
              <Kpi
                label="Fornecedores ativos"
                value={String(suppliers.length)}
                detail="com compras no período"
                icon={<Users className="h-6 w-6" />}
                tone="blue"
              />
              <Kpi
                label="Volume comprado"
                value={currency.format(purchasedValue)}
                detail="pedidos concluídos"
                icon={<ShoppingBag className="h-6 w-6" />}
                tone="amber"
              />
            </div>
          </section>
        )}
      </div>
    </LayoutBase>
  );
}

function Metric({
  label,
  value,
  color = "text-slate-100",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-950/50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className={`mt-2 text-lg font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Attention({
  icon,
  title,
  detail,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-left hover:border-emerald-500/30"
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>
          <span className="block text-xs font-bold text-slate-200">
            {title}
          </span>
          <span className="text-[11px] text-slate-500">{detail}</span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 text-slate-600" />
    </button>
  );
}

function RankingCard({
  title,
  subtitle,
  total,
  items,
  max,
  color,
}: {
  title: string;
  subtitle: string;
  total: string;
  items: Array<{ id: number; name: string; value: number }>;
  max: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-slate-100">{title}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <span className="text-sm font-bold text-emerald-400">{total}</span>
      </div>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.map((item) => (
            <div key={item.id}>
              <div className="mb-1.5 flex justify-between gap-3 text-xs">
                <span className="truncate font-medium text-slate-300">
                  {item.name}
                </span>
                <span className="shrink-0 font-mono text-slate-400">
                  {currency.format(item.value)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-xs text-slate-500">
            Nenhum saldo de estoque encontrado.
          </p>
        )}
      </div>
    </div>
  );
}
