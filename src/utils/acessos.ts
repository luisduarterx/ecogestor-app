// Mapa único das páginas do sistema e das permissões que liberam cada uma.
// O menu lateral, as rotas e a página inicial usam este mapa. A proteção real
// continua na API: aqui só se evita mostrar o que o usuário não pode usar.

export type PaginaID =
  | "dashboard"
  | "pedidos"
  | "estoque"
  | "precos"
  | "financeiro"
  | "fiscal"
  | "registros"
  | "usuarios"
  | "configuracoes";

type Pagina = {
  id: PaginaID;
  rota: string;
  // Basta ter uma das permissões.
  permissoes: string[];
  exigeModuloFiscal?: boolean;
};

export const PAGINAS: Pagina[] = [
  { id: "dashboard", rota: "/dashboard", permissoes: ["read:dashboard"] },
  { id: "pedidos", rota: "/pedidos", permissoes: ["read:pedidos"] },
  { id: "estoque", rota: "/estoque", permissoes: ["read:estoque"] },
  { id: "precos", rota: "/precos", permissoes: ["read:materiais"] },
  {
    id: "financeiro",
    rota: "/financeiro",
    permissoes: [
      "read:caixa",
      "read:contas",
      "read:lancamentos",
      "read:movimentacoes_financeiras",
    ],
  },
  {
    id: "fiscal",
    rota: "/fiscal",
    permissoes: ["read:notas_fiscais"],
    exigeModuloFiscal: true,
  },
  { id: "registros", rota: "/registros", permissoes: ["read:registros"] },
  { id: "usuarios", rota: "/usuarios", permissoes: ["read:usuarios"] },
  {
    id: "configuracoes",
    rota: "/configuracoes",
    permissoes: ["read:configuracoes"],
  },
];

export const ROTA_SEM_ACESSO = "/sem-acesso";

export function podeAcessarPagina(
  id: PaginaID,
  permissoes: readonly string[],
  moduloFiscalHabilitado = false,
) {
  const pagina = PAGINAS.find((item) => item.id === id);
  if (!pagina) return false;
  if (pagina.exigeModuloFiscal && !moduloFiscalHabilitado) return false;
  return pagina.permissoes.some((permissao) => permissoes.includes(permissao));
}

// Primeira página permitida, na ordem do menu. O Fiscal fica de fora porque
// depende do status do módulo, que ainda não foi carregado no login.
export function paginaInicial(permissoes: readonly string[]) {
  const pagina = PAGINAS.find(
    (item) => !item.exigeModuloFiscal && podeAcessarPagina(item.id, permissoes),
  );
  return pagina?.rota ?? ROTA_SEM_ACESSO;
}
