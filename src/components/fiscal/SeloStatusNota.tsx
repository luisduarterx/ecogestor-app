import { Loader2 } from "lucide-react";
import { CLASSES_STATUS_NOTA, ROTULOS_STATUS_NOTA } from "../../utils/fiscal";
import type { StatusNotaFiscal } from "../../utils/types";

export default function SeloStatusNota({
  status,
}: {
  status: StatusNotaFiscal;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${CLASSES_STATUS_NOTA[status]}`}
    >
      {status === "PROCESSANDO" && <Loader2 className="h-3 w-3 animate-spin" />}
      {ROTULOS_STATUS_NOTA[status]}
    </span>
  );
}
