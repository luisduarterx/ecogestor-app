import { CheckCircle2, Circle } from "lucide-react";
import type { RequisitoSenha } from "../../utils/senha";

export function RequisitosSenha({
  requisitos,
}: {
  requisitos: RequisitoSenha[];
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
      <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
        Requisitos de segurança da senha:
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        {requisitos.map((requisito) => (
          <li
            key={requisito.id}
            className={`flex items-center gap-2 text-xs ${
              requisito.atendido ? "text-emerald-300" : "text-slate-400"
            }`}
          >
            {requisito.atendido ? (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden
              />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-slate-600" aria-hidden />
            )}
            {requisito.rotulo}
            <span className="sr-only">
              {requisito.atendido ? "(atendido)" : "(pendente)"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
