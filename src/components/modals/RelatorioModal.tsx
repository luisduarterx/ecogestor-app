import { motion } from "motion/react";
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useLoggedUser } from "../../context/useLoggedUser";
import { useConfiguracoesSistema } from "../../utils/queries";
import { gerarCsvRelatorio } from "../../utils/relatorios/csv";
import {
  descreverFiltros,
  type DefinicaoRelatorio,
  type ValoresFiltro,
} from "../../utils/relatorios/definicoes";
import {
  formatarDataISO,
  formatarQuantidade,
} from "../../utils/relatorios/formatacao";
import { gerarPdfRelatorio } from "../../utils/relatorios/pdf";
import {
  LIMITE_LINHAS,
  type FormatoRelatorio,
} from "../../utils/relatorios/tipos";
import type { ApiError } from "../../utils/types";
import { MODELO_CUPOM_VAZIO, resolverModeloCupom } from "./orderReceiptModel";

interface RelatorioModalProps {
  definicoes: DefinicaoRelatorio[];
  relatorioInicial: string;
  formatoInicial: FormatoRelatorio;
  onClose: () => void;
  onConcluido: (mensagem: string) => void;
}

type Contagem =
  | { estado: "contando" }
  | { estado: "pronto"; total: number }
  | { estado: "erro"; mensagem: string };

const ATRASO_CONTAGEM_MS = 400;

const CLASSE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60";

function dataLocalISO(data: Date) {
  return new Intl.DateTimeFormat("en-CA").format(data);
}

function periodoPadrao() {
  const hoje = new Date();
  return {
    dataInicial: dataLocalISO(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
    dataFinal: dataLocalISO(hoje),
  };
}

function dataValida(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(ano, mes - 1, dia);
  // Rejeita datas inexistentes, como 31/02, que o Date "corrige" sozinho.
  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  );
}

function validarPeriodo(filtros: ValoresFiltro): string | null {
  if (!filtros.dataInicial || !filtros.dataFinal) {
    return "Informe a data inicial e a data final do período.";
  }
  if (!dataValida(filtros.dataInicial) || !dataValida(filtros.dataFinal)) {
    return "Informe datas válidas para o período.";
  }
  if (filtros.dataInicial > filtros.dataFinal) {
    return "A data inicial não pode ser posterior à data final.";
  }
  return null;
}

const mensagemErro = (erro: unknown, padrao: string) =>
  (erro as ApiError | undefined)?.mensagem ?? padrao;

export default function RelatorioModal({
  definicoes,
  relatorioInicial,
  formatoInicial,
  onClose,
  onConcluido,
}: RelatorioModalProps) {
  const { user } = useLoggedUser();
  const configuracaoQuery = useConfiguracoesSistema();
  const [relatorioID, setRelatorioID] = useState(relatorioInicial);
  const [formato, setFormato] = useState(formatoInicial);
  const [filtros, setFiltros] = useState<ValoresFiltro>(periodoPadrao);
  const [contagem, setContagem] = useState<Contagem>({ estado: "contando" });
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState<{
    carregados: number;
    total: number;
  } | null>(null);
  const [erroGeracao, setErroGeracao] = useState("");

  const definicao =
    definicoes.find((item) => item.id === relatorioID) ?? definicoes[0];
  const erroPeriodo = definicao.usaPeriodo ? validarPeriodo(filtros) : null;
  const limite = LIMITE_LINHAS[formato];
  // Sem permissão ou sem acesso às configurações, sai sem dados da empresa.
  const empresa = configuracaoQuery.isError
    ? MODELO_CUPOM_VAZIO
    : resolverModeloCupom(configuracaoQuery.data, null);
  const totalEncontrado = contagem.estado === "pronto" ? contagem.total : null;
  const acimaDoLimite = totalEncontrado !== null && totalEncontrado > limite;
  const podeGerar =
    !gerando &&
    !erroPeriodo &&
    empresa !== null &&
    totalEncontrado !== null &&
    totalEncontrado > 0 &&
    !acimaDoLimite;

  useEffect(() => {
    if (erroPeriodo) return;
    let cancelado = false;
    const temporizador = window.setTimeout(() => {
      definicao
        .contar(filtros)
        .then((total) => {
          if (!cancelado) setContagem({ estado: "pronto", total });
        })
        .catch((erro: unknown) => {
          if (!cancelado) {
            setContagem({
              estado: "erro",
              mensagem: mensagemErro(
                erro,
                "Não foi possível contar os registros. Tente novamente.",
              ),
            });
          }
        });
    }, ATRASO_CONTAGEM_MS);
    return () => {
      cancelado = true;
      window.clearTimeout(temporizador);
    };
  }, [definicao, filtros, erroPeriodo]);

  function alterarFiltro(campo: string, valor: string) {
    setErroGeracao("");
    setContagem({ estado: "contando" });
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function alterarRelatorio(id: string) {
    setErroGeracao("");
    setContagem({ estado: "contando" });
    setRelatorioID(id);
    // Mantém o período e limpa os filtros específicos do relatório anterior.
    setFiltros((atuais) => ({
      dataInicial: atuais.dataInicial,
      dataFinal: atuais.dataFinal,
    }));
  }

  async function gerar(evento: FormEvent) {
    evento.preventDefault();
    if (!podeGerar || !empresa) return;
    setGerando(true);
    setErroGeracao("");
    setProgresso(null);
    try {
      const { total, conteudo } = await definicao.carregar(
        filtros,
        limite,
        (carregados, totalRegistros) =>
          setProgresso({ carregados, total: totalRegistros }),
      );
      if (!conteudo) {
        setContagem({ estado: "pronto", total });
        return;
      }
      if (conteudo.linhas.length === 0) {
        setContagem({ estado: "pronto", total: 0 });
        return;
      }
      const relatorio = {
        titulo: definicao.titulo,
        filtros: descreverFiltros(definicao, filtros),
        ...conteudo,
      };
      const emitidoEm = new Date();
      if (formato === "pdf") {
        await gerarPdfRelatorio(relatorio, {
          empresa,
          usuario: user?.nome ?? "Usuário",
          emitidoEm,
        });
      } else {
        gerarCsvRelatorio(relatorio, emitidoEm);
      }
      onConcluido(
        `${formato.toUpperCase()} "${definicao.titulo}" gerado com ${formatarQuantidade(conteudo.linhas.length)} registros.`,
      );
    } catch (erro) {
      setErroGeracao(
        mensagemErro(
          erro,
          "Não foi possível gerar o relatório. Tente novamente.",
        ),
      );
    } finally {
      setGerando(false);
      setProgresso(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="relatorio-modal-titulo"
      onMouseDown={(evento) =>
        evento.target === evento.currentTarget && !gerando && onClose()
      }
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-400" />
            <h3
              id="relatorio-modal-titulo"
              className="font-bold text-slate-100"
            >
              Gerar relatório
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={gerando}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(evento) => void gerar(evento)}
          className="space-y-4 overflow-y-auto p-6"
        >
          {definicoes.length > 1 && (
            <label className="block text-[10px] font-bold uppercase text-slate-400">
              Relatório
              <select
                value={definicao.id}
                onChange={(evento) => alterarRelatorio(evento.target.value)}
                disabled={gerando}
                className={`${CLASSE_CAMPO} cursor-pointer`}
              >
                {definicoes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.titulo}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="text-xs text-slate-400">{definicao.descricao}</p>

          <div>
            <span className="block text-[10px] font-bold uppercase text-slate-400">
              Formato
            </span>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {(
                [
                  ["pdf", "PDF", FileText],
                  ["csv", "Planilha CSV", FileSpreadsheet],
                ] as const
              ).map(([valor, rotulo, Icone]) => (
                <button
                  key={valor}
                  type="button"
                  onClick={() => setFormato(valor)}
                  disabled={gerando}
                  aria-pressed={formato === valor}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                    formato === valor
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icone className="h-4 w-4" />
                  {rotulo}
                  <span className="font-mono text-[10px] font-normal text-slate-500">
                    até {formatarQuantidade(LIMITE_LINHAS[valor])}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {definicao.usaPeriodo && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Data inicial
                <input
                  type="date"
                  required
                  value={filtros.dataInicial ?? ""}
                  max={filtros.dataFinal || undefined}
                  onChange={(evento) =>
                    alterarFiltro("dataInicial", evento.target.value)
                  }
                  disabled={gerando}
                  className={CLASSE_CAMPO}
                />
              </label>
              <label className="block text-[10px] font-bold uppercase text-slate-400">
                Data final
                <input
                  type="date"
                  required
                  value={filtros.dataFinal ?? ""}
                  min={filtros.dataInicial || undefined}
                  onChange={(evento) =>
                    alterarFiltro("dataFinal", evento.target.value)
                  }
                  disabled={gerando}
                  className={CLASSE_CAMPO}
                />
              </label>
            </div>
          )}

          {definicao.selecoes.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {definicao.selecoes.map((selecao) => (
                <label
                  key={selecao.id}
                  className="block text-[10px] font-bold uppercase text-slate-400"
                >
                  {selecao.rotulo}
                  <select
                    value={filtros[selecao.id] ?? ""}
                    onChange={(evento) =>
                      alterarFiltro(selecao.id, evento.target.value)
                    }
                    disabled={gerando}
                    className={`${CLASSE_CAMPO} cursor-pointer`}
                  >
                    <option value="">{selecao.rotuloTodos}</option>
                    {selecao.opcoes.map((opcao) => (
                      <option key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          <SituacaoContagem
            erroPeriodo={erroPeriodo}
            contagem={contagem}
            limite={limite}
            formato={formato}
            gerando={gerando}
            progresso={progresso}
          />

          {erroGeracao && (
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {erroGeracao}
            </div>
          )}

          {definicao.usaPeriodo && !erroPeriodo && (
            <p className="text-[11px] text-slate-500">
              Período: {formatarDataISO(filtros.dataInicial)} a{" "}
              {formatarDataISO(filtros.dataFinal)}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={gerando}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!podeGerar}
              className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
            >
              {gerando && <Loader2 className="h-4 w-4 animate-spin" />}
              {gerando
                ? "Gerando..."
                : `Gerar ${formato === "pdf" ? "PDF" : "CSV"}`}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function SituacaoContagem({
  erroPeriodo,
  contagem,
  limite,
  formato,
  gerando,
  progresso,
}: {
  erroPeriodo: string | null;
  contagem: Contagem;
  limite: number;
  formato: FormatoRelatorio;
  gerando: boolean;
  progresso: { carregados: number; total: number } | null;
}) {
  const base =
    "flex items-start gap-2 rounded-xl border p-3 text-xs leading-relaxed";

  if (erroPeriodo) {
    return (
      <div
        className={`${base} border-amber-500/20 bg-amber-500/10 text-amber-300`}
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {erroPeriodo}
      </div>
    );
  }
  if (gerando) {
    return (
      <div
        className={`${base} border-slate-800 bg-slate-950/40 text-slate-300`}
      >
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-emerald-400" />
        {progresso
          ? `Carregando ${formatarQuantidade(progresso.carregados)} de ${formatarQuantidade(progresso.total)} registros...`
          : "Preparando o relatório..."}
      </div>
    );
  }
  if (contagem.estado === "contando") {
    return (
      <div
        className={`${base} border-slate-800 bg-slate-950/40 text-slate-400`}
      >
        <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
        Contando registros...
      </div>
    );
  }
  if (contagem.estado === "erro") {
    return (
      <div
        className={`${base} border-rose-500/20 bg-rose-500/10 text-rose-300`}
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        {contagem.mensagem}
      </div>
    );
  }
  if (contagem.total === 0) {
    return (
      <div
        className={`${base} border-slate-800 bg-slate-950/40 text-slate-400`}
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        Nenhum registro encontrado com esses filtros.
      </div>
    );
  }
  if (contagem.total > limite) {
    return (
      <div
        className={`${base} border-amber-500/20 bg-amber-500/10 text-amber-300`}
      >
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {formatarQuantidade(contagem.total)} registros encontrados. O limite
          para {formato === "pdf" ? "PDF" : "CSV"} é de{" "}
          {formatarQuantidade(limite)} registros. Reduza o período ou use
          filtros mais específicos
          {formato === "pdf" ? ", ou exporte em CSV" : ""}.
        </span>
      </div>
    );
  }
  return (
    <div
      className={`${base} border-emerald-500/20 bg-emerald-500/10 text-emerald-300`}
    >
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      {formatarQuantidade(contagem.total)}{" "}
      {contagem.total === 1 ? "registro encontrado" : "registros encontrados"}.
    </div>
  );
}
