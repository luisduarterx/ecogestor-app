import type { ReactNode } from "react";
import { usePermissoes } from "../context/usePermissoes";
import { podeAcessarPagina, type PaginaID } from "../utils/acessos";
import { useStatusFiscal } from "../utils/queries";
import { SemAcesso } from "./sem-acesso";

interface RotaPermitidaProps {
  pagina: PaginaID;
  children: ReactNode;
}

export function RotaPermitida({ pagina, children }: RotaPermitidaProps) {
  const { permissoes } = usePermissoes();
  const statusFiscal = useStatusFiscal();

  if (pagina === "fiscal" && statusFiscal.isPending) {
    return <div>Carregando...</div>;
  }

  if (!podeAcessarPagina(pagina, permissoes, statusFiscal.data?.habilitado)) {
    return <SemAcesso />;
  }

  return children;
}
