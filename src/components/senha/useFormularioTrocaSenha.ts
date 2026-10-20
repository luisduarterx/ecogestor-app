import { useState } from "react";
import { useAlterarSenha } from "../../utils/queries";
import { requisitosNovaSenha, validarTrocaSenha } from "../../utils/senha";
import type { UserAuthenticated } from "../../utils/types";

export const AVISO_ENTRAR_COM_NOVA_SENHA =
  "Senha alterada com sucesso. Entre novamente com a nova senha.";

/**
 * Estado e envio do formulário de troca de senha, usado na troca obrigatória e
 * nas configurações. `enviar` devolve o usuário autenticado de novo, `null`
 * quando a senha mudou mas o novo login falhou, ou `undefined` quando a troca
 * não foi feita (o motivo fica em `erro`).
 */
export function useFormularioTrocaSenha(email: string) {
  const alterarSenha = useAlterarSenha();
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");

  const dados = { senhaAtual, novaSenha, confirmacao, email };

  function limpar() {
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmacao("");
    setErro("");
  }

  async function enviar(): Promise<UserAuthenticated | null | undefined> {
    const erroValidacao = validarTrocaSenha(dados);
    if (erroValidacao) {
      setErro(erroValidacao);
      return undefined;
    }

    setErro("");
    try {
      const { usuario } = await alterarSenha.mutateAsync({
        email,
        senhaAtual,
        novaSenha,
      });
      return usuario;
    } catch (falha) {
      const mensagem = (falha as { mensagem?: unknown } | null)?.mensagem;
      setErro(
        typeof mensagem === "string" && mensagem
          ? mensagem
          : "Não foi possível alterar a senha. Tente novamente.",
      );
      return undefined;
    }
  }

  return {
    senhaAtual,
    setSenhaAtual,
    novaSenha,
    setNovaSenha,
    confirmacao,
    setConfirmacao,
    erro,
    requisitos: requisitosNovaSenha(dados),
    enviando: alterarSenha.isPending,
    enviar,
    limpar,
  };
}
