import { Home, ShieldOff } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { LayoutBase } from "../../components/LayoutBase";
import { usePermissoes } from "../../context/usePermissoes";
import { paginaInicial, ROTA_SEM_ACESSO } from "../../utils/acessos";

export function SemAcesso() {
  const navigate = useNavigate();
  const { permissoes } = usePermissoes();
  const inicio = paginaInicial(permissoes);

  return (
    <LayoutBase activeTab="" pageTitle="Acesso negado">
      <section className="relative flex min-h-[calc(100vh-8.5rem)] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-md">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 w-full max-w-2xl text-center"
        >
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10 text-amber-400 shadow-lg shadow-amber-950/20">
            <ShieldOff className="h-9 w-9" strokeWidth={1.75} />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 sm:text-3xl">
            Você não tem acesso a esta página
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
            O seu cargo não inclui as permissões necessárias. Se precisar deste
            acesso, peça a um administrador para ajustar o seu cargo.
          </p>

          {inicio !== ROTA_SEM_ACESSO && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => navigate(inicio, { replace: true })}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              >
                <Home className="h-4 w-4" />
                Ir para a página inicial
              </button>
            </div>
          )}
        </motion.div>
      </section>
    </LayoutBase>
  );
}
