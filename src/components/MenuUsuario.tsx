import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

interface MenuUsuarioProps {
  nome: string;
  iniciais: string;
  onSair: () => void;
}

/** Nome e avatar do cabeçalho, com acesso ao perfil e à saída do sistema. */
export function MenuUsuario({ nome, iniciais, onSair }: MenuUsuarioProps) {
  const [aberto, setAberto] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function fecharAoClicarFora(evento: MouseEvent) {
      if (!container.current?.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    function fecharComEsc(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEsc);
    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEsc);
    };
  }, [aberto]);

  return (
    <div ref={container} className="relative border-l border-slate-800 pl-4">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={`Menu do usuário ${nome}`}
        className="flex cursor-pointer items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-slate-800/60"
      >
        <span className="hidden text-right text-xs font-bold text-slate-200 sm:block">
          {nome}
        </span>
        <span className="flex h-8.5 w-8.5 select-none items-center justify-center rounded-xl border border-slate-700 bg-slate-800 font-mono text-sm font-semibold uppercase text-emerald-400 shadow-sm">
          {iniciais}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>

      {aberto && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 py-1 shadow-2xl shadow-slate-950/60"
        >
          <Link
            to="/perfil"
            role="menuitem"
            onClick={() => setAberto(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-800"
          >
            <UserRound className="h-4 w-4 text-emerald-400" />
            Meu perfil
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAberto(false);
              onSair();
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-left text-sm text-rose-300 hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Sair do sistema
          </button>
        </div>
      )}
    </div>
  );
}
