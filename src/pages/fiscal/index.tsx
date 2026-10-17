import { FileText, Landmark, Loader2, Lock, Sliders } from "lucide-react";
import { useEffect, useState } from "react";
import { LayoutBase } from "../../components/LayoutBase";
import AvisoAmbienteFiscal from "../../components/fiscal/AvisoAmbienteFiscal";
import { usePermissoes } from "../../context/usePermissoes";
import { useStatusFiscal } from "../../utils/queries";
import { ConfiguracaoFiscalAba } from "./ConfiguracaoFiscalAba";
import { NaturezasOperacaoAba } from "./NaturezasOperacaoAba";
import { NotasFiscaisAba } from "./NotasFiscaisAba";

type Aba = "notas" | "naturezas" | "configuracao";

export function Fiscal() {
  const statusQuery = useStatusFiscal();
  // Naturezas e configuração fiscal têm permissões próprias de leitura.
  const { pode } = usePermissoes();
  const verNaturezas = pode("read:natureza_operacao");
  const verConfiguracao = pode("read:configuracao_fiscal");
  const [aba, setAba] = useState<Aba>("notas");
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    if (!aviso) return;
    const temporizador = window.setTimeout(() => setAviso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [aviso]);

  return (
    <LayoutBase activeTab="fiscal" pageTitle="Fiscal">
      {statusQuery.isPending ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-12 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          Verificando o módulo fiscal...
        </div>
      ) : statusQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <span>Não foi possível verificar o módulo fiscal.</span>
          <button
            type="button"
            onClick={() => void statusQuery.refetch()}
            className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950 hover:bg-rose-300"
          >
            Tentar novamente
          </button>
        </div>
      ) : !statusQuery.data.habilitado ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
          <Lock className="h-8 w-8 text-slate-500" />
          <h2 className="text-lg font-bold text-slate-100">
            Módulo fiscal não habilitado
          </h2>
          <p className="max-w-md text-sm text-slate-400">
            A emissão de notas fiscais é contratada à parte. Contate o suporte
            do EcoGestor para ativar o módulo nesta empresa.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 md:flex-row md:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2 text-xs text-slate-400">
                <span>Fiscal</span>
                <span aria-hidden="true">·</span>
                <span>NF-e de saída</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-emerald-400">Modelo 55</span>
              </div>
              <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold text-slate-100">
                Módulo Fiscal
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    statusQuery.data.ambiente === "producao"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-amber-500/20 bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {statusQuery.data.ambiente === "producao"
                    ? "Produção"
                    : "Homologação"}
                </span>
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Notas fiscais eletrônicas, regras tributárias definidas com o
                contador e parâmetros de emissão.
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950/40 p-1">
              <BotaoAba
                ativa={aba === "notas"}
                onClick={() => setAba("notas")}
                Icone={FileText}
                rotulo="Notas"
              />
              {verNaturezas && (
                <BotaoAba
                  ativa={aba === "naturezas"}
                  onClick={() => setAba("naturezas")}
                  Icone={Landmark}
                  rotulo="Naturezas de operação"
                />
              )}
              {verConfiguracao && (
                <BotaoAba
                  ativa={aba === "configuracao"}
                  onClick={() => setAba("configuracao")}
                  Icone={Sliders}
                  rotulo="Configuração fiscal"
                />
              )}
            </div>
          </div>

          <AvisoAmbienteFiscal status={statusQuery.data} />

          {aviso && (
            <div
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300"
              role="status"
            >
              {aviso}
            </div>
          )}

          {aba === "notas" && <NotasFiscaisAba />}
          {aba === "naturezas" && verNaturezas && (
            <NaturezasOperacaoAba onAviso={setAviso} />
          )}
          {aba === "configuracao" && verConfiguracao && (
            <ConfiguracaoFiscalAba onAviso={setAviso} />
          )}
        </div>
      )}
    </LayoutBase>
  );
}

function BotaoAba({
  ativa,
  onClick,
  Icone,
  rotulo,
}: {
  ativa: boolean;
  onClick: () => void;
  Icone: typeof Landmark;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
        ativa
          ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          : "border border-transparent text-slate-400 hover:text-slate-200"
      }`}
    >
      <Icone className="h-4 w-4" />
      {rotulo}
    </button>
  );
}
