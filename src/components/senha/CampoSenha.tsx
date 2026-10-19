import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState } from "react";

interface CampoSenhaProps {
  id: string;
  rotulo: string;
  /** Numeração exibida antes do rótulo, como no passo a passo da troca. */
  prefixo?: string;
  valor: string;
  onChange: (valor: string) => void;
  Icone: LucideIcon;
  placeholder?: string;
  autoComplete: "current-password" | "new-password";
  autoFocus?: boolean;
  destacado?: boolean;
  desabilitado?: boolean;
}

export function CampoSenha({
  id,
  rotulo,
  prefixo,
  valor,
  onChange,
  Icone,
  placeholder,
  autoComplete,
  autoFocus,
  destacado = false,
  desabilitado = false,
}: CampoSenhaProps) {
  const [visivel, setVisivel] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block font-mono text-xs font-bold uppercase tracking-wider text-slate-300"
      >
        {prefixo ? `${prefixo} ${rotulo}` : rotulo}
      </label>
      <div className="relative">
        <Icone
          className={`pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 ${
            destacado ? "text-emerald-400" : "text-slate-500"
          }`}
        />
        <input
          id={id}
          type={visivel ? "text" : "password"}
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={desabilitado}
          className="block w-full rounded-xl border border-slate-700/80 bg-slate-950 py-2 pl-11 pr-11 font-mono text-sm text-slate-100 placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setVisivel((atual) => !atual)}
          aria-label={`${visivel ? "Ocultar" : "Mostrar"} ${rotulo.toLowerCase()}`}
          aria-pressed={visivel}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:text-slate-200"
        >
          {visivel ? (
            <EyeOff className="h-4.5 w-4.5" />
          ) : (
            <Eye className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </div>
  );
}
