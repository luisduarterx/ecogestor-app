import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LIMITE_ACOMPANHAMENTO_RAPIDO, tempoProcessando } from "./fiscal";
import {
  type ApiError,
  type AddOrderItemInput,
  type CreateOrderInput,
  type CreateOrderResponse,
  type CloseCashInput,
  type CreateMaterialInput,
  type CreateFinancialAccountInput,
  type DashboardSummary,
  type DashboardMaterialsReport,
  type FinalizeOrderInput,
  type FinancialAccountResponse,
  type FinancialCategoryResponse,
  type FinancialEntryInput,
  type FinancialEntryResponse,
  type FinancialEntriesFilters,
  type FinancialTransferInput,
  type FinancialMovementsResponse,
  type InventoryBalancesResponse,
  type InventoryAdjustmentInput,
  type InventoryConversion,
  type InventoryConversionInput,
  type InventoryConversionsResponse,
  type InventoryMovement,
  type InventoryMovementsResponse,
  type InventoryPagination,
  type UserAuthenticated,
  type LoginReponse,
  type AlterarSenhaInput,
  type SessionUserResponse,
  type MaterialResponse,
  type MaterialCategoryResponse,
  type UpdateMaterialCategoryInput,
  type UpdateMaterialInput,
  type OrderItemResponse,
  type OrderResponse,
  type OrdersFilters,
  type OrdersResponse,
  type RecordsResponse,
  type RecordsFilters,
  type CreateRecordInput,
  type UpdateRecordInput,
  type RecordResponse,
  type ReconciliationCashResponse,
  type CashResponse,
  type TableResponse,
  type TablesResponse,
  type SaveTableInput,
  type PermissionResponse,
  type RoleResponse,
  type RolesResponse,
  type SaveRoleInput,
  type AtualizarUsuarioInput,
  type CriarUsuarioInput,
  type UserManagementDetail,
  type UserManagementResponse,
  type UpdatedMaterialResponse,
  type ConfiguracaoSistemaResponse,
  type AtualizarConfiguracaoSistemaInput,
  type AtualizarConfiguracaoFiscalInput,
  type Cfop,
  type ConfiguracaoFiscal,
  type NaturezaOperacao,
  type NaturezaOperacaoInput,
  type StatusModuloFiscal,
  type AtualizarNotaFiscalInput,
  type FiltrosNotasFiscais,
  type ItemNotaFiscalInput,
  type NotaFiscal,
  type NotaFiscalResumo,
  type Paginado,
  type ArquivoNotaFiscal,
  type CartaCorrecao,
  type EventoNotaFiscal,
} from "./types";
import { api } from "./api";

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // As chaves "auth" ficam fora do redirecionamento global por sessão
    // expirada (ver `context/QueryClient.tsx`).
    mutationKey: ["auth", "signin"],
    mutationFn: async (credentials: { email: string; senha: string }) => {
      const { data } = await api.post<LoginReponse>("auth/signin", credentials);
      return data;
    },
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["auth", "session"], user);
    },
  });
};
export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    retry: false,
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await api.post<SessionUserResponse>("auth/validate");

      return {
        id: data.id,
        nome: data.nome,
        email: data.email,
        cargoID: data.cargo.id,
        permissoes: data.permissoes,
        trocaSenhaObrigatoria: data.trocaSenhaObrigatoria,
      } satisfies UserAuthenticated;
    },
  });
}
/**
 * Troca a senha do próprio usuário. A API revoga todas as sessões, inclusive a
 * atual, então o front entra de novo com a nova senha. `usuario` é `null`
 * quando esse novo login falha e o usuário precisa entrar manualmente.
 */
export function useAlterarSenha() {
  const queryClient = useQueryClient();

  return useMutation<
    { usuario: UserAuthenticated | null },
    ApiError,
    AlterarSenhaInput & { email: string }
  >({
    mutationKey: ["auth", "senha"],
    mutationFn: async ({ email, senhaAtual, novaSenha }) => {
      await api.patch("auth/senha", { senhaAtual, novaSenha });
      try {
        const { data } = await api.post<LoginReponse>("auth/signin", {
          email,
          senha: novaSenha,
        });
        return { usuario: data.user };
      } catch {
        return { usuario: null };
      }
    },
    onSuccess: ({ usuario }) => {
      if (usuario) {
        queryClient.setQueryData(["auth", "session"], usuario);
      } else {
        queryClient.removeQueries({ queryKey: ["auth"] });
      }
    },
  });
}
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["auth", "signout"],
    mutationFn: async () => {
      await api.post("auth/signout");
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth"] });
    },
  });
}
export function useDashboard(startDate: string, endDate = startDate) {
  return useQuery({
    queryKey: ["dashboard", "resumo", startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<DashboardSummary>("/dashboard/resumo", {
        params: {
          dataInicial: startDate,
          dataFinal: endDate,
        },
      });
      return {
        totalStockKg: data.estoque.peso_total,
        negativeMaterialsCount: data.estoque.materiais_negativos,
        totalPurchasedAmount: data.compras.valor_total,
        purchaseInvoicesCount: data.compras.quantidade_pedidos,
        totalExpenses: data.despesas_operacionais.valor_total,
        paidExpenses: data.despesas_operacionais.valor_pago,
        pendingExpenses: data.despesas_operacionais.valor_pendente,
        expensesCount: data.despesas_operacionais.quantidade_lancamentos,
        totalBankBalance: data.contas.saldo_total,
        bankAccountsCount: data.contas.quantidade_contas,
        generatedAt: data.gerado_em,
      };
    },
  });
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function numeric(...values: unknown[]) {
  const value = values.find(
    (candidate) => candidate !== undefined && candidate !== null,
  );
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Relatório consolidado de materiais comprados e vendidos por período. */
export async function fetchDashboardMaterials(
  startDate: string,
  endDate: string,
): Promise<DashboardMaterialsReport> {
  const { data } = await api.get<unknown>("/dashboard/materiais", {
    params: { dataInicial: startDate, dataFinal: endDate },
  });
  const response = record(data);
  const rawMaterials = Array.isArray(response.materiais)
    ? response.materiais
    : Array.isArray(response.dados)
      ? response.dados
      : Array.isArray(data)
        ? data
        : [];

  return {
    periodo: { dataInicial: startDate, dataFinal: endDate },
    materiais: rawMaterials.map((raw, index) => {
      const item = record(raw);
      const material = record(item.material);
      const categoria = record(item.categoria ?? material.categoria);
      const compras = record(item.compras ?? item.compra);
      const vendas = record(item.vendas ?? item.venda);
      return {
        id: numeric(
          item.materialID,
          item.material_id,
          material.id,
          item.id,
          index,
        ),
        nome: String(
          item.nome ?? item.material_nome ?? material.nome ?? "Material",
        ),
        categoria: {
          id:
            categoria.id === undefined
              ? null
              : numeric(categoria.id, item.categoriaID),
          nome: String(
            categoria.nome ?? item.categoria_nome ?? "Sem categoria",
          ),
        },
        compras: {
          peso: numeric(
            compras.peso,
            compras.peso_total,
            item.peso_comprado,
            item.total_comprado,
            item.quantidade_comprada,
          ),
          valor: numeric(
            compras.valor,
            compras.valor_total,
            item.valor_comprado,
            item.total_valor_comprado,
          ),
          pedidos: numeric(
            compras.pedidos,
            compras.quantidade_pedidos,
            item.compras_quantidade,
          ),
        },
        vendas: {
          peso: numeric(
            vendas.peso,
            vendas.peso_total,
            item.peso_vendido,
            item.total_vendido,
            item.quantidade_vendida,
          ),
          valor: numeric(
            vendas.valor,
            vendas.valor_total,
            item.valor_vendido,
            item.total_valor_vendido,
          ),
          pedidos: numeric(
            vendas.pedidos,
            vendas.quantidade_pedidos,
            item.vendas_quantidade,
          ),
        },
      };
    }),
  } satisfies DashboardMaterialsReport;
}

export function useDashboardMaterials(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["dashboard", "materiais", startDate, endDate],
    enabled: Boolean(startDate && endDate),
    queryFn: () => fetchDashboardMaterials(startDate, endDate),
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

  return useMutation<CreateOrderResponse, ApiError, CreateOrderInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<CreateOrderResponse>("/pedidos", input);
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
  return useMutation<RecordResponse, ApiError, CreateRecordInput>({
    mutationFn: async (input) => {
      const { data } = await api.post<RecordResponse>("/registros", input);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["registros"] });
    },
  });
}

export function useRecord(recordID?: number) {
  return useQuery({
    queryKey: ["registros", recordID],
    enabled: Boolean(recordID),
    queryFn: async () => {
      const { data } = await api.get<RecordResponse>(`/registros/${recordID}`);
      return data;
    },
  });
}

export function useUpdateRecord(recordID: number) {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, UpdateRecordInput>({
    mutationFn: async (input) => {
      const { data } = await api.patch(`/registros/${recordID}`, input);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["registros", recordID],
      });
      await queryClient.invalidateQueries({ queryKey: ["registros"] });
    },
  });
}

export function useMaterials() {
  return useQuery({
    queryKey: ["materiais", "selecao-pedido"],
    queryFn: async () => {
      const { data } = await api.get<MaterialResponse[]>(`/materiais`, {
        params: { order: "nome" },
      });
      return data;
    },
  });
}
export function useMaterial(materialID: number) {
  return useQuery({
    queryKey: ["materiais", materialID],
    queryFn: async () => {
      const { data } = await api.get<MaterialResponse>(
        `/materiais/${materialID}`,
      );
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

export function useUpdateMaterialCategory() {
  const queryClient = useQueryClient();

  return useMutation<
    MaterialCategoryResponse,
    ApiError,
    UpdateMaterialCategoryInput
  >({
    mutationFn: async ({ id, nome }) => {
      const { data } = await api.patch<MaterialCategoryResponse>(
        `/materiais/categorias/${id}`,
        { nome },
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["materiais", "categorias"],
        }),
        queryClient.invalidateQueries({ queryKey: ["materiais"] }),
        queryClient.invalidateQueries({ queryKey: ["estoque"] }),
      ]);
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

export function useUpdateMaterial(materialID?: number) {
  const queryClient = useQueryClient();

  return useMutation<UpdatedMaterialResponse, ApiError, UpdateMaterialInput>({
    mutationFn: async (input) => {
      if (materialID === undefined) {
        throw {
          nome: "MaterialNotSelected",
          mensagem: "Selecione um material para atualizar.",
          statusCode: 400,
          action: "Selecione um material",
        } satisfies ApiError;
      }
      const { data } = await api.patch<UpdatedMaterialResponse>(
        `/materiais/${materialID}`,

        input,
      );
      return data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["materiais"] }),
        queryClient.invalidateQueries({ queryKey: ["estoque", "saldos"] }),
        queryClient.invalidateQueries({ queryKey: ["tabelas"] }),
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
      const { data } =
        await api.get<FinancialAccountResponse[]>("/financeiro/contas");
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

export function useFinancialEntries(filters: FinancialEntriesFilters = {}) {
  return useQuery({
    queryKey: ["financeiro", "lancamentos", filters],
    queryFn: async () => {
      const { data } = await api.get<FinancialEntryResponse[]>(
        "/financeiro/lancamentos",
        {
          params: {
            ...filters,
            nome: filters.nome?.trim() || undefined,
            dataInicial: filters.dataInicial || undefined,
            dataFinal: filters.dataFinal || undefined,
          },
        },
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
    onSuccess: async () => {
      // A consulta sem caixa aberto responde com erro e o React Query preserva
      // o último dado válido. Limpe a sessão encerrada antes de atualizar as
      // demais informações para a tela refletir o fechamento imediatamente.
      queryClient.setQueryData<ReconciliationCashResponse | null>(
        ["financeiro", "caixa", "consulta"],
        null,
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["financeiro", "caixas"] }),
        queryClient.invalidateQueries({ queryKey: ["contas-financeiras"] }),
        queryClient.invalidateQueries({
          queryKey: ["financeiro", "movimentacoes"],
        }),
      ]);
    },
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

export function useReverseFinancialTransfer() {
  const queryClient = useQueryClient();

  return useMutation<unknown, ApiError, { transferID: number; reason: string }>(
    {
      mutationFn: async ({ transferID, reason }) => {
        const { data } = await api.post(
          `/financeiro/transferencia/estorno/${transferID}`,
          { motivo: reason },
        );
        return data;
      },
      onSuccess: () => invalidateCash(queryClient),
    },
  );
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

export function useSettleFinancialEntry() {
  const queryClient = useQueryClient();
  return useMutation<
    FinancialEntryResponse,
    ApiError,
    { entryID: number; accountID: number }
  >({
    mutationFn: async ({ entryID, accountID }) => {
      const { data } = await api.post<FinancialEntryResponse>(
        `/financeiro/lancamentos/${entryID}/baixar`,
        { conta_id: accountID },
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

export function useReverseFinancialEntry() {
  const queryClient = useQueryClient();
  return useMutation<
    FinancialEntryResponse,
    ApiError,
    { entryID: number; reason: string }
  >({
    mutationFn: async ({ entryID, reason }) => {
      const { data } = await api.post<FinancialEntryResponse>(
        `/financeiro/lancamentos/${entryID}/estornar`,
        { motivo: reason },
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

export function useUsers(search?: string) {
  return useQuery({
    queryKey: ["usuarios", search?.trim() || ""],
    queryFn: async () => {
      const { data } = await api.get<UserManagementResponse[]>("/usuarios", {
        params: { search: search?.trim() || undefined },
      });
      return data;
    },
  });
}

export function useUser(userID?: number) {
  return useQuery({
    queryKey: ["usuario", userID],
    enabled: Boolean(userID),
    queryFn: async () => {
      const { data } = await api.get<UserManagementDetail>(
        `/usuarios/${userID}`,
      );
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation<UserManagementDetail, ApiError, CriarUsuarioInput>({
    mutationFn: async (input) => (await api.post("/usuarios", input)).data,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useUpdateUser(userID?: number) {
  const queryClient = useQueryClient();
  return useMutation<UserManagementDetail, ApiError, AtualizarUsuarioInput>({
    mutationFn: async (input) =>
      (await api.patch(`/usuarios/${userID}`, input)).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
        queryClient.invalidateQueries({ queryKey: ["usuario", userID] }),
      ]);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation<{ id: number; deletedAt: string }, ApiError, number>({
    mutationFn: async (userID) =>
      (await api.delete(`/usuarios/${userID}`)).data,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["usuarios"] }),
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["cargos"],
    queryFn: async () => (await api.get<RolesResponse[]>("/cargos")).data,
  });
}

export function useRole(roleID?: number) {
  return useQuery({
    queryKey: ["cargo", roleID],
    enabled: Boolean(roleID),
    queryFn: async () =>
      (await api.get<RoleResponse>(`/cargos/${roleID}`)).data,
  });
}

export function useRoleDetails(roleIDs: number[]) {
  return useQuery({
    queryKey: ["cargos", "detalhes", roleIDs],
    enabled: roleIDs.length > 0,
    queryFn: async () =>
      Promise.all(
        roleIDs.map(
          async (roleID) =>
            (await api.get<RoleResponse>(`/cargos/${roleID}`)).data,
        ),
      ),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissoes"],
    queryFn: async () => {
      try {
        return (await api.get<PermissionResponse[]>("/permissoes")).data;
      } catch {
        const { data: roles } = await api.get<RolesResponse[]>("/cargos");
        const details = await Promise.all(
          roles.map(
            async (role) =>
              (await api.get<RoleResponse>(`/cargos/${role.id}`)).data,
          ),
        );
        const unique = new Map<number, PermissionResponse>();
        details.forEach((role) =>
          role.permissoes.forEach((permission) =>
            unique.set(permission.id, permission),
          ),
        );
        return [...unique.values()].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        );
      }
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation<RoleResponse, ApiError, SaveRoleInput>({
    mutationFn: async (input) => (await api.post("/cargos", input)).data,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["cargos"] }),
  });
}

export function useUpdateRole(roleID?: number) {
  const queryClient = useQueryClient();
  return useMutation<RoleResponse, ApiError, SaveRoleInput>({
    mutationFn: async (input) =>
      (await api.patch(`/cargos/${roleID}`, input)).data,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["cargos"] }),
        queryClient.invalidateQueries({ queryKey: ["cargo", roleID] }),
      ]);
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation<{ deletado: number }, ApiError, number>({
    mutationFn: async (roleID) => (await api.delete(`/cargos/${roleID}`)).data,
    onSuccess: async () =>
      queryClient.invalidateQueries({ queryKey: ["cargos"] }),
  });
}

export function useConfiguracoesSistema() {
  return useQuery<ConfiguracaoSistemaResponse | null, ApiError>({
    queryKey: ["configuracoes"],
    staleTime: 5 * 60_000,
    // Falta de permissão (403) não se resolve com novas tentativas.
    retry: (falhas, erro) => erro.statusCode !== 403 && falhas < 2,
    queryFn: async () => {
      try {
        return (await api.get<ConfiguracaoSistemaResponse>("/configuracoes"))
          .data;
      } catch (caught) {
        // A API retorna 404 enquanto a configuração inicial não foi criada.
        if ((caught as ApiError).statusCode === 404) return null;
        throw caught;
      }
    },
  });
}

export function useAtualizarConfiguracoesSistema() {
  const queryClient = useQueryClient();
  return useMutation<
    ConfiguracaoSistemaResponse,
    ApiError,
    AtualizarConfiguracaoSistemaInput
  >({
    mutationFn: async (input) =>
      (await api.patch<ConfiguracaoSistemaResponse>("/configuracoes", input))
        .data,
    onSuccess: (configuracao) => {
      queryClient.setQueryData(["configuracoes"], configuracao);
    },
  });
}

/** Rotas paginadas usadas na exportação de relatórios. */
type RotaRelatorioPaginada =
  | "/estoque/saldos"
  | "/estoque/movimentacoes"
  | "/estoque/conversoes"
  | "/financeiro/movimentacoes";

type ParametrosRelatorio = Record<string, string | number | undefined>;

type RespostaPaginada<T> = { dados: T[]; paginacao: InventoryPagination };

const LIMITE_POR_PAGINA = 100;
const PAGINAS_SIMULTANEAS = 4;

/** Conta os registros de uma rota paginada sem carregar os dados. */
export async function contarRegistrosRelatorio(
  rota: RotaRelatorioPaginada,
  parametros: ParametrosRelatorio,
) {
  const { data } = await api.get<RespostaPaginada<unknown>>(rota, {
    params: { ...parametros, pagina: 1, limite: 1 },
  });
  return data.paginacao.total;
}

/**
 * Carrega todas as páginas de uma rota para um relatório. Se o total passar
 * do limite informado, nada além da primeira página é carregado.
 */
export async function buscarRegistrosRelatorio<T>(
  rota: RotaRelatorioPaginada,
  parametros: ParametrosRelatorio,
  limiteRegistros: number,
  aoProgredir?: (carregados: number, total: number) => void,
): Promise<{ total: number; dados: T[] | null }> {
  const buscarPagina = async (pagina: number) =>
    (
      await api.get<RespostaPaginada<T>>(rota, {
        params: { ...parametros, pagina, limite: LIMITE_POR_PAGINA },
      })
    ).data;

  const primeira = await buscarPagina(1);
  const { total, totalPaginas } = primeira.paginacao;
  if (total > limiteRegistros) return { total, dados: null };

  const dados = [...primeira.dados];
  aoProgredir?.(dados.length, total);
  for (let pagina = 2; pagina <= totalPaginas; pagina += PAGINAS_SIMULTANEAS) {
    const lote = Array.from(
      { length: Math.min(PAGINAS_SIMULTANEAS, totalPaginas - pagina + 1) },
      (_, indice) => buscarPagina(pagina + indice),
    );
    (await Promise.all(lote)).forEach((resposta) =>
      dados.push(...resposta.dados),
    );
    aoProgredir?.(dados.length, total);
  }
  return { total, dados };
}

// ---------------------------------------------------------------------------
// Módulo fiscal
// ---------------------------------------------------------------------------

/** Indica se o módulo fiscal está ativo nesta instância e o ambiente. */
export function useStatusFiscal() {
  return useQuery<StatusModuloFiscal, ApiError>({
    queryKey: ["fiscal", "status"],
    staleTime: 10 * 60_000,
    queryFn: async () =>
      (await api.get<StatusModuloFiscal>("/fiscal/status")).data,
  });
}

export function useConfiguracaoFiscal() {
  return useQuery<ConfiguracaoFiscal | null, ApiError>({
    queryKey: ["fiscal", "configuracao"],
    retry: (falhas, erro) => erro.statusCode >= 500 && falhas < 2,
    queryFn: async () => {
      try {
        return (await api.get<ConfiguracaoFiscal>("/fiscal/configuracao")).data;
      } catch (caught) {
        // A API retorna 404 enquanto a configuração fiscal não foi salva.
        if ((caught as ApiError).statusCode === 404) return null;
        throw caught;
      }
    },
  });
}

export function useAtualizarConfiguracaoFiscal() {
  const queryClient = useQueryClient();
  return useMutation<
    ConfiguracaoFiscal,
    ApiError,
    AtualizarConfiguracaoFiscalInput
  >({
    mutationFn: async (input) =>
      (await api.patch<ConfiguracaoFiscal>("/fiscal/configuracao", input)).data,
    onSuccess: async (configuracao) => {
      queryClient.setQueryData(["fiscal", "configuracao"], configuracao);
      // O selo "Padrão" e a compatibilidade com o regime vêm nas naturezas.
      await queryClient.invalidateQueries({
        queryKey: ["fiscal", "naturezas"],
      });
    },
  });
}

export function useNaturezasOperacao(ativo?: boolean) {
  return useQuery<NaturezaOperacao[], ApiError>({
    queryKey: ["fiscal", "naturezas", { ativo }],
    retry: (falhas, erro) => erro.statusCode >= 500 && falhas < 2,
    queryFn: async () =>
      (
        await api.get<NaturezaOperacao[]>("/fiscal/naturezas-operacao", {
          params: { ativo },
        })
      ).data,
  });
}

export function useSalvarNaturezaOperacao(naturezaID?: number) {
  const queryClient = useQueryClient();
  return useMutation<
    NaturezaOperacao,
    ApiError,
    Partial<NaturezaOperacaoInput>
  >({
    mutationFn: async (input) =>
      (naturezaID
        ? await api.patch<NaturezaOperacao>(
            `/fiscal/naturezas-operacao/${naturezaID}`,
            input,
          )
        : await api.post<NaturezaOperacao>("/fiscal/naturezas-operacao", input)
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["fiscal", "naturezas"] }),
  });
}

export function useExcluirNaturezaOperacao() {
  const queryClient = useQueryClient();
  return useMutation<{ id: number }, ApiError, number>({
    mutationFn: async (naturezaID) =>
      (
        await api.delete<{ id: number }>(
          `/fiscal/naturezas-operacao/${naturezaID}`,
        )
      ).data,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["fiscal", "naturezas"] }),
  });
}

/** Busca na tabela oficial de CFOP (somente leitura). */
export function useCfops(busca: string, tipo: "saida" | "entrada" = "saida") {
  const termo = busca.trim();
  return useQuery<Cfop[], ApiError>({
    queryKey: ["fiscal", "cfops", tipo, termo],
    enabled: termo.length > 0,
    staleTime: Infinity,
    queryFn: async () =>
      (
        await api.get<Cfop[]>("/fiscal/cfops", {
          params: { busca: termo, tipo },
        })
      ).data,
  });
}

export function useNotasFiscais(filtros: FiltrosNotasFiscais) {
  return useQuery<Paginado<NotaFiscalResumo>, ApiError>({
    queryKey: ["fiscal", "notas", filtros],
    placeholderData: (anteriores) => anteriores,
    // Enquanto houver nota em processamento na página, acompanha o retorno.
    refetchInterval: (query) =>
      query.state.data?.dados.some((nota) => nota.status === "PROCESSANDO")
        ? 30_000
        : false,
    retry: (falhas, erro) => erro.statusCode >= 500 && falhas < 2,
    queryFn: async () =>
      (
        await api.get<Paginado<NotaFiscalResumo>>("/fiscal/notas", {
          params: filtros,
        })
      ).data,
  });
}

/** Quantidade de notas para os filtros, sem carregar a lista. */
export function useContagemNotasFiscais(
  filtros: Omit<FiltrosNotasFiscais, "pagina" | "limite">,
) {
  return useQuery<number, ApiError>({
    queryKey: ["fiscal", "notas", "contagem", filtros],
    retry: false,
    queryFn: async () =>
      (
        await api.get<Paginado<NotaFiscalResumo>>("/fiscal/notas", {
          params: { ...filtros, pagina: 1, limite: 1 },
        })
      ).data.paginacao.total,
  });
}

export function useNotaFiscal(notaID: number) {
  return useQuery<NotaFiscal, ApiError>({
    queryKey: ["fiscal", "nota", notaID],
    enabled: Number.isInteger(notaID) && notaID > 0,
    retry: (falhas, erro) => erro.statusCode >= 500 && falhas < 2,
    // Em processamento, recarrega a cada 5 s no primeiro minuto e depois a
    // cada 30 s. O GET só lê o banco; o retorno chega pelo webhook da Focus.
    refetchInterval: (query) => {
      const nota = query.state.data;
      if (nota?.status !== "PROCESSANDO") return false;
      return tempoProcessando(nota.emissao) < LIMITE_ACOMPANHAMENTO_RAPIDO
        ? 5_000
        : 30_000;
    },
    queryFn: async () =>
      (await api.get<NotaFiscal>(`/fiscal/notas/${notaID}`)).data,
  });
}

/** Atualiza o cache da nota e invalida as listas após uma alteração. */
function aplicarNotaAtualizada(
  queryClient: ReturnType<typeof useQueryClient>,
  nota: NotaFiscal,
) {
  queryClient.setQueryData(["fiscal", "nota", nota.id], nota);
  void queryClient.invalidateQueries({
    queryKey: ["fiscal", "eventos", nota.id],
  });
  return queryClient.invalidateQueries({
    queryKey: ["fiscal", "notas"],
  });
}

export function useCriarNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, ApiError, AtualizarNotaFiscalInput>({
    mutationFn: async (input) =>
      (await api.post<NotaFiscal>("/fiscal/notas", input)).data,
    onSuccess: (nota) => aplicarNotaAtualizada(queryClient, nota),
  });
}

export function useImportarPedidoNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation<
    NotaFiscal,
    ApiError,
    { pedidoID: number; naturezaOperacaoID?: number }
  >({
    mutationFn: async ({ pedidoID, naturezaOperacaoID }) =>
      (
        await api.post<NotaFiscal>(
          `/fiscal/notas/importar-pedido/${pedidoID}`,
          naturezaOperacaoID ? { naturezaOperacaoID } : {},
        )
      ).data,
    onSuccess: (nota) => aplicarNotaAtualizada(queryClient, nota),
  });
}

export function useAtualizarNotaFiscal(notaID: number) {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, ApiError, AtualizarNotaFiscalInput>({
    mutationFn: async (input) =>
      (await api.patch<NotaFiscal>(`/fiscal/notas/${notaID}`, input)).data,
    onSuccess: (nota) => aplicarNotaAtualizada(queryClient, nota),
  });
}

export function useSalvarItensNotaFiscal(notaID: number) {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, ApiError, ItemNotaFiscalInput[]>({
    mutationFn: async (itens) =>
      (await api.put<NotaFiscal>(`/fiscal/notas/${notaID}/itens`, { itens }))
        .data,
    onSuccess: (nota) => aplicarNotaAtualizada(queryClient, nota),
  });
}

export function useExcluirNotaFiscal() {
  const queryClient = useQueryClient();
  return useMutation<{ id: number }, ApiError, number>({
    mutationFn: async (notaID) =>
      (await api.delete<{ id: number }>(`/fiscal/notas/${notaID}`)).data,
    onSuccess: async (_, notaID) => {
      queryClient.removeQueries({ queryKey: ["fiscal", "nota", notaID] });
      await queryClient.invalidateQueries({ queryKey: ["fiscal", "notas"] });
    },
  });
}

/** A emissão e a consulta à Focus podem demorar mais que o padrão. */
const TEMPO_LIMITE_FOCUS = 60_000;

export function useEmitirNotaFiscal(notaID: number) {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, ApiError, void>({
    mutationFn: async () =>
      (
        await api.post<NotaFiscal>(
          `/fiscal/notas/${notaID}/emitir`,
          undefined,
          {
            timeout: TEMPO_LIMITE_FOCUS,
          },
        )
      ).data,
    onSuccess: (nota) => aplicarNotaAtualizada(queryClient, nota),
  });
}

export function useSincronizarNotaFiscal(notaID: number) {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, ApiError, void>({
    mutationFn: async () =>
      (
        await api.post<NotaFiscal>(
          `/fiscal/notas/${notaID}/sincronizar`,
          undefined,
          { timeout: TEMPO_LIMITE_FOCUS },
        )
      ).data,
    onSuccess: (nota) => aplicarNotaAtualizada(queryClient, nota),
  });
}

export function useEventosNotaFiscal(notaID: number, enabled = true) {
  return useQuery<EventoNotaFiscal[], ApiError>({
    queryKey: ["fiscal", "eventos", notaID],
    enabled,
    retry: (falhas, erro) => erro.statusCode >= 500 && falhas < 2,
    queryFn: async () =>
      (await api.get<EventoNotaFiscal[]>(`/fiscal/notas/${notaID}/eventos`))
        .data,
  });
}

export function useCancelarNotaFiscal(notaID: number) {
  const queryClient = useQueryClient();
  return useMutation<NotaFiscal, ApiError, string>({
    mutationFn: async (justificativa) =>
      (
        await api.post<NotaFiscal>(
          `/fiscal/notas/${notaID}/cancelar`,
          { justificativa },
          { timeout: TEMPO_LIMITE_FOCUS },
        )
      ).data,
    onSuccess: (nota) => aplicarNotaAtualizada(queryClient, nota),
    // A recusa da SEFAZ fica registrada no histórico da nota.
    onError: () =>
      queryClient.invalidateQueries({
        queryKey: ["fiscal", "eventos", notaID],
      }),
  });
}

export function useCartasCorrecao(notaID: number, enabled = true) {
  return useQuery<CartaCorrecao[], ApiError>({
    queryKey: ["fiscal", "cartas", notaID],
    enabled,
    retry: (falhas, erro) => erro.statusCode >= 500 && falhas < 2,
    queryFn: async () =>
      (
        await api.get<CartaCorrecao[]>(
          `/fiscal/notas/${notaID}/cartas-correcao`,
        )
      ).data,
  });
}

export function useRegistrarCartaCorrecao(notaID: number) {
  const queryClient = useQueryClient();
  return useMutation<CartaCorrecao, ApiError, string>({
    mutationFn: async (correcao) =>
      (
        await api.post<CartaCorrecao>(
          `/fiscal/notas/${notaID}/cartas-correcao`,
          { correcao },
          { timeout: TEMPO_LIMITE_FOCUS },
        )
      ).data,
    // A nota traz a quantidade de cartas, e o histórico ganha um evento.
    onSettled: () =>
      Promise.all(
        [
          ["fiscal", "cartas", notaID],
          ["fiscal", "nota", notaID],
          ["fiscal", "eventos", notaID],
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

/**
 * Baixa um arquivo da nota. Em caso de erro o corpo vem como Blob com o JSON
 * padrão da API, convertido aqui para ApiError.
 */
export async function baixarArquivoNotaFiscal(
  notaID: number,
  arquivo: ArquivoNotaFiscal,
) {
  try {
    const resposta = await api.get<Blob>(`/fiscal/notas/${notaID}/${arquivo}`, {
      responseType: "blob",
      timeout: TEMPO_LIMITE_FOCUS,
      headers: { Accept: "*/*" },
    });
    return resposta.data;
  } catch (caught) {
    if (!(caught instanceof Blob)) throw caught;
    let erro: ApiError;
    try {
      erro = JSON.parse(await caught.text()) as ApiError;
    } catch {
      erro = {
        nome: "InternalError",
        mensagem: "Não foi possível baixar o arquivo. Tente novamente.",
        statusCode: 500,
        action: "Tente novamente em instantes.",
      };
    }
    throw erro;
  }
}
