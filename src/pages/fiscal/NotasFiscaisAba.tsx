import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import BuscaRegistro from "../../components/fiscal/BuscaRegistro";
import SeloStatusNota from "../../components/fiscal/SeloStatusNota";
import ImportarPedidoModal from "../../components/modals/ImportarPedidoModal";
import {
  ROTULOS_STATUS_NOTA,
  STATUS_NOTA,
  formatarCpfCnpj,
  formatarDataHoraFiscal,
  formatarMoedaFiscal,
  mensagemErroFiscal,
} from "../../utils/fiscal";
import {
  useContagemNotasFiscais,
  useCriarNotaFiscal,
  useNotasFiscais,
} from "../../utils/queries";
import type { FiltrosNotasFiscais, StatusNotaFiscal } from "../../utils/types";

const LIMITE_POR_PAGINA = 20;

const CLASSE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none";

const dataLocal = (data: Date) => new Intl.DateTimeFormat("en-CA").format(data);

function inicioDoMes() {
  const hoje = new Date();
  return dataLocal(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
}

export function NotasFiscaisAba() {
  const navigate = useNavigate();
  const criarNota = useCriarNotaFiscal();
  const [status, setStatus] = useState<StatusNotaFiscal | "">("");
  const [registro, setRegistro] = useState<{ id: number; nome: string } | null>(
    null,
  );
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [pagina, setPagina] = useState(1);
  const [importando, setImportando] = useState(false);
  const [erroAcao, setErroAcao] = useState("");

  const periodoInvertido = Boolean(
    dataInicial && dataFinal && dataInicial > dataFinal,
  );
  const filtros: FiltrosNotasFiscais = {
    status: status || undefined,
    registroID: registro?.id,
    dataInicial: !periodoInvertido ? dataInicial || undefined : undefined,
    dataFinal: !periodoInvertido ? dataFinal || undefined : undefined,
    pagina,
    limite: LIMITE_POR_PAGINA,
  };
  const notasQuery = useNotasFiscais(filtros);
  const notas = notasQuery.data?.dados ?? [];
  const paginacao = notasQuery.data?.paginacao;
  const possuiFiltros = Boolean(status || registro || dataInicial || dataFinal);

  function alterarFiltro(acao: () => void) {
    acao();
    setPagina(1);
  }

  async function novaNota() {
    setErroAcao("");
    try {
      const nota = await criarNota.mutateAsync({});
      navigate(`/fiscal/notas/${nota.id}`);
    } catch (erro) {
      setErroAcao(mensagemErroFiscal(erro, "Não foi possível criar a nota."));
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Contador
          rotulo="Autorizadas no mês"
          dica="Notas criadas neste mês e já autorizadas pela SEFAZ."
          filtros={{ status: "AUTORIZADA", dataInicial: inicioDoMes() }}
          Icone={ShieldCheck}
          cor="text-emerald-400"
        />
        <Contador
          rotulo="Rascunhos"
          filtros={{ status: "RASCUNHO" }}
          Icone={FileText}
          cor="text-slate-300"
        />
        <Contador
          rotulo="Rejeitadas"
          dica="Precisam de correção para serem emitidas novamente."
          filtros={{ status: "REJEITADA" }}
          Icone={AlertCircle}
          cor="text-orange-400"
        />
        <Contador
          rotulo="Processando"
          filtros={{ status: "PROCESSANDO" }}
          Icone={Clock}
          cor="text-sky-400"
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Notas fiscais
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">
              A nota é independente: não movimenta estoque nem financeiro.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setImportando(true)}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase text-slate-200 hover:bg-slate-700"
            >
              <ClipboardList className="h-4 w-4" />
              Importar pedido
            </button>
            <button
              type="button"
              onClick={() => void novaNota()}
              disabled={criarNota.isPending}
              className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              {criarNota.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Nova nota
            </button>
          </div>
        </div>

        {erroAcao && (
          <div
            className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {erroAcao}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[10rem_1fr_9rem_9rem_auto] md:items-end">
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Status
            <select
              value={status}
              onChange={(evento) =>
                alterarFiltro(() =>
                  setStatus(evento.target.value as StatusNotaFiscal | ""),
                )
              }
              className={`${CLASSE_CAMPO} cursor-pointer`}
            >
              <option value="">Todos</option>
              {STATUS_NOTA.map((valor) => (
                <option key={valor} value={valor}>
                  {ROTULOS_STATUS_NOTA[valor]}
                </option>
              ))}
            </select>
          </label>
          <BuscaRegistro
            rotulo="Cliente / fornecedor"
            selecionado={registro?.nome}
            onSelecionar={(escolhido) =>
              alterarFiltro(() =>
                setRegistro({
                  id: escolhido.id,
                  nome: escolhido.apelido || escolhido.nome,
                }),
              )
            }
            onLimpar={() => alterarFiltro(() => setRegistro(null))}
            classeCampo={CLASSE_CAMPO}
          />
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Criada de
            <input
              type="date"
              value={dataInicial}
              onChange={(evento) =>
                alterarFiltro(() => setDataInicial(evento.target.value))
              }
              className={CLASSE_CAMPO}
            />
          </label>
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Até
            <input
              type="date"
              value={dataFinal}
              onChange={(evento) =>
                alterarFiltro(() => setDataFinal(evento.target.value))
              }
              className={CLASSE_CAMPO}
            />
          </label>
          <button
            type="button"
            disabled={!possuiFiltros}
            onClick={() =>
              alterarFiltro(() => {
                setStatus("");
                setRegistro(null);
                setDataInicial("");
                setDataFinal("");
              })
            }
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Limpar
          </button>
        </div>
        {periodoInvertido && (
          <p className="text-[11px] text-amber-300">
            A data inicial não pode ser posterior à data final.
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-slate-800">
          {notasQuery.isPending ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
              Carregando notas fiscais...
            </div>
          ) : notasQuery.isError ? (
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-rose-300">
              <span>
                {mensagemErroFiscal(
                  notasQuery.error,
                  "Não foi possível carregar as notas fiscais.",
                )}
              </span>
              <button
                type="button"
                onClick={() => void notasQuery.refetch()}
                className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950"
              >
                Tentar novamente
              </button>
            </div>
          ) : notas.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              {possuiFiltros
                ? "Nenhuma nota fiscal encontrada para os filtros selecionados."
                : "Nenhuma nota fiscal criada. Crie uma nova nota ou importe um pedido de venda."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Nº / Série</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Destinatário</th>
                    <th className="px-4 py-3">Natureza</th>
                    <th className="px-4 py-3 text-right">Itens</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Criada / Autorizada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {notas.map((nota) => (
                    <tr
                      key={nota.id}
                      tabIndex={0}
                      onClick={() => navigate(`/fiscal/notas/${nota.id}`)}
                      onKeyDown={(evento) =>
                        evento.key === "Enter" &&
                        navigate(`/fiscal/notas/${nota.id}`)
                      }
                      className="cursor-pointer hover:bg-slate-800/40 focus:bg-slate-800/40 focus:outline-none"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="font-mono font-semibold text-slate-100">
                          {nota.numero
                            ? String(nota.numero).padStart(6, "0")
                            : "—"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {nota.serie
                            ? `Série ${nota.serie}`
                            : `Rascunho #${nota.id}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SeloStatusNota status={nota.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[220px] truncate font-medium text-slate-200">
                          {nota.destinatarioNome ?? "Não informado"}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          {nota.destinatarioDocumento
                            ? formatarCpfCnpj(nota.destinatarioDocumento)
                            : "—"}
                        </div>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-slate-400">
                        {nota.naturezaOperacaoDescricao ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {nota.quantidadeItens}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-slate-100">
                        {formatarMoedaFiscal(nota.valorTotal)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[11px]">
                        <div>{formatarDataHoraFiscal(nota.criadoEm)}</div>
                        <div className="text-slate-500">
                          {nota.autorizadaEm
                            ? formatarDataHoraFiscal(nota.autorizadaEm)
                            : "—"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {paginacao && paginacao.totalPaginas > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              {paginacao.total} notas · página {paginacao.pagina} de{" "}
              {paginacao.totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pagina <= 1 || notasQuery.isFetching}
                onClick={() => setPagina((atual) => atual - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 hover:text-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              <button
                type="button"
                disabled={
                  pagina >= paginacao.totalPaginas || notasQuery.isFetching
                }
                onClick={() => setPagina((atual) => atual + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 hover:text-slate-200 disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {importando && (
        <ImportarPedidoModal
          onClose={() => setImportando(false)}
          onImportada={(nota) => navigate(`/fiscal/notas/${nota.id}`)}
        />
      )}
    </div>
  );
}

function Contador({
  rotulo,
  dica,
  filtros,
  Icone,
  cor,
}: {
  rotulo: string;
  dica?: string;
  filtros: Omit<FiltrosNotasFiscais, "pagina" | "limite">;
  Icone: LucideIcon;
  cor: string;
}) {
  const contagemQuery = useContagemNotasFiscais(filtros);
  return (
    <div
      className="rounded-xl border border-slate-800 bg-slate-900 p-4"
      title={dica}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{rotulo}</span>
        <Icone className={`h-4 w-4 ${cor}`} />
      </div>
      <div className="mt-2 font-mono text-2xl font-bold text-slate-100">
        {contagemQuery.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        ) : contagemQuery.isError ? (
          "—"
        ) : (
          contagemQuery.data
        )}
      </div>
    </div>
  );
}
