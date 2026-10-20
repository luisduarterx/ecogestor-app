import { Loader2 } from "lucide-react";
import { LayoutBase } from "../../components/LayoutBase";
import { usePerfil } from "../../utils/queries";
import { AlterarSenha } from "./AlterarSenha";
import { DadosPessoais } from "./DadosPessoais";

/** Página "Meu perfil": dados e senha do próprio usuário. */
export function Perfil() {
  const perfilQuery = usePerfil();

  return (
    <LayoutBase activeTab="perfil" pageTitle="Meu perfil">
      <div className="space-y-6">
        {perfilQuery.isPending ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-12 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            Carregando seus dados...
          </div>
        ) : perfilQuery.isError ? (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
          >
            <span>
              {perfilQuery.error.mensagem ??
                "Não foi possível carregar seus dados."}
            </span>
            <button
              type="button"
              onClick={() => void perfilQuery.refetch()}
              className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950 hover:bg-rose-300"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <DadosPessoais perfil={perfilQuery.data} />
        )}
        <AlterarSenha />
      </div>
    </LayoutBase>
  );
}
