import { useEffect, useMemo, useState } from "react";
import { LayoutBase } from "../../components/LayoutBase";
import {
  ArrowDownRight,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ClipboardList,
  Edit,
  Plus,
  Printer,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import NewOrder from "../../components/NewOrder";
import PrintModalOrder from "../../components/modals/PrintModalOrder";
import { useLoggedUser } from "../../context/useLoggedUser";
import {
  useCancelOrder,
  useCreateOrder,
  useOrders,
  useReopenOrder,
} from "../../utils/queries";
import type { ApiError, OrdersResponse } from "../../utils/types";

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
  const [currentOrder, setCurrentOrder] = useState<{
    id: number;
    tipo: "COMPRA" | "VENDA";
  } | null>(null);
  const [confirmation, setConfirmation] = useState<{
    action: "reopen" | "cancel";
    order: OrdersResponse;
  } | null>(null);
  const [createOrderError, setCreateOrderError] = useState("");
  const [orderOpenNotice, setOrderOpenNotice] = useState("");
  const [printOrderId, setPrintOrderId] = useState<number | null>(null);
  const { user } = useLoggedUser();
  const createOrder = useCreateOrder();
  const reopenOrder = useReopenOrder();
  const cancelOrder = useCancelOrder();
  const ordersQuery = useOrders({
    tipo: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
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

  async function handleCreateOrder(tipo: "COMPRA" | "VENDA") {
    setCreateOrderError("");
    setOrderOpenNotice("");

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

      const existingOrder = (openOrdersResult.data ?? [])
        .filter((order) => order.userID === user.id && order.tipo === tipo)
        .sort(
          (first, second) =>
            new Date(second.atualizado || second.criado_em).getTime() -
            new Date(first.atualizado || first.criado_em).getTime(),
        )[0];

      if (existingOrder) {
        setCreateOrderError("");
        setOrderOpenNotice(
          `Pedido de ${tipo === "COMPRA" ? "compra" : "venda"} #${existingOrder.id} retomado por ${user.nome}. Nenhum novo pedido foi criado.`,
        );
        openOrder(existingOrder);
        return;
      }

      const order = await createOrder.mutateAsync(tipo);

      if (order.userID !== user.id) {
        setCreateOrderError(
          "O pedido foi associado a um usuário diferente da sessão atual.",
        );
        return;
      }

      setCurrentOrder(order);
      setOrderOpenNotice(
        `Pedido de ${tipo === "COMPRA" ? "compra" : "venda"} #${order.id} criado e aberto por ${user.nome}.`,
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

  return (
    <LayoutBase activeTab="pedidos" pageTitle="Gerenciar Pedidos">
      <div className="space-y-6 font-sans">
        {/* Upper Banner with Quick Sub-Tabs */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-400" />
              Central Geral de Pedidos
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Controle de fluxo de entrada (compras) e saídas (vendas). Cancele
              faturas, reabra cargas e altere registros de pesagem de forma
              centralizada.
            </p>
          </div>
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab("list")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all select-none cursor-pointer ${
                activeSubTab === "list"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Listagem de Pedidos
            </button>
            <button
              type="button"
              onClick={() => void handleCreateOrder("VENDA")}
              disabled={openingOrder}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "new_sale_order"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <Plus className="h-4 w-4" />
              {openingOrder ? "Verificando..." : "Pedido Venda"}
            </button>
            <button
              type="button"
              onClick={() => void handleCreateOrder("COMPRA")}
              disabled={openingOrder}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "new_purchase_order"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <Plus className="h-4 w-4" />
              {openingOrder ? "Verificando..." : "Pedido Compra"}
            </button>
          </div>
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
          <div
            className="fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-xl border border-emerald-500/30 bg-slate-900 p-4 text-sm text-slate-200 shadow-2xl shadow-slate-950/50"
            role="status"
            aria-live="polite"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <span className="flex-1 leading-5">{orderOpenNotice}</span>
            <button
              type="button"
              onClick={() => setOrderOpenNotice("")}
              className="rounded-md p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* SUBTAB 1: ORDERS LIST WORKSPACE */}
        {activeSubTab === "list" && (
          <div className="space-y-4">
            {/* Filtering controls bar */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row items-center gap-3">
              {/* Search Input */}
              <div className="relative w-full lg:flex-1">
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
            </div>

            {ordersQuery.isPending && (
              <div
                className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400"
                role="status"
              >
                Carregando pedidos...
              </div>
            )}

            {ordersQuery.isError && (
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
            {ordersQuery.isSuccess && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-400">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/15 text-slate-500 font-mono uppercase tracking-wider">
                        <th className="py-3 px-4">Pedido ID</th>
                        <th className="py-3 px-4">Fluxo</th>
                        <th className="py-3 px-4">Data Emissão</th>
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

                            {/* Date */}
                            <td className="py-3.5 px-4 text-slate-400 font-mono">
                              {formatarData(order.criado_em)}
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
                                  onClick={() => setPrintOrderId(order.id)}
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg cursor-pointer transition-colors"
                                  title="Visualizar e Emitir Cupom Térmico 80x40"
                                >
                                  <Printer className="h-4 w-4" />
                                </button>

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
            <NewOrder pedidoID={currentOrder.id} tipo={currentOrder.tipo} />
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

        {printOrderId !== null && (
          <PrintModalOrder
            orderId={printOrderId}
            onClose={() => setPrintOrderId(null)}
          />
        )}
      </div>
    </LayoutBase>
  );
}
