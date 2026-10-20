export type UserAuthenticated = {
  id: number;
  nome: string;
  cargoID: number;
  permissoes: string[];
  email: string;
  /** Senha provisória ou troca exigida pelo administrador: a sessão só pode trocar a senha. */
  trocaSenhaObrigatoria: boolean;
};
export type LoginReponse = {
  user: UserAuthenticated;
  expiresAt: string;
};
export type SessionUserResponse = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cargo: {
    id: number;
    nome: string;
  };
  /** Nomes das permissões vigentes do cargo, em ordem alfabética. */
  permissoes: string[];
  trocaSenhaObrigatoria: boolean;
};
export type AlterarSenhaInput = {
  senhaAtual: string;
  novaSenha: string;
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
export type DashboardMaterialReport = {
  id: number;
  nome: string;
  categoria: { id: number | null; nome: string };
  compras: { peso: number; valor: number; pedidos: number };
  vendas: { peso: number; valor: number; pedidos: number };
};
export type DashboardMaterialsReport = {
  periodo: { dataInicial: string; dataFinal: string };
  materiais: DashboardMaterialReport[];
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
  /** Data de competência (YYYY-MM-DD): o dia em que o negócio ocorreu. */
  data_pedido: string;
  /** Verdadeiro quando `data_pedido` é anterior ao dia de `criado_em`. */
  retroativo: boolean;
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
  /** Filtra por `data_pedido` (YYYY-MM-DD, inclusivo). */
  dataInicial?: string;
  dataFinal?: string;
};

export type CreateOrderInput = {
  tipo: OrdersResponse["tipo"];
  /** YYYY-MM-DD; omitido = hoje. Datas anteriores exigem `backdate:pedido`. */
  data_pedido?: string;
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
  data_pedido: string;
  retroativo: boolean;
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
  /** Cliente/fornecedor do pedido da movimentação; null em ajustes e conversões. */
  registro: {
    id: number;
    nome: string;
    /** CPF (pessoa física) ou CNPJ (pessoa jurídica). */
    documento: string | null;
  } | null;
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
  data_pedido: string;
  retroativo: boolean;
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
export type OrigemMercadoria =
  | "NACIONAL"
  | "ESTRANGEIRA_IMPORTACAO_DIRETA"
  | "ESTRANGEIRA_MERCADO_INTERNO"
  | "NACIONAL_IMPORTADO_40_70"
  | "NACIONAL_PROCESSO_BASICO"
  | "NACIONAL_IMPORTADO_ATE_40"
  | "ESTRANGEIRA_DIRETA_SEM_SIMILAR"
  | "ESTRANGEIRA_INTERNO_SEM_SIMILAR"
  | "NACIONAL_IMPORTADO_ACIMA_70";
export type IndicadorIE = "CONTRIBUINTE" | "ISENTO" | "NAO_CONTRIBUINTE";
/** Dados fiscais do material, usados na emissão de NF-e. */
export type DadosFiscaisMaterial = {
  ncm: string | null;
  cest: string | null;
  origemMercadoria: OrigemMercadoria | null;
};
export type MaterialResponse = {
  id: number;
  nome: string;
  preco_venda: number;
  preco_compra: number;
  est_min: number | null;
  est_max: number | null;
  unidade: "KG" | "LT" | "UN";
  criado_em: string;
  editado_em: string;
  status: boolean;
  categoria: {
    id: number;
    nome: string;
  };
} & Partial<DadosFiscaisMaterial>;
export type UpdatedMaterialResponse = {
  id: number;
  nome: string;
  preco_venda: number;
  est_min: number | null;
  est_max: number | null;
  unidade: "KG" | "LT" | "UN";
  criado_em: string;
  editado_em: string;
  status: boolean;
  categoria: {
    id: number;
    nome: string;
  };
} & Partial<DadosFiscaisMaterial>;
export type MaterialCategoryResponse = {
  id: number;
  nome: string;
};
export type UpdateMaterialCategoryInput = {
  id: number;
  nome: string;
};
export type CreateMaterialInput = {
  catID: number;
  nome: string;
  preco_compra: number;
  preco_venda: number;
  est_min: number;
  est_max: number;
  unidade: "KG" | "LT" | "UN";
} & Partial<DadosFiscaisMaterial>;
export type UpdateMaterialInput = Partial<CreateMaterialInput> & {
  status?: boolean;
};
export type RecordResponse = {
  id: number;
  nome: string;
  apelido?: string;
  documento: string;
  ie?: string | null;
  indicadorIE?: IndicadorIE | null;
  nascimento?: string | null;
  criado_em: string;
  tabela: { id: number; nome: string; padrao: boolean };
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
  indicadorIE?: IndicadorIE;
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
export type UpdateRecordInput = {
  nome?: string;
  tabelaID?: number;
  apelido?: string;
  email?: string;
  telefone?: string;
  pagamento?: CreateRecordInput["pagamento"];
  endereco?: CreateRecordInput["endereco"];
  indicadorIE?: IndicadorIE | null;
  fisica?: { cpf?: string; nascimento?: string; ie?: string | null };
  juridica?: { cnpj: string; ie?: string };
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
  titulo: string;
  descricao: string;
  vencimento: string;
  data_baixa: string | null;
  criado_em: string;
  desconto: number;
  acrescimo: number;
  categoria: { id: number; nome: string };
  registro: { id: number; nome_razao: string; apelido: string | null } | null;
};
export type FinancialEntriesFilters = {
  status?: FinancialEntryResponse["status"];
  tipo?: FinancialEntryResponse["tipo"];
  nome?: string;
  dataInicial?: string;
  dataFinal?: string;
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
  permissoes: PermissionResponse[];
};
export type RolesResponse = {
  id: number;
  nome: string;
};
export type PermissionResponse = {
  id: number;
  nome: string;
  descricao: string | null;
};
export type UserManagementResponse = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  cargoID: number;
};
export type UserManagementDetail = Omit<UserManagementResponse, "cargoID"> & {
  cargo: { id: number; nome: string };
};
export type AtualizarUsuarioInput = {
  nome: string;
  email: string;
  telefone?: string;
  cargoID: number;
};
export type CriarUsuarioInput = AtualizarUsuarioInput & {
  senha: string;
};
export type RedefinirSenhaUsuarioInput = {
  userID: number;
  senhaProvisoria: string;
};
/** Resposta das ações do administrador sobre a senha de outro usuário. */
export type TrocaSenhaUsuarioResponse = {
  id: number;
  trocaSenhaObrigatoria: boolean;
};
export type SaveRoleInput = {
  nome: string;
  permissoes: number[];
};
export type FormatoImpressao = "CUPOM_80MM" | "FOLHA_A4";
export type TipoDocumentoEmpresa = "CPF" | "CNPJ";
export type ConfiguracaoSistemaCampos = {
  razaoSocial: string | null;
  nomeFantasia: string | null;
  tipoDocumento: TipoDocumentoEmpresa | null;
  documento: string | null;
  inscricaoEstadual: string | null;
  telefone: string | null;
  email: string | null;
  logotipoUrl: string | null;
  cep: string | null;
  estado: string | null;
  cidade: string | null;
  bairro: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  formatoImpressaoPadrao: FormatoImpressao;
  mensagemCabecalho: string | null;
  mensagemRodape: string | null;
  exibirDadosEmpresa: boolean;
  exibirOperador: boolean;
  imprimirAutomaticamente: boolean;
};
export type ConfiguracaoSistemaResponse = ConfiguracaoSistemaCampos & {
  id: number;
  criadoEm: string;
  atualizadoEm: string;
  atualizadoPorID: number | null;
  atualizadoPor: { id: number; nome: string } | null;
};
export type AtualizarConfiguracaoSistemaInput =
  Partial<ConfiguracaoSistemaCampos>;

// Módulo fiscal (contrato em api-ecogestor/docs/modulo-fiscal-frontend.md)
export type StatusModuloFiscal = {
  habilitado: boolean;
  ambiente: "homologacao" | "producao" | null;
};
export type RegimeTributario =
  "SIMPLES_NACIONAL" | "SIMPLES_EXCESSO_SUBLIMITE" | "REGIME_NORMAL" | "MEI";
export type UsuarioResumo = { id: number; nome: string };
export type ConfiguracaoFiscal = {
  id: number;
  regimeTributario: RegimeTributario | null;
  naturezaPadraoID: number | null;
  naturezaPadrao: { id: number; descricao: string } | null;
  criadoEm: string;
  atualizadoEm: string;
  atualizadoPorID: number | null;
  atualizadoPor: UsuarioResumo | null;
};
export type AtualizarConfiguracaoFiscalInput = {
  regimeTributario?: RegimeTributario | null;
  naturezaPadraoID?: number | null;
};
export type NaturezaOperacao = {
  id: number;
  descricao: string;
  cfopDentroEstado: string;
  cfopForaEstado: string | null;
  icmsSituacaoTributaria: string;
  icmsAliquota: number | null;
  pisSituacaoTributaria: string;
  pisAliquota: number | null;
  cofinsSituacaoTributaria: string;
  cofinsAliquota: number | null;
  informacoesComplementares: string | null;
  ativo: boolean;
  padrao: boolean;
  compativelComRegime: boolean | null;
  criadoEm: string;
  atualizadoEm: string;
};
export type NaturezaOperacaoInput = {
  descricao: string;
  cfopDentroEstado: string;
  cfopForaEstado: string | null;
  icmsSituacaoTributaria: string;
  icmsAliquota: number | null;
  pisSituacaoTributaria: string;
  pisAliquota: number | null;
  cofinsSituacaoTributaria: string;
  cofinsAliquota: number | null;
  informacoesComplementares: string | null;
  ativo: boolean;
};
export type Cfop = { codigo: string; descricao: string };
export type StatusNotaFiscal =
  | "RASCUNHO"
  | "PROCESSANDO"
  | "AUTORIZADA"
  | "REJEITADA"
  | "DENEGADA"
  | "CANCELADA";
export type ModalidadeFrete =
  | "EMITENTE"
  | "DESTINATARIO"
  | "TERCEIROS"
  | "PROPRIO_EMITENTE"
  | "PROPRIO_DESTINATARIO"
  | "SEM_FRETE";
export type DestinatarioNota = {
  tipo: "FISICA" | "JURIDICA" | null;
  nome: string | null;
  documento: string | null;
  indicadorIE: IndicadorIE | null;
  ie: string | null;
  email: string | null;
  telefone: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  municipio: string | null;
  uf: string | null;
  cep: string | null;
};
export type TransportadoraNota = {
  nome: string | null;
  documento: string | null;
  ie: string | null;
  endereco: string | null;
  municipio: string | null;
  uf: string | null;
};
export type VeiculoNota = { placa: string | null; uf: string | null };
export type TributacaoItemNota = {
  cfop: string | null;
  icmsSituacaoTributaria: string | null;
  icmsAliquota: number | null;
  pisSituacaoTributaria: string | null;
  pisAliquota: number | null;
  cofinsSituacaoTributaria: string | null;
  cofinsAliquota: number | null;
};
export type ItemNotaFiscal = TributacaoItemNota & {
  id: number;
  numeroItem: number;
  materialID: number;
  descricao: string;
  ncm: string | null;
  cest: string | null;
  origemMercadoria: OrigemMercadoria | null;
  unidade: "KG" | "LT" | "UN";
  quantidade: number;
  valorUnitario: number;
  valorBruto: number;
};
export type NotaFiscal = {
  id: number;
  status: StatusNotaFiscal;
  emissao: {
    ambiente: "HOMOLOGACAO" | "PRODUCAO" | null;
    numero: number | null;
    serie: number | null;
    chave: string | null;
    protocolo: string | null;
    statusSefaz: string | null;
    mensagemSefaz: string | null;
    errosValidacao:
      { codigo?: string; campo?: string; mensagem: string }[] | null;
    emitidaEm: string | null;
    autorizadaEm: string | null;
    emitidaPor: UsuarioResumo | null;
  };
  cancelamento: {
    canceladaEm: string | null;
    justificativa: string | null;
    protocolo: string | null;
    canceladaPor: UsuarioResumo | null;
  };
  quantidadeCartasCorrecao: number;
  naturezaOperacaoID: number | null;
  naturezaOperacaoDescricao: string | null;
  registroID: number | null;
  destinatario: DestinatarioNota;
  consumidorFinal: boolean;
  modalidadeFrete: ModalidadeFrete;
  transportadoraRegistroID: number | null;
  transportadora: TransportadoraNota;
  veiculo: VeiculoNota;
  informacoesComplementares: string | null;
  valorTotal: number;
  itens: ItemNotaFiscal[];
  criadoPor: UsuarioResumo;
  criadoEm: string;
  atualizadoEm: string;
};
export type NotaFiscalResumo = {
  id: number;
  status: StatusNotaFiscal;
  numero: number | null;
  serie: number | null;
  autorizadaEm: string | null;
  naturezaOperacaoDescricao: string | null;
  registroID: number | null;
  destinatarioNome: string | null;
  destinatarioDocumento: string | null;
  valorTotal: number;
  quantidadeItens: number;
  criadoEm: string;
  atualizadoEm: string;
};
export type Paginado<T> = {
  dados: T[];
  paginacao: InventoryPagination;
};
export type FiltrosNotasFiscais = {
  status?: StatusNotaFiscal;
  registroID?: number;
  dataInicial?: string;
  dataFinal?: string;
  pagina?: number;
  limite?: number;
};
/** Corpo do PATCH do cabeçalho; apenas os campos alterados. */
export type AtualizarNotaFiscalInput = {
  naturezaOperacaoID?: number | null;
  registroID?: number | null;
  destinatario?: Partial<DestinatarioNota>;
  consumidorFinal?: boolean;
  modalidadeFrete?: ModalidadeFrete;
  transportadoraRegistroID?: number | null;
  transportadora?: Partial<TransportadoraNota>;
  veiculo?: Partial<VeiculoNota>;
  informacoesComplementares?: string | null;
};
export type ItemNotaFiscalInput = {
  materialID: number;
  quantidade: number;
  valorUnitario: number;
} & Partial<TributacaoItemNota>;
export type TipoEventoNotaFiscal =
  | "EMISSAO_SOLICITADA"
  | "FALHA_COMUNICACAO"
  | "STATUS_ATUALIZADO"
  | "CANCELAMENTO_SOLICITADO"
  | "CANCELAMENTO_RECUSADO"
  | "CARTA_CORRECAO_REGISTRADA"
  | "CARTA_CORRECAO_RECUSADA";
export type OrigemEventoNotaFiscal = "USUARIO" | "WEBHOOK" | "SINCRONIZACAO";
export type EventoNotaFiscal = {
  id: number;
  tipo: TipoEventoNotaFiscal;
  origem: OrigemEventoNotaFiscal;
  statusAnterior: StatusNotaFiscal | null;
  statusNovo: StatusNotaFiscal | null;
  mensagem: string | null;
  respostaFocus: unknown;
  usuario: UsuarioResumo | null;
  criadoEm: string;
};
export type CartaCorrecao = {
  id: number;
  sequencia: number;
  correcao: string;
  statusSefaz: string | null;
  mensagemSefaz: string | null;
  criadoPor: UsuarioResumo;
  criadoEm: string;
};
/** Arquivos da nota disponíveis para download, relativos à rota da nota. */
export type ArquivoNotaFiscal =
  | "danfe"
  | "xml"
  | "xml-cancelamento"
  | `cartas-correcao/${number}/${"pdf" | "xml"}`;
