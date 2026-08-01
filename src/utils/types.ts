export type UserAuthenticated = {
  id: number;
  nome: string;
  cargoID: number;
  permissoes: string[];
  email: string;
};
export type LoginReponse = {
  user: UserAuthenticated;
  token: string;
};
export type ApiError = {
  nome: string;
  mensagem: string;
  statusCode: number;
  action: string;
};

export type DashboardSummary = {
  periodo: {
    dataInicial: string;
    dataFinal: string;
  };
  estoque: {
    peso_total: number;
    materiais_negativos: number;
  };
  compras: {
    valor_total: number;
    quantidade_pedidos: number;
  };
  despesas_operacionais: {
    valor_total: number;
    valor_pago: number;
    valor_pendente: number;
    quantidade_lancamentos: number;
  };
  contas: {
    saldo_total: number;
    quantidade_contas: number;
  };
  fornecedores: [];
  gerado_em: Date;
};
export type OrdersResponse = {
  id: number;
  regID: number | null;
  caixaID: number;
  tipo: "VENDA" | "COMPRA";
  valor_total: number;
  status: "ABERTO" | "FECHADO" | "CANCELADO";
  userID: number;
  criado_em: string;
  finalizado_em: string | null;
  atualizado: string;
  registro: {
    id: number;
    nome_razao: string;
    apelido: string | null;
  } | null;
  caixa: { id: number; status: "ABERTO" | "FECHADO" };
  _count: { items: number; lancamentos: number };
};

export type OrdersFilters = {
  tipo?: OrdersResponse["tipo"];
  status?: OrdersResponse["status"];
};

export type CreateOrderResponse = {
  id: number;
  regID: number | null;
  caixaID: number;
  tipo: OrdersResponse["tipo"];
  valor_total: number;
  status: "ABERTO";
  userID: number;
  criado_em: string;
  items: [];
  caixa: { id: number; status: "ABERTO" | "FECHADO" };
  registro: null;
};

export type AddOrderItemInput = {
  materialID: number;
  pesoBruto: number;
  tara: number;
  impureza: number;
  preco: number;
};

export type FinalizeOrderInput = {
  regID: number;
  titulos: Array<{
    valor: number;
    vencimento: string;
    categoria_id: number;
    titulo: string;
    descricao: string;
    baixar_agora: boolean;
    conta_id?: number;
  }>;
};

export type FinancialCategoryResponse = {
  id: number;
  nome: string;
  TipoCategoria: "RECEITA" | "DESPESA";
};

export type FinancialAccountResponse = {
  id: number;
  nome: string;
  saldo_atual: number;
  saldo_inicial: number;
  conta_padrao: boolean;
  status: boolean;
};
export type CreateFinancialAccountInput = {
  nome: string;
  saldo_inicial: number;
  conta_padrao?: boolean;
};

export type InventoryPagination = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

export type InventoryBalance = {
  id: number;
  nome: string;
  status: boolean;
  categoria: { id: number; nome: string };
  saldo: number;
  custo_medio: number;
  valor_estoque_compra: number;
  expectativa_venda: number;
};

export type InventoryMovement = {
  id: number;
  materialID: number;
  tipoMovimentacao:
    | "COMPRA"
    | "VENDA"
    | "ENTRADA_MANUAL"
    | "SAIDA_MANUAL"
    | "ENTRADA_CONVERSAO"
    | "SAIDA_CONVERSAO";
  origem: string;
  origemID: number | null;
  quantidade: number;
  createdAt: string;
  observacao: string | null;
  pedidoID: number | null;
  conversaoID: number | null;
  direcao: "ENTRADA" | "SAIDA";
  material: {
    id: number;
    nome: string;
    categoria: { id: number; nome: string };
  };
};

export type InventoryBalancesResponse = {
  dados: InventoryBalance[];
  paginacao: InventoryPagination;
};

export type InventoryMovementsResponse = {
  dados: InventoryMovement[];
  paginacao: InventoryPagination;
};

export type InventoryAdjustmentInput = {
  materialID: number;
  direcao: "ENTRADA" | "SAIDA";
  quantidade: number;
  motivo: string;
};

export type InventoryConversionInput = {
  materialOrigemID: number;
  materialDestinoID: number;
  quantidadeOrigem: number;
  quantidadeDestino: number;
  descricao: string;
};

export type InventoryConversion = {
  id: number;
  mat_origemID: number;
  mat_destinoID: number;
  quantidade_origem: number;
  quantidade_destino: number;
  descricao: string;
  createdAt: string;
  estornadaEm: string | null;
  status: "ATIVA" | "ESTORNADA";
  material_origem: {
    id: number;
    nome: string;
    categoria?: { id: number; nome: string };
  };
  material_destino: {
    id: number;
    nome: string;
    categoria?: { id: number; nome: string };
  };
  movimentacoes?: InventoryMovement[];
};

export type InventoryConversionsResponse = {
  dados: InventoryConversion[];
  paginacao: InventoryPagination;
};

export type OrderItemResponse = {
  id: number;
  pedidoID: number;
  materialID: number;
  preco: number;
  quantidade: number;
  pesoBruto: number;
  tara: number;
  impureza: number;
  subtotal: number;
  material: {
    id: number;
    nome: string;
  };
};
export type OrderResponse = {
  id: number;
  regID?: number;
  caixaID: number;
  tipo: "COMPRA" | "VENDA";
  valor_total: number;
  status: "ABERTO" | "FECHADO" | "CANCELADO";
  userID: number;
  criado_em: string;
  finalizado_em?: string;
  atualizado?: string;
  registro: {
    id: number;
    nome_razao: string;
    apelido: string | null;
  } | null;
  user: { id: number; nome: string };
  items: OrderItemResponse[];
  lancamentos: unknown[];
  movimentacoes: unknown[];
};
export type ItemOrderResponse = {
  id: number;
  pedidoID: number;
  materialID: number;
  preco: number;
  quantidade: number;
  pesoBruto: number;
  tara?: number;
  impureza?: number;
  subtotal: number;
  material: [
    id: number,
    nome: string,
    catID: number,
    preco_venda: string,
    estoque: string,
    criado_em: string,
    editado_em: string,
    status: boolean,
  ];
};
export type MaterialResponse = {
  id: number;
  nome: string;
  preco_venda: number;
  preco_compra: number;
  criado_em: string;
  editado_em: string;
  status: boolean;
  categoria: {
    id: number;
    nome: string;
  };
};
export type MaterialCategoryResponse = {
  id: number;
  nome: string;
};
export type CreateMaterialInput = {
  catID: number;
  nome: string;
  preco_compra: number;
  preco_venda: number;
};
export type RecordResponse = {
  id: number;
  nome_razao: string;
  apelido?: string;
  criadoEm: string;
  tabelaID: number;
  email?: string;
  telefone?: string;
  dados_pagamento?: {
    id: number;
    banco?: string;
    agencia?: string;
    conta?: string;
    chave?: string;
    cpf?: string;
    regID: number;
  };
  saldo: { id: number; saldo: number };
  endereco?: {
    id: number;
    regID: number;
    cep?: string;
    estado?: string;
    cidade?: string;
    bairro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
  };
  fisica?: { id: number; cpf: string; nascimento: string; registroID: number };
  juridica?: {
    id: number;
    cnpj: string;
    ie: string;
    fantasia: string;
    registroID: number;
  };
  tipo: "FISICA" | "JURIDICA";
};
export type RecordsResponse = {
  id: number;
  nome: string;
  apelido?: string;
  documento: string;
  tipo: "FISICA" | "JURIDICA";
  tabela: {
    id: number;
    nome: string;
    padrao: boolean;
    updatedAt: string;
  };
  email?: string;
  telefone?: string;
  criado_em: string;
};
export type RecordsFilters = {
  page?: number;
  take?: number;
  search?: string;
};
export type CreateRecordInput = {
  tipo: "FISICA" | "JURIDICA";
  nome: string;
  cpf?: string;
  cnpj?: string;
  nascimento?: string;
  ie?: string;
  apelido?: string;
  email?: string;
  telefone?: string;
  tabelaID?: number;
  pagamento?: {
    banco?: string;
    agencia?: string;
    conta?: string;
    cpf?: string;
    pix?: string;
  };
  endereco?: {
    cep?: string;
    estado?: string;
    cidade?: string;
    bairro?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
  };
};
export type TablesResponse = {
  id: number;
  nome: string;
  padrao: boolean;
  updatedAt: string;
};
export type TableResponse = {
  id: number;
  nome: string;
  padrao: boolean;
  updatedAt: string;
  materiais: {
    id: number;
    materialID: number;
    preco_compra: number;
  }[];
};
export type SaveTableInput = {
  nome?: string;
  padrao?: boolean;
  materiais?: Array<{ id: number; preco_compra: number }>;
};
export type ReconciliationCashResponse = {
  id: number;
  valor_abertura: number;
  data_abertura: string;
  compra_total: number;
  venda_total: number;
  despesa_total: number;
  abastecimento_total: number;
  retiradas_total: number;
  total_creditos: number;
  total_debitos: number;
  valor_esperado: number;
  movimentacoes: Array<{
    id: number;
    conta_id: number;
    origem:
      | "PEDIDO_COMPRA"
      | "PEDIDO_VENDA"
      | "TRANSFERENCIA"
      | "LANCAMENTO_PAGAR"
      | "LANCAMENTO_RECEBER"
      | "AJUSTE_MANUAL"
      | "ABERTURA_CAIXA"
      | "FECHAMENTO_CAIXA"
      | "ESTORNO";
    origem_id: number | null;
    descricao: string;
    direcao: "ENTRADA" | "SAIDA";
    saldo_inicial: number;
    valor: number;
    saldo_final: number;
    user_id: number;
    lancamento_id: number | null;
    transferencia_id: number | null;
    motivo_ajuste: string | null;
    estornada: boolean;
    estorno_de_id: number | null;
    caixa_id: number | null;
  }>;
};
export type CloseCashInput = {
  saldo_informado: number;
  motivo?: string;
  observacao?: string;
};
export type FinancialTransferInput = {
  descricao?: string;
  valor: number;
  conta_origem_id: number;
  conta_destino_id: number;
};
export type FinancialEntryInput = {
  valor: number;
  descricao: string;
  tipo: "PAGAR" | "RECEBER";
  titulo: string;
  categoria_id: number;
  vencimento: string;
  baixar_agora: boolean;
  conta_id?: number;
};
export type FinancialEntryResponse = {
  id: number;
  status: "ABERTO" | "PAGO" | "CANCELADO";
  valor: number;
  tipo: "PAGAR" | "RECEBER";
};

export type FinancialMovementResponse = {
  id: number;
  conta_id: number;
  origem: string;
  descricao: string;
  direcao: "ENTRADA" | "SAIDA";
  saldo_inicial: number;
  valor: number;
  saldo_final: number;
  estornada: boolean;
  caixa_id: number | null;
  criado_em: string;
  conta: { id: number; nome: string; status: boolean };
  usuario: { id: number; nome: string };
  caixa: { id: number; status: "ABERTO" | "FECHADO" } | null;
  lancamento: {
    id: number;
    titulo: string;
    tipo: "PAGAR" | "RECEBER";
  } | null;
  transferencia: {
    id: number;
    descricao: string;
    conta_origem_id: number;
    conta_destino_id: number;
  } | null;
};

export type FinancialMovementsResponse = {
  dados: FinancialMovementResponse[];
  paginacao: InventoryPagination;
};
export type CashResponse = {
  id: number;
  conta_id: number;
  usuario_abertura_id: number;
  usuario_fechamento_id?: number;
  status: "ABERTO" | "FECHADO";
  saldo_inicial: number;
  saldo_final_sistema?: number;
  saldo_final_informado?: number;
  diferenca?: number;
  aberto_em: string;
  fechado_em?: string;
  observacao_abertura?: string;
  observacao_fechamento?: string;
  conta: { id: number; nome: string };
  usuario_abertura: { id: number; nome: string };
  usuario_fechamento?: { id: number; nome: string };
};
export type RoleResponse = {
  id: number;
  nome: string;
  permissoes: { id: number; nome: string; descricao: string }[];
};
export type RolesResponse = {
  id: number;
  nome: string;
};
