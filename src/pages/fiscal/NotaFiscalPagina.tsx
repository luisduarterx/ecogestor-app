import { Loader2, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { LayoutBase } from "../../components/LayoutBase";
import AvisoAmbienteFiscal from "../../components/fiscal/AvisoAmbienteFiscal";
import { ROTULOS_STATUS_NOTA, mensagemErroFiscal } from "../../utils/fiscal";
import { useNotaFiscal, useStatusFiscal } from "../../utils/queries";
import EditorNotaFiscal from "./EditorNotaFiscal";

/** Editor (rascunho/rejeitada) e detalhe da nota fiscal. */
export function NotaFiscalPagina() {
  const { id } = useParams();
  const notaID = Number(id);
  const statusQuery = useStatusFiscal();
  const notaQuery = useNotaFiscal(notaID);
  const [aviso, setAviso] = useState("");
  const queryClient = useQueryClient();
  const statusNota = notaQuery.data?.status;
  const statusAnterior = useRef(statusNota);

  // O acompanhamento automático detecta o retorno da SEFAZ: avisa e atualiza
  // a lista e o histórico, que não passam pelas mutações.
  useEffect(() => {
    const anterior = statusAnterior.current;
    statusAnterior.current = statusNota;
    if (anterior !== "PROCESSANDO" || !statusNota || statusNota === anterior)
      return;
    setAviso(
      `Retorno da SEFAZ: nota ${ROTULOS_STATUS_NOTA[statusNota].toLowerCase()}.`,
    );
    void queryClient.invalidateQueries({ queryKey: ["fiscal", "notas"] });
    void queryClient.invalidateQueries({
      queryKey: ["fiscal", "eventos", notaID],
    });
  }, [statusNota, notaID, queryClient]);

  useEffect(() => {
    if (!aviso) return;
    const temporizador = window.setTimeout(() => setAviso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [aviso]);

  let conteudo;
  if (!Number.isInteger(notaID) || notaID <= 0) {
    conteudo = <Mensagem texto="Nota fiscal inválida." />;
  } else if (statusQuery.data && !statusQuery.data.habilitado) {
    conteudo = (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
        <Lock className="h-8 w-8 text-slate-500" />
        <p className="text-sm text-slate-400">
          O módulo fiscal não está habilitado para esta empresa.
        </p>
      </div>
    );
  } else if (notaQuery.isPending) {
    conteudo = (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-12 text-sm text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        Carregando nota fiscal...
      </div>
    );
  } else if (notaQuery.isError) {
    conteudo = (
      <Mensagem
        texto={
          notaQuery.error.statusCode === 404
            ? "Nota fiscal não encontrada. Ela pode ter sido excluída."
            : mensagemErroFiscal(
                notaQuery.error,
                "Não foi possível carregar a nota fiscal.",
              )
        }
        onTentar={
          notaQuery.error.statusCode === 404
            ? undefined
            : () => void notaQuery.refetch()
        }
      />
    );
  } else {
    conteudo = (
      <EditorNotaFiscal
        key={notaQuery.data.id}
        nota={notaQuery.data}
        onAviso={setAviso}
        onRecarregar={() => void notaQuery.refetch()}
      />
    );
  }

  return (
    <LayoutBase activeTab="fiscal" pageTitle="Nota fiscal">
      <div className="space-y-4">
        <AvisoAmbienteFiscal status={statusQuery.data} />
        {aviso && (
          <div
            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"
            role="status"
          >
            {aviso}
          </div>
        )}
        {conteudo}
      </div>
    </LayoutBase>
  );
}

function Mensagem({
  texto,
  onTentar,
}: {
  texto: string;
  onTentar?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
      <span>{texto}</span>
      <div className="flex gap-2">
        {onTentar && (
          <button
            type="button"
            onClick={onTentar}
            className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950"
          >
            Tentar novamente
          </button>
        )}
        <Link
          to="/fiscal"
          className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold uppercase text-slate-200"
        >
          Voltar para a lista
        </Link>
      </div>
    </div>
  );
}
