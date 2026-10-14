import { Receipt } from "lucide-react";
import {
  ORIGENS_MERCADORIA,
  ROTULOS_ORIGEM_MERCADORIA,
  formatarCest,
  formatarNcm,
  somenteDigitos,
} from "../../utils/fiscal";
import { useStatusFiscal } from "../../utils/queries";
import type { DadosFiscaisMaterial, OrigemMercadoria } from "../../utils/types";

interface CamposFiscaisMaterialProps {
  dados: DadosFiscaisMaterial;
  onChange: (dados: DadosFiscaisMaterial) => void;
  classeCampo: string;
}

/**
 * Campos fiscais do material (NCM, CEST e origem). Só aparecem com o módulo
 * fiscal ativo; são opcionais no cadastro e cobrados apenas na emissão.
 */
export default function CamposFiscaisMaterial({
  dados,
  onChange,
  classeCampo,
}: CamposFiscaisMaterialProps) {
  const statusQuery = useStatusFiscal();
  if (!statusQuery.data?.habilitado) return null;

  const rotulo =
    "block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5";

  return (
    <fieldset className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/20 p-3">
      <legend className="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
        <Receipt className="h-3.5 w-3.5" />
        Dados fiscais (NF-e)
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={rotulo}>NCM</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatarNcm(dados.ncm ?? "")}
            onChange={(evento) =>
              onChange({
                ...dados,
                ncm: somenteDigitos(evento.target.value).slice(0, 8) || null,
              })
            }
            placeholder="0000.00.00"
            className={`${classeCampo} font-mono`}
          />
        </label>
        <label className="block">
          <span className={rotulo}>CEST (opcional)</span>
          <input
            type="text"
            inputMode="numeric"
            value={formatarCest(dados.cest ?? "")}
            onChange={(evento) =>
              onChange({
                ...dados,
                cest: somenteDigitos(evento.target.value).slice(0, 7) || null,
              })
            }
            placeholder="00.000.00"
            className={`${classeCampo} font-mono`}
          />
        </label>
      </div>
      <label className="block">
        <span className={rotulo}>Origem da mercadoria</span>
        <select
          value={dados.origemMercadoria ?? ""}
          onChange={(evento) =>
            onChange({
              ...dados,
              origemMercadoria:
                (evento.target.value as OrigemMercadoria) || null,
            })
          }
          className={classeCampo}
        >
          <option value="">Não informada</option>
          {ORIGENS_MERCADORIA.map((origem) => (
            <option key={origem} value={origem}>
              {ROTULOS_ORIGEM_MERCADORIA[origem]}
            </option>
          ))}
        </select>
      </label>
      <p className="text-[10px] leading-4 text-slate-500">
        Opcionais no cadastro. NCM e origem são obrigatórios para emitir nota
        fiscal com este material; em reciclagem, a origem costuma ser
        "Nacional".
      </p>
    </fieldset>
  );
}
