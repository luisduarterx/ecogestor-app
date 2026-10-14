import {
  AlertCircle,
  Ban,
  CircleSlash,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  LIMITE_ACOMPANHAMENTO_RAPIDO,
  formatarChaveAcesso,
  formatarDataHoraFiscal,
  formatarNumeroNota,
  mensagemErroFiscal,
  tempoProcessando,
} from "../../utils/fiscal";
import { useSincronizarNotaFiscal } from "../../utils/queries";
import type { ArquivoNotaFiscal, NotaFiscal } from "../../utils/types";
import CancelarNotaModal from "../modals/CancelarNotaModal";
import { abrirArquivoNota } from "./arquivosNota";

interface PainelEmissaoProps {
  nota: NotaFiscal;
  onAviso: (mensagem: string) => void;
  onRecarregar: () => void;
}

/** Situação da emissão: acompanhamento, resultado e arquivos da nota. */
export default function PainelEmissao({
  nota,
  onAviso,
  onRecarregar,
}: PainelEmissaoProps) {
  const sincronizar = useSincronizarNotaFiscal(nota.id);
  const [erro, setErro] = useState("");
  const [cancelando, setCancelando] = useState(false);
  const agora = useRelogio(nota.status === "PROCESSANDO");
  const { emissao, cancelamento } = nota;

  if (nota.status === "RASCUNHO") return null;

  const demorando =
    tempoProcessando(emissao, agora) >= LIMITE_ACOMPANHAMENTO_RAPIDO;
  // A consulta à Focus é limitada: em processamento, só depois de 1 minuto.
  const podeSincronizar =
    nota.status === "REJEITADA" ||
    nota.status === "AUTORIZADA" ||
    (nota.status === "PROCESSANDO" && demorando);

  async function atualizarSituacao() {
    setErro("");
    try {
      const atualizada = await sincronizar.mutateAsync();
      onAviso(
        atualizada.status === nota.status
          ? "Situação consultada na SEFAZ, sem alterações."
          : "Situação da nota atualizada.",
      );
    } catch (caught) {
      setErro(
        mensagemErroFiscal(
          caught,
          "Não foi possível consultar a nota na Focus NFe agora.",
        ),
      );
    }
  }

  const botaoSincronizar = podeSincronizar && (
    <button
      type="button"
      disabled={sincronizar.isPending}
      onClick={() => void atualizarSituacao()}
      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
    >
      <RefreshCw
        className={`h-4 w-4 ${sincronizar.isPending ? "animate-spin" : ""}`}
      />
      {sincronizar.isPending ? "Consultando..." : "Atualizar situação"}
    </button>
  );

  let conteudo: ReactNode;
  switch (nota.status) {
    case "PROCESSANDO":
      conteudo = (
        <Cartao
          classe="border-sky-500/30 bg-sky-500/5"
          Icone={Loader2}
          classeIcone="animate-spin text-sky-400"
          titulo="Nota enviada. Aguardando a SEFAZ..."
          acoes={botaoSincronizar}
        >
          <p>
            A situação é atualizada automaticamente.{" "}
            {demorando
              ? "A resposta está demorando mais que o normal; use “Atualizar situação” para consultar a SEFAZ."
              : "A SEFAZ costuma responder em poucos segundos."}
          </p>
          {emissao.emitidaEm && (
            <p className="text-slate-500">
              Enviada em {formatarDataHoraFiscal(emissao.emitidaEm)}
              {emissao.emitidaPor ? ` por ${emissao.emitidaPor.nome}` : ""}
            </p>
          )}
        </Cartao>
      );
      break;
    case "AUTORIZADA":
      conteudo = (
        <Cartao
          classe="border-emerald-500/30 bg-emerald-500/5"
          Icone={CheckCircle2}
          classeIcone="text-emerald-400"
          titulo="Nota autorizada pela SEFAZ"
          acoes={
            <>
              <BotoesArquivos nota={nota} onErro={setErro} />
              {botaoSincronizar}
              <button
                type="button"
                onClick={() => setCancelando(true)}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10"
              >
                <CircleSlash className="h-4 w-4" />
                Cancelar nota
              </button>
            </>
          }
        >
          <DadosAutorizacao nota={nota} />
        </Cartao>
      );
      break;
    case "REJEITADA":
      conteudo = (
        <Cartao
          classe="border-orange-500/30 bg-orange-500/5"
          Icone={XCircle}
          classeIcone="text-orange-400"
          titulo="Nota rejeitada"
          acoes={botaoSincronizar}
        >
          <MensagemSefaz nota={nota} classe="text-orange-200" />
          <p className="text-slate-400">
            Corrija os dados abaixo, salve e use “Emitir novamente”.
          </p>
        </Cartao>
      );
      break;
    case "DENEGADA":
      conteudo = (
        <Cartao
          classe="border-rose-500/30 bg-rose-500/5"
          Icone={Ban}
          classeIcone="text-rose-400"
          titulo="Nota denegada"
        >
          <MensagemSefaz nota={nota} classe="text-rose-200" />
          <p className="text-slate-400">
            A denegação é definitiva: esta nota não pode mais ser usada.
            Verifique a situação cadastral do emitente ou do destinatário antes
            de emitir uma nova nota.
          </p>
        </Cartao>
      );
      break;
    case "CANCELADA":
      conteudo = (
        <Cartao
          classe="border-rose-900/60 bg-rose-950/20"
          Icone={Ban}
          classeIcone="text-rose-300"
          titulo="Nota cancelada"
          acoes={<BotoesArquivos nota={nota} onErro={setErro} />}
        >
          <DadosAutorizacao nota={nota} />
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            <Dado rotulo="Cancelada em">
              {formatarDataHoraFiscal(cancelamento.canceladaEm)}
              {cancelamento.canceladaPor
                ? ` por ${cancelamento.canceladaPor.nome}`
                : ""}
            </Dado>
            {cancelamento.protocolo && (
              <Dado rotulo="Protocolo do cancelamento" mono>
                {cancelamento.protocolo}
              </Dado>
            )}
            {cancelamento.justificativa && (
              <Dado rotulo="Justificativa" classe="sm:col-span-2">
                {cancelamento.justificativa}
              </Dado>
            )}
          </dl>
        </Cartao>
      );
      break;
  }

  return (
    <div className="space-y-2">
      {conteudo}
      {erro && (
        <div
          className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}
      {cancelando && nota.status === "AUTORIZADA" && (
        <CancelarNotaModal
          nota={nota}
          onClose={() => setCancelando(false)}
          onCancelada={() => {
            setCancelando(false);
            onAviso("Nota cancelada na SEFAZ.");
          }}
          onRecarregar={onRecarregar}
        />
      )}
    </div>
  );
}

/** Hora atual atualizada a cada segundo enquanto `ativo`. */
function useRelogio(ativo: boolean) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return;
    const intervalo = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(intervalo);
  }, [ativo]);
  return agora;
}

function DadosAutorizacao({ nota }: { nota: NotaFiscal }) {
  const { emissao } = nota;
  const [copiada, setCopiada] = useState(false);

  async function copiarChave() {
    if (!emissao.chave) return;
    try {
      await navigator.clipboard.writeText(emissao.chave);
      setCopiada(true);
      window.setTimeout(() => setCopiada(false), 2000);
    } catch {
      setCopiada(false);
    }
  }

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
      {emissao.numero !== null && (
        <Dado rotulo="Número / série">
          {formatarNumeroNota(emissao.numero)} / {emissao.serie ?? "—"}
        </Dado>
      )}
      {emissao.autorizadaEm && (
        <Dado rotulo="Autorizada em">
          {formatarDataHoraFiscal(emissao.autorizadaEm)}
        </Dado>
      )}
      {emissao.protocolo && (
        <Dado rotulo="Protocolo" mono>
          {emissao.protocolo}
        </Dado>
      )}
      {emissao.emitidaPor && (
        <Dado rotulo="Emitida por">{emissao.emitidaPor.nome}</Dado>
      )}
      {emissao.chave && (
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Chave de acesso</dt>
          <dd className="mt-0.5 flex flex-wrap items-center gap-2">
            <span className="break-all font-mono text-slate-200">
              {formatarChaveAcesso(emissao.chave)}
            </span>
            <button
              type="button"
              onClick={() => void copiarChave()}
              className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
            >
              <Copy className="h-3.5 w-3.5" />
              {copiada ? "Copiada" : "Copiar"}
            </button>
          </dd>
        </div>
      )}
    </dl>
  );
}

function MensagemSefaz({ nota, classe }: { nota: NotaFiscal; classe: string }) {
  const { mensagemSefaz, statusSefaz, errosValidacao } = nota.emissao;
  return (
    <>
      {mensagemSefaz && (
        <p className={`font-semibold ${classe}`}>
          {statusSefaz ? `${statusSefaz} · ` : ""}
          {mensagemSefaz}
        </p>
      )}
      {errosValidacao && errosValidacao.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5">
          {errosValidacao.map((erro, indice) => (
            <li key={`${erro.codigo ?? ""}-${indice}`}>
              {erro.campo && (
                <span className="font-mono text-slate-400">{erro.campo}: </span>
              )}
              {erro.mensagem}
              {erro.codigo && (
                <span className="text-slate-500"> (código {erro.codigo})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

type ArquivoPrincipal = Extract<
  ArquivoNotaFiscal,
  "danfe" | "xml" | "xml-cancelamento"
>;

const ARQUIVOS: Record<
  ArquivoPrincipal,
  { rotulo: string; sufixo: string; pdf: boolean }
> = {
  danfe: { rotulo: "DANFE", sufixo: ".pdf", pdf: true },
  xml: { rotulo: "XML", sufixo: "-nfe.xml", pdf: false },
  "xml-cancelamento": {
    rotulo: "XML do cancelamento",
    sufixo: "-can.xml",
    pdf: false,
  },
};

function BotoesArquivos({
  nota,
  onErro,
}: {
  nota: NotaFiscal;
  onErro: (mensagem: string) => void;
}) {
  const [baixando, setBaixando] = useState<ArquivoPrincipal | null>(null);
  const arquivos: ArquivoPrincipal[] =
    nota.status === "CANCELADA"
      ? ["danfe", "xml", "xml-cancelamento"]
      : ["danfe", "xml"];

  async function baixar(arquivo: ArquivoPrincipal) {
    const { pdf, rotulo, sufixo } = ARQUIVOS[arquivo];
    onErro("");
    setBaixando(arquivo);
    const erro = await abrirArquivoNota(nota.id, arquivo, {
      rotulo,
      pdf,
      nome: `${nota.emissao.chave ?? `nota-${nota.id}`}${sufixo}`,
    });
    setBaixando(null);
    if (erro) onErro(erro);
  }

  return arquivos.map((arquivo) => (
    <button
      key={arquivo}
      type="button"
      disabled={baixando !== null}
      onClick={() => void baixar(arquivo)}
      className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
    >
      {baixando === arquivo ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : ARQUIVOS[arquivo].pdf ? (
        <FileText className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {ARQUIVOS[arquivo].rotulo}
    </button>
  ));
}

function Cartao({
  classe,
  Icone,
  classeIcone,
  titulo,
  acoes,
  children,
}: {
  classe: string;
  Icone: typeof CheckCircle2;
  classeIcone: string;
  titulo: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      className={`space-y-3 rounded-2xl border p-5 text-xs text-slate-300 ${classe}`}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-100">
          <Icone className={`h-5 w-5 ${classeIcone}`} />
          {titulo}
        </h2>
        {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
      </div>
      {children}
    </section>
  );
}

function Dado({
  rotulo,
  mono,
  classe = "",
  children,
}: {
  rotulo: string;
  mono?: boolean;
  classe?: string;
  children: ReactNode;
}) {
  return (
    <div className={classe}>
      <dt className="inline text-slate-500">{rotulo}: </dt>
      <dd className={`inline text-slate-200 ${mono ? "font-mono" : ""}`}>
        {children}
      </dd>
    </div>
  );
}
