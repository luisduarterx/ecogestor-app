// Mapa único das páginas do sistema e das permissões que liberam cada uma.
// Cada página é um módulo e exige o acesso a ele (`access:<id>`) e ao menos
// uma das permissões listadas, sem as quais a página não teria o que mostrar.
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
  // Além do acesso ao módulo, basta ter uma destas.
  permissoes: string[];
  exigeModuloFiscal?: boolean;
};

export const PAGINAS: Pagina[] = [
  { id: "dashboard", rota: "/dashboard", permissoes: ["read:dashboard"] },
  { id: "pedidos", rota: "/pedidos", permissoes: ["read:pedido"] },
  { id: "estoque", rota: "/estoque", permissoes: ["read:estoque"] },
  { id: "precos", rota: "/precos", permissoes: ["read:material"] },
  {
    id: "financeiro",
    rota: "/financeiro",
    permissoes: [
      "read:caixa",
      "read:conta",
      "read:lancamento",
      "read:movimentacao_financeira",
    ],
  },
  {
    id: "fiscal",
    rota: "/fiscal",
    permissoes: ["read:nota_fiscal"],
    exigeModuloFiscal: true,
  },
  { id: "registros", rota: "/registros", permissoes: ["read:registro"] },
  { id: "usuarios", rota: "/usuarios", permissoes: ["read:usuario"] },
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
  return (
    permissoes.includes(`access:${pagina.id}`) &&
    pagina.permissoes.some((permissao) => permissoes.includes(permissao))
  );
}

// Primeira página permitida, na ordem do menu. O Fiscal fica de fora porque
// depende do status do módulo, que ainda não foi carregado no login.
export function paginaInicial(permissoes: readonly string[]) {
  const pagina = PAGINAS.find(
    (item) => !item.exigeModuloFiscal && podeAcessarPagina(item.id, permissoes),
  );
  return pagina?.rota ?? ROTA_SEM_ACESSO;
}
