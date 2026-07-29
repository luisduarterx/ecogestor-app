import { useState } from "react";
import { LayoutBase } from "../../components/LayoutBase";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  ClipboardList,
  DollarSign,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
} from "lucide-react";
import NewOrder from "../../components/NewOrder";

export function Pedidos() {
  const [activeSubTab, setActiveSubTab] = useState<
    "list" | "new_purchase_order" | "new_sale_order"
  >("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

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
              onClick={() => setActiveSubTab("new_sale_order")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "new_sale_order"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <Plus className="h-4 w-4" />
              Pedido Venda
            </button>
            <button
              onClick={() => setActiveSubTab("new_purchase_order")}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all select-none cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === "new_purchase_order"
                  ? "bg-emerald-400 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              <Plus className="h-4 w-4" />
              Pedido Compra
            </button>
          </div>
        </div>

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
                  placeholder="Filtrar pedidos por código, cliente, fornecedor ou observações..."
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
                  onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full lg:w-40 bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">Ver Todos</option>
                  <option value="compra">Compras (Entradas)</option>
                  <option value="venda">Vendas (Saídas)</option>
                </select>
              </div>

              {/* Status selector */}
              <div className="flex items-center gap-1.5 w-full lg:w-auto">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 whitespace-nowrap">
                  Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full lg:w-40 bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">Todos Status</option>
                  <option value="pago">Líquido (Pago)</option>
                  <option value="pendente">Pendente / Faturado</option>
                  <option value="cancelado">Estornado (Cancelado)</option>
                </select>
              </div>
            </div>

            {/* Orders Table Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/15 text-slate-500 font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">Pedido ID</th>
                      <th className="py-3 px-4">Fluxo</th>
                      <th className="py-3 px-4">Data Emissão</th>
                      <th className="py-3 px-4">Parceiro Comercial</th>
                      <th className="py-3 px-4">Material de Pesagem</th>
                      <th className="py-3 px-4 text-right">Valor Líquido</th>
                      <th className="py-3 px-4 text-center">Faturamento</th>
                      <th className="py-3 px-4 text-center">Situação</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredOrders.map((order) => {
                      const isSale = order.type === "venda";
                      const itemsSummary = order.items
                        .map((i: any) => `${i.name} (${i.quantity}kg)`)
                        .join(", ");

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
                            {order.date}
                          </td>

                          {/* Customer/Supplier */}
                          <td className="py-3.5 px-4 text-slate-200 font-semibold truncate max-w-[160px]">
                            {order.partnerName}
                          </td>

                          {/* Material Summary */}
                          <td
                            className="py-3.5 px-4 text-slate-400 truncate max-w-[180px]"
                            title={itemsSummary}
                          >
                            {itemsSummary}
                          </td>

                          {/* Value */}
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                            R${" "}
                            {order.total.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>

                          {/* Payment Method / Terms */}
                          <td className="py-3.5 px-4 text-center text-slate-400 font-medium text-[11px]">
                            {order.paymentMethod} (
                            {order.paymentTerms === "vista"
                              ? "À Vista"
                              : order.paymentTerms}
                            )
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                                order.status === "pago"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : order.status === "pendente"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  order.status === "pago"
                                    ? "bg-emerald-400"
                                    : order.status === "pendente"
                                      ? "bg-amber-400"
                                      : "bg-rose-400"
                                }`}
                              ></span>
                              {order.status === "pago"
                                ? isSale
                                  ? "Recebido"
                                  : "Liquidado"
                                : order.status === "pendente"
                                  ? "Faturado"
                                  : "Estornado"}
                            </span>
                          </td>

                          {/* Actions Button List */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View & print 80x40 receipt button */}
                              <button
                                onClick={() => {
                                  setSelectedReceiptOrder(order);
                                  setSelectedReceiptType(order.type);
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg cursor-pointer transition-colors"
                                title="Visualizar e Emitir Cupom Térmico 80x40"
                              >
                                <Printer className="h-4 w-4" />
                              </button>

                              {/* Only edit if NOT cancelled */}
                              {order.status !== "cancelado" && (
                                <button
                                  onClick={() =>
                                    startEditOrder(order, order.type)
                                  }
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-lg cursor-pointer transition-colors"
                                  title="Editar quantias ou preços do pedido"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}

                              {/* Cancel / Reopen Toggles */}
                              {order.status === "cancelado" ? (
                                <button
                                  onClick={() =>
                                    handleReopenOrder(order.id, order.type)
                                  }
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 rounded-lg cursor-pointer transition-all"
                                  title="Reabrir / Restaurar Pedido"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleCancelOrder(order.id, order.type)
                                  }
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-950 rounded-lg cursor-pointer transition-all"
                                  title="Cancelar / Estornar Lançamento"
                                >
                                  <Ban className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredOrders.length === 0 && (
                      <tr>
                        <td
                          colSpan={9}
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
          </div>
        )}

        {/* SUBTAB 2: LAUNCH NEW SALE ORDER WORKSPACE */}
        {activeSubTab === "new_purchase_order" && <NewOrder type="purchase" />}
        {activeSubTab === "new_sale_order" && <NewOrder type="sale" />}
      </div>
    </LayoutBase>
  );
}
