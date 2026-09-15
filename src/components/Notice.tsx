import { CheckCircle2, X } from "lucide-react";

type NoticeProps = {
  data: string;
  setNotice: (x: string) => void;
};

export default function Notice({ data, setNotice }: NoticeProps) {
  return (
    <div
      className="fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-md items-start gap-3 rounded-xl border border-emerald-500/30 bg-slate-900 p-4 text-sm text-slate-200 shadow-2xl shadow-slate-950/50"
      role="status"
      aria-live="polite"
    >
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
      <span className="flex-1 leading-5">{data}</span>
      <button
        type="button"
        onClick={() => setNotice("")}
        className="rounded-md p-0.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
        aria-label="Fechar notificação"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
