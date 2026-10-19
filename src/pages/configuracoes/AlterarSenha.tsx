import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Save,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { CampoSenha } from "../../components/senha/CampoSenha";
import { RequisitosSenha } from "../../components/senha/RequisitosSenha";
import {
  AVISO_ENTRAR_COM_NOVA_SENHA,
  useFormularioTrocaSenha,
} from "../../components/senha/useFormularioTrocaSenha";
import { useLoggedUser } from "../../context/useLoggedUser";

/**
 * Troca voluntária da própria senha. Não depende das permissões de
 * configuração do sistema: todo usuário autenticado pode trocar a senha.
 */
export function AlterarSenha() {
  const { user, logout } = useLoggedUser();
  const navigate = useNavigate();
  const formulario = useFormularioTrocaSenha(user?.email ?? "");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    if (!mensagemSucesso) return;
    const temporizador = window.setTimeout(() => setMensagemSucesso(""), 6000);
    return () => window.clearTimeout(temporizador);
  }, [mensagemSucesso]);

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagemSucesso("");
    const resultado = await formulario.enviar();
    if (resultado === undefined) return;

    if (resultado === null) {
      logout();
      navigate("/", {
        replace: true,
        state: { aviso: AVISO_ENTRAR_COM_NOVA_SENHA },
      });
      return;
    }

    formulario.limpar();
    setMensagemSucesso(
      "Senha alterada com sucesso. As demais sessões abertas foram encerradas.",
    );
  }

  return (
    <section
      aria-labelledby="alterar-senha-titulo"
      className="mt-6 space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6"
    >
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <KeyRound className="h-5 w-5 text-emerald-400" />
        <div>
          <h2
            id="alterar-senha-titulo"
            className="text-base font-semibold text-slate-100"
          >
            Alterar minha senha
          </h2>
          <p className="text-xs text-slate-400">
            Ao trocar a senha, todas as outras sessões abertas com a sua conta
            são encerradas.
          </p>
        </div>
      </div>

      <form onSubmit={salvar} noValidate className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <CampoSenha
            id="alterar-senha-atual"
            rotulo="Senha atual"
            valor={formulario.senhaAtual}
            onChange={formulario.setSenhaAtual}
            Icone={Lock}
            placeholder="Sua senha atual"
            autoComplete="current-password"
            desabilitado={formulario.enviando}
          />
          <CampoSenha
            id="alterar-senha-nova"
            rotulo="Nova senha"
            valor={formulario.novaSenha}
            onChange={formulario.setNovaSenha}
            Icone={KeyRound}
            placeholder="Crie sua nova senha segura"
            autoComplete="new-password"
            destacado
            desabilitado={formulario.enviando}
          />
          <CampoSenha
            id="alterar-senha-confirmacao"
            rotulo="Confirmar nova senha"
            valor={formulario.confirmacao}
            onChange={formulario.setConfirmacao}
            Icone={CheckCircle2}
            placeholder="Repita a nova senha"
            autoComplete="new-password"
            destacado
            desabilitado={formulario.enviando}
          />
        </div>

        <RequisitosSenha requisitos={formulario.requisitos} />

        {formulario.erro && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            {formulario.erro}
          </div>
        )}

        {mensagemSucesso && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-sm font-semibold text-emerald-300"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            {mensagemSucesso}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={formulario.enviando}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {formulario.enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {formulario.enviando ? "Alterando..." : "Alterar senha"}
          </button>
        </div>
      </form>
    </section>
  );
}
