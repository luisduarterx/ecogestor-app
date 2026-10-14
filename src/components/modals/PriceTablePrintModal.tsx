import { motion } from "motion/react";
import {
  Check,
  Copy,
  Eye,
  EyeOff,
  FileText,
  MessageCircle,
  Printer,
  Scale,
  Share2,
  X,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useConfiguracoesSistema, useTable } from "../../utils/queries";
import { imprimirHtml } from "../../utils/impressao";
import type { MaterialResponse, TableResponse } from "../../utils/types";
import { AjusteDeLargura } from "../OrderReceipt";
import { CupomTabelaPrecos, TabelaPrecosA4 } from "../TabelaPrecosImpressao";
import {
  MODELO_CUPOM_VAZIO,
  getReceiptCss,
  resolverModeloCupom,
} from "./orderReceiptModel";
import {
  AVISO_TABELA_PRECOS,
  LARGURA_A4_RETRATO_MM,
  agruparPorCategoria,
  formatarPreco,
  getCssTabelaA4,
  type PrecoImpresso,
} from "./tabelaPrecosModelo";

type DocumentFormat = "a4" | "coupon" | "whatsapp";

interface PriceTablePrintModalProps {
  tableId: number;
  materials: MaterialResponse[];
  baseTable?: TableResponse;
  onClose: () => void;
}

export default function PriceTablePrintModal({
  tableId,
  materials,
  baseTable,
  onClose,
}: PriceTablePrintModalProps) {
  const tableQuery = useTable(tableId);
  const configuracaoQuery = useConfiguracoesSistema();
  // Sem permissão ou sem acesso às configurações, sai sem dados da empresa.
  const empresa = configuracaoQuery.isError
    ? MODELO_CUPOM_VAZIO
    : resolverModeloCupom(configuracaoQuery.data, null);
  const [printError, setPrintError] = useState("");
  const [format, setFormat] = useState<DocumentFormat>("a4");
  const [showSellPrice, setShowSellPrice] = useState(false);
  const [copied, setCopied] = useState(false);
  const documentId = `price-table-${useId().replaceAll(":", "")}`;
  const emittedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date()),
    [],
  );
  const prices = useMemo<PrecoImpresso[]>(() => {
    if (!tableQuery.data) return [];
    return materials
      .filter((material) => material.status)
      .map((material) => {
        const tablePrice = tableQuery.data?.materiais.find(
          (item) => item.materialID === material.id,
        )?.preco_compra;
        const basePrice = baseTable?.materiais.find(
          (item) => item.materialID === material.id,
        )?.preco_compra;
        return {
          id: material.id,
          nome: material.nome,
          categoria: material.categoria.nome,
          precoCompra: tablePrice ?? basePrice ?? material.preco_compra,
          precoVenda: material.preco_venda,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [baseTable, materials, tableQuery.data]);

  const tableName = tableQuery.data?.nome ?? "Tabela de preços";
  const documentProps = {
    idDocumento: documentId,
    nomeTabela: tableName,
    emitidoEm: emittedAt,
    precos: prices,
    // A tabela em cupom sempre usa a bobina de 80mm.
    empresa: { ...(empresa ?? MODELO_CUPOM_VAZIO), paperWidthMm: 80 },
    mostrarVenda: showSellPrice,
  };

  function getShareText() {
    const lines = [
      `♻️ *${tableName.toUpperCase()}*`,
      `📅 Atualizada em ${emittedAt}`,
    ];
    if (empresa?.companyName) lines.push(`🏭 *${empresa.companyName}*`);
    lines.push("");
    agruparPorCategoria(prices).forEach(([category, items]) => {
      lines.push(`📦 *${category.toUpperCase()}*`);
      items.forEach((item) => {
        let line = `• *${item.nome}*: ${formatarPreco(item.precoCompra)}/kg`;
        if (showSellPrice)
          line += ` | Venda: ${formatarPreco(item.precoVenda)}/kg`;
        lines.push(line);
      });
      lines.push("");
    });
    lines.push(`⚠️ ${AVISO_TABELA_PRECOS}`);
    return lines.join("\n");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert(
        "Não foi possível copiar. Selecione o texto e copie manualmente.",
      );
    }
  }

  function shareWhatsApp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(getShareText())}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyText();
      return;
    }
    try {
      await navigator.share({ title: tableName, text: getShareText() });
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") await copyText();
    }
  }

  async function printDocument() {
    const target = document.getElementById(documentId);
    if (!target) return;
    setPrintError("");
    try {
      await imprimirHtml(
        tableName,
        format === "coupon" ? getReceiptCss(80, true) : getCssTabelaA4(true),
        target.outerHTML,
      );
    } catch {
      setPrintError("Não foi possível abrir a impressão da tabela.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-print-title"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <Printer className="h-5 w-5 text-emerald-400" />
            <div>
              <h2
                id="price-print-title"
                className="text-sm font-bold text-slate-100"
              >
                Imprimir e compartilhar tabela
              </h2>
              <p className="text-xs text-slate-400">{tableName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="w-full shrink-0 space-y-5 overflow-y-auto border-b border-slate-800 p-5 md:w-72 md:border-r md:border-b-0">
            <div>
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Formato
              </div>
              <div className="grid grid-cols-3 gap-2 md:grid-cols-1">
                {(
                  [
                    ["a4", "Documento A4", FileText],
                    ["coupon", "Cupom 80 mm", Scale],
                    ["whatsapp", "WhatsApp", MessageCircle],
                  ] as const
                ).map(([value, label, Icon]) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setFormat(value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${format === value ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"}`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4 border-t border-slate-800 pt-5">
              <Toggle
                label="Mostrar preço de venda"
                checked={showSellPrice}
                onChange={setShowSellPrice}
                icon={showSellPrice ? Eye : EyeOff}
              />
              <p className="text-[10px] leading-4 text-slate-500">
                Por segurança comercial, o preço de venda começa oculto.
              </p>
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-auto bg-slate-950 p-4 md:p-6">
            {tableQuery.isPending && (
              <div className="py-20 text-center text-sm text-slate-400">
                Carregando tabela...
              </div>
            )}
            {tableQuery.isError && (
              <div className="mx-auto max-w-md rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-sm text-rose-300">
                Não foi possível carregar a tabela.
                <button
                  type="button"
                  onClick={() => tableQuery.refetch()}
                  className="mt-3 block w-full rounded-lg bg-rose-400 px-3 py-2 font-bold text-slate-950"
                >
                  Tentar novamente
                </button>
              </div>
            )}
            {tableQuery.data && empresa && format === "a4" && (
              <div className="mx-auto max-w-[210mm] overflow-hidden rounded-lg shadow-2xl">
                <AjusteDeLargura
                  larguraMm={LARGURA_A4_RETRATO_MM}
                  estilos={getCssTabelaA4()}
                >
                  <TabelaPrecosA4 {...documentProps} />
                </AjusteDeLargura>
              </div>
            )}
            {tableQuery.data && empresa && format === "coupon" && (
              <div className="mx-auto w-fit overflow-hidden rounded-sm shadow-2xl">
                <AjusteDeLargura larguraMm={80} estilos={getReceiptCss(80)}>
                  <CupomTabelaPrecos {...documentProps} />
                </AjusteDeLargura>
              </div>
            )}
            {tableQuery.data && format === "whatsapp" && (
              <div className="mx-auto max-w-lg">
                <textarea
                  readOnly
                  value={getShareText()}
                  className="h-[60vh] w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 p-5 font-mono text-xs leading-5 text-emerald-300 outline-none"
                />
              </div>
            )}
          </main>
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-800 bg-slate-950/30 px-5 py-4">
          {format === "whatsapp" ? (
            <>
              <button
                type="button"
                onClick={() => void copyText()}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado" : "Copiar texto"}
              </button>
              <button
                type="button"
                onClick={() => void nativeShare()}
                className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-300"
              >
                <MessageCircle className="h-4 w-4" />
                Abrir WhatsApp
              </button>
            </>
          ) : (
            <>
              {printError && (
                <p className="self-center text-xs text-rose-300" role="alert">
                  {printError}
                </p>
              )}
              <button
                type="button"
                onClick={() => void printDocument()}
                disabled={!tableQuery.data || !empresa || prices.length === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
              >
                <Printer className="h-4 w-4" />
                Imprimir / salvar PDF
              </button>
            </>
          )}
        </footer>
      </motion.div>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon: typeof Eye;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-xs font-medium text-slate-300">
        <Icon className="h-4 w-4 text-emerald-400" />
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`h-6 w-11 rounded-full p-0.5 transition-colors ${checked ? "bg-emerald-500" : "bg-slate-700"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
