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
import { useTable } from "../../utils/queries";
import type {
  MaterialResponse,
  TableResponse,
} from "../../utils/types";

type PriceTableDocumentTemplate = {
  companyName: string;
  subtitle: string;
  address?: string;
  contact?: string;
  description: string;
  legalNote: string;
};

const DEFAULT_PRICE_TABLE_DOCUMENT: PriceTableDocumentTemplate = {
  companyName: "EcoGestor",
  subtitle: "Soluções ambientais e gestão de resíduos",
  description:
    "Preços vigentes para compra e venda de materiais recicláveis.",
  legalNote:
    "Os valores podem variar de acordo com qualidade, umidade, impurezas e condições do lote.",
};

type DocumentFormat = "a4" | "coupon" | "whatsapp";

type PrintablePrice = {
  id: number;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
};

interface PriceTablePrintModalProps {
  tableId: number;
  materials: MaterialResponse[];
  baseTable?: TableResponse;
  onClose: () => void;
  template?: PriceTableDocumentTemplate;
}

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

function A4PriceTable({
  tableName,
  prices,
  showSellPrice,
  showTons,
  emittedAt,
  template,
  elementId,
}: {
  tableName: string;
  prices: PrintablePrice[];
  showSellPrice: boolean;
  showTons: boolean;
  emittedAt: string;
  template: PriceTableDocumentTemplate;
  elementId: string;
}) {
  return (
    <article
      id={elementId}
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "16mm",
        background: "white",
        color: "#0f172a",
        fontFamily: "Arial, Helvetica, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "24px",
          paddingBottom: "16px",
          borderBottom: "3px solid #0f172a",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", textTransform: "uppercase" }}>
            {template.companyName}
          </h1>
          <div style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
            {template.subtitle}
          </div>
          {template.address && <div style={{ marginTop: "8px", color: "#64748b", fontSize: "10px" }}>{template.address}</div>}
          {template.contact && <div style={{ marginTop: "2px", color: "#64748b", fontSize: "10px" }}>{template.contact}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "10px" }}>
          <div style={{ display: "inline-block", padding: "5px 10px", background: "#0f172a", color: "white", fontWeight: 800, letterSpacing: "1px" }}>
            TABELA VIGENTE
          </div>
          <div style={{ marginTop: "8px", color: "#64748b" }}>Emissão: {emittedAt}</div>
          <div style={{ marginTop: "4px", color: "#059669", fontWeight: 800 }}>STATUS: ATIVA</div>
        </div>
      </header>

      <section style={{ margin: "22px 0 18px" }}>
        <h2 style={{ margin: 0, paddingLeft: "10px", borderLeft: "5px solid #10b981", fontSize: "17px", textTransform: "uppercase" }}>
          {tableName}
        </h2>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "11px" }}>{template.description}</p>
      </section>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #0f172a", color: "#475569", textTransform: "uppercase" }}>
            <th style={{ padding: "8px 4px", textAlign: "left" }}>Material</th>
            <th style={{ padding: "8px", textAlign: "left" }}>Categoria</th>
            <th style={{ padding: "8px 4px", textAlign: "right" }}>Compra/kg</th>
            {showTons && <th style={{ padding: "8px 4px", textAlign: "right" }}>Compra/ton</th>}
            {showSellPrice && <th style={{ padding: "8px 4px", textAlign: "right" }}>Venda/kg</th>}
          </tr>
        </thead>
        <tbody>
          {prices.map((item) => (
            <tr key={item.id} style={{ borderBottom: "1px solid #e2e8f0", breakInside: "avoid" }}>
              <td style={{ padding: "9px 4px", fontWeight: 700 }}>{item.name}</td>
              <td style={{ padding: "9px 8px", color: "#64748b", textTransform: "uppercase", fontSize: "9px" }}>{item.category}</td>
              <td style={{ padding: "9px 4px", textAlign: "right", color: "#047857", fontWeight: 800 }}>{money.format(item.buyPrice)}</td>
              {showTons && <td style={{ padding: "9px 4px", textAlign: "right", fontWeight: 600 }}>{money.format(item.buyPrice * 1000)}</td>}
              {showSellPrice && <td style={{ padding: "9px 4px", textAlign: "right", color: "#0369a1", fontWeight: 800 }}>{money.format(item.sellPrice)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <footer style={{ marginTop: "30px", paddingTop: "14px", borderTop: "1px solid #cbd5e1", color: "#64748b", fontSize: "9px", fontWeight: 700, textAlign: "center", textTransform: "uppercase" }}>
        {template.legalNote}
      </footer>
    </article>
  );
}

function CouponPriceTable({
  tableName,
  prices,
  showSellPrice,
  showTons,
  emittedAt,
  template,
  elementId,
}: {
  tableName: string;
  prices: PrintablePrice[];
  showSellPrice: boolean;
  showTons: boolean;
  emittedAt: string;
  template: PriceTableDocumentTemplate;
  elementId: string;
}) {
  const separator = "------------------------------------------";
  return (
    <article id={elementId} style={{ width: "80mm", minHeight: "100mm", padding: "4mm", background: "white", color: "black", fontFamily: '"Courier New", monospace', fontSize: "10px", lineHeight: 1.25, boxSizing: "border-box" }}>
      <header style={{ textAlign: "center" }}>
        <div style={{ fontSize: "14px", fontWeight: 800, textTransform: "uppercase" }}>*** {template.companyName} ***</div>
        <div style={{ marginTop: "2px", fontSize: "9px", textTransform: "uppercase" }}>{template.subtitle}</div>
        <div style={{ overflow: "hidden", margin: "6px 0", whiteSpace: "nowrap" }}>{separator}</div>
        <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase" }}>{tableName}</div>
        <div style={{ marginTop: "3px", color: "#475569", fontSize: "9px" }}>Emissão: {emittedAt}</div>
      </header>
      <div style={{ overflow: "hidden", margin: "6px 0", whiteSpace: "nowrap" }}>{separator}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontWeight: 800 }}>
        <span>MATERIAL</span><span>COMPRA{showSellPrice ? " / VENDA" : ""}</span>
      </div>
      <div style={{ overflow: "hidden", margin: "4px 0", whiteSpace: "nowrap" }}>{separator}</div>
      {prices.map((item) => (
        <div key={item.id} style={{ marginTop: "6px", breakInside: "avoid" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontWeight: 800 }}>
            <span style={{ maxWidth: showSellPrice ? "42mm" : "52mm", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase" }}>{item.name}</span>
            <span>{money.format(item.buyPrice)}{showSellPrice ? ` / ${money.format(item.sellPrice)}` : ""}</span>
          </div>
          {showTons && <div style={{ display: "flex", justifyContent: "space-between", paddingLeft: "8px", color: "#475569", fontSize: "9px" }}><span>Preço por tonelada</span><span>{money.format(item.buyPrice * 1000)}/t</span></div>}
        </div>
      ))}
      <div style={{ overflow: "hidden", margin: "8px 0", whiteSpace: "nowrap" }}>{separator}</div>
      <footer style={{ textAlign: "center", color: "#475569", fontSize: "9px" }}>
        <div style={{ color: "black", fontWeight: 800 }}>TARIFAS VALIDADAS</div>
        <div style={{ marginTop: "4px" }}>{template.legalNote}</div>
        <div style={{ marginTop: "8px", fontWeight: 800 }}>Obrigado pela parceria!</div>
      </footer>
    </article>
  );
}

export default function PriceTablePrintModal({
  tableId,
  materials,
  baseTable,
  onClose,
  template = DEFAULT_PRICE_TABLE_DOCUMENT,
}: PriceTablePrintModalProps) {
  const tableQuery = useTable(tableId);
  const [format, setFormat] = useState<DocumentFormat>("a4");
  const [showSellPrice, setShowSellPrice] = useState(false);
  const [showTons, setShowTons] = useState(true);
  const [copied, setCopied] = useState(false);
  const documentId = `price-table-${useId().replaceAll(":", "")}`;
  const emittedAt = useMemo(
    () => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
    [],
  );
  const prices = useMemo<PrintablePrice[]>(() => {
    if (!tableQuery.data) return [];
    return materials
      .filter((material) => material.status)
      .map((material) => {
        const tablePrice = tableQuery.data?.materiais.find((item) => item.materialID === material.id)?.preco_compra;
        const basePrice = baseTable?.materiais.find((item) => item.materialID === material.id)?.preco_compra;
        return {
          id: material.id,
          name: material.nome,
          category: material.categoria.nome,
          buyPrice: tablePrice ?? basePrice ?? material.preco_compra,
          sellPrice: material.preco_venda,
        };
      })
      .sort((a, b) => a.category.localeCompare(b.category, "pt-BR") || a.name.localeCompare(b.name, "pt-BR"));
  }, [baseTable, materials, tableQuery.data]);

  const tableName = tableQuery.data?.nome ?? "Tabela de preços";

  function getShareText() {
    const categories = Array.from(new Set(prices.map((item) => item.category)));
    const lines = [
      `♻️ *${tableName.toUpperCase()}*`,
      `📅 Atualizada em ${emittedAt}`,
      `🏭 *${template.companyName}*`,
      "",
    ];
    categories.forEach((category) => {
      lines.push(`📦 *${category.toUpperCase()}*`);
      prices.filter((item) => item.category === category).forEach((item) => {
        let line = `• *${item.name}*: ${money.format(item.buyPrice)}/kg`;
        if (showTons) line += ` (${money.format(item.buyPrice * 1000)}/t)`;
        if (showSellPrice) line += ` | Venda: ${money.format(item.sellPrice)}/kg`;
        lines.push(line);
      });
      lines.push("");
    });
    lines.push(`⚠️ ${template.legalNote}`);
    return lines.join("\n");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareText())}`, "_blank", "noopener,noreferrer");
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

  function printDocument() {
    const target = document.getElementById(documentId);
    if (!target) return;
    const printWindow = window.open("", "_blank", "width=900,height=800");
    if (!printWindow) {
      window.alert("Permita pop-ups para imprimir ou exportar a tabela.");
      return;
    }
    const isCoupon = format === "coupon";
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${tableName}</title><style>*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff}@page{size:${isCoupon ? "80mm auto" : "A4 portrait"};margin:0}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${target.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 150);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="price-print-title" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-800 bg-slate-950/40 px-5 py-4">
          <div className="flex items-center gap-3"><Printer className="h-5 w-5 text-emerald-400" /><div><h2 id="price-print-title" className="text-sm font-bold text-slate-100">Imprimir e compartilhar tabela</h2><p className="text-xs text-slate-400">{tableName}</p></div></div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="w-full shrink-0 space-y-5 overflow-y-auto border-b border-slate-800 p-5 md:w-72 md:border-r md:border-b-0">
            <div><div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Formato</div><div className="grid grid-cols-3 gap-2 md:grid-cols-1">
              {([['a4', 'Documento A4', FileText], ['coupon', 'Cupom 80 mm', Scale], ['whatsapp', 'WhatsApp', MessageCircle]] as const).map(([value, label, Icon]) => <button type="button" key={value} onClick={() => setFormat(value)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold ${format === value ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700"}`}><Icon className="h-4 w-4" />{label}</button>)}
            </div></div>
            <div className="space-y-4 border-t border-slate-800 pt-5">
              <Toggle label="Mostrar preço de venda" checked={showSellPrice} onChange={setShowSellPrice} icon={showSellPrice ? Eye : EyeOff} />
              <Toggle label="Mostrar preço por tonelada" checked={showTons} onChange={setShowTons} icon={Scale} />
              <p className="text-[10px] leading-4 text-slate-500">Por segurança comercial, o preço de venda começa oculto.</p>
            </div>
          </aside>

          <main className="min-w-0 flex-1 overflow-auto bg-slate-950 p-4 md:p-6">
            {tableQuery.isPending && <div className="py-20 text-center text-sm text-slate-400">Carregando tabela...</div>}
            {tableQuery.isError && <div className="mx-auto max-w-md rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-center text-sm text-rose-300">Não foi possível carregar a tabela.<button type="button" onClick={() => tableQuery.refetch()} className="mt-3 block w-full rounded-lg bg-rose-400 px-3 py-2 font-bold text-slate-950">Tentar novamente</button></div>}
            {tableQuery.data && format === "a4" && <div className="mx-auto w-fit origin-top overflow-hidden rounded-lg shadow-2xl"><A4PriceTable tableName={tableName} prices={prices} showSellPrice={showSellPrice} showTons={showTons} emittedAt={emittedAt} template={template} elementId={documentId} /></div>}
            {tableQuery.data && format === "coupon" && <div className="mx-auto w-fit overflow-hidden rounded-sm shadow-2xl"><CouponPriceTable tableName={tableName} prices={prices} showSellPrice={showSellPrice} showTons={showTons} emittedAt={emittedAt} template={template} elementId={documentId} /></div>}
            {tableQuery.data && format === "whatsapp" && <div className="mx-auto max-w-lg"><textarea readOnly value={getShareText()} className="h-[60vh] w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 p-5 font-mono text-xs leading-5 text-emerald-300 outline-none" /></div>}
          </main>
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-800 bg-slate-950/30 px-5 py-4">
          {format === "whatsapp" ? <><button type="button" onClick={() => void copyText()} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700">{copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}{copied ? "Copiado" : "Copiar texto"}</button><button type="button" onClick={() => void nativeShare()} className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-700"><Share2 className="h-4 w-4" />Compartilhar</button><button type="button" onClick={shareWhatsApp} className="flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-300"><MessageCircle className="h-4 w-4" />Abrir WhatsApp</button></> : <button type="button" onClick={printDocument} disabled={!tableQuery.data || prices.length === 0} className="flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-300 disabled:opacity-50"><Printer className="h-4 w-4" />Imprimir / salvar PDF</button>}
        </footer>
      </motion.div>
    </div>
  );
}

function Toggle({ label, checked, onChange, icon: Icon }: { label: string; checked: boolean; onChange: (value: boolean) => void; icon: typeof Eye }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-xs font-medium text-slate-300"><Icon className="h-4 w-4 text-emerald-400" />{label}</span><button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`h-6 w-11 rounded-full p-0.5 transition-colors ${checked ? "bg-emerald-500" : "bg-slate-700"}`}><span className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} /></button></div>;
}
