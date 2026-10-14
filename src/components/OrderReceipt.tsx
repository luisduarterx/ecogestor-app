import { useEffect, useRef, useState } from "react";
import {
  getReceiptCss,
  type OrderReceiptData,
  type OrderReceiptTemplate,
} from "./modals/orderReceiptModel";

const PIXELS_POR_MM = 96 / 25.4;

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
});

function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OrderReceipt({
  data,
  template,
  receiptId,
}: {
  data: OrderReceiptData;
  template: OrderReceiptTemplate;
  receiptId: string;
}) {
  const isPurchase = data.type === "COMPRA";

  return (
    <article
      id={receiptId}
      className="receipt bg-white p-4 font-mono text-[10px] leading-tight text-black shadow-sm"
      style={{ width: `${template.paperWidthMm}mm` }}
    >
      <header className="receipt-center">
        {template.logoUrl && (
          <img
            src={template.logoUrl}
            alt=""
            className="receipt-logo"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        )}
        {template.companyName && (
          <h1 className="receipt-company">{template.companyName}</h1>
        )}
        {template.legalName && <div>{template.legalName}</div>}
        {template.document && (
          <div>
            {template.documentLabel ?? "CNPJ/CPF"}: {template.document}
          </div>
        )}
        {template.address && <div>{template.address}</div>}
        {template.phone && <div>Telefone: {template.phone}</div>}
        {template.headerLines?.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
      </header>

      <div className="receipt-separator" />
      <h2 className="receipt-title">
        {isPurchase ? "CUPOM DE COMPRA" : "CUPOM DE VENDA"}
      </h2>

      <section>
        <div>PEDIDO: #{data.id}</div>
        <div>EMISSÃO: {formatDate(data.issuedAt)}</div>
        {data.finalizedAt && (
          <div>FINALIZAÇÃO: {formatDate(data.finalizedAt)}</div>
        )}
        <div>STATUS: {data.status}</div>
        <div>
          {isPurchase ? "FORNECEDOR" : "CLIENTE"}: {data.partnerName}
        </div>
        {data.partnerDocument && <div>DOCUMENTO: {data.partnerDocument}</div>}
        {template.showOperator !== false && (
          <div>OPERADOR: {data.operatorName}</div>
        )}
      </section>

      <div className="receipt-separator" />
      <section>
        <div className="receipt-row receipt-strong">
          <span>DESCRIÇÃO</span>
          <span>TOTAL</span>
        </div>
        {data.items.length === 0 ? (
          <div className="receipt-center receipt-empty">
            Nenhum item lançado
          </div>
        ) : (
          data.items.map((item) => (
            <div className="receipt-item" key={item.id}>
              <div className="receipt-strong">
                {item.description.toUpperCase()}
              </div>
              <div className="receipt-row">
                <span>
                  {numberFormatter.format(item.quantity)} kg ×{" "}
                  {moneyFormatter.format(item.unitPrice)}
                </span>
                <span>{moneyFormatter.format(item.total)}</span>
              </div>
            </div>
          ))
        )}
      </section>

      <div className="receipt-separator" />
      <div className="receipt-row receipt-total">
        <span>TOTAL</span>
        <span>{moneyFormatter.format(data.total)}</span>
      </div>
      <div className="receipt-separator" />

      <footer className="receipt-center receipt-footer">
        {template.footerLines.map((line, index) => (
          <div key={`${index}-${line}`}>{line}</div>
        ))}
        <div className="receipt-code">
          PED-{String(data.id).padStart(8, "0")}
        </div>
        {/* Assinatura fixa do sistema: não depende das configurações. */}
        <div className="receipt-system">
          <div className="receipt-strong">ECOGESTOR</div>
          <div>Sistema de Gerenciamento de Reciclagens</div>
        </div>
      </footer>
    </article>
  );
}

/**
 * Exibe o cupom reduzido para caber na largura disponível, mantendo as
 * proporções da impressão. A marcação impressa continua sendo a do cupom.
 */
export function CupomAjustado({
  data,
  template,
  receiptId,
}: {
  data: OrderReceiptData;
  template: OrderReceiptTemplate;
  receiptId: string;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [larguraArea, setLarguraArea] = useState(0);
  const larguraCupom = template.paperWidthMm * PIXELS_POR_MM;
  const escala = larguraArea > 0 ? Math.min(1, larguraArea / larguraCupom) : 1;

  useEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const observador = new ResizeObserver(([entrada]) =>
      setLarguraArea(entrada.contentRect.width),
    );
    observador.observe(area);
    return () => observador.disconnect();
  }, []);

  return (
    <div ref={areaRef} className="flex w-full justify-center overflow-hidden">
      <style>{getReceiptCss(template.paperWidthMm)}</style>
      <div style={{ zoom: escala }}>
        <OrderReceipt data={data} template={template} receiptId={receiptId} />
      </div>
    </div>
  );
}
