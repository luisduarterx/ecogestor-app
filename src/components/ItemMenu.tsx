import { type LucideIcon } from "lucide-react";

interface ItemMenuProps {
  key: string;
  onClick: () => void;
  isActive: boolean;
  label: string;
  Icon: LucideIcon;
}

export function ItemMenu({
  key,
  onClick,
  isActive,
  label,
  Icon,
}: ItemMenuProps) {
  return (
    <button
      key={key}
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
        isActive
          ? "bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-400 font-semibold pl-4"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-4 border-transparent"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${isActive ? "text-emerald-400" : "text-slate-400"}`}
      />
      {label}
    </button>
  );
}
