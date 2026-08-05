import { useDeferredValue, useMemo, useState } from "react";
import { LayoutBase } from "../../components/LayoutBase";
import {
  DollarSign,
  Search,
  Plus,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  ListFilter,
  Check,
  Building,
  ArrowUpCircle,
  Receipt,
  FileText,
  RotateCcw,
  Wallet,
  Lock,
  Unlock,
  History,
  Clock,
  User,
  ArrowDownCircle,
} from "lucide-react";
import FinancesTransferModal from "../../components/modals/FinancesTransferModal";
import CashCloseModal from "../../components/modals/CashCloseModal";
import CashOpenModal from "../../components/modals/CashOpenModal";
import BankModal from "../../components/modals/BankModal";
import ReconcileModal from "../../components/modals/ReconcileModal";
import IncomeModal from "../../components/modals/IncomeModal";
import ExpenseModal from "../../components/modals/ExpenseModal";
import UndoModal from "../../components/modals/UndoModal";
import ReverseFinancialEntryModal, {
  type ReversibleFinancialEntry,
} from "../../components/modals/ReverseFinancialEntryModal";
import {
  useCashReconciliation,
  useCashSessions,
  useFinancialAccounts,
  useFinancialMovements,
  useFinancialEntries,
} from "../../utils/queries";
import { useLoggedUser } from "../../context/useLoggedUser";

// --- CASH REGISTER (CONTROLE DE CAIXA DIÁRIO) TYPES ---
interface CashSession {
  id: number;
  status: "aberto" | "fechado";
  openedAt: string; // ISO String
  closedAt?: string; // ISO String
  openedBy: string;
  initialBalance: number;
  expectedBalance: number;
  actualBalance?: number;
  discrepancy?: number;
  notes?: string;
  bankAccountId: string;
  bankAccountName: string;
}

interface FinancialOperationLog {
  id: string;
  date: string;
  type: "income" | "expense";
  description: string;
  account: string;
  category: string;
  value: number;
  status: "Líquido" | "Pendente";
}
export function Financeiro() {
  const [activeSubTab, setActiveSubTab] = useState("fluxo");
  const [searchTerm, setSearchTerm] = useState("");
  const [flowFilter, setFlowFilter] = useState<"all" | "income" | "expense">(
    "all",
  );

  // --- CASH REGISTER STATE & LOCAL PERSISTENCE ---
  const cashReconciliationQuery = useCashReconciliation();
  const cashSessionsQuery = useCashSessions();
  const financialAccountsQuery = useFinancialAccounts();
  const financialMovementsQuery = useFinancialMovements();
  const { user } = useLoggedUser();
  const defaultApiAccount = financialAccountsQuery.data?.find(
    (account) => account.conta_padrao,
  );
  const activeSession = cashReconciliationQuery.data
    ? {
        id: cashReconciliationQuery.data.id,
        openedAt: cashReconciliationQuery.data.data_abertura,
        openedBy: user?.nome ?? "Usuário autenticado",
        initialBalance: cashReconciliationQuery.data.valor_abertura,
        expectedBalance: cashReconciliationQuery.data.valor_esperado,
        bankAccountId: String(defaultApiAccount?.id ?? ""),
        bankAccountName: defaultApiAccount?.nome ?? "Conta padrão",
      }
    : null;
  const activeSessionTransactions = (
    cashReconciliationQuery.data?.movimentacoes ?? []
  )
    .filter(
      (movement) => movement.caixa_id === cashReconciliationQuery.data?.id,
    )
    .map((movement) => ({
      id: movement.id,
      date: `Caixa #${movement.caixa_id}`,
      type:
        movement.direcao === "ENTRADA"
          ? ("entrada" as const)
          : ("saída" as const),
      description: movement.descricao,
      category: movement.origem.replaceAll("_", " "),
      value: movement.valor,
    }));
  const cashSessions: CashSession[] = (cashSessionsQuery.data ?? [])
    .filter((cash) => cash.status === "FECHADO")
    .map((cash) => ({
      id: cash.id,
      status: "fechado",
      openedAt: cash.aberto_em,
      closedAt: cash.fechado_em,
      openedBy: cash.usuario_abertura?.nome ?? "Não informado",
      initialBalance: cash.saldo_inicial,
      expectedBalance: cash.saldo_final_sistema ?? 0,
      actualBalance: cash.saldo_final_informado,
      discrepancy: cash.diferenca,
      notes: cash.observacao_fechamento,
      bankAccountId: String(cash.conta_id),
      bankAccountName: cash.conta?.nome ?? "Conta não informada",
    }));

  // Modal open controllers
  const [isCashOpenModalOpen, setIsCashOpenModalOpen] = useState(false);
  const [isCashCloseModalOpen, setIsCashCloseModalOpen] = useState(false);

  const totalBalance = (financialAccountsQuery.data ?? []).reduce(
    (total, account) => total + account.saldo_atual,
    0,
  );
  const operationLog = useMemo<FinancialOperationLog[]>(
    () =>
      (financialMovementsQuery.data?.dados ?? []).map((movement) => ({
        id: `M-${movement.id}`,
        date: new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(movement.criado_em)),
        type:
          movement.direcao === "ENTRADA"
            ? ("income" as const)
            : ("expense" as const),
        description: movement.descricao,
        account: movement.conta?.nome ?? `Conta #${movement.conta_id}`,
        category: movement.origem.replaceAll("_", " "),
        value: movement.valor,
        status: "Líquido" as const,
      })),
    [financialMovementsQuery.data],
  );
  const totalIncomes = operationLog
    .filter((operation) => operation.type === "income")
    .reduce((total, operation) => total + operation.value, 0);
  const totalExpenses = operationLog
    .filter((operation) => operation.type === "expense")
    .reduce((total, operation) => total + operation.value, 0);
  const filteredLog = operationLog.filter((operation) => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");
    return (
      (flowFilter === "all" || operation.type === flowFilter) &&
      (!normalizedSearch ||
        operation.description
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        operation.account
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch) ||
        operation.category
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedSearch))
    );
  });
  // Helper to filter bank accounts representing physical Cash

  const bankAccounts = (financialAccountsQuery.data ?? []).map((account) => ({
    id: account.id,
    name: account.nome,
    bankName: account.conta_padrao ? "Conta padrão" : "Conta financeira",
    balance: account.saldo_atual,
    color: "bg-emerald-50 text-emerald-800 border-emerald-200",
  }));

  // Auto-set the opening account ID once default becomes available

  // Update opening initial balance if account changes

  // Real-time tracking of transactions in Cash for the active session

  const totalCashIn = cashReconciliationQuery.data?.total_creditos ?? 0;
  const totalCashOut = cashReconciliationQuery.data?.total_debitos ?? 0;

  const currentExpectedBalance = activeSession
    ? activeSession.expectedBalance
    : 0;

  // Handler to Open Cash Register

  // Lançar Nova Despesa (Screen 9 Modal) State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Lançar Nova Receita State
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);

  // Transferência entre Bancos (Screen 10 Modal) State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // 1. Criar Banco Modal State
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // 2. Dar Baixa Modal State
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [reconcileItem, setReconcileItem] = useState<any>(null);

  // 3. Desfazer Operação Modal State
  const [isUndoModalOpen, setIsUndoModalOpen] = useState(false);
  const [undoItem, setUndoItem] = useState<any>(null);
  const [reverseEntryItem, setReverseEntryItem] =
    useState<ReversibleFinancialEntry | null>(null);
  const [openSearchTerm, setOpenSearchTerm] = useState("");
  const deferredOpenSearch = useDeferredValue(openSearchTerm);
  const [openTypeFilter, setOpenTypeFilter] = useState<
    "all" | "expense" | "income"
  >("all");
  const [entryStatusFilter, setEntryStatusFilter] = useState<
    "all" | "ABERTO" | "PAGO" | "CANCELADO"
  >("all");
  const [entryStartDate, setEntryStartDate] = useState("");
  const [entryEndDate, setEntryEndDate] = useState("");
  const financialEntriesQuery = useFinancialEntries({
    status: entryStatusFilter === "all" ? undefined : entryStatusFilter,
    tipo:
      openTypeFilter === "all"
        ? undefined
        : openTypeFilter === "expense"
          ? "PAGAR"
          : "RECEBER",
    nome: deferredOpenSearch,
    dataInicial: entryStartDate,
    dataFinal: entryEndDate,
  });
  const openEntriesSummaryQuery = useFinancialEntries({ status: "ABERTO" });
  const filteredOpenLog = (financialEntriesQuery.data ?? []).map((entry) => ({
    id: entry.id,
    type: entry.tipo === "PAGAR" ? ("expense" as const) : ("income" as const),
    description: entry.titulo || entry.descricao,
    date: new Date(entry.vencimento).toLocaleDateString("pt-BR"),
    rawDate: entry.vencimento.slice(0, 10),
    category: entry.categoria?.nome ?? "Sem categoria",
    account: "",
    value: entry.valor + entry.acrescimo - entry.desconto,
    status: entry.status,
  }));
  const pendingEntries = (openEntriesSummaryQuery.data ?? []).map((entry) => ({
    type: entry.tipo === "PAGAR" ? ("expense" as const) : ("income" as const),
    value: entry.valor + entry.acrescimo - entry.desconto,
  }));
  const pendingExpenses = pendingEntries.filter(
    (entry) => entry.type === "expense",
  );
  const pendingIncomes = pendingEntries.filter(
    (entry) => entry.type === "income",
  );
  const totalPendingExpenseValue = pendingExpenses.reduce(
    (total, entry) => total + entry.value,
    0,
  );
  const totalPendingIncomeValue = pendingIncomes.reduce(
    (total, entry) => total + entry.value,
    0,
  );
  const totalPendingCount = pendingEntries.length;

  return (
    <LayoutBase activeTab="financeiro" pageTitle="FINANCEIRO">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 mb-4 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("fluxo")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
              activeSubTab === "fluxo"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Visão Geral & Caixa Diário</span>
          </button>

          <button
            onClick={() => setActiveSubTab("abertas")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none whitespace-nowrap ${
              activeSubTab === "abertas"
                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Contas a Pagar / Receber</span>
            {totalPendingCount > 0 && (
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {totalPendingCount}
              </span>
            )}
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 px-3 text-xs text-slate-500 font-mono">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span>Gestão Financeira</span>
        </div>
      </div>
      <div className="space-y-6 font-sans">
        {activeSubTab === "fluxo" && (
          <div className="space-y-6">
            {/* Upper Banner with Quick Actions */}

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                  Fluxo de Caixa & Contas Bancárias
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gestão financeira unificada. Lance despesas administrativas,
                  registre aportes operacionais e execute transferências
                  internas.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTransferModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                >
                  <ArrowRightLeft className="h-4 w-4 text-emerald-400" />
                  Transferência
                </button>
                <button
                  onClick={() => {
                    setIsIncomeModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Lançar Receita
                </button>
                <button
                  onClick={() => {
                    setIsExpenseModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 border border-rose-500/20 font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Lançar Despesa
                </button>
              </div>
            </div>

            {/* ========================================================================================= */}
            {/* CONTROLE DE CAIXA FÍSICO DIÁRIO PANEL */}
            {/* ========================================================================================= */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl ${activeSession ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}
                  >
                    {activeSession ? (
                      <Unlock className="h-5 w-5 animate-pulse" />
                    ) : (
                      <Lock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 flex items-center gap-2">
                      Controle de Caixa Diário (Gaveta de Dinheiro Físico)
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          activeSession
                            ? "bg-emerald-500/10 text-emerald-400 animate-pulse border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {activeSession ? "Caixa Aberto" : "Caixa Fechado"}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeSession
                        ? `Sessão ativa vinculada à conta "${activeSession.bankAccountName}" para conferência no fim do expediente.`
                        : "Abra o caixa ao iniciar o dia para rastrear todas as compras, vendas e despesas em dinheiro físico."}
                    </p>
                  </div>
                </div>
                <div>
                  {activeSession ? (
                    <button
                      onClick={() => {
                        setIsCashCloseModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 border border-rose-500/20 font-bold rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2 transition-all select-none"
                    >
                      <Lock className="h-4 w-4" />
                      Fechar Caixa (Conferência)
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setIsCashOpenModalOpen(true);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer flex items-center justify-center gap-2 transition-all shadow-md select-none"
                    >
                      <Unlock className="h-4 w-4" />
                      Abrir Caixa Diário
                    </button>
                  )}
                </div>
              </div>

              {/* ACTIVE SESSION DASHBOARD */}
              {activeSession ? (
                <div className="space-y-6">
                  {/* Bento Grid Info Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                        Identificador / Data
                      </span>
                      <p className="text-sm font-bold text-slate-200 mt-1 font-mono">
                        {activeSession.id}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5 font-mono">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>
                          Aberto em:{" "}
                          {new Date(activeSession.openedAt).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                        Operador Responsável
                      </span>
                      <p className="text-sm font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-emerald-400" />
                        {activeSession.openedBy}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-1.5">
                        Responsável pela sessão
                      </span>
                    </div>

                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">
                        Saldo Inicial de Abertura
                      </span>
                      <p className="text-base font-extrabold text-slate-100 mt-1 font-mono">
                        R${" "}
                        {activeSession.initialBalance.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <span className="text-[10px] text-slate-500 block mt-1.5">
                        Valor declarado em gaveta física
                      </span>
                    </div>

                    <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                      <span className="text-[10px] text-emerald-400/80 font-bold uppercase block tracking-wider">
                        Saldo Esperado em Caixa
                      </span>
                      <p className="text-lg font-black text-emerald-400 mt-1 font-mono">
                        R${" "}
                        {currentExpectedBalance.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <div className="flex justify-between items-center text-[9px] text-slate-400 mt-1 font-mono">
                        <span className="text-emerald-400">
                          +
                          {totalCashIn.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          (Entradas)
                        </span>
                        <span className="text-rose-400">
                          -
                          {totalCashOut.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          (Saídas)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-table: Transactions registered in this active session */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="h-3.5 w-3.5 text-slate-500" />
                      Lançamentos em Dinheiro do Caixa Ativo (
                      {activeSessionTransactions.length})
                    </h4>

                    {activeSessionTransactions.length === 0 ? (
                      <div className="bg-slate-950/10 border border-slate-800/60 p-6 rounded-xl text-center">
                        <p className="text-xs text-slate-500">
                          Nenhuma compra, venda, receita ou despesa em dinheiro
                          físico foi registrada hoje.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-950/20 border border-slate-800/50 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs text-slate-400">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-950/25 text-slate-500 font-mono text-[10px] uppercase">
                              <th className="py-2.5 px-3">Código</th>
                              <th className="py-2.5 px-3">Caixa</th>
                              <th className="py-2.5 px-3">Fluxo</th>
                              <th className="py-2.5 px-3">
                                Descrição do Lançamento
                              </th>
                              <th className="py-2.5 px-3">Categoria</th>
                              <th className="py-2.5 px-3 text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {activeSessionTransactions.map((t) => (
                              <tr key={t.id} className="hover:bg-slate-800/5">
                                <td className="py-2 px-3 font-mono text-slate-500 font-bold text-[10px]">
                                  {t.id}
                                </td>
                                <td className="py-2 px-3 text-slate-500 font-mono text-[10px]">
                                  {t.date}
                                </td>
                                <td className="py-2 px-3">
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[8px] font-bold ${
                                      t.type === "entrada"
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                                        : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
                                    }`}
                                  >
                                    {t.type === "entrada" ? "ENTRADA" : "SAÍDA"}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-300 font-semibold">
                                  {t.description}
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[10px]">
                                  {t.category}
                                </td>
                                <td
                                  className={`py-2 px-3 text-right font-mono font-bold ${
                                    t.type === "entrada"
                                      ? "text-emerald-400"
                                      : "text-rose-400"
                                  }`}
                                >
                                  {t.type === "entrada" ? "+" : "-"} R${" "}
                                  {t.value.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* CLOSED STATE INTRO PANEL */
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-950/20 p-6 rounded-xl border border-slate-800/80">
                  <div className="space-y-2 max-w-xl">
                    <h4 className="text-sm font-bold text-slate-200">
                      Como funciona o caixa diário operacional?
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ao iniciar o expediente, realize a abertura informando o
                      saldo inicial da gaveta física. Durante o dia, qualquer
                      compra de materiais ou venda balcão em dinheiro físico
                      altera o saldo de forma controlada. No fim do expediente,
                      conte o numerário físico e feche o caixa para registrar e
                      conciliar automaticamente quaisquer quebras ou sobras.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
                    <button
                      onClick={() => {
                        setIsCashOpenModalOpen(true);
                      }}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 hover:border-emerald-500/30 rounded-xl text-xs uppercase font-bold cursor-pointer flex items-center justify-center gap-2 select-none transition-all"
                    >
                      <Unlock className="h-4 w-4 text-emerald-400" />
                      Iniciar Abertura de Caixa
                    </button>
                  </div>
                </div>
              )}

              {/* HISTORICAL CLOSURES TABLE */}
              {cashSessions.length > 0 && (
                <div className="border-t border-slate-800 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-slate-500" />
                    Histórico de Fechamentos de Caixa
                  </h4>
                  <div className="bg-slate-950/15 border border-slate-800/50 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-400">
                      <thead className="sticky top-0 bg-slate-900 border-b border-slate-800/80 text-slate-500 font-mono text-[10px] uppercase z-10">
                        <tr>
                          <th className="py-2.5 px-3">Código Caixa</th>
                          <th className="py-2.5 px-3">Abertura</th>
                          <th className="py-2.5 px-3">Fechamento</th>
                          <th className="py-2.5 px-3">Operador</th>
                          <th className="py-2.5 px-3 text-right">
                            Saldo Inicial
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            Saldo Esperado
                          </th>
                          <th className="py-2.5 px-3 text-right">
                            Contagem Real
                          </th>
                          <th className="py-2.5 px-3 text-center">Diferença</th>
                          <th className="py-2.5 px-3">Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 font-medium">
                        {cashSessions.map((session) => (
                          <tr key={session.id} className="hover:bg-slate-800/5">
                            <td className="py-2 px-3 font-mono text-slate-400 font-bold text-[10px]">
                              {session.id}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[10px]">
                              {new Date(session.openedAt).toLocaleDateString(
                                "pt-BR",
                              )}{" "}
                              {new Date(session.openedAt).toLocaleTimeString(
                                "pt-BR",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[10px]">
                              {session.closedAt ? (
                                <>
                                  {new Date(
                                    session.closedAt,
                                  ).toLocaleDateString("pt-BR")}{" "}
                                  {new Date(
                                    session.closedAt,
                                  ).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-300">
                              {session.openedBy}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-400">
                              R${" "}
                              {session.initialBalance.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-400">
                              R${" "}
                              {session.expectedBalance.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-slate-200">
                              R${" "}
                              {session.actualBalance?.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {session.discrepancy !== undefined ? (
                                <span
                                  className={`inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold ${
                                    session.discrepancy === 0
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                                      : session.discrepancy > 0
                                        ? "bg-sky-500/10 text-sky-400 border border-sky-500/10"
                                        : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
                                  }`}
                                >
                                  {session.discrepancy === 0
                                    ? "Sem divergências"
                                    : `${session.discrepancy > 0 ? "+" : ""} R$ ${session.discrepancy.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td
                              className="py-2 px-3 text-slate-500 text-[10px] truncate max-w-[150px]"
                              title={session.notes}
                            >
                              {session.notes || (
                                <span className="text-slate-600 italic">
                                  Nenhuma
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* BANK VAULTS LIST (Screen 7 layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {bankAccounts.map((acct) => (
                <div
                  key={acct.id}
                  className="border rounded-2xl p-5 shadow-xs bg-slate-900 border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-3">
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {acct.id}
                      </span>
                      <Building className="h-4 w-4 text-slate-500" />
                    </div>
                    <p className="text-xs text-slate-400 font-semibold leading-tight">
                      {acct.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {acct.bankName}
                    </p>
                  </div>
                  <h4 className="text-xl font-extrabold text-slate-100 tracking-tight mt-4 font-mono">
                    R${" "}
                    {acct.balance.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </h4>
                </div>
              ))}

              {/* Interactive "Criar Novo Banco" Card */}
              <div
                onClick={() => setIsBankModalOpen(true)}
                className="border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer flex flex-col items-center justify-center min-h-[140px] transition-all group select-none"
              >
                <div className="h-9 w-9 rounded-xl bg-slate-800/50 group-hover:bg-emerald-500/10 flex items-center justify-center mb-2.5 transition-colors">
                  <Plus className="h-5 w-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <p className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                  Nova Conta / Banco
                </p>
                <p className="text-[10px] text-slate-500 text-center mt-1 max-w-[150px] leading-snug">
                  Cadastre novo caixa físico, cofre ou conta corrente.
                </p>
              </div>
            </div>

            {/* CORE FINANCIAL STATISTICS STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-center md:border-r border-slate-800/80 py-2">
                <span className="text-xs text-slate-500 font-bold uppercase font-mono block">
                  Saldo Total de Caixa
                </span>
                <p className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
                  R${" "}
                  {totalBalance.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-center md:border-r border-slate-800/80 py-2">
                <span className="text-xs text-slate-500 font-bold uppercase font-mono block">
                  Faturamento Bruto (Mês)
                </span>
                <p className="text-3xl font-extrabold text-sky-400 mt-1 font-mono">
                  R${" "}
                  {totalIncomes.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="text-center py-2">
                <span className="text-xs text-slate-500 font-bold uppercase font-mono block">
                  Outflows de Caixa (Despesas)
                </span>
                <p className="text-3xl font-extrabold text-rose-400 mt-1 font-mono">
                  R${" "}
                  {totalExpenses.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            {/* FINANCES JOURNAL (Screen 7 table) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/15 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-100">
                    Extrato de Movimentações
                  </h3>
                  <p className="text-xs text-slate-400">
                    Exibindo {filteredLog.length} movimentações financeiras
                    recentes.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto xl:justify-end">
                  {/* Search */}
                  <div className="relative flex-1 min-w-[200px] max-w-sm xl:flex-none">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Search className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Filtrar por descrição ou conta..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 text-xs border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Toggle Income/Expense */}
                  <select
                    value={flowFilter}
                    onChange={(e) => setFlowFilter(e.target.value as any)}
                    className="bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  >
                    <option value="all">Ver Tudo</option>
                    <option value="income">Entradas (+)</option>
                    <option value="expense">Saídas (-)</option>
                  </select>

                  {/* Export buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {}}
                      className="flex items-center justify-center gap-1.5 bg-slate-950/40 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold px-3 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all hover:border-emerald-500/25 select-none"
                      title="Exportar fluxo de caixa para CSV"
                    >
                      <FileText className="h-4 w-4 text-emerald-400" />
                      Exportar CSV
                    </button>
                    <button
                      onClick={() => {}}
                      className="flex items-center justify-center gap-1.5 bg-slate-950/40 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold px-3 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all hover:border-rose-500/25 select-none"
                      title="Gerar PDF do fluxo de caixa"
                    >
                      <FileText className="h-4 w-4 text-rose-400" />
                      Exportar PDF
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/10 text-slate-500 font-mono uppercase tracking-wider">
                      <th className="py-3 px-4">Código</th>
                      <th className="py-3 px-4">Data Ocor</th>
                      <th className="py-3 px-4">Fluxo</th>
                      <th className="py-3 px-4">Descrição de Lançamento</th>
                      <th className="py-3 px-4">Conta Débito/Crédito</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4 text-right">Valor Operação</th>
                      <th className="py-3 px-4 text-center">Situação</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredLog.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-800/10 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                          {log.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {log.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                              log.type === "income"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {log.type === "income" ? "CRÉDITO" : "DÉBITO"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-200">
                          {log.description}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono">
                          {log.account || "Não conciliada"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {log.category}
                        </td>
                        <td
                          className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                            log.type === "income"
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {log.type === "income" ? "+" : "-"} R${" "}
                          {log.value.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] ${
                              log.status === "Líquido"
                                ? "text-emerald-400"
                                : "text-amber-400"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${log.status === "Líquido" ? "bg-emerald-400" : "bg-amber-400"}`}
                            ></span>
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {log.status === "Pendente" && (
                              <button
                                onClick={() => {
                                  setReconcileItem(log);

                                  setIsReconcileModalOpen(true);
                                }}
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer border border-emerald-500/20 hover:border-emerald-500/40"
                                title="Dar Baixa (Registrar Recebimento/Pagamento)"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setUndoItem(log);

                                setIsUndoModalOpen(true);
                              }}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer border border-rose-500/20 hover:border-rose-500/40"
                              title="Desfazer / Estornar Operação"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {activeSubTab === "abertas" && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-400" />
                  Contas (A Pagar / A Receber)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Acompanhamento e liquidação de compromissos futuros e
                  faturamentos pendentes de recebimento.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsIncomeModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-500/20 font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Lançar Receita a Receber
                </button>
                <button
                  onClick={() => {
                    setIsExpenseModalOpen(true);
                  }}
                  className="flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500 hover:text-slate-950 text-rose-400 border border-rose-500/20 font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-all"
                >
                  <ArrowDownRight className="h-4 w-4" />
                  Lançar Conta a Pagar
                </button>
              </div>
            </div>

            {/* Bento Grid Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowDownCircle className="h-3.5 w-3.5" />
                    Total Contas a Pagar (Abertas)
                  </span>
                  <span className="bg-rose-500/15 text-rose-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {pendingExpenses.length}{" "}
                    {pendingExpenses.length === 1 ? "conta" : "contas"}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-100 font-mono">
                  R${" "}
                  {totalPendingExpenseValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[10px] text-slate-500">
                  Despesas cadastradas pendentes de quitação
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpCircle className="h-3.5 w-3.5" />
                    Total Contas a Receber (Abertas)
                  </span>
                  <span className="bg-emerald-500/15 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {pendingIncomes.length}{" "}
                    {pendingIncomes.length === 1 ? "conta" : "contas"}
                  </span>
                </div>
                <p className="text-2xl font-black text-slate-100 font-mono">
                  R${" "}
                  {totalPendingIncomeValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[10px] text-slate-500">
                  Faturamentos pendentes de cobrança/recebimento
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <Receipt className="h-3.5 w-3.5" />
                    Saldo Líquido em Aberto
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                      totalPendingIncomeValue - totalPendingExpenseValue >= 0
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-rose-500/15 text-rose-400"
                    }`}
                  >
                    {totalPendingIncomeValue - totalPendingExpenseValue >= 0
                      ? "Superávit Previsto"
                      : "Déficit Previsto"}
                  </span>
                </div>
                <p
                  className={`text-2xl font-black font-mono ${
                    totalPendingIncomeValue - totalPendingExpenseValue >= 0
                      ? "text-emerald-400"
                      : "text-rose-400"
                  }`}
                >
                  R${" "}
                  {Math.abs(
                    totalPendingIncomeValue - totalPendingExpenseValue,
                  ).toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-[10px] text-slate-500">
                  Projeção líquida após quitação das pendências
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-center">
              <div className="relative w-full xl:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar por título, descrição, categoria ou registro..."
                  value={openSearchTerm}
                  onChange={(e) => setOpenSearchTerm(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <select
                value={entryStatusFilter}
                onChange={(event) =>
                  setEntryStatusFilter(
                    event.target.value as typeof entryStatusFilter,
                  )
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
              >
                <option value="all">Todos os status</option>
                <option value="ABERTO">Em aberto</option>
                <option value="PAGO">Pago</option>
                <option value="CANCELADO">Cancelado</option>
              </select>

              <label className="text-[10px] font-bold uppercase text-slate-500">
                Data inicial
                <input
                  type="date"
                  value={entryStartDate}
                  max={entryEndDate || undefined}
                  onChange={(event) => setEntryStartDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </label>
              <label className="text-[10px] font-bold uppercase text-slate-500">
                Data final
                <input
                  type="date"
                  value={entryEndDate}
                  min={entryStartDate || undefined}
                  onChange={(event) => setEntryEndDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </label>

              <div className="flex items-center gap-1.5 w-full md:col-span-2 xl:col-span-5">
                <button
                  onClick={() => setOpenTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    openTypeFilter === "all"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  Todas ({totalPendingCount})
                </button>
                <button
                  onClick={() => setOpenTypeFilter("expense")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    openTypeFilter === "expense"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  A Pagar ({pendingExpenses.length})
                </button>
                <button
                  onClick={() => setOpenTypeFilter("income")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    openTypeFilter === "income"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-950/40 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  A Receber ({pendingIncomes.length})
                </button>
              </div>
            </div>

            {/* Table of Open Accounts */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-amber-400" />
                  Listagem de Títulos ({filteredOpenLog.length})
                </h3>
              </div>

              {financialEntriesQuery.isPending ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Carregando títulos financeiros...
                </div>
              ) : financialEntriesQuery.isError ? (
                <div className="p-12 text-center text-xs text-rose-400">
                  Não foi possível carregar os títulos financeiros.
                </div>
              ) : filteredOpenLog.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Clock className="h-8 w-8 text-slate-600 mx-auto opacity-50" />
                  <p className="text-slate-400 text-xs font-semibold">
                    Nenhum título encontrado.
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Não existem lançamentos correspondentes aos filtros
                    informados.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
                        <th className="py-3 px-4">Código</th>
                        <th className="py-3 px-4">Tipo</th>
                        <th className="py-3 px-4">Descrição do Lançamento</th>
                        <th className="py-3 px-4">Data / Vencimento</th>
                        <th className="py-3 px-4">Categoria</th>
                        <th className="py-3 px-4 text-right">Valor Operação</th>
                        <th className="py-3 px-4 text-center">Situação</th>
                        <th className="py-3 px-4 text-right">
                          Ação / Liquidação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredOpenLog.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-400 text-[11px]">
                            {item.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.type === "expense"
                                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                  : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {item.type === "expense"
                                ? "A PAGAR"
                                : "A RECEBER"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-100">
                            {item.description}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {item.date}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {item.category}
                          </td>
                          <td
                            className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${
                              item.type === "expense"
                                ? "text-rose-400"
                                : "text-emerald-400"
                            }`}
                          >
                            R${" "}
                            {item.value.toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                item.status === "ABERTO"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : item.status === "PAGO"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.status === "ABERTO"
                                    ? "bg-amber-400"
                                    : item.status === "PAGO"
                                      ? "bg-emerald-400"
                                      : "bg-slate-500"
                                }`}
                              ></span>
                              {item.status === "ABERTO"
                                ? "Em aberto"
                                : item.status === "PAGO"
                                  ? "Pago"
                                  : "Cancelado"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              {item.status === "ABERTO" && (
                                <button
                                  onClick={() => {
                                    setReconcileItem({
                                      id: item.id,
                                      type: item.type,
                                      description: item.description,
                                      value: item.value,
                                      account: item.account,
                                    });
                                    setIsReconcileModalOpen(true);
                                  }}
                                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5 ml-auto shadow-xs"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Finalizar</span>
                                </button>
                              )}
                              {item.status === "PAGO" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReverseEntryItem({
                                      id: item.id,
                                      type: item.type,
                                      description: item.description,
                                      value: item.value,
                                    })
                                  }
                                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-1.5 text-xs font-bold uppercase text-rose-400 transition-colors hover:bg-rose-500 hover:text-slate-950"
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Estornar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {isTransferModalOpen && (
        <FinancesTransferModal setIsOpen={setIsTransferModalOpen} />
      )}
      {isCashOpenModalOpen && (
        <CashOpenModal setIsOpen={setIsCashOpenModalOpen} />
      )}
      {isCashCloseModalOpen && (
        <CashCloseModal setIsOpen={setIsCashCloseModalOpen} />
      )}
      {isBankModalOpen && <BankModal setIsOpen={setIsBankModalOpen} />}
      {isReconcileModalOpen && (
        <ReconcileModal
          setIsOpen={setIsReconcileModalOpen}
          item={reconcileItem}
        />
      )}
      {isIncomeModalOpen && <IncomeModal setIsOpen={setIsIncomeModalOpen} />}
      {isExpenseModalOpen && <ExpenseModal setIsOpen={setIsExpenseModalOpen} />}
      {isUndoModalOpen && (
        <UndoModal setIsOpen={setIsUndoModalOpen} item={undoItem} />
      )}
      {reverseEntryItem && (
        <ReverseFinancialEntryModal
          item={reverseEntryItem}
          setIsOpen={(open) => {
            if (!open) setReverseEntryItem(null);
          }}
        />
      )}
    </LayoutBase>
  );
}
