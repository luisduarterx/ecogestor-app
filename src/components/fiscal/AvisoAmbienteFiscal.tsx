import { AlertTriangle } from "lucide-react";
import type { StatusModuloFiscal } from "../../utils/types";

/** Aviso fixo exibido nas telas fiscais quando o ambiente é de homologação. */
export default function AvisoAmbienteFiscal({
  status,
}: {
  status: StatusModuloFiscal | undefined;
}) {
  if (!status?.habilitado || status.ambiente !== "homologacao") return null;
  return (
    <div
      className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-semibold text-amber-300"
      role="status"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      Ambiente de homologação — notas sem valor fiscal.
    </div>
  );
}
