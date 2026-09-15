import { ArrowLeft, Home, SearchX } from "lucide-react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router";
import { LayoutBase } from "../../components/LayoutBase";

export function NotFound() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <LayoutBase activeTab="" pageTitle="Página não encontrada">
      <section className="relative flex min-h-[calc(100vh-8.5rem)] items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-md">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative z-10 w-full max-w-2xl text-center"
        >
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-950/20">
            <SearchX className="h-9 w-9" strokeWidth={1.75} />
          </div>

          <div className="mb-3 flex items-center justify-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-emerald-400">
            <span className="h-px w-8 bg-emerald-500/40" />
            Erro de navegação
            <span className="h-px w-8 bg-emerald-500/40" />
          </div>

          <h1 className="m-0 text-7xl font-black leading-none tracking-tighter text-slate-100 sm:text-8xl">
            4<span className="text-emerald-400">0</span>4
          </h1>
          <h2 className="mt-5 text-2xl font-bold text-slate-100 sm:text-3xl">
            Esta página não foi encontrada
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-400">
            O endereço pode ter sido alterado, removido ou digitado
            incorretamente. Você pode retornar à tela anterior ou seguir para o
            painel principal.
          </p>

          <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3 text-left">
            <img
              src="/ICON_VERDE.svg"
              alt=""
              aria-hidden="true"
              className="h-4 w-4 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                Rota solicitada
              </p>
              <p className="truncate font-mono text-xs text-slate-300">
                {location.pathname}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar à página anterior
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard", { replace: true })}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-transparent bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-md transition-colors hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <Home className="h-4 w-4" />
              Ir para o painel
            </button>
          </div>

          <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">
            EcoGestor · Suite de Reciclagem
          </p>
        </motion.div>
      </section>
    </LayoutBase>
  );
}
