import { Loader2, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { formatarCpfCnpj } from "../../utils/fiscal";
import { useRecords } from "../../utils/queries";
import type { RecordsResponse } from "../../utils/types";

const ATRASO_BUSCA_MS = 300;

interface BuscaRegistroProps {
  rotulo: string;
  /** Texto exibido quando há um registro escolhido. */
  selecionado?: string | null;
  onSelecionar: (registro: RecordsResponse) => void;
  onLimpar?: () => void;
  rotuloLimpar?: string;
  placeholder?: string;
  disabled?: boolean;
  classeCampo: string;
}

/** Autocomplete de clientes e fornecedores (registros). */
export default function BuscaRegistro({
  rotulo,
  selecionado,
  onSelecionar,
  onLimpar,
  rotuloLimpar = "Limpar",
  placeholder = "Buscar por nome ou documento...",
  disabled,
  classeCampo,
}: BuscaRegistroProps) {
  const idLista = useId();
  const [texto, setTexto] = useState("");
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const registrosQuery = useRecords({ take: 10, search: termo });
  const registros = aberto ? (registrosQuery.data ?? []) : [];

  useEffect(() => {
    const temporizador = window.setTimeout(
      () => setTermo(texto),
      ATRASO_BUSCA_MS,
    );
    return () => window.clearTimeout(temporizador);
  }, [texto]);

  return (
    <div className="relative">
      <span className="block text-[10px] font-bold uppercase text-slate-400">
        {rotulo}
      </span>
      {selecionado ? (
        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-2.5 text-xs text-slate-100">
          <span className="truncate">{selecionado}</span>
          {onLimpar && (
            <button
              type="button"
              onClick={onLimpar}
              disabled={disabled}
              className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-rose-400 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              {rotuloLimpar}
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 mt-[3px] h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            role="combobox"
            aria-label={rotulo}
            aria-expanded={aberto}
            aria-controls={idLista}
            autoComplete="off"
            value={texto}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(evento) => {
              setTexto(evento.target.value);
              setAberto(true);
            }}
            onFocus={() => setAberto(true)}
            onBlur={() => window.setTimeout(() => setAberto(false), 150)}
            className={`${classeCampo} pl-8`}
          />
        </div>
      )}
      {aberto && !selecionado && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 py-1 text-xs shadow-2xl"
        >
          {registrosQuery.isFetching && (
            <li className="flex items-center gap-2 px-3 py-2 text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Buscando...
            </li>
          )}
          {!registrosQuery.isFetching && registros.length === 0 && (
            <li className="px-3 py-2 text-slate-500">
              {registrosQuery.isError
                ? "Não foi possível buscar os registros."
                : "Nenhum cliente ou fornecedor encontrado."}
            </li>
          )}
          {registros.map((registro) => (
            <li
              key={registro.id}
              role="option"
              aria-selected={false}
              onMouseDown={(evento) => {
                // Evita perder o foco antes do clique.
                evento.preventDefault();
                setTexto("");
                setAberto(false);
                onSelecionar(registro);
              }}
              className="cursor-pointer px-3 py-2 text-slate-300 hover:bg-slate-800"
            >
              <span className="font-semibold text-slate-100">
                {registro.apelido || registro.nome}
              </span>
              <span className="ml-2 font-mono text-[11px] text-slate-500">
                {formatarCpfCnpj(registro.documento)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
