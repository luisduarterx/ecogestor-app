import { CheckCircle2, Circle } from "lucide-react";
import type { RequisitoSenha } from "../../utils/senha";

export function RequisitosSenha({
  requisitos,
}: {
  requisitos: RequisitoSenha[];
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
        Requisitos de segurança da senha:
      </p>
      <ul className="flex flex-wrap gap-x-6 gap-y-2">
        {requisitos.map((requisito) => (
          <li
            key={requisito.id}
            className={`flex items-center gap-2 text-sm ${
              requisito.atendido ? "text-emerald-300" : "text-slate-400"
            }`}
          >
            {requisito.atendido ? (
              <CheckCircle2
                className="h-4.5 w-4.5 text-emerald-400"
                aria-hidden
              />
            ) : (
              <Circle className="h-4.5 w-4.5 text-slate-600" aria-hidden />
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
