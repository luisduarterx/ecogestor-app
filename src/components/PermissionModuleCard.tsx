interface PermissionModuleCardProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  onToggleAll: (enable: boolean) => void;
  children: React.ReactNode;
}

export default function PermissionModuleCard({
  title,
  icon: Icon,
  description,
  onToggleAll,
  children,
}: PermissionModuleCardProps) {
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

        <div className="flex items-center gap-1 text-[10px] self-end sm:self-auto">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {children}
      </div>
    </div>
  );
}
