import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  FileText,
  Layers,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  Trash2,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useBlocker, useNavigate } from "react-router";
import BuscaRegistro from "../../components/fiscal/BuscaRegistro";
import SeloStatusNota from "../../components/fiscal/SeloStatusNota";
import {
  INDICADORES_IE,
  MODALIDADES_FRETE,
  ROTULOS_INDICADOR_IE,
  ROTULOS_MODALIDADE_FRETE,
  UFS,
  formatarCpfCnpj,
  formatarDataHoraFiscal,
  formatarMoedaFiscal,
  mensagemErroFiscal,
  notaEditavel,
} from "../../utils/fiscal";
import {
  useAtualizarNotaFiscal,
  useConfiguracaoFiscal,
  useExcluirNotaFiscal,
  useMaterials,
  useNaturezasOperacao,
  useSalvarItensNotaFiscal,
} from "../../utils/queries";
import type {
  ApiError,
  AtualizarNotaFiscalInput,
  IndicadorIE,
  ModalidadeFrete,
  NotaFiscal,
} from "../../utils/types";
import ItensNotaFiscal from "./ItensNotaFiscal";
import {
  LIMITE_INFORMACOES,
  LIMITE_TEXTO,
  alteracoesCabecalho,
  cabecalhoDaNota,
  consumidorFinalTravado,
  itensAlterados,
  itensParaEnvio,
  linhasDaNota,
  possuiErros,
  validarFormulario,
  type ErrosFormulario,
  type FormularioCabecalho,
  type LinhaItem,
} from "./formularioNota";

const CLASSE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60";

type Confirmacao =
  { tipo: "natureza"; naturezaID: number | null } | { tipo: "excluir" } | null;

interface EditorNotaFiscalProps {
  nota: NotaFiscal;
  onAviso: (mensagem: string) => void;
  onRecarregar: () => void;
}

export default function EditorNotaFiscal({
  nota,
  onAviso,
  onRecarregar,
}: EditorNotaFiscalProps) {
  const navigate = useNavigate();
  const naturezasQuery = useNaturezasOperacao(true);
  const configuracaoQuery = useConfiguracaoFiscal();
  const materiaisQuery = useMaterials();
  const atualizar = useAtualizarNotaFiscal(nota.id);
  const salvarItens = useSalvarItensNotaFiscal(nota.id);
  const excluir = useExcluirNotaFiscal();

  const [formulario, setFormulario] = useState<FormularioCabecalho>(() =>
    cabecalhoDaNota(nota),
  );
  const [linhas, setLinhas] = useState<LinhaItem[]>(() => linhasDaNota(nota));
  const [erros, setErros] = useState<ErrosFormulario | null>(null);
  const [erroEnvio, setErroEnvio] = useState("");
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);
  const [salvando, setSalvando] = useState(false);

  const editavel = notaEditavel(nota.status);
  const materiaisAtivos = useMemo(
    () => (materiaisQuery.data ?? []).filter((material) => material.status),
    [materiaisQuery.data],
  );
  const alteracoes = alteracoesCabecalho(formulario, nota);
  const itensSujos = itensAlterados(linhas, nota);
  const sujo = Object.keys(alteracoes).length > 0 || itensSujos;
  const ocupado = salvando || excluir.isPending;
  const { destinatario, transportadora, veiculo } = formulario;
  const travado = consumidorFinalTravado(destinatario.indicadorIE);
  const transporteEmSemFrete =
    formulario.modalidadeFrete === "SEM_FRETE" &&
    [...Object.values(transportadora), ...Object.values(veiculo)].some(
      (valor) => valor.trim(),
    );

  // Aviso ao recarregar ou fechar a aba com alterações não salvas.
  useEffect(() => {
    if (!sujo) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [sujo]);

  // Liberada ao excluir o rascunho, quando as alterações deixam de importar.
  const saidaLiberada = useRef(false);
  const bloqueio = useBlocker(
    ({ currentLocation, nextLocation }) =>
      sujo &&
      !saidaLiberada.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  function reiniciar(notaSalva: NotaFiscal) {
    setFormulario(cabecalhoDaNota(notaSalva));
    setLinhas(linhasDaNota(notaSalva));
    setErros(null);
  }

  function alterarBloco<
    B extends "destinatario" | "transportadora" | "veiculo",
  >(bloco: B, campo: keyof FormularioCabecalho[B], valor: string) {
    setFormulario((atual) => ({
      ...atual,
      [bloco]: { ...atual[bloco], [campo]: valor },
      // O não contribuinte é sempre consumidor final.
      ...(bloco === "destinatario" &&
      campo === "indicadorIE" &&
      consumidorFinalTravado(valor)
        ? { consumidorFinal: true }
        : {}),
    }));
    setErroEnvio("");
  }

  /**
   * Salva os itens alterados e o cabeçalho, junto com uma ação opcional
   * (trocar natureza, escolher Registro ou transportadora).
   */
  async function salvar(
    acao: AtualizarNotaFiscalInput = {},
    ignorar: ("destinatario" | "transportadora")[] = [],
  ) {
    const validacao = validarFormulario(formulario, linhas);
    if (possuiErros(validacao)) {
      setErros(validacao);
      setErroEnvio("Corrija os campos indicados antes de salvar.");
      return;
    }
    setErros(null);
    setErroEnvio("");
    setSalvando(true);
    try {
      let salva = nota;
      if (itensSujos) {
        salva = await salvarItens.mutateAsync(itensParaEnvio(linhas));
      }
      const cabecalho = {
        ...alteracoesCabecalho(formulario, nota, ignorar),
        ...acao,
      };
      if (Object.keys(cabecalho).length > 0) {
        salva = await atualizar.mutateAsync(cabecalho);
      }
      reiniciar(salva);
      onAviso("Nota salva.");
    } catch (caught) {
      const erro = caught as ApiError;
      if (erro.statusCode === 409) onRecarregar();
      setErroEnvio(
        mensagemErroFiscal(
          erro,
          "Não foi possível salvar a nota. Nada foi alterado nos itens.",
        ),
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    try {
      await excluir.mutateAsync(nota.id);
      setConfirmacao(null);
      saidaLiberada.current = true;
      onAviso("Rascunho excluído.");
      navigate("/fiscal", { replace: true });
    } catch (caught) {
      setConfirmacao(null);
      setErroEnvio(
        mensagemErroFiscal(caught, "Não foi possível excluir o rascunho."),
      );
    }
  }

  const campoTexto = (
    bloco: "destinatario" | "transportadora" | "veiculo",
    campo: string,
    rotulo: string,
    opcoes: { limite?: number; placeholder?: string; classe?: string } = {},
  ) => (
    <label
      className={`block text-[10px] font-bold uppercase text-slate-400 ${opcoes.classe ?? ""}`}
    >
      {rotulo}
      <input
        type="text"
        value={(formulario[bloco] as Record<string, string>)[campo]}
        maxLength={opcoes.limite}
        placeholder={opcoes.placeholder}
        onChange={(evento) =>
          alterarBloco(
            bloco,
            campo as keyof FormularioCabecalho[typeof bloco],
            evento.target.value,
          )
        }
        className={CLASSE_CAMPO}
      />
    </label>
  );

  const campoUf = (
    bloco: "destinatario" | "transportadora" | "veiculo",
    rotulo = "UF",
  ) => (
    <label className="block text-[10px] font-bold uppercase text-slate-400">
      {rotulo}
      <select
        value={(formulario[bloco] as Record<string, string>).uf.toUpperCase()}
        onChange={(evento) =>
          alterarBloco(
            bloco,
            "uf" as keyof FormularioCabecalho[typeof bloco],
            evento.target.value,
          )
        }
        className={`${CLASSE_CAMPO} cursor-pointer`}
      >
        <option value="">—</option>
        {UFS.map((uf) => (
          <option key={uf} value={uf}>
            {uf}
          </option>
        ))}
      </select>
    </label>
  );

  const titulo = nota.emissao.numero
    ? `NF-e nº ${String(nota.emissao.numero).padStart(6, "0")} · Série ${nota.emissao.serie}`
    : `Rascunho #${nota.id}`;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <Link
            to="/fiscal"
            className="flex w-fit items-center gap-1 text-xs text-slate-400 hover:text-emerald-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Notas fiscais
          </Link>
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-slate-100">
            {titulo}
            <SeloStatusNota status={nota.status} />
            {editavel && sujo && (
              <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
                Alterações não salvas
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400">
            Criada em {formatarDataHoraFiscal(nota.criadoEm)} por{" "}
            {nota.criadoPor.nome} · Total{" "}
            <strong className="font-mono text-emerald-400">
              {formatarMoedaFiscal(nota.valorTotal)}
            </strong>
          </p>
        </div>
        {editavel && (
          <div className="flex flex-wrap items-center gap-2">
            {nota.status === "RASCUNHO" && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => setConfirmacao({ tipo: "excluir" })}
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-2.5 text-xs font-bold text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Excluir rascunho
              </button>
            )}
            {sujo && (
              <button
                type="button"
                disabled={ocupado}
                onClick={() => reiniciar(nota)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Descartar
              </button>
            )}
            <button
              type="button"
              disabled={!sujo || ocupado}
              onClick={() => void salvar()}
              className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        )}
      </div>

      {!editavel && <ResumoNaoEditavel nota={nota} />}

      {(erroEnvio || (erros && erros.cabecalho.length > 0)) && (
        <div
          className="space-y-1 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300"
          role="alert"
        >
          {erroEnvio && (
            <p className="flex items-start gap-2 font-semibold">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {erroEnvio}
            </p>
          )}
          {erros?.cabecalho.map((mensagem) => (
            <p key={mensagem} className="pl-6">
              • {mensagem}
            </p>
          ))}
        </div>
      )}

      <fieldset disabled={!editavel || ocupado} className="space-y-6">
        {/* 1. Natureza */}
        <Secao Icone={FileText} titulo="1. Natureza de operação">
          <label className="block max-w-xl text-[10px] font-bold uppercase text-slate-400">
            Natureza
            <select
              value={nota.naturezaOperacaoID ?? ""}
              onChange={(evento) =>
                setConfirmacao({
                  tipo: "natureza",
                  naturezaID: evento.target.value
                    ? Number(evento.target.value)
                    : null,
                })
              }
              className={`${CLASSE_CAMPO} cursor-pointer`}
            >
              <option value="">Sem natureza</option>
              {/* A natureza atual continua visível mesmo se inativa. */}
              {nota.naturezaOperacaoID &&
                !naturezasQuery.data?.some(
                  (natureza) => natureza.id === nota.naturezaOperacaoID,
                ) && (
                  <option value={nota.naturezaOperacaoID}>
                    {nota.naturezaOperacaoDescricao}
                  </option>
                )}
              {(naturezasQuery.data ?? []).map((natureza) => (
                <option key={natureza.id} value={natureza.id}>
                  {natureza.descricao}
                  {natureza.padrao ? " (padrão)" : ""}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-slate-500">
            A natureza define o CFOP e a tributação dos itens. O CFOP muda
            conforme a UF do destinatário (5xxx no mesmo estado, 6xxx em outro).
          </p>
        </Secao>

        {/* 2. Destinatário */}
        <Secao Icone={Building2} titulo="2. Destinatário">
          <div className="max-w-xl">
            <BuscaRegistro
              rotulo="Cliente cadastrado"
              selecionado={
                nota.registroID
                  ? `${nota.destinatario.nome ?? `Registro #${nota.registroID}`} · ${formatarCpfCnpj(nota.destinatario.documento)}`
                  : null
              }
              onSelecionar={(registro) =>
                void salvar({ registroID: registro.id }, ["destinatario"])
              }
              onLimpar={() => void salvar({ registroID: null })}
              rotuloLimpar="Desvincular"
              disabled={!editavel || ocupado}
              classeCampo={CLASSE_CAMPO}
            />
            <p className="mt-1 text-[11px] text-slate-500">
              {nota.registroID
                ? "Os dados do cadastro foram copiados para a nota. Alterações aqui não mudam o cadastro do cliente."
                : "Escolha um cliente para copiar os dados, ou preencha manualmente (cliente eventual)."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="block text-[10px] font-bold uppercase text-slate-400">
              Tipo
              <select
                value={destinatario.tipo}
                onChange={(evento) =>
                  alterarBloco("destinatario", "tipo", evento.target.value)
                }
                className={`${CLASSE_CAMPO} cursor-pointer`}
              >
                <option value="">—</option>
                <option value="JURIDICA">Pessoa jurídica</option>
                <option value="FISICA">Pessoa física</option>
              </select>
            </label>
            {campoTexto("destinatario", "nome", "Nome / razão social", {
              limite: LIMITE_TEXTO,
              classe: "md:col-span-2",
            })}
            {campoTexto(
              "destinatario",
              "documento",
              destinatario.tipo === "FISICA"
                ? "CPF"
                : destinatario.tipo === "JURIDICA"
                  ? "CNPJ"
                  : "CPF / CNPJ",
              { placeholder: "Somente números" },
            )}
            <label className="block text-[10px] font-bold uppercase text-slate-400 md:col-span-2">
              Indicador de IE
              <select
                value={destinatario.indicadorIE}
                onChange={(evento) =>
                  alterarBloco(
                    "destinatario",
                    "indicadorIE",
                    evento.target.value as IndicadorIE | "",
                  )
                }
                className={`${CLASSE_CAMPO} cursor-pointer`}
              >
                <option value="">Não informado</option>
                {INDICADORES_IE.map((indicador) => (
                  <option key={indicador} value={indicador}>
                    {ROTULOS_INDICADOR_IE[indicador]}
                  </option>
                ))}
              </select>
            </label>
            {campoTexto("destinatario", "ie", "Inscrição estadual")}
            <label className="flex items-end">
              <span className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-300">
                Consumidor final
                <input
                  type="checkbox"
                  checked={formulario.consumidorFinal}
                  disabled={travado}
                  title={
                    travado
                      ? "Não contribuinte é sempre consumidor final"
                      : undefined
                  }
                  onChange={(evento) =>
                    setFormulario((atual) => ({
                      ...atual,
                      consumidorFinal: evento.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-emerald-500"
                />
              </span>
            </label>
            {campoTexto("destinatario", "email", "E-mail", {
              classe: "md:col-span-2",
            })}
            {campoTexto("destinatario", "telefone", "Telefone")}
            {campoTexto("destinatario", "cep", "CEP", {
              placeholder: "00000000",
            })}
            {campoTexto("destinatario", "logradouro", "Logradouro", {
              limite: LIMITE_TEXTO,
              classe: "md:col-span-2",
            })}
            {campoTexto("destinatario", "numero", "Número", {
              limite: LIMITE_TEXTO,
            })}
            {campoTexto("destinatario", "complemento", "Complemento", {
              limite: LIMITE_TEXTO,
            })}
            {campoTexto("destinatario", "bairro", "Bairro", {
              limite: LIMITE_TEXTO,
            })}
            {campoTexto("destinatario", "municipio", "Município", {
              limite: LIMITE_TEXTO,
              classe: "md:col-span-2",
            })}
            {campoUf("destinatario")}
          </div>
        </Secao>

        {/* 3. Transporte */}
        <Secao Icone={Truck} titulo="3. Transporte">
          <label className="block max-w-sm text-[10px] font-bold uppercase text-slate-400">
            Modalidade do frete
            <select
              value={formulario.modalidadeFrete}
              onChange={(evento) =>
                setFormulario((atual) => ({
                  ...atual,
                  modalidadeFrete: evento.target.value as ModalidadeFrete,
                }))
              }
              className={`${CLASSE_CAMPO} cursor-pointer`}
            >
              {MODALIDADES_FRETE.map((modalidade) => (
                <option key={modalidade} value={modalidade}>
                  {ROTULOS_MODALIDADE_FRETE[modalidade]}
                </option>
              ))}
            </select>
          </label>

          {transporteEmSemFrete && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
              <span className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Com "Sem frete", transportadora e veículo devem ficar vazios; a
                emissão aponta pendência se estiverem preenchidos.
              </span>
              <button
                type="button"
                onClick={() =>
                  setFormulario((atual) => ({
                    ...atual,
                    transportadora: cabecalhoVazio.transportadora,
                    veiculo: cabecalhoVazio.veiculo,
                  }))
                }
                className="rounded-lg bg-amber-400 px-3 py-1.5 text-[11px] font-bold uppercase text-slate-950"
              >
                Limpar transporte
              </button>
            </div>
          )}

          {formulario.modalidadeFrete !== "SEM_FRETE" && (
            <>
              <div className="max-w-xl">
                <BuscaRegistro
                  rotulo="Transportadora cadastrada"
                  selecionado={
                    nota.transportadoraRegistroID
                      ? (nota.transportadora.nome ??
                        `Registro #${nota.transportadoraRegistroID}`)
                      : null
                  }
                  onSelecionar={(registro) =>
                    void salvar({ transportadoraRegistroID: registro.id }, [
                      "transportadora",
                    ])
                  }
                  onLimpar={() =>
                    void salvar({ transportadoraRegistroID: null })
                  }
                  rotuloLimpar="Desvincular"
                  disabled={!editavel || ocupado}
                  classeCampo={CLASSE_CAMPO}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {campoTexto("transportadora", "nome", "Transportadora", {
                  limite: LIMITE_TEXTO,
                  classe: "md:col-span-2",
                })}
                {campoTexto("transportadora", "documento", "CPF / CNPJ", {
                  placeholder: "Somente números",
                })}
                {campoTexto("transportadora", "ie", "Inscrição estadual")}
                {campoTexto("transportadora", "endereco", "Endereço", {
                  limite: LIMITE_TEXTO,
                  classe: "md:col-span-2",
                })}
                {campoTexto("transportadora", "municipio", "Município", {
                  limite: LIMITE_TEXTO,
                })}
                {campoUf("transportadora")}
                {campoTexto("veiculo", "placa", "Placa do veículo", {
                  placeholder: "ABC1D23",
                })}
                {campoUf("veiculo", "UF do veículo")}
              </div>
            </>
          )}
        </Secao>

        {/* 4. Itens */}
        <Secao Icone={Layers} titulo="4. Itens">
          {materiaisQuery.isError && (
            <p className="text-xs text-rose-300">
              Não foi possível carregar os materiais.
            </p>
          )}
          <ItensNotaFiscal
            linhas={linhas}
            onChange={(novas) => {
              setLinhas(novas);
              setErroEnvio("");
            }}
            editavel={editavel && !ocupado}
            materiais={materiaisAtivos}
            regime={configuracaoQuery.data?.regimeTributario ?? null}
            erros={erros?.itens ?? {}}
          />
          <p className="text-[11px] text-slate-500">
            Descrição, NCM, origem e unidade vêm do cadastro do material. O
            total oficial é recalculado pela API ao salvar.
          </p>
        </Secao>

        {/* 5. Informações complementares */}
        <Secao Icone={FileText} titulo="5. Informações complementares">
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            <span className="flex justify-between">
              Texto impresso na nota
              <span className="font-mono normal-case text-slate-500">
                {formulario.informacoesComplementares.length}/
                {LIMITE_INFORMACOES}
              </span>
            </span>
            <textarea
              rows={4}
              maxLength={LIMITE_INFORMACOES}
              value={formulario.informacoesComplementares}
              onChange={(evento) =>
                setFormulario((atual) => ({
                  ...atual,
                  informacoesComplementares: evento.target.value,
                }))
              }
              className={`${CLASSE_CAMPO} resize-y normal-case`}
            />
          </label>
        </Secao>
      </fieldset>

      {confirmacao && (
        <Dialogo
          titulo={
            confirmacao.tipo === "excluir"
              ? "Excluir rascunho"
              : "Trocar natureza de operação"
          }
          texto={
            confirmacao.tipo === "excluir"
              ? "O rascunho e seus itens serão excluídos. Esta ação não pode ser desfeita."
              : "Trocar a natureza reaplica CFOP e tributação em todos os itens. Ajustes manuais serão perdidos. As demais alterações pendentes serão salvas junto."
          }
          rotuloConfirmar={
            confirmacao.tipo === "excluir" ? "Excluir" : "Trocar natureza"
          }
          perigo={confirmacao.tipo === "excluir"}
          ocupado={ocupado}
          onCancelar={() => setConfirmacao(null)}
          onConfirmar={() => {
            if (confirmacao.tipo === "excluir") void confirmarExclusao();
            else {
              setConfirmacao(null);
              void salvar({ naturezaOperacaoID: confirmacao.naturezaID });
            }
          }}
        />
      )}

      {bloqueio.state === "blocked" && (
        <Dialogo
          titulo="Sair sem salvar?"
          texto="Há alterações não salvas nesta nota. Se sair agora, elas serão perdidas."
          rotuloConfirmar="Sair sem salvar"
          perigo
          onCancelar={() => bloqueio.reset()}
          onConfirmar={() => bloqueio.proceed()}
        />
      )}
    </div>
  );
}

const cabecalhoVazio = {
  transportadora: {
    nome: "",
    documento: "",
    ie: "",
    endereco: "",
    municipio: "",
    uf: "",
  },
  veiculo: { placa: "", uf: "" },
};

function ResumoNaoEditavel({ nota }: { nota: NotaFiscal }) {
  const { emissao } = nota;
  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-xs text-slate-300">
      <p className="flex items-center gap-2 font-semibold text-slate-200">
        <Lock className="h-4 w-4 text-slate-400" />
        Esta nota não pode mais ser editada.
      </p>
      {emissao.mensagemSefaz && (
        <p className="text-slate-400">SEFAZ: {emissao.mensagemSefaz}</p>
      )}
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {emissao.chave && (
          <div>
            <dt className="inline text-slate-500">Chave: </dt>
            <dd className="inline font-mono">{emissao.chave}</dd>
          </div>
        )}
        {emissao.protocolo && (
          <div>
            <dt className="inline text-slate-500">Protocolo: </dt>
            <dd className="inline font-mono">{emissao.protocolo}</dd>
          </div>
        )}
        {emissao.autorizadaEm && (
          <div>
            <dt className="inline text-slate-500">Autorizada em: </dt>
            <dd className="inline">
              {formatarDataHoraFiscal(emissao.autorizadaEm)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Secao({
  Icone,
  titulo,
  children,
}: {
  Icone: LucideIcon;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
        <Icone className="h-4 w-4 text-emerald-400" />
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dialogo({
  titulo,
  texto,
  rotuloConfirmar,
  perigo,
  ocupado,
  onCancelar,
  onConfirmar,
}: {
  titulo: string;
  texto: string;
  rotuloConfirmar: string;
  perigo?: boolean;
  ocupado?: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h3 className="font-bold text-slate-100">{titulo}</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">{texto}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={ocupado}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase text-slate-300 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={ocupado}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold uppercase disabled:opacity-50 ${
              perigo
                ? "bg-rose-500 text-white"
                : "bg-emerald-400 text-slate-950"
            }`}
          >
            {ocupado ? "Aguarde..." : rotuloConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
