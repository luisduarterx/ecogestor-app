import { motion } from "motion/react";
import { AlertCircle, AlertTriangle, Landmark, Loader2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  CST_PIS_COFINS,
  emiteNaV1,
  mensagemErroFiscal,
  opcoesIcms,
  usaCsosn,
  type CodigoFiscal,
} from "../../utils/fiscal";
import { useSalvarNaturezaOperacao } from "../../utils/queries";
import type {
  NaturezaOperacao,
  NaturezaOperacaoInput,
  RegimeTributario,
} from "../../utils/types";
import CampoCfop from "../fiscal/CampoCfop";

interface NaturezaOperacaoModalProps {
  natureza?: NaturezaOperacao;
  regime: RegimeTributario | null;
  onClose: () => void;
  onSalva: (mensagem: string) => void;
}

type Formulario = {
  descricao: string;
  cfopDentroEstado: string;
  cfopForaEstado: string;
  icmsSituacaoTributaria: string;
  icmsAliquota: string;
  pisSituacaoTributaria: string;
  pisAliquota: string;
  cofinsSituacaoTributaria: string;
  cofinsAliquota: string;
  informacoesComplementares: string;
  ativo: boolean;
};

type Erros = Partial<Record<keyof Formulario, string>>;

const LIMITE_DESCRICAO = 60;
const LIMITE_INFORMACOES = 5000;

const CLASSE_CAMPO =
  "mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60";

const aliquotaTexto = (valor: number | null) =>
  valor === null ? "" : String(valor).replace(".", ",");

function paraFormulario(natureza?: NaturezaOperacao): Formulario {
  return {
    descricao: natureza?.descricao ?? "",
    cfopDentroEstado: natureza?.cfopDentroEstado ?? "",
    cfopForaEstado: natureza?.cfopForaEstado ?? "",
    icmsSituacaoTributaria: natureza?.icmsSituacaoTributaria ?? "",
    icmsAliquota: aliquotaTexto(natureza?.icmsAliquota ?? null),
    pisSituacaoTributaria: natureza?.pisSituacaoTributaria ?? "",
    pisAliquota: aliquotaTexto(natureza?.pisAliquota ?? null),
    cofinsSituacaoTributaria: natureza?.cofinsSituacaoTributaria ?? "",
    cofinsAliquota: aliquotaTexto(natureza?.cofinsAliquota ?? null),
    informacoesComplementares: natureza?.informacoesComplementares ?? "",
    ativo: natureza?.ativo ?? true,
  };
}

/** Converte "12,5" em 12.5; "" em null; undefined quando inválida. */
function lerAliquota(texto: string): number | null | undefined {
  const limpo = texto.trim().replace(",", ".");
  if (!limpo) return null;
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(limpo)) return undefined;
  const valor = Number(limpo);
  return valor >= 0 && valor <= 100 ? valor : undefined;
}

function validar(formulario: Formulario, regime: RegimeTributario | null) {
  const erros: Erros = {};
  const descricao = formulario.descricao.trim();
  if (!descricao) erros.descricao = "Informe a descrição.";
  else if (descricao.length > LIMITE_DESCRICAO)
    erros.descricao = `Use no máximo ${LIMITE_DESCRICAO} caracteres.`;
  if (!/^5\d{3}$/.test(formulario.cfopDentroEstado))
    erros.cfopDentroEstado = "Escolha um CFOP iniciado em 5.";
  if (formulario.cfopForaEstado && !/^6\d{3}$/.test(formulario.cfopForaEstado))
    erros.cfopForaEstado = "Escolha um CFOP iniciado em 6 ou deixe vazio.";
  if (!formulario.icmsSituacaoTributaria)
    erros.icmsSituacaoTributaria = "Escolha a situação do ICMS.";
  else if (
    regime &&
    formulario.ativo &&
    usaCsosn(regime) !== (formulario.icmsSituacaoTributaria.length === 3)
  ) {
    erros.icmsSituacaoTributaria = usaCsosn(regime)
      ? "O regime configurado exige CSOSN."
      : "O regime configurado exige CST.";
  }
  if (!formulario.pisSituacaoTributaria)
    erros.pisSituacaoTributaria = "Escolha o CST do PIS.";
  if (!formulario.cofinsSituacaoTributaria)
    erros.cofinsSituacaoTributaria = "Escolha o CST da COFINS.";
  (["icmsAliquota", "pisAliquota", "cofinsAliquota"] as const).forEach(
    (campo) => {
      if (lerAliquota(formulario[campo]) === undefined)
        erros[campo] = "Informe de 0 a 100, com até 2 casas decimais.";
    },
  );
  if (formulario.informacoesComplementares.length > LIMITE_INFORMACOES)
    erros.informacoesComplementares = `Use no máximo ${LIMITE_INFORMACOES} caracteres.`;
  return erros;
}

function paraEnvio(formulario: Formulario): NaturezaOperacaoInput {
  return {
    descricao: formulario.descricao.trim(),
    cfopDentroEstado: formulario.cfopDentroEstado,
    cfopForaEstado: formulario.cfopForaEstado || null,
    icmsSituacaoTributaria: formulario.icmsSituacaoTributaria,
    icmsAliquota: lerAliquota(formulario.icmsAliquota) ?? null,
    pisSituacaoTributaria: formulario.pisSituacaoTributaria,
    pisAliquota: lerAliquota(formulario.pisAliquota) ?? null,
    cofinsSituacaoTributaria: formulario.cofinsSituacaoTributaria,
    cofinsAliquota: lerAliquota(formulario.cofinsAliquota) ?? null,
    informacoesComplementares:
      formulario.informacoesComplementares.trim() || null,
    ativo: formulario.ativo,
  };
}

/** Opções do select, incluindo o valor atual caso não esteja na lista. */
function opcoesComAtual(lista: CodigoFiscal[], atual: string) {
  return atual && !lista.some((opcao) => opcao.codigo === atual)
    ? [{ codigo: atual, descricao: "Código atual", emiteNaV1: false }, ...lista]
    : lista;
}

export default function NaturezaOperacaoModal({
  natureza,
  regime,
  onClose,
  onSalva,
}: NaturezaOperacaoModalProps) {
  const salvar = useSalvarNaturezaOperacao(natureza?.id);
  const [original] = useState(() => paraFormulario(natureza));
  const [formulario, setFormulario] = useState(original);
  const [erros, setErros] = useState<Erros>({});
  const [erroEnvio, setErroEnvio] = useState("");
  const listaIcms = opcoesComAtual(
    opcoesIcms(regime),
    formulario.icmsSituacaoTributaria,
  );
  const naoEmitidas = [
    ["ICMS", listaIcms, formulario.icmsSituacaoTributaria],
    ["PIS", CST_PIS_COFINS, formulario.pisSituacaoTributaria],
    ["COFINS", CST_PIS_COFINS, formulario.cofinsSituacaoTributaria],
  ]
    .filter(
      ([, lista, codigo]) =>
        codigo && !emiteNaV1(lista as CodigoFiscal[], codigo as string),
    )
    .map(([nome]) => nome as string);

  function alterar<Campo extends keyof Formulario>(
    campo: Campo,
    valor: Formulario[Campo],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setErroEnvio("");
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    const novosErros = validar(formulario, regime);
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = paraEnvio(formulario);
    // Na edição, envia só o que mudou.
    const anterior = paraEnvio(original);
    const corpo = natureza
      ? Object.fromEntries(
          (Object.keys(dados) as (keyof NaturezaOperacaoInput)[])
            .filter((campo) => dados[campo] !== anterior[campo])
            .map((campo) => [campo, dados[campo]]),
        )
      : dados;
    if (natureza && Object.keys(corpo).length === 0) {
      onClose();
      return;
    }

    try {
      await salvar.mutateAsync(corpo);
      onSalva(
        natureza
          ? "Natureza de operação atualizada."
          : "Natureza de operação cadastrada.",
      );
    } catch (erro) {
      setErroEnvio(
        (erro as { statusCode?: number }).statusCode === 409
          ? "Já existe uma natureza de operação com essa descrição."
          : mensagemErroFiscal(
              erro,
              "Não foi possível salvar a natureza de operação.",
            ),
      );
    }
  }

  const rotuloOpcao = (opcao: CodigoFiscal) =>
    `${opcao.codigo} — ${opcao.descricao}${opcao.emiteNaV1 ? "" : " (ainda não emitida)"}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="natureza-modal-titulo"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/20 px-6 py-4">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-emerald-400" />
            <h3 id="natureza-modal-titulo" className="font-bold text-slate-100">
              {natureza
                ? "Editar natureza de operação"
                : "Nova natureza de operação"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(evento) => void enviar(evento)}
          className="space-y-4 overflow-y-auto p-6"
          noValidate
        >
          {erroEnvio && (
            <div
              className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {erroEnvio}
            </div>
          )}

          <label className="block text-[10px] font-bold uppercase text-slate-400">
            <span className="flex justify-between">
              Descrição
              <span className="font-mono normal-case text-slate-500">
                {formulario.descricao.trim().length}/{LIMITE_DESCRICAO}
              </span>
            </span>
            <input
              type="text"
              value={formulario.descricao}
              maxLength={LIMITE_DESCRICAO}
              onChange={(evento) => alterar("descricao", evento.target.value)}
              placeholder="Ex.: VENDA DE SUCATA"
              className={`${CLASSE_CAMPO} uppercase`}
            />
            {erros.descricao && (
              <span className="mt-1 block text-[11px] normal-case text-rose-400">
                {erros.descricao}
              </span>
            )}
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CampoCfop
              rotulo="CFOP dentro do estado"
              prefixo="5"
              valor={formulario.cfopDentroEstado}
              onChange={(codigo) => alterar("cfopDentroEstado", codigo)}
              erro={erros.cfopDentroEstado}
              classeCampo={CLASSE_CAMPO}
            />
            <CampoCfop
              rotulo="CFOP fora do estado (opcional)"
              prefixo="6"
              valor={formulario.cfopForaEstado}
              onChange={(codigo) => alterar("cfopForaEstado", codigo)}
              erro={erros.cfopForaEstado}
              classeCampo={CLASSE_CAMPO}
            />
          </div>

          <SituacaoComAliquota
            rotulo={
              regime
                ? `ICMS (${usaCsosn(regime) ? "CSOSN" : "CST"})`
                : "ICMS (CSOSN ou CST)"
            }
            opcoes={listaIcms}
            rotuloOpcao={rotuloOpcao}
            situacao={formulario.icmsSituacaoTributaria}
            aliquota={formulario.icmsAliquota}
            onSituacao={(valor) => alterar("icmsSituacaoTributaria", valor)}
            onAliquota={(valor) => alterar("icmsAliquota", valor)}
            erroSituacao={erros.icmsSituacaoTributaria}
            erroAliquota={erros.icmsAliquota}
          />
          <SituacaoComAliquota
            rotulo="PIS (CST)"
            opcoes={opcoesComAtual(
              CST_PIS_COFINS,
              formulario.pisSituacaoTributaria,
            )}
            rotuloOpcao={rotuloOpcao}
            situacao={formulario.pisSituacaoTributaria}
            aliquota={formulario.pisAliquota}
            onSituacao={(valor) => alterar("pisSituacaoTributaria", valor)}
            onAliquota={(valor) => alterar("pisAliquota", valor)}
            erroSituacao={erros.pisSituacaoTributaria}
            erroAliquota={erros.pisAliquota}
          />
          <SituacaoComAliquota
            rotulo="COFINS (CST)"
            opcoes={opcoesComAtual(
              CST_PIS_COFINS,
              formulario.cofinsSituacaoTributaria,
            )}
            rotuloOpcao={rotuloOpcao}
            situacao={formulario.cofinsSituacaoTributaria}
            aliquota={formulario.cofinsAliquota}
            onSituacao={(valor) => alterar("cofinsSituacaoTributaria", valor)}
            onAliquota={(valor) => alterar("cofinsAliquota", valor)}
            erroSituacao={erros.cofinsSituacaoTributaria}
            erroAliquota={erros.cofinsAliquota}
          />

          {naoEmitidas.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                A situação de {naoEmitidas.join(", ")} ainda não é suportada na
                emissão. A natureza pode ser salva, mas a emissão vai apontar a
                pendência.
              </span>
            </div>
          )}

          <label className="block text-[10px] font-bold uppercase text-slate-400">
            <span className="flex justify-between">
              Informações complementares (opcional)
              <span className="font-mono normal-case text-slate-500">
                {formulario.informacoesComplementares.length}/
                {LIMITE_INFORMACOES}
              </span>
            </span>
            <textarea
              rows={3}
              maxLength={LIMITE_INFORMACOES}
              value={formulario.informacoesComplementares}
              onChange={(evento) =>
                alterar("informacoesComplementares", evento.target.value)
              }
              placeholder="Texto incluído na nota quando ela ainda não tiver informações complementares."
              className={`${CLASSE_CAMPO} resize-y normal-case`}
            />
          </label>

          {!natureza?.padrao && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
              <span>
                <span className="block font-bold text-slate-200">Ativa</span>
                Naturezas inativas não aparecem na criação de notas.
              </span>
              <input
                type="checkbox"
                checked={formulario.ativo}
                onChange={(evento) => alterar("ativo", evento.target.checked)}
                className="h-4 w-4 accent-emerald-500"
              />
            </label>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvar.isPending}
              className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
            >
              {salvar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {salvar.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function SituacaoComAliquota({
  rotulo,
  opcoes,
  rotuloOpcao,
  situacao,
  aliquota,
  onSituacao,
  onAliquota,
  erroSituacao,
  erroAliquota,
}: {
  rotulo: string;
  opcoes: CodigoFiscal[];
  rotuloOpcao: (opcao: CodigoFiscal) => string;
  situacao: string;
  aliquota: string;
  onSituacao: (valor: string) => void;
  onAliquota: (valor: string) => void;
  erroSituacao?: string;
  erroAliquota?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem]">
      <label className="block text-[10px] font-bold uppercase text-slate-400">
        {rotulo}
        <select
          value={situacao}
          onChange={(evento) => onSituacao(evento.target.value)}
          className={`${CLASSE_CAMPO} cursor-pointer normal-case`}
        >
          <option value="">Selecione...</option>
          {opcoes.map((opcao) => (
            <option key={opcao.codigo} value={opcao.codigo}>
              {rotuloOpcao(opcao)}
            </option>
          ))}
        </select>
        {erroSituacao && (
          <span className="mt-1 block text-[11px] normal-case text-rose-400">
            {erroSituacao}
          </span>
        )}
      </label>
      <label className="block text-[10px] font-bold uppercase text-slate-400">
        Alíquota (%)
        <input
          type="text"
          inputMode="decimal"
          value={aliquota}
          onChange={(evento) => onAliquota(evento.target.value)}
          placeholder="Opcional"
          className={`${CLASSE_CAMPO} text-right font-mono`}
        />
        {erroAliquota && (
          <span className="mt-1 block text-[11px] normal-case text-rose-400">
            {erroAliquota}
          </span>
        )}
      </label>
    </div>
  );
}
