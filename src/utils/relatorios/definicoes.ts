import {
  buscarRegistrosRelatorio,
  contarRegistrosRelatorio,
  fetchDashboardMaterials,
} from "../queries";
import type {
  FinancialMovementResponse,
  InventoryBalance,
  InventoryConversion,
  InventoryMovement,
} from "../types";
import {
  formatarDataISO,
  formatarMoeda,
  formatarPeso,
  formatarQuantidade,
} from "./formatacao";
import type { ItemRelatorio, Relatorio } from "./tipos";

/** Valores escolhidos no modal; "" significa "todos". */
export type ValoresFiltro = Record<string, string>;

export type OpcaoFiltro = { valor: string; rotulo: string };

export type SelecaoFiltro = {
  id: string;
  rotulo: string;
  rotuloTodos: string;
  opcoes: OpcaoFiltro[];
};

export type ConteudoRelatorio = Pick<
  Relatorio,
  "colunas" | "linhas" | "resumo"
>;

export type DefinicaoRelatorio = {
  id: string;
  titulo: string;
  descricao: string;
  /** Exige período (dataInicial e dataFinal) para gerar o relatório. */
  usaPeriodo: boolean;
  selecoes: SelecaoFiltro[];
  contar: (filtros: ValoresFiltro) => Promise<number>;
  /** Retorna conteudo null quando o total passa do limite. */
  carregar: (
    filtros: ValoresFiltro,
    limite: number,
    aoProgredir?: (carregados: number, total: number) => void,
  ) => Promise<{ total: number; conteudo: ConteudoRelatorio | null }>;
};

const ROTULOS_MOVIMENTACAO_ESTOQUE: Record<
  InventoryMovement["tipoMovimentacao"],
  string
> = {
  COMPRA: "Compra",
  VENDA: "Venda",
  ENTRADA_MANUAL: "Entrada manual",
  SAIDA_MANUAL: "Saída manual",
  ENTRADA_CONVERSAO: "Entrada por conversão",
  SAIDA_CONVERSAO: "Saída por conversão",
};

const ORIGENS_FINANCEIRAS: OpcaoFiltro[] = [
  { valor: "PEDIDO_COMPRA", rotulo: "Pedido de compra" },
  { valor: "PEDIDO_VENDA", rotulo: "Pedido de venda" },
  { valor: "TRANSFERENCIA", rotulo: "Transferência" },
  { valor: "LANCAMENTO_PAGAR", rotulo: "Lançamento a pagar" },
  { valor: "LANCAMENTO_RECEBER", rotulo: "Lançamento a receber" },
  { valor: "AJUSTE_MANUAL", rotulo: "Ajuste manual" },
  { valor: "ABERTURA_CAIXA", rotulo: "Abertura de caixa" },
  { valor: "FECHAMENTO_CAIXA", rotulo: "Fechamento de caixa" },
  { valor: "ESTORNO", rotulo: "Estorno" },
];

const DIRECOES: OpcaoFiltro[] = [
  { valor: "ENTRADA", rotulo: "Entradas" },
  { valor: "SAIDA", rotulo: "Saídas" },
];

const textoLegivel = (valor: string) =>
  valor.charAt(0) +
  valor.slice(1).toLocaleLowerCase("pt-BR").replaceAll("_", " ");

const opcional = (valor?: string) => valor || undefined;
const idOpcional = (valor?: string) => (valor ? Number(valor) : undefined);
const periodo = (filtros: ValoresFiltro) => ({
  dataInicial: filtros.dataInicial,
  dataFinal: filtros.dataFinal,
});
const somar = <T>(itens: T[], valor: (item: T) => number) =>
  itens.reduce((total, item) => total + valor(item), 0);

/** Descreve os filtros escolhidos em português, para o cabeçalho. */
export function descreverFiltros(
  definicao: DefinicaoRelatorio,
  filtros: ValoresFiltro,
): ItemRelatorio[] {
  const descricao: ItemRelatorio[] = [];
  if (definicao.usaPeriodo) {
    descricao.push({
      rotulo: "Período",
      valor: `${formatarDataISO(filtros.dataInicial)} a ${formatarDataISO(filtros.dataFinal)}`,
    });
  }
  definicao.selecoes.forEach((selecao) => {
    const escolhida = selecao.opcoes.find(
      (opcao) => opcao.valor === filtros[selecao.id],
    );
    descricao.push({
      rotulo: selecao.rotulo,
      valor: escolhida?.rotulo ?? selecao.rotuloTodos,
    });
  });
  return descricao;
}

export function criarRelatoriosEstoque(opcoes: {
  categorias: OpcaoFiltro[];
  materiais: OpcaoFiltro[];
}): DefinicaoRelatorio[] {
  const categoria: SelecaoFiltro = {
    id: "categoriaID",
    rotulo: "Categoria",
    rotuloTodos: "Todas",
    opcoes: opcoes.categorias,
  };
  const material: SelecaoFiltro = {
    id: "materialID",
    rotulo: "Material",
    rotuloTodos: "Todos",
    opcoes: opcoes.materiais,
  };

  const parametrosSaldos = (filtros: ValoresFiltro) => ({
    status: "ATIVO",
    categoriaID: idOpcional(filtros.categoriaID),
    materialID: idOpcional(filtros.materialID),
  });

  const parametrosMovimentacoes = (filtros: ValoresFiltro) => ({
    ...periodo(filtros),
    direcao: opcional(filtros.direcao),
    categoriaID: idOpcional(filtros.categoriaID),
    materialID: idOpcional(filtros.materialID),
  });

  const parametrosConversoes = (filtros: ValoresFiltro) => ({
    ...periodo(filtros),
    status: opcional(filtros.status),
    materialID: idOpcional(filtros.materialID),
  });

  // O relatório por período já vem consolidado por material pela API;
  // categoria e fluxo são aplicados aqui.
  const materiaisDoPeriodo = async (filtros: ValoresFiltro) => {
    const { materiais } = await fetchDashboardMaterials(
      filtros.dataInicial,
      filtros.dataFinal,
    );
    return materiais.filter(
      (item) =>
        (!filtros.categoriaID ||
          item.categoria.id === Number(filtros.categoriaID)) &&
        (!filtros.fluxo ||
          (filtros.fluxo === "COMPRAS" && item.compras.peso > 0) ||
          (filtros.fluxo === "VENDAS" && item.vendas.peso > 0)),
    );
  };

  return [
    {
      id: "saldos",
      titulo: "Saldos de estoque",
      descricao: "Saldo atual, custo médio e valor em estoque por material.",
      usaPeriodo: false,
      selecoes: [categoria, material],
      contar: (filtros) =>
        contarRegistrosRelatorio("/estoque/saldos", parametrosSaldos(filtros)),
      carregar: async (filtros, limite, aoProgredir) => {
        const { total, dados } =
          await buscarRegistrosRelatorio<InventoryBalance>(
            "/estoque/saldos",
            parametrosSaldos(filtros),
            limite,
            aoProgredir,
          );
        if (!dados) return { total, conteudo: null };
        return {
          total,
          conteudo: {
            colunas: [
              { titulo: "Código", tipo: "codigo" },
              { titulo: "Material", tipo: "texto" },
              { titulo: "Categoria", tipo: "texto" },
              { titulo: "Saldo (kg)", tipo: "peso", totalizar: true },
              { titulo: "Custo médio (R$/kg)", tipo: "moeda" },
              { titulo: "Valor em estoque", tipo: "moeda", totalizar: true },
            ],
            linhas: dados.map((item) => [
              item.id,
              item.nome,
              item.categoria.nome,
              item.saldo,
              item.custo_medio,
              item.valor_estoque_compra,
            ]),
            resumo: [
              { rotulo: "Materiais", valor: formatarQuantidade(dados.length) },
              {
                rotulo: "Estoque total",
                valor: formatarPeso(somar(dados, (item) => item.saldo)),
              },
              {
                rotulo: "Valor em estoque",
                valor: formatarMoeda(
                  somar(dados, (item) => item.valor_estoque_compra),
                ),
              },
            ],
          },
        };
      },
    },
    {
      id: "periodo",
      titulo: "Materiais comprados e vendidos por período",
      descricao: "Peso e valor comprados e vendidos de cada material.",
      usaPeriodo: true,
      selecoes: [
        categoria,
        {
          id: "fluxo",
          rotulo: "Fluxo",
          rotuloTodos: "Compras e vendas",
          opcoes: [
            { valor: "COMPRAS", rotulo: "Somente com compras" },
            { valor: "VENDAS", rotulo: "Somente com vendas" },
          ],
        },
      ],
      contar: async (filtros) => (await materiaisDoPeriodo(filtros)).length,
      carregar: async (filtros, limite) => {
        const dados = await materiaisDoPeriodo(filtros);
        if (dados.length > limite)
          return { total: dados.length, conteudo: null };
        return {
          total: dados.length,
          conteudo: {
            colunas: [
              { titulo: "Código", tipo: "codigo" },
              { titulo: "Material", tipo: "texto" },
              { titulo: "Categoria", tipo: "texto" },
              { titulo: "Comprado (kg)", tipo: "peso", totalizar: true },
              { titulo: "Valor comprado", tipo: "moeda", totalizar: true },
              { titulo: "Vendido (kg)", tipo: "peso", totalizar: true },
              { titulo: "Valor vendido", tipo: "moeda", totalizar: true },
              {
                titulo: "Saldo do período (kg)",
                tipo: "peso",
                totalizar: true,
              },
            ],
            linhas: dados.map((item) => [
              item.id,
              item.nome,
              item.categoria.nome,
              item.compras.peso,
              item.compras.valor,
              item.vendas.peso,
              item.vendas.valor,
              item.compras.peso - item.vendas.peso,
            ]),
            resumo: [
              {
                rotulo: "Peso comprado",
                valor: formatarPeso(somar(dados, (item) => item.compras.peso)),
              },
              {
                rotulo: "Valor comprado",
                valor: formatarMoeda(
                  somar(dados, (item) => item.compras.valor),
                ),
              },
              {
                rotulo: "Peso vendido",
                valor: formatarPeso(somar(dados, (item) => item.vendas.peso)),
              },
              {
                rotulo: "Valor vendido",
                valor: formatarMoeda(somar(dados, (item) => item.vendas.valor)),
              },
            ],
          },
        };
      },
    },
    {
      id: "movimentacoes",
      titulo: "Movimentações de estoque",
      descricao: "Entradas e saídas de material no período.",
      usaPeriodo: true,
      selecoes: [
        {
          id: "direcao",
          rotulo: "Direção",
          rotuloTodos: "Entradas e saídas",
          opcoes: DIRECOES,
        },
        categoria,
        material,
      ],
      contar: (filtros) =>
        contarRegistrosRelatorio(
          "/estoque/movimentacoes",
          parametrosMovimentacoes(filtros),
        ),
      carregar: async (filtros, limite, aoProgredir) => {
        const { total, dados } =
          await buscarRegistrosRelatorio<InventoryMovement>(
            "/estoque/movimentacoes",
            parametrosMovimentacoes(filtros),
            limite,
            aoProgredir,
          );
        if (!dados) return { total, conteudo: null };
        const entradas = dados.filter((item) => item.direcao === "ENTRADA");
        const saidas = dados.filter((item) => item.direcao === "SAIDA");
        return {
          total,
          conteudo: {
            colunas: [
              { titulo: "Código", tipo: "codigo" },
              { titulo: "Data", tipo: "data" },
              { titulo: "Material", tipo: "texto" },
              { titulo: "Tipo", tipo: "texto" },
              { titulo: "Cliente/Fornecedor", tipo: "texto" },
              { titulo: "Entrada (kg)", tipo: "peso", totalizar: true },
              { titulo: "Saída (kg)", tipo: "peso", totalizar: true },
              { titulo: "Origem", tipo: "texto" },
              { titulo: "Observação", tipo: "texto" },
            ],
            linhas: dados.map((item) => [
              item.id,
              item.createdAt,
              item.material.nome,
              ROTULOS_MOVIMENTACAO_ESTOQUE[item.tipoMovimentacao] ??
                item.tipoMovimentacao,
              item.registro?.nome ?? "—",
              item.direcao === "ENTRADA" ? item.quantidade : null,
              item.direcao === "SAIDA" ? item.quantidade : null,
              item.origemID
                ? `${textoLegivel(item.origem)} #${item.origemID}`
                : textoLegivel(item.origem),
              item.observacao,
            ]),
            resumo: [
              {
                rotulo: "Movimentações",
                valor: formatarQuantidade(dados.length),
              },
              {
                rotulo: "Total de entradas",
                valor: formatarPeso(somar(entradas, (item) => item.quantidade)),
              },
              {
                rotulo: "Total de saídas",
                valor: formatarPeso(somar(saidas, (item) => item.quantidade)),
              },
            ],
          },
        };
      },
    },
    {
      id: "conversoes",
      titulo: "Conversões de estoque",
      descricao: "Conversões entre materiais realizadas no período.",
      usaPeriodo: true,
      selecoes: [
        {
          id: "status",
          rotulo: "Situação",
          rotuloTodos: "Todas",
          opcoes: [
            { valor: "ATIVA", rotulo: "Ativas" },
            { valor: "ESTORNADA", rotulo: "Estornadas" },
          ],
        },
        material,
      ],
      contar: (filtros) =>
        contarRegistrosRelatorio(
          "/estoque/conversoes",
          parametrosConversoes(filtros),
        ),
      carregar: async (filtros, limite, aoProgredir) => {
        const { total, dados } =
          await buscarRegistrosRelatorio<InventoryConversion>(
            "/estoque/conversoes",
            parametrosConversoes(filtros),
            limite,
            aoProgredir,
          );
        if (!dados) return { total, conteudo: null };
        return {
          total,
          conteudo: {
            colunas: [
              { titulo: "Código", tipo: "codigo" },
              { titulo: "Data", tipo: "data" },
              { titulo: "Material de origem", tipo: "texto" },
              { titulo: "Origem (kg)", tipo: "peso", totalizar: true },
              { titulo: "Material de destino", tipo: "texto" },
              { titulo: "Destino (kg)", tipo: "peso", totalizar: true },
              { titulo: "Situação", tipo: "texto" },
              { titulo: "Descrição", tipo: "texto" },
            ],
            linhas: dados.map((item) => [
              item.id,
              item.createdAt,
              item.material_origem.nome,
              item.quantidade_origem,
              item.material_destino.nome,
              item.quantidade_destino,
              item.status === "ATIVA" ? "Ativa" : "Estornada",
              item.descricao,
            ]),
            resumo: [
              { rotulo: "Conversões", valor: formatarQuantidade(dados.length) },
              {
                rotulo: "Peso de origem",
                valor: formatarPeso(
                  somar(dados, (item) => item.quantidade_origem),
                ),
              },
              {
                rotulo: "Peso de destino",
                valor: formatarPeso(
                  somar(dados, (item) => item.quantidade_destino),
                ),
              },
            ],
          },
        };
      },
    },
  ];
}

export function criarRelatoriosFinanceiro(opcoes: {
  contas: OpcaoFiltro[];
}): DefinicaoRelatorio[] {
  const parametros = (filtros: ValoresFiltro) => ({
    ...periodo(filtros),
    contaID: idOpcional(filtros.contaID),
    direcao: opcional(filtros.direcao),
    origem: opcional(filtros.origem),
  });

  return [
    {
      id: "movimentacoes-financeiras",
      titulo: "Movimentações financeiras",
      descricao: "Entradas e saídas registradas nas contas no período.",
      usaPeriodo: true,
      selecoes: [
        {
          id: "contaID",
          rotulo: "Conta",
          rotuloTodos: "Todas",
          opcoes: opcoes.contas,
        },
        {
          id: "direcao",
          rotulo: "Direção",
          rotuloTodos: "Entradas e saídas",
          opcoes: DIRECOES,
        },
        {
          id: "origem",
          rotulo: "Origem",
          rotuloTodos: "Todas",
          opcoes: ORIGENS_FINANCEIRAS,
        },
      ],
      contar: (filtros) =>
        contarRegistrosRelatorio(
          "/financeiro/movimentacoes",
          parametros(filtros),
        ),
      carregar: async (filtros, limite, aoProgredir) => {
        const { total, dados } =
          await buscarRegistrosRelatorio<FinancialMovementResponse>(
            "/financeiro/movimentacoes",
            parametros(filtros),
            limite,
            aoProgredir,
          );
        if (!dados) return { total, conteudo: null };
        const rotuloOrigem = new Map(
          ORIGENS_FINANCEIRAS.map((opcao) => [opcao.valor, opcao.rotulo]),
        );
        const entradas = somar(
          dados.filter((item) => item.direcao === "ENTRADA"),
          (item) => item.valor,
        );
        const saidas = somar(
          dados.filter((item) => item.direcao === "SAIDA"),
          (item) => item.valor,
        );
        return {
          total,
          conteudo: {
            colunas: [
              { titulo: "Código", tipo: "codigo" },
              { titulo: "Data", tipo: "data" },
              { titulo: "Conta", tipo: "texto" },
              { titulo: "Origem", tipo: "texto" },
              { titulo: "Descrição", tipo: "texto" },
              { titulo: "Entrada", tipo: "moeda", totalizar: true },
              { titulo: "Saída", tipo: "moeda", totalizar: true },
            ],
            linhas: dados.map((item) => [
              item.id,
              item.criado_em,
              item.conta?.nome ?? `Conta #${item.conta_id}`,
              rotuloOrigem.get(item.origem) ?? textoLegivel(item.origem),
              item.descricao,
              item.direcao === "ENTRADA" ? item.valor : null,
              item.direcao === "SAIDA" ? item.valor : null,
            ]),
            resumo: [
              {
                rotulo: "Movimentações",
                valor: formatarQuantidade(dados.length),
              },
              { rotulo: "Total de entradas", valor: formatarMoeda(entradas) },
              { rotulo: "Total de saídas", valor: formatarMoeda(saidas) },
              { rotulo: "Resultado", valor: formatarMoeda(entradas - saidas) },
            ],
          },
        };
      },
    },
  ];
}
