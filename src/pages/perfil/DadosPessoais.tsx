import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { CampoSenha } from "../../components/senha/CampoSenha";
import {
  emailFoiAlterado,
  montarAlteracoesPerfil,
  TAMANHO_MAXIMO_NOME,
  validarPerfil,
  type FormularioPerfil,
} from "../../utils/perfil";
import { useAtualizarPerfil } from "../../utils/queries";
import type { PerfilResponse } from "../../utils/types";

const CLASSE_CAMPO =
  "w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60";

const paraFormulario = (perfil: PerfilResponse): FormularioPerfil => ({
  nome: perfil.nome,
  email: perfil.email,
  senhaAtual: "",
});

/** Nome e e-mail do próprio usuário. O cargo só é exibido. */
export function DadosPessoais({ perfil }: { perfil: PerfilResponse }) {
  const atualizarPerfil = useAtualizarPerfil();
  const [formulario, setFormulario] = useState(() => paraFormulario(perfil));
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const enviando = atualizarPerfil.isPending;
  const exigeSenha = emailFoiAlterado(perfil, formulario.email);

  useEffect(() => {
    if (!mensagemSucesso) return;
    const temporizador = window.setTimeout(() => setMensagemSucesso(""), 6000);
    return () => window.clearTimeout(temporizador);
  }, [mensagemSucesso]);

  function alterar(campo: keyof FormularioPerfil, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setMensagemSucesso("");

    const erroValidacao = validarPerfil(perfil, formulario);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }
    const alteracoes = montarAlteracoesPerfil(perfil, formulario);
    if (!alteracoes) {
      setErro("Nenhuma alteração para salvar.");
      return;
    }

    try {
      const atualizado = await atualizarPerfil.mutateAsync(alteracoes);
      setFormulario(paraFormulario(atualizado));
      setMensagemSucesso("Dados atualizados com sucesso.");
    } catch (falha) {
      const mensagem = (falha as { mensagem?: unknown } | null)?.mensagem;
      setErro(
        typeof mensagem === "string" && mensagem
          ? mensagem
          : "Não foi possível salvar os dados. Tente novamente.",
      );
    }
  }

  return (
    <section
      aria-labelledby="dados-pessoais-titulo"
      className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6"
    >
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <UserRound className="h-5 w-5 text-emerald-400" />
        <div>
          <h2
            id="dados-pessoais-titulo"
            className="m-0 text-base font-semibold tracking-normal text-slate-100"
          >
            Dados pessoais
          </h2>
          <p className="text-xs text-slate-400">
            O e-mail é usado para entrar no sistema.
          </p>
        </div>
      </div>

      <form onSubmit={salvar} noValidate className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Campo id="perfil-nome" rotulo="Nome">
            <input
              id="perfil-nome"
              type="text"
              value={formulario.nome}
              onChange={(e) => alterar("nome", e.target.value)}
              maxLength={TAMANHO_MAXIMO_NOME}
              autoComplete="name"
              disabled={enviando}
              className={CLASSE_CAMPO}
            />
          </Campo>
          <Campo id="perfil-email" rotulo="E-mail">
            <input
              id="perfil-email"
              type="email"
              value={formulario.email}
              onChange={(e) => alterar("email", e.target.value)}
              autoComplete="email"
              disabled={enviando}
              className={CLASSE_CAMPO}
            />
          </Campo>
          <Campo id="perfil-cargo" rotulo="Cargo">
            <div
              id="perfil-cargo"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-sm text-slate-400"
            >
              <ShieldCheck className="h-4 w-4 text-slate-500" />
              {perfil.cargo.nome}
            </div>
          </Campo>
        </div>

        {exigeSenha && (
          <div className="max-w-sm">
            <CampoSenha
              id="perfil-senha-atual"
              rotulo="Senha atual"
              valor={formulario.senhaAtual}
              onChange={(valor) => alterar("senhaAtual", valor)}
              Icone={Lock}
              placeholder="Confirme para alterar o e-mail"
              autoComplete="current-password"
              desabilitado={enviando}
            />
          </div>
        )}

        {erro && (
          <div
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
          >
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
            {erro}
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
            disabled={enviando}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {enviando ? "Salvando..." : "Salvar dados"}
          </button>
        </div>
      </form>
    </section>
  );
}

function Campo({
  id,
  rotulo,
  children,
}: {
  id: string;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300"
      >
        {rotulo}
      </label>
      {children}
    </div>
  );
}
