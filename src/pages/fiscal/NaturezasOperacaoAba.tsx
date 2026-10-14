import {
  AlertTriangle,
  Edit3,
  Loader2,
  Plus,
  Power,
  Star,
  Trash2,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import NaturezaOperacaoModal from "../../components/modals/NaturezaOperacaoModal";
import {
  CST_PIS_COFINS,
  descreverCodigo,
  formatarAliquota,
  mensagemErroFiscal,
  opcoesIcms,
} from "../../utils/fiscal";
import {
  useAtualizarConfiguracaoFiscal,
  useConfiguracaoFiscal,
  useExcluirNaturezaOperacao,
  useNaturezasOperacao,
  useSalvarNaturezaOperacao,
} from "../../utils/queries";
import type { ApiError, NaturezaOperacao } from "../../utils/types";

export function NaturezasOperacaoAba({
  onAviso,
}: {
  onAviso: (mensagem: string) => void;
}) {
  const naturezasQuery = useNaturezasOperacao();
  const configuracaoQuery = useConfiguracaoFiscal();
  const regime = configuracaoQuery.data?.regimeTributario ?? null;
  const [edicao, setEdicao] = useState<NaturezaOperacao | "nova" | null>(null);
  const [exclusao, setExclusao] = useState<NaturezaOperacao | null>(null);
  const [erroAcao, setErroAcao] = useState("");
  const naturezas = naturezasQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-bold text-slate-100">
            Naturezas de operação
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Cada natureza define o CFOP e a tributação aplicados aos itens da
            nota. Cadastre-as com o seu contador.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEdicao("nova")}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-300"
        >
          <Plus className="h-4 w-4" />
          Nova natureza
        </button>
      </div>

      {erroAcao && (
        <div
          className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300"
          role="alert"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {erroAcao}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        {naturezasQuery.isPending ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Carregando naturezas de operação...
          </div>
        ) : naturezasQuery.isError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-rose-300">
            <span>
              {mensagemErroFiscal(
                naturezasQuery.error,
                "Não foi possível carregar as naturezas de operação.",
              )}
            </span>
            <button
              type="button"
              onClick={() => void naturezasQuery.refetch()}
              className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950"
            >
              Tentar novamente
            </button>
          </div>
        ) : naturezas.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Nenhuma natureza de operação cadastrada. Cadastre a primeira para
            poder emitir notas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">CFOP (dentro / fora)</th>
                  <th className="px-4 py-3">ICMS</th>
                  <th className="px-4 py-3">PIS / COFINS</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {naturezas.map((natureza) => (
                  <LinhaNatureza
                    key={natureza.id}
                    natureza={natureza}
                    regime={regime}
                    onEditar={() => setEdicao(natureza)}
                    onExcluir={() => setExclusao(natureza)}
                    onAviso={onAviso}
                    onErro={setErroAcao}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {edicao && (
        <NaturezaOperacaoModal
          natureza={edicao === "nova" ? undefined : edicao}
          regime={regime}
          onClose={() => setEdicao(null)}
          onSalva={(mensagem) => {
            setEdicao(null);
            onAviso(mensagem);
          }}
        />
      )}

      {exclusao && (
        <ConfirmarExclusao
          natureza={exclusao}
          onClose={() => setExclusao(null)}
          onExcluida={() => {
            setExclusao(null);
            onAviso("Natureza de operação excluída.");
          }}
        />
      )}
    </div>
  );
}

function LinhaNatureza({
  natureza,
  regime,
  onEditar,
  onExcluir,
  onAviso,
  onErro,
}: {
  natureza: NaturezaOperacao;
  regime: Parameters<typeof opcoesIcms>[0];
  onEditar: () => void;
  onExcluir: () => void;
  onAviso: (mensagem: string) => void;
  onErro: (mensagem: string) => void;
}) {
  const salvar = useSalvarNaturezaOperacao(natureza.id);
  const definirPadrao = useAtualizarConfiguracaoFiscal();
  const ocupada = salvar.isPending || definirPadrao.isPending;

  async function alternarAtivo() {
    onErro("");
    try {
      await salvar.mutateAsync({ ativo: !natureza.ativo });
      onAviso(
        natureza.ativo
          ? "Natureza de operação desativada."
          : "Natureza de operação ativada.",
      );
    } catch (erro) {
      onErro(mensagemErroFiscal(erro, "Não foi possível alterar a natureza."));
    }
  }

  async function tornarPadrao() {
    onErro("");
    try {
      await definirPadrao.mutateAsync({ naturezaPadraoID: natureza.id });
      onAviso(`"${natureza.descricao}" agora é a natureza padrão.`);
    } catch (erro) {
      onErro(
        mensagemErroFiscal(erro, "Não foi possível definir a natureza padrão."),
      );
    }
  }

  const aliquotas = (valor: number | null) =>
    formatarAliquota(valor) ? ` · ${formatarAliquota(valor)}` : "";

  return (
    <tr
      className={`hover:bg-slate-800/30 ${natureza.ativo ? "" : "opacity-60"}`}
    >
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-100">
          {natureza.descricao}
          {natureza.padrao && (
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Padrão
            </span>
          )}
          {!natureza.ativo && (
            <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400">
              Inativa
            </span>
          )}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-mono">
        {natureza.cfopDentroEstado} / {natureza.cfopForaEstado ?? "—"}
      </td>
      <td className="px-4 py-3">
        <span
          title={descreverCodigo(
            opcoesIcms(regime),
            natureza.icmsSituacaoTributaria,
          )}
        >
          <span className="font-mono">{natureza.icmsSituacaoTributaria}</span>
          {aliquotas(natureza.icmsAliquota)}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          title={`PIS: ${descreverCodigo(CST_PIS_COFINS, natureza.pisSituacaoTributaria)}\nCOFINS: ${descreverCodigo(CST_PIS_COFINS, natureza.cofinsSituacaoTributaria)}`}
          className="font-mono"
        >
          {natureza.pisSituacaoTributaria}
          {aliquotas(natureza.pisAliquota)} /{" "}
          {natureza.cofinsSituacaoTributaria}
          {aliquotas(natureza.cofinsAliquota)}
        </span>
      </td>
      <td className="px-4 py-3">
        {natureza.compativelComRegime === false ? (
          <span className="flex items-start gap-1 text-[11px] text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Incompatível com o regime tributário — edite a situação do ICMS
          </span>
        ) : (
          <span className="text-[11px] text-slate-500">
            {natureza.ativo ? "Ativa" : "Inativa"}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          {ocupada && (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          )}
          <BotaoIcone titulo="Editar" onClick={onEditar} disabled={ocupada}>
            <Edit3 className="h-4 w-4" />
          </BotaoIcone>
          {natureza.ativo && !natureza.padrao && (
            <BotaoIcone
              titulo="Definir como padrão"
              onClick={() => void tornarPadrao()}
              disabled={ocupada}
            >
              <Star className="h-4 w-4" />
            </BotaoIcone>
          )}
          {!natureza.padrao && (
            <BotaoIcone
              titulo={natureza.ativo ? "Desativar" : "Ativar"}
              onClick={() => void alternarAtivo()}
              disabled={ocupada}
            >
              <Power className="h-4 w-4" />
            </BotaoIcone>
          )}
          {!natureza.padrao && (
            <BotaoIcone
              titulo="Excluir"
              onClick={onExcluir}
              disabled={ocupada}
              perigo
            >
              <Trash2 className="h-4 w-4" />
            </BotaoIcone>
          )}
        </div>
      </td>
    </tr>
  );
}

function BotaoIcone({
  titulo,
  onClick,
  disabled,
  perigo,
  children,
}: {
  titulo: string;
  onClick: () => void;
  disabled?: boolean;
  perigo?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 disabled:opacity-40 ${
        perigo ? "hover:text-rose-400" : "hover:text-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}

function ConfirmarExclusao({
  natureza,
  onClose,
  onExcluida,
}: {
  natureza: NaturezaOperacao;
  onClose: () => void;
  onExcluida: () => void;
}) {
  const excluir = useExcluirNaturezaOperacao();
  const desativar = useSalvarNaturezaOperacao(natureza.id);
  const [erro, setErro] = useState<ApiError | null>(null);
  const emUso = erro?.statusCode === 409;

  async function confirmar() {
    setErro(null);
    try {
      await excluir.mutateAsync(natureza.id);
      onExcluida();
    } catch (caught) {
      setErro(caught as ApiError);
    }
  }

  async function desativarEmVezDeExcluir() {
    try {
      await desativar.mutateAsync({ ativo: false });
      onClose();
    } catch (caught) {
      setErro(caught as ApiError);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <h3 className="font-bold text-slate-100">
          Excluir natureza de operação
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Excluir{" "}
          <strong className="text-slate-200">{natureza.descricao}</strong>? Se
          ela já foi usada em alguma nota, não poderá ser excluída — apenas
          desativada.
        </p>
        {erro && (
          <p className="mt-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            {emUso
              ? "Esta natureza já foi usada em nota fiscal e não pode ser excluída. Você pode desativá-la."
              : mensagemErroFiscal(
                  erro,
                  "Não foi possível excluir a natureza.",
                )}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold uppercase text-slate-300"
          >
            Cancelar
          </button>
          {emUso && natureza.ativo ? (
            <button
              type="button"
              disabled={desativar.isPending}
              onClick={() => void desativarEmVezDeExcluir()}
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
            >
              {desativar.isPending ? "Desativando..." : "Desativar"}
            </button>
          ) : (
            <button
              type="button"
              disabled={excluir.isPending || emUso}
              onClick={() => void confirmar()}
              className="rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-50"
            >
              {excluir.isPending ? "Excluindo..." : "Excluir"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
