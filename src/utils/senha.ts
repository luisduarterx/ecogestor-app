// Regras da API para a nova senha (as mesmas do cadastro de usuário): no
// mínimo 10 caracteres, até 72 bytes, diferente do e-mail e da senha atual.
export const TAMANHO_MINIMO_SENHA = 10;
export const TAMANHO_MAXIMO_SENHA_BYTES = 72;

export type DadosTrocaSenha = {
  senhaAtual: string;
  novaSenha: string;
  confirmacao: string;
  email: string;
};

export type RequisitoSenha = {
  id: "tamanho" | "diferenteAtual" | "diferenteEmail" | "coincidem";
  rotulo: string;
  atendido: boolean;
};

function tamanhoEmBytes(texto: string) {
  return new TextEncoder().encode(texto).length;
}

function igualAoEmail(senha: string, email: string) {
  return senha.toLowerCase() === email.trim().toLowerCase();
}

/** Requisitos exibidos ao usuário enquanto ele digita a nova senha. */
export function requisitosNovaSenha({
  senhaAtual,
  novaSenha,
  confirmacao,
  email,
}: DadosTrocaSenha): RequisitoSenha[] {
  const preenchida = novaSenha.length > 0;

  return [
    {
      id: "tamanho",
      rotulo: `Mín. ${TAMANHO_MINIMO_SENHA} caracteres`,
      atendido: novaSenha.length >= TAMANHO_MINIMO_SENHA,
    },
    {
      id: "diferenteAtual",
      rotulo: "Diferente da atual",
      atendido: preenchida && novaSenha !== senhaAtual,
    },
    {
      id: "diferenteEmail",
      rotulo: "Diferente do e-mail",
      atendido: preenchida && !igualAoEmail(novaSenha, email),
    },
    {
      id: "coincidem",
      rotulo: "Senhas coincidem",
      atendido: preenchida && novaSenha === confirmacao,
    },
  ];
}

/** Retorna a primeira regra violada ou `null` quando a troca pode ser enviada. */
export function validarTrocaSenha(dados: DadosTrocaSenha): string | null {
  const { senhaAtual, novaSenha, confirmacao, email } = dados;

  if (!senhaAtual) return "Informe a senha atual.";
  if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
    return `A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }
  if (tamanhoEmBytes(novaSenha) > TAMANHO_MAXIMO_SENHA_BYTES) {
    return `A nova senha deve ter no máximo ${TAMANHO_MAXIMO_SENHA_BYTES} bytes.`;
  }
  if (novaSenha === senhaAtual) {
    return "A nova senha deve ser diferente da atual.";
  }
  if (igualAoEmail(novaSenha, email)) {
    return "A nova senha não pode ser igual ao e-mail.";
  }
  if (novaSenha !== confirmacao) {
    return "A confirmação não corresponde à nova senha.";
  }
  return null;
}

/** Senha provisória definida pelo administrador para outro usuário. */
export function validarSenhaProvisoria({
  senha,
  confirmacao,
  email,
}: {
  senha: string;
  confirmacao: string;
  email: string;
}): string | null {
  if (senha.length < TAMANHO_MINIMO_SENHA) {
    return `A senha provisória deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`;
  }
  if (tamanhoEmBytes(senha) > TAMANHO_MAXIMO_SENHA_BYTES) {
    return `A senha provisória deve ter no máximo ${TAMANHO_MAXIMO_SENHA_BYTES} bytes.`;
  }
  if (igualAoEmail(senha, email)) {
    return "A senha provisória não pode ser igual ao e-mail do usuário.";
  }
  if (senha !== confirmacao) {
    return "A confirmação não corresponde à senha provisória.";
  }
  return null;
}

/** Iniciais exibidas no avatar, no mesmo padrão do cabeçalho: dois primeiros nomes. */
export function iniciaisDoNome(nome: string) {
  const iniciais = nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join("");
  return iniciais ? iniciais.toLocaleUpperCase("pt-BR") : "?";
}
