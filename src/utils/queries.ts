import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type ApiError,
  type AddOrderItemInput,
  type CreateOrderResponse,
  type CloseCashInput,
  type CreateMaterialInput,
  type CreateFinancialAccountInput,
  type DashboardSummary,
  type FinalizeOrderInput,
  type FinancialAccountResponse,
  type FinancialCategoryResponse,
  type FinancialEntryInput,
  type FinancialEntryResponse,
  type FinancialTransferInput,
  type FinancialMovementsResponse,
  type InventoryBalancesResponse,
  type InventoryAdjustmentInput,
  type InventoryConversion,
  type InventoryConversionInput,
  type InventoryConversionsResponse,
  type InventoryMovement,
  type InventoryMovementsResponse,
  type UserAuthenticated,
  type LoginReponse,
  type MaterialResponse,
  type MaterialCategoryResponse,
  type OrderItemResponse,
  type OrderResponse,
  type OrdersFilters,
  type OrdersResponse,
  type RecordsResponse,
  type RecordsFilters,
  type CreateRecordInput,
  type ReconciliationCashResponse,
  type CashResponse,
  type TableResponse,
  type TablesResponse,
  type SaveTableInput,
} from "./types";
import { api } from "./api";

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { email: string; senha: string }) => {
      const { data } = await api.post<LoginReponse>("auth/signin", credentials);
      return data;
    },
  });
};
export function useSession(enabled: boolean) {
  return useQuery({
    queryKey: ["auth", "session"],
    enabled,
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.post<UserAuthenticated>("auth/validate");

      return data;
    },
  });
}
export function useDashboard(date: string) {
  return useQuery({
    queryKey: ["dashboard", "resumo", date],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>("/dashboard/resumo", {
        params: {
          dataInicial: date,
          dataFinal: date,
        },
      });
      return {
        totalStockKg: data.estoque.peso_total,
        totalPurchasedAmount: data.compras.valor_total,
        purchaseInvoicesCount: data.compras.quantidade_pedidos,
        totalExpenses: data.despesas_operacionais.valor_total,
        totalBankBalance: data.contas.saldo_total,
        bankAccountsCount: data.contas.quantidade_contas,
      };
    },
  });
}
export function useOrders(filters: OrdersFilters = {}) {
  return useQuery({
    queryKey: ["pedidos", filters],
    queryFn: async () => {
      const { data } = await api.get<OrdersResponse[]>("/pedidos", {
        params: filters,
      });
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation<CreateOrderResponse, ApiError, "COMPRA" | "VENDA">({
    mutationFn: async (tipo) => {
      const { data } = await api.post<CreateOrderResponse>("/pedidos", {
        tipo,
      });
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
  });
}

export function useOrder(pedidoID: number) {
  return useQuery({
    queryKey: ["pedido", pedidoID],
    queryFn: async () => {
      const { data } = await api.get<OrderResponse>(`/pedidos/${pedidoID}`);
      return data;
    },
  });
}

export function useRecords(filters: RecordsFilters = {}) {
  const { page = 1, take = 1000, search } = filters;
  return useQuery({
    queryKey: ["registros", { page, take, search }],
    queryFn: async () => {
      const { data } = await api.get<RecordsResponse[]>("/registros", {
        params: { page, take, search: search?.trim() || undefined },
      });
      return data;
    },
  });
}

export function useCreateRecord() {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, CreateRecordInput>({
    mutationFn: async (input) => {
      const { data } = await api.post("/registros", input);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["registros"] });
    },
  });
}

export function useMaterials() {
  return useQuery({
    queryKey: ["materiais", "selecao-pedido"],
    queryFn: async () => {
      const { data } = await api.get<MaterialResponse[]>("/materiais", {
        params: { order: "nome" },
      });
      return data;
    },
  });
}

export function useMaterialCategories() {
  return useQuery({
    queryKey: ["materiais", "categorias"],
    queryFn: async () => {
      const { data } = await api.get<MaterialCategoryResponse[]>(
        "/materiais/categorias",
      );
      return data;
    },
  });
}

export function useCreateMaterialCategory() {
  const queryClient = useQueryClient();

  return useMutation<MaterialCategoryResponse, ApiError, string>({
    mutationFn: async (nome) => {
      const { data } = await api.post<MaterialCategoryResponse>(
        "/materiais/categorias",
        { nome },
      );
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["materiais", "categorias"],
      });
    },
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();

  return useMutation<MaterialResponse, ApiError, CreateMaterialInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<MaterialResponse>("/materiais", input);
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["materiais"] }),
        queryClient.invalidateQueries({ queryKey: ["estoque", "saldos"] }),
      ]);
    },
  });
}

export function useTables() {
  return useQuery({
    queryKey: ["tabelas"],
    queryFn: async () => {
      const { data } = await api.get<TablesResponse[]>("/tabelas");
      return data;
    },
  });
}

export async function fetchTable(tableID: number) {
  const { data } = await api.get<{
    id: number;
    nome: string;
    padrao: boolean;
    updatedAt: string;
    materiais: Array<{
      id: number;
      materialID: number;
      v_compra: number | string;
    }>;
  }>(`/tabelas/${tableID}`);

  return {
    ...data,
    materiais: data.materiais.map((material) => ({
      id: material.id,
      materialID: material.materialID,
      preco_compra: Number(material.v_compra),
    })),
  } satisfies TableResponse;
}

export function useTable(tableID?: number) {
  return useQuery({
    queryKey: ["tabelas", tableID],
    enabled: Boolean(tableID),
    queryFn: () => fetchTable(tableID!),
  });
}

export function useCreateTable() {
  const queryClient = useQueryClient();

  return useMutation<TablesResponse, ApiError, SaveTableInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<TablesResponse>("/tabelas", input);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tabelas"] });
    },
  });
}

export function useUpdateTable(tableID?: number) {
  const queryClient = useQueryClient();

  return useMutation<TableResponse, ApiError, SaveTableInput>({
    mutationFn: async (input) => {
      const { data } = await api.patch<TableResponse>(
        `/tabelas/${tableID}`,
        input,
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tabelas"] }),
        queryClient.invalidateQueries({ queryKey: ["registros"] }),
      ]);
    },
  });
}

export function useDeleteTable() {
  const queryClient = useQueryClient();

  return useMutation<{ id: number; deletada: true }, ApiError, number>({
    mutationFn: async (tableID) => {
      const { data } = await api.delete<{ id: number; deletada: true }>(
        `/tabelas/${tableID}`,
      );
      return data;
    },
    onSuccess: async (_, tableID) => {
      queryClient.removeQueries({ queryKey: ["tabelas", tableID] });
      await queryClient.invalidateQueries({ queryKey: ["tabelas"] });
    },
  });
}

export function useInventoryBalances(categoriaID?: number) {
  return useQuery({
    queryKey: ["estoque", "saldos", categoriaID],
    queryFn: async () => {
      const { data } = await api.get<InventoryBalancesResponse>(
        "/estoque/saldos",
        {
          params: {
            pagina: 1,
            limite: 100,
            status: "ATIVO",
            categoriaID,
          },
        },
      );
      return data;
    },
  });
}

export function useInventoryMovements(filters: {
  categoriaID?: number;
  direcao?: "ENTRADA" | "SAIDA";
}) {
  return useQuery({
    queryKey: ["estoque", "movimentacoes", filters],
    queryFn: async () => {
      const { data } = await api.get<InventoryMovementsResponse>(
        "/estoque/movimentacoes",
        { params: { pagina: 1, limite: 100, ...filters } },
      );
      return data;
    },
  });
}

function invalidateInventory(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["estoque", "saldos"] }),
    queryClient.invalidateQueries({ queryKey: ["estoque", "movimentacoes"] }),
    queryClient.invalidateQueries({ queryKey: ["estoque", "conversoes"] }),
  ]);
}

export function useCreateInventoryAdjustment() {
  const queryClient = useQueryClient();

  return useMutation<InventoryMovement, ApiError, InventoryAdjustmentInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<InventoryMovement>(
        "/estoque/ajustes",
        input,
      );
      return data;
    },
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useCreateInventoryConversion() {
  const queryClient = useQueryClient();

  return useMutation<InventoryConversion, ApiError, InventoryConversionInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<InventoryConversion>(
        "/estoque/conversoes",
        input,
      );
      return data;
    },
    onSuccess: () => invalidateInventory(queryClient),
  });
}

export function useInventoryConversions(status?: "ATIVA" | "ESTORNADA") {
  return useQuery({
    queryKey: ["estoque", "conversoes", status],
    queryFn: async () => {
      const { data } = await api.get<InventoryConversionsResponse>(
        "/estoque/conversoes",
        { params: { pagina: 1, limite: 100, status } },
      );
      return data;
    },
  });
}

export function useInventoryConversion(id: number | null) {
  return useQuery({
    queryKey: ["estoque", "conversao", id],
    enabled: id !== null,
    queryFn: async () => {
      const { data } = await api.get<InventoryConversion>(
        `/estoque/conversoes/${id}`,
      );
      return data;
    },
  });
}

export function useReverseInventoryConversion() {
  const queryClient = useQueryClient();

  return useMutation<InventoryConversion, ApiError, number>({
    mutationFn: async (id) => {
      const { data } = await api.post<InventoryConversion>(
        `/estoque/conversoes/${id}/estornar`,
      );
      return data;
    },
    onSuccess: async (conversion) => {
      queryClient.setQueryData(
        ["estoque", "conversao", conversion.id],
        conversion,
      );
      await invalidateInventory(queryClient);
    },
  });
}

export function useSetOrderRecord(pedidoID: number) {
  const queryClient = useQueryClient();

  return useMutation<OrderResponse, ApiError, number | null>({
    mutationFn: async (regID) => {
      const { data } = await api.patch<OrderResponse>(
        `/pedidos/${pedidoID}/registro`,
        { regID },
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pedido", pedidoID] }),
        queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
      ]);
    },
  });
}

export function useApplyOrderRecordTable(pedidoID: number) {
  const queryClient = useQueryClient();
  return useMutation<OrderResponse, ApiError>({
    mutationFn: async () => {
      const { data } = await api.post<OrderResponse>(
        `/pedidos/${pedidoID}/aplicar-tabela-registro`,
      );
      return data;
    },
    onSuccess: async (pedido) => {
      queryClient.setQueryData(["pedido", pedidoID], pedido);
      await queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
  });
}

export function useAddOrderItem(pedidoID: number) {
  const queryClient = useQueryClient();

  return useMutation<OrderItemResponse, ApiError, AddOrderItemInput>({
    mutationFn: async (item) => {
      const { data } = await api.post<OrderItemResponse>(
        `/pedidos/${pedidoID}/itens`,
        item,
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pedido", pedidoID] }),
        queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
      ]);
    },
  });
}

export function useRemoveOrderItem(pedidoID: number) {
  const queryClient = useQueryClient();

  return useMutation<{ id: number; removido: true }, ApiError, number>({
    mutationFn: async (itemID) => {
      const { data } = await api.delete<{ id: number; removido: true }>(
        `/pedidos/${pedidoID}/itens/${itemID}`,
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["pedido", pedidoID] }),
        queryClient.invalidateQueries({ queryKey: ["pedidos"] }),
      ]);
    },
  });
}

export function useFinancialCategories(tipo: "RECEITA" | "DESPESA") {
  return useQuery({
    queryKey: ["categorias-lancamento", tipo],
    queryFn: async () => {
      const { data } = await api.get<FinancialCategoryResponse[]>(
        "/financeiro/categorias-lancamento",
        { params: { tipo } },
      );
      return data;
    },
  });
}

export function useFinancialAccounts() {
  return useQuery({
    queryKey: ["contas-financeiras"],
    queryFn: async () => {
      const { data } = await api.get<FinancialAccountResponse[]>(
        "/financeiro/contas",
      );
      return data.filter((conta) => conta.status);
    },
  });
}

export function useFinancialMovements() {
  return useQuery({
    queryKey: ["financeiro", "movimentacoes"],
    queryFn: async () => {
      const { data } = await api.get<FinancialMovementsResponse>(
        "/financeiro/movimentacoes",
        { params: { pagina: 1, limite: 100 } },
      );
      return data;
    },
  });
}

export function useCreateFinancialAccount() {
  const queryClient = useQueryClient();

  return useMutation<
    FinancialAccountResponse,
    ApiError,
    CreateFinancialAccountInput
  >({
    mutationFn: async (input) => {
      const { data } = await api.post<FinancialAccountResponse>(
        "/financeiro/contas",
        input,
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useCashReconciliation() {
  return useQuery({
    queryKey: ["financeiro", "caixa", "consulta"],
    retry: false,
    queryFn: async () => {
      const { data } = await api.get<ReconciliationCashResponse>(
        "/financeiro/caixa/consulta",
      );
      return data;
    },
  });
}

export function useCashSessions() {
  return useQuery({
    queryKey: ["financeiro", "caixas"],
    queryFn: async () => {
      const { data } = await api.get<CashResponse[]>("/financeiro/caixas");
      return data;
    },
  });
}

function invalidateCash(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: ["financeiro", "caixa", "consulta"],
    }),
    queryClient.invalidateQueries({ queryKey: ["financeiro", "caixas"] }),
    queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] }),
    queryClient.invalidateQueries({
      queryKey: ["financeiro", "movimentacoes"],
    }),
  ]);
}

export function useOpenCash() {
  const queryClient = useQueryClient();

  return useMutation<CashResponse, ApiError, { observacao?: string }>({
    mutationFn: async (input) => {
      const { data } = await api.post<CashResponse>(
        "/financeiro/caixa/abrir",
        input,
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateCash(queryClient),
        queryClient.invalidateQueries({
          queryKey: ["financeiro", "movimentacoes"],
        }),
      ]);
    },
  });
}

export function useCloseCash() {
  const queryClient = useQueryClient();

  return useMutation<CashResponse, ApiError, CloseCashInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<CashResponse>(
        "/financeiro/caixa/fechar",
        input,
      );
      return data;
    },
    onSuccess: () => invalidateCash(queryClient),
  });
}

export function useCreateFinancialTransfer() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, FinancialTransferInput>({
    mutationFn: async (input) => {
      const { data } = await api.post("/financeiro/transferencia", input);
      return data;
    },
    onSuccess: () => invalidateCash(queryClient),
  });
}

export function useCreateFinancialEntry() {
  const queryClient = useQueryClient();

  return useMutation<FinancialEntryResponse, ApiError, FinancialEntryInput>({
    mutationFn: async ({ baixar_agora, conta_id, ...input }) => {
      const { data: entry } = await api.post<FinancialEntryResponse>(
        "/financeiro/lancamentos",
        input,
      );

      if (!baixar_agora) return entry;
      const { data } = await api.post<FinancialEntryResponse>(
        `/financeiro/lancamentos/${entry.id}/baixar`,
        { conta_id },
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        invalidateCash(queryClient),
        queryClient.invalidateQueries({
          queryKey: ["financeiro", "lancamentos"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["financeiro", "movimentacoes"],
        }),
      ]);
    },
  });
}

export function useFinalizeOrder(pedidoID: number) {
  const queryClient = useQueryClient();

  return useMutation<OrderResponse, ApiError, FinalizeOrderInput>({
    mutationFn: async (finalizacao) => {
      const { data } = await api.post<OrderResponse>(
        `/pedidos/${pedidoID}/finalizar`,
        finalizacao,
      );
      return data;
    },
    onSuccess: async (pedido) => {
      queryClient.setQueryData(["pedido", pedidoID], pedido);
      await queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
  });
}

export function useReopenOrder() {
  const queryClient = useQueryClient();

  return useMutation<OrderResponse, ApiError, number>({
    mutationFn: async (pedidoID) => {
      const { data } = await api.post<OrderResponse>(
        `/pedidos/${pedidoID}/reabrir`,
      );
      return data;
    },
    onSuccess: async (pedido) => {
      queryClient.setQueryData(["pedido", pedido.id], pedido);
      await queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation<OrderResponse, ApiError, number>({
    mutationFn: async (pedidoID) => {
      const { data } = await api.post<OrderResponse>(
        `/pedidos/${pedidoID}/cancelar`,
      );
      return data;
    },
    onSuccess: async (pedido) => {
      queryClient.setQueryData(["pedido", pedido.id], pedido);
      await queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
  });
}
