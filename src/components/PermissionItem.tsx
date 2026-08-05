interface PermissionItemProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}
export default function PermissionItem({
  label,
  checked,
  onChange,
}: PermissionItemProps) {
  return (
    <label
      onClick={onChange}
      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
        checked
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300"
      }`}
    >
      <span className="font-medium text-[11px] truncate pr-2">{label}</span>
      <div
        className={`h-5 w-9 rounded-full transition-colors flex items-center p-0.5 shrink-0 ${
          checked ? "bg-emerald-500 justify-end" : "bg-slate-800 justify-start"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full shadow-xs transition-transform ${
            checked ? "bg-slate-950" : "bg-slate-500"
          }`}
        />
      </div>
    </label>
  );
}
