import {
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  Save,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  REGIMES,
  ROTULOS_REGIME,
  mensagemErroFiscal,
  usaCsosn,
} from "../../utils/fiscal";
import {
  useAtualizarConfiguracaoFiscal,
  useConfiguracaoFiscal,
  useConfiguracoesSistema,
  useNaturezasOperacao,
} from "../../utils/queries";
import type {
  AtualizarConfiguracaoFiscalInput,
  ConfiguracaoFiscal,
  NaturezaOperacao,
  RegimeTributario,
} from "../../utils/types";

const CLASSE_CAMPO =
  "mt-1.5 w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60";

const formatarDataHora = (valor: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));

export function ConfiguracaoFiscalAba({
  onAviso,
}: {
  onAviso: (mensagem: string) => void;
}) {
  const configuracaoQuery = useConfiguracaoFiscal();
  const naturezasQuery = useNaturezasOperacao(true);

  if (configuracaoQuery.isPending || naturezasQuery.isPending) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-10 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        Carregando configuração fiscal...
      </div>
    );
  }

  const erro = configuracaoQuery.error ?? naturezasQuery.error;
  if (erro) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
        <span>
          {mensagemErroFiscal(
            erro,
            "Não foi possível carregar a configuração fiscal.",
          )}
        </span>
        <button
          type="button"
          onClick={() => {
            void configuracaoQuery.refetch();
            void naturezasQuery.refetch();
          }}
          className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <FormularioConfiguracaoFiscal
      // Remonta com os dados salvos após cada gravação.
      key={configuracaoQuery.data?.atualizadoEm ?? "nova"}
      configuracao={configuracaoQuery.data ?? null}
      naturezasAtivas={naturezasQuery.data ?? []}
      onAviso={onAviso}
    />
  );
}

function FormularioConfiguracaoFiscal({
  configuracao,
  naturezasAtivas,
  onAviso,
}: {
  configuracao: ConfiguracaoFiscal | null;
  naturezasAtivas: NaturezaOperacao[];
  onAviso: (mensagem: string) => void;
}) {
  const atualizar = useAtualizarConfiguracaoFiscal();
  const empresaQuery = useConfiguracoesSistema();
  const [regime, setRegime] = useState<RegimeTributario | "">(
    configuracao?.regimeTributario ?? "",
  );
  const [naturezaPadraoID, setNaturezaPadraoID] = useState(
    configuracao?.naturezaPadraoID ? String(configuracao.naturezaPadraoID) : "",
  );
  const [erroEnvio, setErroEnvio] = useState("");

  const alteracoes: AtualizarConfiguracaoFiscalInput = {};
  if (regime !== (configuracao?.regimeTributario ?? ""))
    alteracoes.regimeTributario = regime || null;
  if (naturezaPadraoID !== String(configuracao?.naturezaPadraoID ?? ""))
    alteracoes.naturezaPadraoID = naturezaPadraoID
      ? Number(naturezaPadraoID)
      : null;
  const possuiAlteracoes = Object.keys(alteracoes).length > 0;

  // A natureza padrão precisa combinar com o regime escolhido.
  const combinaComRegime = (natureza: NaturezaOperacao) =>
    !regime ||
    usaCsosn(regime) === (natureza.icmsSituacaoTributaria.length === 3);
  const naturezaEscolhida = naturezasAtivas.find(
    (natureza) => String(natureza.id) === naturezaPadraoID,
  );
  const padraoIncompativel =
    naturezaEscolhida !== undefined && !combinaComRegime(naturezaEscolhida);
  // Trocar só o regime não é bloqueado (a API sinaliza as incompatíveis);
  // escolher uma nova natureza padrão incompatível, sim.
  const bloqueiaPadrao = padraoIncompativel && "naturezaPadraoID" in alteracoes;

  const empresa = empresaQuery.data;
  const faltaDadosEmpresa =
    empresaQuery.isSuccess &&
    (!empresa?.documento ||
      empresa.tipoDocumento !== "CNPJ" ||
      !empresa.estado);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!possuiAlteracoes || bloqueiaPadrao) return;
    setErroEnvio("");
    try {
      await atualizar.mutateAsync(alteracoes);
      onAviso("Configuração fiscal salva.");
    } catch (erro) {
      setErroEnvio(
        mensagemErroFiscal(erro, "Não foi possível salvar a configuração."),
      );
    }
  }

  return (
    <form onSubmit={(evento) => void salvar(evento)} className="space-y-4">
      {faltaDadosEmpresa && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            O CNPJ e a UF da empresa são obrigatórios para emitir notas.
            Preencha-os em{" "}
            <Link to="/configuracoes" className="font-bold underline">
              Configurações do sistema
            </Link>
            .
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Regime tributário
            <select
              value={regime}
              onChange={(evento) => {
                setRegime(evento.target.value as RegimeTributario | "");
                setErroEnvio("");
              }}
              className={CLASSE_CAMPO}
            >
              <option value="">Não definido</option>
              {REGIMES.map((valor) => (
                <option key={valor} value={valor}>
                  {ROTULOS_REGIME[valor]}
                </option>
              ))}
            </select>
          </label>
          <p className="flex items-start gap-1.5 text-[11px] text-slate-400">
            <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
            Deve ser igual ao regime cadastrado na Focus NFe pelo suporte do
            EcoGestor. Ao trocar o regime, as naturezas incompatíveis ficam
            sinalizadas para ajuste.
          </p>

          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Natureza padrão
            <select
              value={naturezaPadraoID}
              onChange={(evento) => {
                setNaturezaPadraoID(evento.target.value);
                setErroEnvio("");
              }}
              className={CLASSE_CAMPO}
            >
              <option value="">Nenhuma</option>
              {naturezasAtivas.map((natureza) => (
                <option key={natureza.id} value={natureza.id}>
                  {natureza.descricao}
                  {combinaComRegime(natureza)
                    ? ""
                    : " (incompatível com o regime)"}
                </option>
              ))}
            </select>
          </label>
          <p className="text-[11px] text-slate-400">
            Vem selecionada ao criar uma nota. Apenas naturezas ativas aparecem.
          </p>
          {padraoIncompativel && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Essa natureza não combina com o regime escolhido. Ajuste a
              situação do ICMS dela ou escolha outra.
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 text-xs text-slate-400">
          <h3 className="text-sm font-bold text-slate-100">
            Emitente e certificado
          </h3>
          <p>
            Os dados da empresa (razão social, CNPJ, endereço e UF) vêm das{" "}
            <Link to="/configuracoes" className="text-emerald-400 underline">
              Configurações do sistema
            </Link>
            .
          </p>
          <p>
            O certificado digital A1, a série e a numeração da NF-e são
            configurados pelo suporte do EcoGestor diretamente na Focus NFe,
            durante a implantação. O EcoGestor não armazena o certificado.
          </p>
          {configuracao?.atualizadoPor && (
            <p className="font-mono text-[11px] text-slate-500">
              Última alteração: {formatarDataHora(configuracao.atualizadoEm)}{" "}
              por {configuracao.atualizadoPor.nome}
            </p>
          )}
        </div>
      </div>

      {erroEnvio && (
        <div
          className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {erroEnvio}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!possuiAlteracoes || bloqueiaPadrao || atualizar.isPending}
          className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
        >
          {atualizar.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {atualizar.isPending ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
    </form>
  );
}
