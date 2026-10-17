interface PermissionModuleCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onToggleAll: (enable: boolean) => void;
  // Chave de acesso ao módulo. Sem ela, as demais permissões não valem.
  access?: { checked: boolean; onChange: () => void };
  children: React.ReactNode;
}

export default function PermissionModuleCard({
  title,
  icon: Icon,
  description,
  onToggleAll,
  access,
  children,
}: PermissionModuleCardProps) {
  const semAcesso = access !== undefined && !access.checked;
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-slate-800 text-emerald-400 rounded-lg border border-slate-700">
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-200 text-xs">{title}</h4>
            <p className="text-[10px] text-slate-400">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {access && (
            <button
              type="button"
              role="switch"
              aria-checked={access.checked}
              onClick={access.onChange}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-all ${
                access.checked
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600"
              }`}
            >
              Acesso ao módulo
              <span
                className={`flex h-4 w-7 items-center rounded-full p-0.5 transition-colors ${
                  access.checked
                    ? "justify-end bg-emerald-500"
                    : "justify-start bg-slate-700"
                }`}
              >
                <span
                  className={`h-3 w-3 rounded-full ${
                    access.checked ? "bg-slate-950" : "bg-slate-400"
                  }`}
                />
              </span>
            </button>
          )}
          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => onToggleAll(true)}
              className="px-2 py-0.5 text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer transition-all font-mono"
            >
              + Marcar Módulo
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => onToggleAll(false)}
              className="px-2 py-0.5 text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-all font-mono"
            >
              - Desmarcar
            </button>
          </div>
        </div>
      </div>

      {semAcesso && (
        <p className="text-[10px] text-slate-500">
          Sem o acesso, o módulo não aparece no menu e as permissões abaixo não
          valem.
        </p>
      )}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 transition-opacity ${
          semAcesso ? "opacity-50" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
