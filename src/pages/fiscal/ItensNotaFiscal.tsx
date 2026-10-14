import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  CST_PIS_COFINS,
  formatarMoedaFiscal,
  formatarNcm,
  opcoesIcms,
} from "../../utils/fiscal";
import type {
  MaterialResponse,
  RegimeTributario,
  TributacaoItemNota,
} from "../../utils/types";
import {
  LIMITE_ITENS,
  lerDecimal,
  linhaVazia,
  type LinhaItem,
} from "./formularioNota";

interface ItensNotaFiscalProps {
  linhas: LinhaItem[];
  onChange: (linhas: LinhaItem[]) => void;
  editavel: boolean;
  materiais: MaterialResponse[];
  regime: RegimeTributario | null;
  erros: Record<string, string>;
  /** Itens apontados nas pendências de emissão, pelo número do item. */
  destacados?: Set<number>;
}

const CLASSE_CELULA =
  "w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-60";

const ROTULO_UNIDADE: Record<string, string> = { KG: "kg", LT: "L", UN: "un" };

export default function ItensNotaFiscal({
  linhas,
  onChange,
  editavel,
  materiais,
  regime,
  erros,
  destacados,
}: ItensNotaFiscalProps) {
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const materialPorID = new Map(materiais.map((m) => [String(m.id), m]));

  function alterar(chave: string, mudanca: Partial<LinhaItem>) {
    onChange(
      linhas.map((linha) =>
        linha.chave === chave ? { ...linha, ...mudanca } : linha,
      ),
    );
  }

  function alterarTributacao(
    chave: string,
    campo: keyof TributacaoItemNota,
    valor: string,
  ) {
    onChange(
      linhas.map((linha) =>
        linha.chave === chave
          ? { ...linha, tributacao: { ...linha.tributacao, [campo]: valor } }
          : linha,
      ),
    );
  }

  function escolherMaterial(chave: string, materialID: string) {
    const linha = linhas.find((item) => item.chave === chave);
    const material = materialPorID.get(materialID);
    // Sugere o preço de venda do material quando o valor ainda não foi digitado.
    alterar(chave, {
      materialID,
      valorUnitario:
        linha?.valorUnitario ||
        (material ? String(material.preco_venda).replace(".", ",") : ""),
    });
  }

  function alternar(chave: string) {
    setAbertas((atuais) => {
      const proximas = new Set(atuais);
      if (proximas.has(chave)) proximas.delete(chave);
      else proximas.add(chave);
      return proximas;
    });
  }

  const totalPrevisto = linhas.reduce((total, linha) => {
    const quantidade = lerDecimal(linha.quantidade) ?? 0;
    const valor = lerDecimal(linha.valorUnitario) ?? 0;
    return total + Math.round(quantidade * valor * 100) / 100;
  }, 0);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-slate-950/60 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <tr>
              <th className="w-10 px-3 py-2">#</th>
              <th className="px-3 py-2">Material</th>
              <th className="w-28 px-3 py-2 text-right">Quantidade</th>
              <th className="w-32 px-3 py-2 text-right">Valor unit. (R$)</th>
              <th className="w-32 px-3 py-2 text-right">Total</th>
              <th className="w-24 px-3 py-2">CFOP</th>
              <th className="w-20 px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {linhas.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-slate-500"
                >
                  Nenhum item na nota.
                </td>
              </tr>
            )}
            {linhas.map((linha, indice) => {
              const material = materialPorID.get(linha.materialID);
              const ncm = linha.original?.ncm ?? material?.ncm ?? null;
              const quantidade = lerDecimal(linha.quantidade);
              const valor = lerDecimal(linha.valorUnitario);
              const total =
                quantidade !== null && valor !== null
                  ? Math.round(quantidade * valor * 100) / 100
                  : null;
              const aberta = abertas.has(linha.chave);
              const numero = linha.original?.numeroItem ?? indice + 1;
              const destacada = destacados?.has(numero);
              const erro = erros[linha.chave];
              return [
                <tr
                  key={linha.chave}
                  className={
                    destacada || erro
                      ? "bg-orange-500/5"
                      : "hover:bg-slate-800/20"
                  }
                >
                  <td className="px-3 py-2 font-mono text-slate-500">
                    {indice + 1}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={linha.materialID}
                      disabled={!editavel}
                      onChange={(evento) =>
                        escolherMaterial(linha.chave, evento.target.value)
                      }
                      className={`${CLASSE_CELULA} cursor-pointer`}
                    >
                      <option value="">Selecione o material...</option>
                      {/* Material salvo que não está mais ativo continua visível. */}
                      {linha.original && !material && (
                        <option value={linha.materialID}>
                          {linha.original.descricao}
                        </option>
                      )}
                      {materiais.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.nome}
                        </option>
                      ))}
                    </select>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                      {(material || linha.original) && (
                        <span>
                          Unidade:{" "}
                          {
                            ROTULO_UNIDADE[
                              linha.original?.unidade ??
                                material?.unidade ??
                                "KG"
                            ]
                          }
                        </span>
                      )}
                      {linha.materialID &&
                        (ncm ? (
                          <span className="font-mono">
                            NCM {formatarNcm(ncm)}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            NCM ausente — cadastre no material
                          </span>
                        ))}
                    </div>
                    {erro && (
                      <p className="mt-1 text-[11px] text-rose-400">{erro}</p>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={linha.quantidade}
                      disabled={!editavel}
                      onChange={(evento) =>
                        alterar(linha.chave, {
                          quantidade: evento.target.value,
                        })
                      }
                      className={`${CLASSE_CELULA} text-right font-mono`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={linha.valorUnitario}
                      disabled={!editavel}
                      onChange={(evento) =>
                        alterar(linha.chave, {
                          valorUnitario: evento.target.value,
                        })
                      }
                      className={`${CLASSE_CELULA} text-right font-mono`}
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-slate-100">
                    {total !== null ? formatarMoedaFiscal(total) : "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-300">
                    {linha.tributacao.cfop || (
                      <span
                        className="text-slate-500"
                        title="Definido pela natureza ao salvar"
                      >
                        natureza
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => alternar(linha.chave)}
                        title="Tributação do item"
                        aria-label="Tributação do item"
                        aria-expanded={aberta}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400"
                      >
                        {aberta ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {editavel && (
                        <button
                          type="button"
                          onClick={() =>
                            onChange(
                              linhas.filter(
                                (item) => item.chave !== linha.chave,
                              ),
                            )
                          }
                          title="Remover item"
                          aria-label="Remover item"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>,
                aberta && (
                  <tr
                    key={`${linha.chave}-tributacao`}
                    className="bg-slate-950/40"
                  >
                    <td />
                    <td colSpan={6} className="px-3 pb-3 pt-1">
                      <TributacaoItem
                        tributacao={linha.tributacao}
                        regime={regime}
                        editavel={editavel}
                        onChange={(campo, valor) =>
                          alterarTributacao(linha.chave, campo, valor)
                        }
                      />
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        {editavel ? (
          <button
            type="button"
            disabled={linhas.length >= LIMITE_ITENS}
            onClick={() => onChange([...linhas, linhaVazia()])}
            className="flex w-fit items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Adicionar item
          </button>
        ) : (
          <span />
        )}
        <span className="text-xs text-slate-400">
          {linhas.length} {linhas.length === 1 ? "item" : "itens"} · Total
          previsto:{" "}
          <strong className="font-mono text-emerald-400">
            {formatarMoedaFiscal(totalPrevisto)}
          </strong>
        </span>
      </div>
    </div>
  );
}

function TributacaoItem({
  tributacao,
  regime,
  editavel,
  onChange,
}: {
  tributacao: LinhaItem["tributacao"];
  regime: RegimeTributario | null;
  editavel: boolean;
  onChange: (campo: keyof TributacaoItemNota, valor: string) => void;
}) {
  const icms = opcoesIcms(regime);
  const comAtual = (lista: { codigo: string }[], atual: string) =>
    atual && !lista.some((opcao) => opcao.codigo === atual)
      ? [{ codigo: atual }, ...lista]
      : lista;

  const select = (
    campo: keyof TributacaoItemNota,
    rotulo: string,
    lista: { codigo: string; descricao?: string }[],
  ) => (
    <label className="block text-[10px] font-bold uppercase text-slate-500">
      {rotulo}
      <select
        value={tributacao[campo]}
        disabled={!editavel}
        onChange={(evento) => onChange(campo, evento.target.value)}
        className={`${CLASSE_CELULA} mt-1 cursor-pointer`}
      >
        <option value="">Da natureza</option>
        {comAtual(lista, tributacao[campo]).map((opcao) => (
          <option key={opcao.codigo} value={opcao.codigo}>
            {opcao.codigo}
            {"descricao" in opcao && opcao.descricao
              ? ` — ${opcao.descricao}`
              : ""}
          </option>
        ))}
      </select>
    </label>
  );

  const aliquota = (campo: keyof TributacaoItemNota, rotulo: string) => (
    <label className="block text-[10px] font-bold uppercase text-slate-500">
      {rotulo}
      <input
        type="text"
        inputMode="decimal"
        value={tributacao[campo]}
        disabled={!editavel}
        placeholder="—"
        onChange={(evento) => onChange(campo, evento.target.value)}
        className={`${CLASSE_CELULA} mt-1 text-right font-mono`}
      />
    </label>
  );

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-slate-500">
        Campos vazios usam a tributação da natureza de operação.
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <label className="block text-[10px] font-bold uppercase text-slate-500">
          CFOP
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={tributacao.cfop}
            disabled={!editavel}
            placeholder="Da natureza"
            onChange={(evento) =>
              onChange("cfop", evento.target.value.replace(/\D/g, ""))
            }
            className={`${CLASSE_CELULA} mt-1 font-mono`}
          />
        </label>
        {select("icmsSituacaoTributaria", "ICMS", icms)}
        {select("pisSituacaoTributaria", "PIS", CST_PIS_COFINS)}
        {select("cofinsSituacaoTributaria", "COFINS", CST_PIS_COFINS)}
        <span className="hidden md:block" />
        {aliquota("icmsAliquota", "Alíq. ICMS (%)")}
        {aliquota("pisAliquota", "Alíq. PIS (%)")}
        {aliquota("cofinsAliquota", "Alíq. COFINS (%)")}
      </div>
    </div>
  );
}
