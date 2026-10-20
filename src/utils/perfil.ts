import type { AtualizarPerfilInput, PerfilResponse } from "./types";

// Mesmas regras de `PATCH /auth/perfil`.
export const TAMANHO_MINIMO_NOME = 3;
export const TAMANHO_MAXIMO_NOME = 205;

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FormularioPerfil = {
  nome: string;
  email: string;
  senhaAtual: string;
};

const normalizarEmail = (email: string) => email.trim().toLowerCase();

/** O e-mail é o login: trocá-lo exige a senha atual. */
export function emailFoiAlterado(
  original: Pick<PerfilResponse, "email">,
  email: string,
) {
  return normalizarEmail(email) !== normalizarEmail(original.email);
}

/**
 * Monta o corpo da edição só com o que mudou. Devolve `null` quando nada
 * mudou. O nome é comparado em maiúsculas, como a API o grava.
 */
export function montarAlteracoesPerfil(
  original: Pick<PerfilResponse, "nome" | "email">,
  formulario: FormularioPerfil,
): AtualizarPerfilInput | null {
  const alteracoes: AtualizarPerfilInput = {};
  const nome = formulario.nome.trim();

  if (nome.toLocaleUpperCase("pt-BR") !== original.nome) {
    alteracoes.nome = nome;
  }
  if (emailFoiAlterado(original, formulario.email)) {
    alteracoes.email = normalizarEmail(formulario.email);
    alteracoes.senhaAtual = formulario.senhaAtual;
  }

  return Object.keys(alteracoes).length > 0 ? alteracoes : null;
}

/** Retorna a primeira regra violada ou `null` quando pode ser enviado. */
export function validarPerfil(
  original: Pick<PerfilResponse, "email">,
  formulario: FormularioPerfil,
): string | null {
  const nome = formulario.nome.trim();

  if (nome.length < TAMANHO_MINIMO_NOME) {
    return `O nome deve ter pelo menos ${TAMANHO_MINIMO_NOME} caracteres.`;
  }
  if (nome.length > TAMANHO_MAXIMO_NOME) {
    return `O nome deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres.`;
  }
  if (!FORMATO_EMAIL.test(formulario.email.trim())) {
    return "Informe um e-mail válido.";
  }
  if (emailFoiAlterado(original, formulario.email) && !formulario.senhaAtual) {
    return "Informe a senha atual para alterar o e-mail.";
  }
  return null;
}
