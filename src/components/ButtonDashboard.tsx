import type { LucideIcon } from "lucide-react";

interface ButtonDashboardProps {
  Icon: LucideIcon;
  color_icon?: string;
  label: string;
  description: string;
  cta: boolean;
  onClick: () => void;
}

export default function ButtonDashboard({
  Icon,
  cta,
  color_icon,
  label,
  description,
  onClick,
}: ButtonDashboardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start p-4 ${cta ? `bg-emerald-400 hover:bg-emerald-300 text-slate-950` : "bg-slate-900 hover:bg-slate-800/80 text-slate-100"}   rounded-2xl transition-all duration-150 text-left border border-transparent shadow-xs cursor-pointer group`}
    >
      <div
        className={`p-2  ${cta ? "bg-slate-950/10 " : "bg-slate-800 border border-slate-700 "} rounded-xl mb-3 ${color_icon ? color_icon : "text-slate-950 "} group-hover:scale-105 transition-transform`}
      >
        <Icon className="h-5 w-5 font-bold" />
      </div>
      <span className="text-sm font-bold tracking-tight">{label}</span>
      <span
        className={`text-[11px] ${cta ? "text-slate-800" : "text-slate-400"}  font-medium mt-1`}
      >
        {description}
      </span>
    </button>
  );
}
