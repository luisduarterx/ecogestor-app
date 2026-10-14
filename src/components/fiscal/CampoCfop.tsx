import { Loader2 } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useCfops } from "../../utils/queries";

const ATRASO_BUSCA_MS = 300;
const MAXIMO_SUGESTOES = 20;

interface CampoCfopProps {
  rotulo: string;
  valor: string;
  /** Primeiro dígito aceito: 5 (dentro do estado) ou 6 (fora do estado). */
  prefixo: "5" | "6";
  onChange: (codigo: string) => void;
  erro?: string;
  disabled?: boolean;
  classeCampo: string;
}

/**
 * Autocomplete de CFOP pela tabela oficial da API. Aceita o início do código
 * ou um trecho da descrição; o valor só é definido com um código válido.
 */
export default function CampoCfop({
  rotulo,
  valor,
  prefixo,
  onChange,
  erro,
  disabled,
  classeCampo,
}: CampoCfopProps) {
  const idLista = useId();
  const [texto, setTexto] = useState(valor);
  const [termo, setTermo] = useState(valor);
  const [aberto, setAberto] = useState(false);
  const sugestoesQuery = useCfops(aberto ? termo : "");
  const selecionadoQuery = useCfops(/^\d{4}$/.test(valor) ? valor : "");
  const descricaoSelecionada = selecionadoQuery.data?.find(
    (cfop) => cfop.codigo === valor,
  )?.descricao;
  const sugestoes = (sugestoesQuery.data ?? [])
    .filter((cfop) => cfop.codigo.startsWith(prefixo))
    .slice(0, MAXIMO_SUGESTOES);

  useEffect(() => {
    const temporizador = window.setTimeout(
      () => setTermo(texto),
      ATRASO_BUSCA_MS,
    );
    return () => window.clearTimeout(temporizador);
  }, [texto]);

  function digitar(novoTexto: string) {
    setTexto(novoTexto);
    setAberto(true);
    // Um código completo digitado vale como seleção; texto livre só busca.
    const codigo = novoTexto.trim();
    onChange(
      /^\d{4}$/.test(codigo) && codigo.startsWith(prefixo) ? codigo : "",
    );
  }

  function selecionar(codigo: string) {
    setTexto(codigo);
    setTermo(codigo);
    setAberto(false);
    onChange(codigo);
  }

  return (
    <div className="relative">
      <label className="block text-[10px] font-bold uppercase text-slate-400">
        {rotulo}
        <input
          type="text"
          role="combobox"
          aria-expanded={aberto}
          aria-controls={idLista}
          aria-autocomplete="list"
          autoComplete="off"
          value={texto}
          disabled={disabled}
          placeholder={`${prefixo}102 ou "venda"`}
          onChange={(evento) => digitar(evento.target.value)}
          onFocus={() => texto && setAberto(true)}
          onBlur={() => window.setTimeout(() => setAberto(false), 150)}
          className={`${classeCampo} font-mono`}
        />
      </label>
      {valor && descricaoSelecionada && (
        <p className="mt-1 text-[11px] text-slate-400">
          {descricaoSelecionada}
        </p>
      )}
      {erro && <p className="mt-1 text-[11px] text-rose-400">{erro}</p>}
      {aberto && termo.trim() && (
        <ul
          id={idLista}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 py-1 text-xs shadow-2xl"
        >
          {sugestoesQuery.isFetching && (
            <li className="flex items-center gap-2 px-3 py-2 text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Buscando CFOP...
            </li>
          )}
          {!sugestoesQuery.isFetching && sugestoes.length === 0 && (
            <li className="px-3 py-2 text-slate-500">
              {sugestoesQuery.isError
                ? "Não foi possível buscar os CFOPs."
                : `Nenhum CFOP iniciado em ${prefixo} encontrado.`}
            </li>
          )}
          {sugestoes.map((cfop) => (
            <li
              key={cfop.codigo}
              role="option"
              aria-selected={cfop.codigo === valor}
              // onMouseDown evita perder o foco antes do clique.
              onMouseDown={(evento) => {
                evento.preventDefault();
                selecionar(cfop.codigo);
              }}
              className="cursor-pointer px-3 py-2 text-slate-300 hover:bg-slate-800"
            >
              <span className="font-mono font-bold text-emerald-400">
                {cfop.codigo}
              </span>{" "}
              — {cfop.descricao}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
