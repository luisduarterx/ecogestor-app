import { Receipt } from "lucide-react";
import { INDICADORES_IE, ROTULOS_INDICADOR_IE } from "../../utils/fiscal";
import { useStatusFiscal } from "../../utils/queries";
import type { IndicadorIE } from "../../utils/types";

interface CamposFiscaisRegistroProps {
  tipoPessoa: "FISICA" | "JURIDICA";
  indicadorIE: IndicadorIE | "";
  onIndicadorIE: (valor: IndicadorIE | "") => void;
  /** IE de pessoa física (produtor rural); a de pessoa jurídica já existe no cadastro. */
  ieFisica: string;
  onIeFisica: (valor: string) => void;
  /** Indica se há IE informada, para o aviso de contribuinte sem IE. */
  possuiIE: boolean;
  classeCampo: string;
}

/**
 * Campos fiscais do registro, usados no destinatário da NF-e. Só aparecem
 * com o módulo fiscal ativo e são opcionais no cadastro.
 */
export default function CamposFiscaisRegistro({
  tipoPessoa,
  indicadorIE,
  onIndicadorIE,
  ieFisica,
  onIeFisica,
  possuiIE,
  classeCampo,
}: CamposFiscaisRegistroProps) {
  const statusQuery = useStatusFiscal();
  if (!statusQuery.data?.habilitado) return null;

  return (
    <div className="space-y-3 border-t border-slate-800 pt-4">
      <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
        <Receipt className="h-4 w-4 text-emerald-400" />
        Dados fiscais (NF-e)
      </h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-400">
            Indicador de IE
          </label>
          <select
            value={indicadorIE}
            onChange={(evento) =>
              onIndicadorIE(evento.target.value as IndicadorIE | "")
            }
            className={classeCampo}
          >
            <option value="">Não informado</option>
            {INDICADORES_IE.map((indicador) => (
              <option key={indicador} value={indicador}>
                {ROTULOS_INDICADOR_IE[indicador]}
              </option>
            ))}
          </select>
        </div>
        {tipoPessoa === "FISICA" && (
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase text-slate-400">
              Inscrição estadual (produtor rural)
            </label>
            <input
              value={ieFisica}
              onChange={(evento) => onIeFisica(evento.target.value)}
              placeholder="Opcional"
              className={classeCampo}
            />
          </div>
        )}
      </div>
      {indicadorIE === "CONTRIBUINTE" && !possuiIE && (
        <p className="text-[11px] text-amber-300">
          Contribuinte do ICMS precisa ter a inscrição estadual informada para
          emitir nota fiscal.
        </p>
      )}
      <p className="text-[10px] leading-4 text-slate-500">
        Para emitir nota, o endereço precisa de logradouro, número, bairro,
        cidade, UF e CEP.
      </p>
    </div>
  );
}
