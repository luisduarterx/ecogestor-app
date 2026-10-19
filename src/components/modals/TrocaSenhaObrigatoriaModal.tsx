import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { useLoggedUser } from "../../context/useLoggedUser";
import { useLogout } from "../../utils/queries";
import { iniciaisDoNome } from "../../utils/senha";
import type { UserAuthenticated } from "../../utils/types";
import { CampoSenha } from "../senha/CampoSenha";
import { RequisitosSenha } from "../senha/RequisitosSenha";
import {
  AVISO_ENTRAR_COM_NOVA_SENHA,
  useFormularioTrocaSenha,
} from "../senha/useFormularioTrocaSenha";

interface TrocaSenhaObrigatoriaModalProps {
  usuario: Pick<UserAuthenticated, "nome" | "email">;
}

/**
 * Exibido no lugar das páginas protegidas enquanto a sessão tiver troca de
 * senha pendente: a API recusa as demais rotas até a troca ser concluída.
 */
export function TrocaSenhaObrigatoriaModal({
  usuario,
}: TrocaSenhaObrigatoriaModalProps) {
  const navigate = useNavigate();
  const { logout } = useLoggedUser();
  const sair = useLogout();
  const formulario = useFormularioTrocaSenha(usuario.email);
  const [erroSaida, setErroSaida] = useState("");
  const ocupado = formulario.enviando || sair.isPending;

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const resultado = await formulario.enviar();
    // Com o novo login a sessão é atualizada e as páginas voltam a aparecer.
    if (resultado === null) {
      logout();
      navigate("/", {
        replace: true,
        state: { aviso: AVISO_ENTRAR_COM_NOVA_SENHA },
      });
    }
  }

  async function encerrarSessao() {
    setErroSaida("");
    try {
      await sair.mutateAsync();
      logout();
      navigate("/", { replace: true });
    } catch {
      setErroSaida("Não foi possível sair. Tente novamente.");
    }
  }

  const erro = formulario.erro || erroSaida;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="troca-senha-titulo"
        aria-describedby="troca-senha-descricao"
        className="my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl shadow-slate-950/60"
      >
        <div className="space-y-5 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/60 p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400">
              <KeyRound className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <span className="inline-block rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Troca de senha pendente
              </span>
              <h1
                id="troca-senha-titulo"
                className="text-xl font-bold text-slate-50 sm:text-2xl"
              >
                Alteração Obrigatória de Senha
              </h1>
            </div>
          </div>

          <p
            id="troca-senha-descricao"
            className="text-sm leading-6 text-slate-400"
          >
            Sua conta está com uma{" "}
            <strong className="text-slate-100">senha provisória</strong> ou o
            administrador exigiu a troca da senha. Para garantir a privacidade e
            a segurança do sistema, cadastre uma nova senha pessoal antes de
            prosseguir.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-xs font-bold text-slate-950"
                aria-hidden
              >
                {iniciaisDoNome(usuario.nome)}
              </span>
              <span className="truncate font-mono text-sm font-bold text-slate-100">
                {usuario.nome}
              </span>
            </div>
            <span className="max-w-full truncate rounded-lg bg-slate-950 px-3 py-1.5 font-mono text-sm text-slate-400">
              login:{" "}
              <span className="font-bold text-emerald-400">
                {usuario.email}
              </span>
            </span>
          </div>
        </div>

        <form
          onSubmit={confirmar}
          noValidate
          className="space-y-5 bg-slate-950/40 p-6 sm:p-8"
        >
          <CampoSenha
            id="troca-senha-atual"
            prefixo="1."
            rotulo="Senha atual ou provisória"
            valor={formulario.senhaAtual}
            onChange={formulario.setSenhaAtual}
            Icone={Lock}
            placeholder="Informe a senha recebida"
            dica="Use a senha provisória informada pelo administrador ou a sua senha atual."
            autoComplete="current-password"
            autoFocus
            desabilitado={ocupado}
          />
          <CampoSenha
            id="troca-senha-nova"
            prefixo="2."
            rotulo="Nova senha pessoal"
            valor={formulario.novaSenha}
            onChange={formulario.setNovaSenha}
            Icone={KeyRound}
            placeholder="Crie sua nova senha segura"
            autoComplete="new-password"
            destacado
            desabilitado={ocupado}
          />
          <CampoSenha
            id="troca-senha-confirmacao"
            prefixo="3."
            rotulo="Confirmar nova senha"
            valor={formulario.confirmacao}
            onChange={formulario.setConfirmacao}
            Icone={CheckCircle2}
            placeholder="Repita a nova senha criada"
            autoComplete="new-password"
            destacado
            desabilitado={ocupado}
          />

          <RequisitosSenha requisitos={formulario.requisitos} />

          {erro && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/15 p-3.5 text-sm text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              {erro}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={() => void encerrarSessao()}
              disabled={ocupado}
              className="cursor-pointer rounded-xl bg-slate-800 px-6 py-3 text-sm font-bold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sair.isPending ? "Saindo..." : "Sair"}
            </button>
            <button
              type="submit"
              disabled={ocupado}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-mono text-sm font-bold uppercase tracking-wider text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {formulario.enviando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Alterando senha...
                </>
              ) : (
                <>
                  Confirmar e acessar o sistema
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
