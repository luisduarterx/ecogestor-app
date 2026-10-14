import {
  AlertCircle,
  Download,
  FilePen,
  FileText,
  Loader2,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { formatarDataHoraFiscal, mensagemErroFiscal } from "../../utils/fiscal";
import { useCartasCorrecao } from "../../utils/queries";
import type {
  ArquivoNotaFiscal,
  CartaCorrecao,
  NotaFiscal,
} from "../../utils/types";
import CartaCorrecaoModal from "../modals/CartaCorrecaoModal";
import { abrirArquivoNota } from "./arquivosNota";

/** Limite de cartas de correção por nota definido pela SEFAZ. */
const LIMITE_CARTAS = 20;

interface CartasCorrecaoProps {
  nota: NotaFiscal;
  onAviso: (mensagem: string) => void;
}

/** Cartas de correção da nota: lista, arquivos e registro de nova carta. */
export default function CartasCorrecao({ nota, onAviso }: CartasCorrecaoProps) {
  const podeRegistrar = nota.status === "AUTORIZADA";
  const visivel = podeRegistrar || nota.quantidadeCartasCorrecao > 0;
  const cartasQuery = useCartasCorrecao(
    nota.id,
    visivel && nota.quantidadeCartasCorrecao > 0,
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [baixando, setBaixando] = useState("");
  const [erro, setErro] = useState("");

  if (!visivel) return null;

  const cartas =
    nota.quantidadeCartasCorrecao > 0 ? (cartasQuery.data ?? []) : [];
  const ultima = cartas.reduce<CartaCorrecao | null>(
    (maior, carta) =>
      !maior || carta.sequencia > maior.sequencia ? carta : maior,
    null,
  );
  const limiteAtingido = nota.quantidadeCartasCorrecao >= LIMITE_CARTAS;

  async function baixar(carta: CartaCorrecao, formato: "pdf" | "xml") {
    const chave = `${carta.id}-${formato}`;
    const arquivo: ArquivoNotaFiscal = `cartas-correcao/${carta.id}/${formato}`;
    setErro("");
    setBaixando(chave);
    const falha = await abrirArquivoNota(nota.id, arquivo, {
      rotulo: `${formato === "pdf" ? "PDF" : "XML"} da carta nº ${carta.sequencia}`,
      pdf: formato === "pdf",
      nome: `${nota.emissao.chave ?? `nota-${nota.id}`}-cce-${carta.sequencia}.${formato}`,
    });
    setBaixando("");
    if (falha) setErro(falha);
  }

  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          <FilePen className="h-4 w-4 text-violet-400" />
          Cartas de correção
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            {nota.quantidadeCartasCorrecao} de {LIMITE_CARTAS}
          </span>
        </h2>
        {podeRegistrar && (
          <button
            type="button"
            disabled={limiteAtingido || cartasQuery.isFetching}
            title={
              limiteAtingido
                ? "Limite de 20 cartas de correção atingido"
                : undefined
            }
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 rounded-xl border border-violet-500/30 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/10 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nova carta de correção
          </button>
        )}
      </div>

      {nota.quantidadeCartasCorrecao === 0 ? (
        <p className="text-slate-500">
          Nenhuma carta registrada. Use a carta de correção para ajustar dados
          que não alteram valores, impostos, remetente, destinatário ou datas.
        </p>
      ) : cartasQuery.isPending ? (
        <p className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Carregando cartas de correção...
        </p>
      ) : cartasQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-rose-300">
          {mensagemErroFiscal(
            cartasQuery.error,
            "Não foi possível carregar as cartas de correção.",
          )}
          <button
            type="button"
            onClick={() => void cartasQuery.refetch()}
            className="rounded-lg bg-rose-400 px-3 py-1.5 font-bold uppercase text-slate-950"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[640px] text-left">
            <thead className="bg-slate-950/40 text-[10px] uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Nº</th>
                <th className="px-3 py-2">Texto</th>
                <th className="px-3 py-2">Usuário</th>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {[...cartas]
                .sort((a, b) => b.sequencia - a.sequencia)
                .map((carta) => (
                  <tr key={carta.id} className="align-top text-slate-300">
                    <td className="px-3 py-2 font-mono font-bold text-slate-100">
                      {carta.sequencia}
                      {carta.id === ultima?.id && (
                        <span className="ml-2 rounded-full bg-violet-500/10 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-violet-300">
                          vigente
                        </span>
                      )}
                    </td>
                    <td className="max-w-md whitespace-pre-wrap px-3 py-2">
                      {carta.correcao}
                    </td>
                    <td className="px-3 py-2">{carta.criadoPor.nome}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatarDataHoraFiscal(carta.criadoEm)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1.5">
                        {(["pdf", "xml"] as const).map((formato) => (
                          <button
                            key={formato}
                            type="button"
                            disabled={baixando !== ""}
                            onClick={() => void baixar(carta, formato)}
                            className="flex items-center gap-1 rounded-lg border border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                          >
                            {baixando === `${carta.id}-${formato}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : formato === "pdf" ? (
                              <FileText className="h-3.5 w-3.5" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            {formato.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {erro && (
        <div
          className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-rose-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {erro}
        </div>
      )}

      {modalAberto && (
        <CartaCorrecaoModal
          notaID={nota.id}
          ultimaCorrecao={ultima?.correcao ?? null}
          onClose={() => setModalAberto(false)}
          onRegistrada={(carta) => {
            setModalAberto(false);
            onAviso(`Carta de correção nº ${carta.sequencia} registrada.`);
          }}
        />
      )}
    </section>
  );
}
