import type { ApiError, UserAuthenticated } from "./types";

/**
 * Recusas de autorização da API:
 * - `401` (`Acesso não Autorizado`): sessão ausente, inválida ou expirada.
 *   O front volta para o login.
 * - `403` (`Acesso Negado`): usuário autenticado sem a permissão exigida.
 *   O front avisa e mantém o usuário na tela.
 *
 * - `403` (`TrocaSenhaObrigatoria`): o usuário precisa trocar a senha antes de
 *   continuar. O front revalida a sessão e exibe a troca obrigatória.
 *
 * O `403` também é usado quando o módulo fiscal está desligado, com outro
 * `nome`. Por isso cada recusa é identificada pelo `nome`, e não só pelo
 * status.
 */
export const NOME_ACESSO_NEGADO = "Acesso Negado";

export const NOME_TROCA_SENHA_OBRIGATORIA = "TrocaSenhaObrigatoria";

export const MENSAGEM_ACESSO_NEGADO =
  "Você não tem permissão para realizar esta ação.";

export const PERMISSAO_PEDIDO_RETROATIVO = "backdate:pedido";

function statusDoErro(erro: unknown) {
  return (erro as Partial<ApiError> | null | undefined)?.statusCode;
}

export function ehSessaoInvalida(erro: unknown) {
  return statusDoErro(erro) === 401;
}

export function ehAcessoNegado(erro: unknown) {
  const apiErro = erro as Partial<ApiError> | null | undefined;
  return apiErro?.statusCode === 403 && apiErro.nome === NOME_ACESSO_NEGADO;
}

export function ehTrocaSenhaObrigatoria(erro: unknown) {
  const apiErro = erro as Partial<ApiError> | null | undefined;
  return (
    apiErro?.statusCode === 403 && apiErro.nome === NOME_TROCA_SENHA_OBRIGATORIA
  );
}

/** Erros que não se resolvem repetindo a mesma requisição. */
export function ehRecusaDeAutorizacao(erro: unknown) {
  const status = statusDoErro(erro);
  return status === 401 || status === 403;
}

/**
 * Indica se o usuário da sessão tem a permissão. Serve apenas para ocultar ou
 * bloquear ações de antemão; a API continua validando cada rota.
 */
export function temPermissao(
  usuario: Pick<UserAuthenticated, "permissoes"> | null | undefined,
  permissao: string,
) {
  return usuario?.permissoes.includes(permissao) ?? false;
}
