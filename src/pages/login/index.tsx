import { Leaf, Lock, User, AlertCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useLoggedUser } from "../../context/useLoggedUser";

import { useLogin } from "../../utils/queries";
import type { ApiError } from "../../utils/types";

export function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useLoggedUser();
  const navigate = useNavigate();

  const { mutateAsync: loginUser, isPending } = useLogin();

  async function handleSubmit(event: React.SubmitEvent) {
    try {
      event.preventDefault();
      const result = await loginUser({ email, senha });
      setUser(result.user);
      localStorage.setItem("sid", result.token);
      navigate("/dashboard");
    } catch (error) {
      const apiErr = error as ApiError;
      setError(apiErr.mensagem);
    }
  }
  return (
    <div
      id="login-container"
      className="min-h-screen min-w-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans"
    >
      {/* Background organic shape vectors representing eco elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-2 mb-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 text-emerald-400">
            <Leaf className="h-8 w-8 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
              Eco<span className="text-emerald-400 font-normal">Gestor</span>
            </h1>
          </div>
        </div>

        <p className="mt-2 text-center text-sm text-slate-400">
          Insira suas credenciais de operador para acessar a plataforma
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
      >
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-4 shadow-xl border border-slate-700/60 sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                EMAIL
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                  placeholder="Email do operador"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Senha
              </label>
              <div className="mt-1.5 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-900/80 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-500/15 p-3.5 border border-rose-500/25 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <span className="text-xs text-rose-200 font-medium">
                  {error}
                </span>
              </div>
            )}

            <div>
              <button
                id="btn-login"
                type="submit"
                disabled={isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-slate-950"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Acessando...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    Entrar no Sistema
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-700/60 pt-4 text-center">
            <span className="text-xs text-slate-500 flex items-center justify-center gap-1 font-mono">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              ECOGESTOR v1.0.0 — Licenciado para 43.746.082.0001-40
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
