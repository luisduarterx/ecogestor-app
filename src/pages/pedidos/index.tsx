import { useEffect, useMemo, useState } from "react";
import { LayoutBase } from "../../components/LayoutBase";
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  ClipboardList,
  Edit,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import NewOrder from "../../components/NewOrder";
import PrintModalOrder from "../../components/modals/PrintModalOrder";
import { useLoggedUser } from "../../context/useLoggedUser";
import { useNavigate } from "react-router";
import { mensagemErroFiscal } from "../../utils/fiscal";
import {
  useCancelOrder,
  useConfiguracoesSistema,
  useImportarPedidoNotaFiscal,
  useStatusFiscal,
  useCreateOrder,
  useOrders,
  useReopenOrder,
} from "../../utils/queries";
import type { ApiError, OrdersResponse } from "../../utils/types";
import Notice from "../../components/Notice";
import {
  dataValida,
  diaNoFuso,
  formatarDia,
  hojeNoFuso,
} from "../../utils/dataCompetencia";

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export function Pedidos() {
  const [activeSubTab, setActiveSubTab] = useState<
    "list" | "new_purchase_order" | "new_sale_order"
  >("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "COMPRA" | "VENDA">(
    "all",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "ABERTO" | "FECHADO" | "CANCELADO"
  >("all");
  // Período pela data de competência (`data_pedido`), no formato YYYY-MM-DD.
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [currentOrder, setCurrentOrder] = useState<{
    id: number;
    tipo: "COMPRA" | "VENDA";
  } | null>(null);
  const [confirmation, setConfirmation] = useState<{
    action: "reopen" | "cancel";
    order: OrdersResponse;
  } | null>(null);
  // Novo pedido: null = hoje (recalculado a cada uso, evita data presa após a meia-noite).
  const [dataNovoPedido, setDataNovoPedido] = useState<string | null>(null);
  const [tipoNovoPedido, setTipoNovoPedido] = useState<"COMPRA" | "VENDA">(
    "COMPRA",
  );
  const [createOrderError, setCreateOrderError] = useState("");
  const [orderOpenNotice, setOrderOpenNotice] = useState("");
  const [printOrder, setPrintOrder] = useState<{
    id: number;
    imprimirAoAbrir: boolean;
  } | null>(null);
  const { user } = useLoggedUser();
  const createOrder = useCreateOrder();
  const reopenOrder = useReopenOrder();
  const cancelOrder = useCancelOrder();
  const configuracaoQuery = useConfiguracoesSistema();
  const navigate = useNavigate();
  const fiscalHabilitado = useStatusFiscal().data?.habilitado ?? false;
  const importarParaNota = useImportarPedidoNotaFiscal();

  /** Cria um rascunho de NF-e a partir do pedido e abre o editor. */
  async function emitirNotaFiscal(pedidoID: number) {
    setCreateOrderError("");
    try {
      const nota = await importarParaNota.mutateAsync({ pedidoID });
      navigate(`/fiscal/notas/${nota.id}`);
    } catch (erro) {
      setCreateOrderError(
        mensagemErroFiscal(
          erro,
          "Não foi possível criar a nota fiscal a partir do pedido.",
        ),
      );
    }
  }
  const erroPeriodo =
    (dataInicial && !dataValida(dataInicial)) ||
    (dataFinal && !dataValida(dataFinal))
      ? "Informe datas válidas para o período."
      : dataInicial && dataFinal && dataInicial > dataFinal
        ? "A data inicial do período não pode ser posterior à data final."
        : "";
  const ordersQuery = useOrders({
    tipo: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
    dataInicial: erroPeriodo ? undefined : dataInicial || undefined,
    dataFinal: erroPeriodo ? undefined : dataFinal || undefined,
  });
  const openOrdersQuery = useOrders({ status: "ABERTO" });
  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");

    if (!term) {
      return ordersQuery.data ?? [];
    }

    return (ordersQuery.data ?? []).filter((order) => {
      const registro = [order.registro?.nome_razao, order.registro?.apelido]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("pt-BR");

      return String(order.id).includes(term) || registro.includes(term);
    });
  }, [ordersQuery.data, searchTerm]);

  useEffect(() => {
    if (!orderOpenNotice) return;

    const timeout = window.setTimeout(() => setOrderOpenNotice(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [orderOpenNotice]);

  async function handleCreateOrder() {
    setCreateOrderError("");
    setOrderOpenNotice("");

    const tipo = tipoNovoPedido;
    const hoje = hojeNoFuso();
    const dataPedido = dataNovoPedido ?? hoje;

    if (!dataValida(dataPedido)) {
      setCreateOrderError("Informe uma data válida para o pedido.");
      return;
    }
    if (dataPedido > hoje) {
      setCreateOrderError("A data do pedido não pode ser futura.");
      return;
    }

    const descricaoPedido = (id: number) =>
      `Pedido de ${tipo === "COMPRA" ? "compra" : "venda"} #${id}${
        dataPedido < hoje ? ` de ${formatarDia(dataPedido)}` : ""
      }`;

    if (!user) {
      setCreateOrderError(
        "Não foi possível identificar o usuário autenticado. Entre novamente.",
      );
      return;
    }

    try {
      const openOrdersResult = await openOrdersQuery.refetch();

      if (openOrdersResult.isError) {
        setCreateOrderError(
          "Não foi possível verificar seus pedidos em andamento. Tente novamente para evitar a criação de pedidos duplicados.",
        );
        return;
      }

      // Retoma só o rascunho do mesmo usuário, tipo e data do pedido.
      const existingOrder = (openOrdersResult.data ?? [])
        .filter(
          (order) =>
            order.userID === user.id &&
            order.tipo === tipo &&
            order.data_pedido === dataPedido,
        )
        .sort(
          (first, second) =>
            new Date(second.atualizado || second.criado_em).getTime() -
            new Date(first.atualizado || first.criado_em).getTime(),
        )[0];

      if (existingOrder) {
        setCreateOrderError("");
        setOrderOpenNotice(
          `${descricaoPedido(existingOrder.id)} retomado por ${user.nome}. Nenhum novo pedido foi criado.`,
        );
        setDataNovoPedido(null);
        openOrder(existingOrder);
        return;
      }

      const order = await createOrder.mutateAsync({
        tipo,
        ...(dataPedido !== hoje ? { data_pedido: dataPedido } : {}),
      });

      if (order.userID !== user.id) {
        setCreateOrderError(
          "O pedido foi associado a um usuário diferente da sessão atual.",
        );
        return;
      }

      setCurrentOrder(order);
      setDataNovoPedido(null);
      setOrderOpenNotice(
        `${descricaoPedido(order.id)} criado e aberto por ${user.nome}.`,
      );
      setActiveSubTab(
        tipo === "COMPRA" ? "new_purchase_order" : "new_sale_order",
      );
    } catch (error) {
      const apiError = error as ApiError;
      setCreateOrderError(
        apiError.mensagem ?? "Não foi possível abrir o pedido.",
      );
    }
  }

  function openOrder(order: Pick<OrdersResponse, "id" | "tipo">) {
    setCurrentOrder({ id: order.id, tipo: order.tipo });
    setActiveSubTab(
      order.tipo === "COMPRA" ? "new_purchase_order" : "new_sale_order",
    );
  }

  function handleEditOrder(order: OrdersResponse) {
    setCreateOrderError("");

    if (order.status === "FECHADO") {
      setConfirmation({ action: "reopen", order });
      return;
    }

    if (order.status === "ABERTO") {
      openOrder(order);
    }
  }

  async function confirmOrderAction() {
    if (!confirmation) return;

    setCreateOrderError("");
    const { action, order } = confirmation;

    try {
      if (action === "reopen") {
        await reopenOrder.mutateAsync(order.id);
        setConfirmation(null);
        openOrder(order);
      } else {
        await cancelOrder.mutateAsync(order.id);
        setConfirmation(null);
      }
    } catch (error) {
      const apiError = error as ApiError;
      setCreateOrderError(
        apiError.mensagem ??
          (action === "reopen"
            ? "Não foi possível reabrir o pedido."
            : "Não foi possível cancelar o pedido."),
      );
      setConfirmation(null);
    }
  }

  const orderActionPending = reopenOrder.isPending || cancelOrder.isPending;
  const openingOrder = createOrder.isPending || openOrdersQuery.isFetching;
  const hoje = hojeNoFuso();
  const dataNovoPedidoExibida = dataNovoPedido ?? hoje;
  const novoPedidoRetroativo =
    dataValida(dataNovoPedidoExibida) && dataNovoPedidoExibida < hoje;

  return (
    <LayoutBase activeTab="pedidos" pageTitle="Gerenciar Pedidos">
      <div className="space-y-6 font-sans">
        {/* Upper Banner: título + listagem; abaixo, abertura de pedido */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-400" />
                Central Geral de Pedidos
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Controle de fluxo de entrada (compras) e saídas (vendas).
                Cancele faturas, reabra cargas e altere registros de pesagem de
                forma centralizada.
              </p>
            </div>
            <div className="flex self-start md:self-auto bg-slate-950/60 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveSubTab("list")}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all select-none cursor-pointer ${
                  activeSubTab === "list"
                    ? "bg-slate-200 text-slate-950 shadow-md"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Listagem de Pedidos
              </button>
            </div>
          </div>

          {/* Abertura de pedido: só na listagem; com pedido aberto fica apenas a 1ª linha. */}
          {activeSubTab === "list" && (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleCreateOrder();
              }}
              className="flex flex-col gap-3 border-t border-slate-800 pt-5 md:flex-row md:flex-wrap md:items-end"
            >
              <label className="text-[10px] uppercase font-mono font-bold text-slate-500">
                Data do pedido
                <input
                  required
                  type="date"
                  max={hoje}
                  value={dataNovoPedidoExibida}
                  onChange={(event) => setDataNovoPedido(event.target.value)}
                  className="mt-1.5 block w-full md:w-44 bg-slate-950/40 text-slate-200 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </label>

              <div>
                <span
                  id="tipo-novo-pedido"
                  className="text-[10px] uppercase font-mono font-bold text-slate-500"
                >
                  Tipo do pedido
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="tipo-novo-pedido"
                  className="mt-1.5 flex bg-slate-950/60 p-1 rounded-lg border border-slate-800"
                >
                  {(["COMPRA", "VENDA"] as const).map((tipo) => {
                    const selecionado = tipoNovoPedido === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        role="radio"
                        aria-checked={selecionado}
                        onClick={() => setTipoNovoPedido(tipo)}
                        className={`flex-1 md:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all select-none cursor-pointer ${
                          selecionado
                            ? tipo === "COMPRA"
                              ? "bg-emerald-400 text-slate-950 shadow-md"
                              : "bg-amber-400 text-slate-950 shadow-md"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tipo === "COMPRA" ? "Compra" : "Venda"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={openingOrder}
                className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-bold uppercase text-slate-950 transition-colors select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  tipoNovoPedido === "COMPRA"
                    ? "bg-emerald-400 hover:bg-emerald-300"
                    : "bg-amber-400 hover:bg-amber-300"
                }`}
              >
                <Plus className="h-4 w-4" />
                {openingOrder
                  ? "Verificando..."
                  : `Iniciar pedido de ${tipoNovoPedido === "COMPRA" ? "compra" : "venda"}`}
              </button>

              {novoPedidoRetroativo && (
                <p className="text-[11px] leading-relaxed text-amber-400 md:max-w-sm md:self-center">
                  Pedido retroativo: exige a permissão de data retroativa.
                  Estoque e financeiro serão movimentados no caixa aberto atual.
                </p>
              )}
            </form>
          )}
        </div>

        {createOrderError && (
          <div
            className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
            role="alert"
          >
            {createOrderError}
          </div>
        )}

        {orderOpenNotice && (
          <Notice data={orderOpenNotice} setNotice={setOrderOpenNotice} />
        )}

        {/* SUBTAB 1: ORDERS LIST WORKSPACE */}
        {activeSubTab === "list" && (
          <div className="space-y-4">
            {/* Filtering controls bar */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row lg:flex-wrap items-center gap-3">
              {/* Search Input */}
              <div className="relative w-full lg:min-w-60 lg:flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filtrar por ID, cliente ou fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 text-xs border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Type selector */}
              <div className="flex items-center gap-1.5 w-full lg:w-auto">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 whitespace-nowrap">
                  Tipo:
                </span>
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as "all" | "COMPRA" | "VENDA")
                  }
                  className="w-full lg:w-40 bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">Ver Todos</option>
                  <option value="COMPRA">Compras (Entradas)</option>
                  <option value="VENDA">Vendas (Saídas)</option>
                </select>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-1.5 w-full lg:w-auto">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 whitespace-nowrap">
                  Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        "all" | "ABERTO" | "FECHADO" | "CANCELADO",
                    )
                  }
                  className="w-full lg:w-40 bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">Todos Status</option>
                  <option value="ABERTO">Aberto</option>
                  <option value="FECHADO">Fechado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>

              {/* Period selector (data do pedido) */}
              <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 whitespace-nowrap">
                  Período:
                </span>
                <input
                  type="date"
                  aria-label="Data inicial do pedido"
                  value={dataInicial}
                  max={dataFinal || undefined}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className="min-w-0 flex-1 basis-32 lg:flex-none lg:w-36 bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <span className="text-[10px] text-slate-500">até</span>
                <input
                  type="date"
                  aria-label="Data final do pedido"
                  value={dataFinal}
                  min={dataInicial || undefined}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className="min-w-0 flex-1 basis-32 lg:flex-none lg:w-36 bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                {(dataInicial || dataFinal) && (
                  <button
                    type="button"
                    onClick={() => {
                      setDataInicial("");
                      setDataFinal("");
                    }}
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                    aria-label="Limpar período"
                    title="Limpar período"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {erroPeriodo && (
              <div
                className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
                role="alert"
              >
                {erroPeriodo}
              </div>
            )}

            {!erroPeriodo && ordersQuery.isPending && (
              <div
                className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400"
                role="status"
              >
                Carregando pedidos...
              </div>
            )}

            {!erroPeriodo && ordersQuery.isError && (
              <div
                className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5"
                role="alert"
              >
                <div>
                  <p className="text-sm font-bold text-rose-300">
                    Não foi possível carregar os pedidos
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Verifique a conexão com a API e tente novamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => ordersQuery.refetch()}
                  className="shrink-0 rounded-xl bg-rose-400 px-4 py-2 text-xs font-bold uppercase text-slate-950 transition-colors hover:bg-rose-300"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {/* Orders Table Container */}
            {!erroPeriodo && ordersQuery.isSuccess && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/15 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="py-3 px-4">Pedido ID</th>
                        <th className="py-3 px-4">Fluxo</th>
                        <th className="py-3 px-4">Data do pedido</th>
                        <th className="py-3 px-4">Cliente/Fornecedor</th>
                        <th className="py-3 px-4 text-right">Valor Líquido</th>
                        <th className="py-3 px-4 text-center">
                          Itens / Lançamentos
                        </th>
                        <th className="py-3 px-4 text-center">Situação</th>
                        <th className="py-3 px-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredOrders.map((order) => {
                        const isSale = order.tipo === "VENDA";

                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-800/10 transition-colors"
                          >
                            {/* ID Badge */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                              {order.id}
                            </td>

                            {/* Flow Tag */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                                  isSale
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                }`}
                              >
                                {isSale ? (
                                  <>
                                    <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                                    Venda
                                  </>
                                ) : (
                                  <>
                                    <ArrowDownRight className="h-3 w-3 text-indigo-400" />
                                    Compra
                                  </>
                                )}
                              </span>
                            </td>

                            {/* Date: competência; mostra o lançamento real quando difere. */}
                            <td className="py-3.5 px-4 text-slate-400 font-mono">
                              {diaNoFuso(order.criado_em) ===
                              order.data_pedido ? (
                                formatarData(order.criado_em)
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                    <span className="text-slate-300">
                                      {formatarDia(order.data_pedido)}
                                    </span>
                                    {order.retroativo && (
                                      <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-sans text-[9px] font-bold uppercase tracking-wider text-amber-400">
                                        Retroativo
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Lançado em {formatarData(order.criado_em)}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Customer/Supplier */}
                            <td className="py-3.5 px-4 text-slate-200 font-semibold truncate max-w-[160px]">
                              {order.registro?.apelido ||
                                order.registro?.nome_razao ||
                                "Não informado"}
                            </td>

                            {/* Value */}
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                              R${" "}
                              {order.valor_total.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>

                            {/* Counts returned by the API */}
                            <td className="py-3.5 px-4 text-center text-slate-400 font-medium text-[11px]">
                              {order._count.items} itens /{" "}
                              {order._count.lancamentos} lançamentos
                            </td>

                            {/* Status Badge */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                                  order.status === "FECHADO"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : order.status === "ABERTO"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    order.status === "FECHADO"
                                      ? "bg-emerald-400"
                                      : order.status === "ABERTO"
                                        ? "bg-amber-400"
                                        : "bg-rose-400"
                                  }`}
                                ></span>
                                {order.status === "FECHADO"
                                  ? "Fechado"
                                  : order.status === "ABERTO"
                                    ? "Aberto"
                                    : "Cancelado"}
                              </span>
                            </td>

                            {/* Actions Button List */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* View & print 80x40 receipt button */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPrintOrder({
                                      id: order.id,
                                      imprimirAoAbrir: false,
                                    })
                                  }
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg cursor-pointer transition-colors"
                                  title="Visualizar e Emitir Cupom Térmico 80x40"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>

                                {/* Venda fechada pode virar rascunho de NF-e. */}
                                {fiscalHabilitado &&
                                  order.tipo === "VENDA" &&
                                  order.status === "FECHADO" && (
                                    <button
                                      type="button"
                                      disabled={importarParaNota.isPending}
                                      onClick={() =>
                                        void emitirNotaFiscal(order.id)
                                      }
                                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-sky-400 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                                      title="Emitir nota fiscal (cria um rascunho com os dados do pedido)"
                                    >
                                      <Receipt className="h-4 w-4" />
                                    </button>
                                  )}

                                {/* Open drafts directly; closed orders require reopening. */}
                                {order.status !== "CANCELADO" && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditOrder(order)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                                    title={
                                      order.status === "FECHADO"
                                        ? "Reabrir pedido para editar"
                                        : "Editar pedido"
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                )}

                                {order.status === "ABERTO" ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setConfirmation({
                                        action: "cancel",
                                        order,
                                      })
                                    }
                                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 rounded-lg cursor-pointer transition-all"
                                    title="Cancelar pedido"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredOrders.length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-12 text-center text-slate-500"
                          >
                            Nenhum pedido de compra ou venda corresponde aos
                            filtros aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: LAUNCH NEW SALE ORDER WORKSPACE */}
        {currentOrder && activeSubTab !== "list" && (
          <div>
            <NewOrder
              pedidoID={currentOrder.id}
              tipo={currentOrder.tipo}
              onFinalized={() => {
                setOrderOpenNotice(
                  `Pedido #${currentOrder.id} finalizado com sucesso.`,
                );
                setActiveSubTab("list");
                setCurrentOrder(null);
                if (configuracaoQuery.data?.imprimirAutomaticamente) {
                  setPrintOrder({ id: currentOrder.id, imprimirAoAbrir: true });
                }
              }}
            />
          </div>
        )}

        {confirmation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-confirmation-title"
          >
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3
                    id="order-confirmation-title"
                    className="text-base font-bold text-slate-100"
                  >
                    {confirmation.action === "reopen"
                      ? "Reabrir pedido?"
                      : "Cancelar pedido?"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {confirmation.action === "reopen"
                      ? `O pedido #${confirmation.order.id} será reaberto e os movimentos financeiros e de estoque serão estornados pela API. Depois disso, ele será aberto para edição.`
                      : `O pedido aberto #${confirmation.order.id} será cancelado. Essa ação não movimenta estoque ou financeiro.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  disabled={orderActionPending}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
                  aria-label="Fechar confirmação"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  disabled={orderActionPending}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => void confirmOrderAction()}
                  disabled={orderActionPending}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold uppercase text-slate-950 disabled:opacity-50 ${
                    confirmation.action === "reopen"
                      ? "bg-emerald-400 hover:bg-emerald-300"
                      : "bg-rose-400 hover:bg-rose-300"
                  }`}
                >
                  {confirmation.action === "reopen" ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  {orderActionPending
                    ? "Processando..."
                    : confirmation.action === "reopen"
                      ? "Reabrir e editar"
                      : "Cancelar pedido"}
                </button>
              </div>
            </div>
          </div>
        )}

        {printOrder !== null && (
          <PrintModalOrder
            orderId={printOrder.id}
            imprimirAoAbrir={printOrder.imprimirAoAbrir}
            onClose={() => setPrintOrder(null)}
          />
        )}
      </div>
    </LayoutBase>
  );
}
