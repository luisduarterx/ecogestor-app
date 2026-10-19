import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  ShieldAlert,
  X,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  ehAcessoNegado,
  MENSAGEM_ACESSO_NEGADO,
} from "../../utils/autorizacao";
import {
  useExigirTrocaSenhaUsuario,
  useRedefinirSenhaUsuario,
} from "../../utils/queries";
import { validarSenhaProvisoria } from "../../utils/senha";
import type { UserManagementResponse } from "../../utils/types";
import { CampoSenha } from "../senha/CampoSenha";

export type AcaoSenhaUsuario = "redefinir" | "exigir";

interface SenhaUsuarioModalProps {
  acao: AcaoSenhaUsuario;
  usuario: Pick<UserManagementResponse, "id" | "nome" | "email">;
  onClose: () => void;
  /** Recebe a mensagem de sucesso exibida pela tela de usuários. */
  onConcluido: (mensagem: string) => void;
}

function mensagemDoErro(erro: unknown) {
  if (ehAcessoNegado(erro)) return MENSAGEM_ACESSO_NEGADO;
  const apiErro = erro as { statusCode?: number; mensagem?: unknown } | null;
  if (apiErro?.statusCode === 404) return "Usuário não encontrado.";
  if (typeof apiErro?.mensagem === "string" && apiErro.mensagem) {
    return apiErro.mensagem;
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

/**
 * Ações do administrador sobre a senha de outro usuário: definir uma senha
 * provisória ou exigir a troca da senha atual. Nos dois casos o usuário passa
 * a ver a troca obrigatória até definir uma nova senha.
 */
export default function SenhaUsuarioModal({
  acao,
  usuario,
  onClose,
  onConcluido,
}: SenhaUsuarioModalProps) {
  const redefinir = useRedefinirSenhaUsuario();
  const exigir = useExigirTrocaSenhaUsuario();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const enviando = redefinir.isPending || exigir.isPending;
  const ehRedefinicao = acao === "redefinir";

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");

    if (ehRedefinicao) {
      const erroValidacao = validarSenhaProvisoria({
        senha,
        confirmacao,
        email: usuario.email,
      });
      if (erroValidacao) {
        setErro(erroValidacao);
        return;
      }
    }

    try {
      if (ehRedefinicao) {
        await redefinir.mutateAsync({
          userID: usuario.id,
          senhaProvisoria: senha,
        });
        onConcluido(
          `Senha provisória definida para ${usuario.nome}. Repasse a senha ao usuário.`,
        );
      } else {
        await exigir.mutateAsync(usuario.id);
        onConcluido(
          `${usuario.nome} precisará trocar a senha para continuar usando o sistema.`,
        );
      }
    } catch (falha) {
      setErro(mensagemDoErro(falha));
    }
  }

  const Icone = ehRedefinicao ? KeyRound : ShieldAlert;
  const titulo = ehRedefinicao
    ? "Definir senha provisória"
    : "Exigir troca de senha";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="senha-usuario-titulo"
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-400">
              <Icone className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="senha-usuario-titulo"
                className="text-base font-bold text-slate-100"
              >
                {titulo}
              </h3>
              <p className="text-xs text-slate-400">
                {usuario.nome} · {usuario.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={confirmar}
          noValidate
          className="flex flex-col gap-4 p-5"
        >
          {ehRedefinicao ? (
            <>
              <p className="text-sm text-slate-400">
                O usuário entra com esta senha e precisa trocá-la antes de
                continuar. Repasse a senha a ele por fora do sistema.
              </p>
              <CampoSenha
                id="senha-provisoria"
                rotulo="Senha provisória"
                valor={senha}
                onChange={setSenha}
                Icone={KeyRound}
                placeholder="Mínimo de 10 caracteres"
                autoComplete="new-password"
                autoFocus
                desabilitado={enviando}
              />
              <CampoSenha
                id="senha-provisoria-confirmacao"
                rotulo="Confirmar senha provisória"
                valor={confirmacao}
                onChange={setConfirmacao}
                Icone={CheckCircle2}
                placeholder="Repita a senha provisória"
                autoComplete="new-password"
                desabilitado={enviando}
              />
            </>
          ) : (
            <p className="text-sm text-slate-400">
              A senha atual de{" "}
              <strong className="text-slate-200">{usuario.nome}</strong>{" "}
              continua valendo, mas o acesso ao sistema fica bloqueado até ele
              definir uma nova senha. As sessões abertas também passam a exigir
              a troca.
            </p>
          )}

          {erro && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/15 p-3 text-sm text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              {erro}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
            >
              {enviando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {enviando
                ? "Salvando..."
                : ehRedefinicao
                  ? "Definir senha provisória"
                  : "Exigir troca"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
