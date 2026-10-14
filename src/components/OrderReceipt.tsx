import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  LARGURA_A4_PAISAGEM_MM,
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
  const folhaA4 = template.paperWidthMm >= LARGURA_A4_PAISAGEM_MM;

  return (
    <article
      id={receiptId}
      className="receipt bg-white p-4 font-mono text-[10px] leading-tight text-black shadow-sm"
      style={{ width: `${template.paperWidthMm}mm` }}
    >
      <CabecalhoCupom template={template} />

      <div className="receipt-separator" />
      <h2 className="receipt-title">
        {isPurchase ? "CUPOM DE COMPRA" : "CUPOM DE VENDA"}
      </h2>

      {folhaA4 ? (
        <section className="receipt-info">
          <div className="receipt-info-line">
            <div className="receipt-strong">PEDIDO: #{data.id}</div>
            <div>
              {isPurchase ? "FORNECEDOR" : "CLIENTE"}: {data.partnerName}
            </div>
            {data.partnerDocument && (
              <div>DOCUMENTO: {data.partnerDocument}</div>
            )}
            {data.partnerPhone && <div>TELEFONE: {data.partnerPhone}</div>}
            {data.partnerAddress && <div>ENDEREÇO: {data.partnerAddress}</div>}
          </div>
          <div className="receipt-info-line">
            <div>EMISSÃO: {formatDate(data.issuedAt)}</div>
            {data.finalizedAt && (
              <div>FINALIZAÇÃO: {formatDate(data.finalizedAt)}</div>
            )}
            <div>STATUS: {data.status}</div>
            {template.showOperator !== false && (
              <div>OPERADOR: {data.operatorName}</div>
            )}
          </div>
        </section>
      ) : (
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
      )}

      <div className="receipt-separator" />
      <section>
        {!folhaA4 && (
          <div className="receipt-row receipt-strong">
            <span>DESCRIÇÃO</span>
            <span>TOTAL</span>
          </div>
        )}
        {data.items.length === 0 ? (
          <div className="receipt-center receipt-empty">
            Nenhum item lançado
          </div>
        ) : folhaA4 ? (
          <table className="receipt-table">
            <thead>
              <tr>
                <th>MATERIAL</th>
                <th>PESO BRUTO</th>
                <th>TARA</th>
                <th>DESCONTO</th>
                <th>PESO LÍQUIDO</th>
                <th>PREÇO/KG</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td className="receipt-strong">
                    {item.description.toUpperCase()}
                  </td>
                  <td>{numberFormatter.format(item.grossWeight)} kg</td>
                  <td>{numberFormatter.format(item.tare)} kg</td>
                  <td>{numberFormatter.format(item.impurity)}%</td>
                  <td>{numberFormatter.format(item.quantity)} kg</td>
                  <td>{moneyFormatter.format(item.unitPrice)}</td>
                  <td>{moneyFormatter.format(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
        <AssinaturaEcoGestor />
      </footer>
    </article>
  );
}

/** Cabeçalho com logo e dados da empresa, compartilhado pelos cupons. */
export function CabecalhoCupom({
  template,
}: {
  template: OrderReceiptTemplate;
}) {
  return (
    <header className="receipt-center receipt-header">
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
      <div className="receipt-header-data">
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
      </div>
    </header>
  );
}

/** Assinatura fixa do sistema: não depende das configurações. */
export function AssinaturaEcoGestor() {
  return (
    <div className="receipt-system">
      <div className="receipt-strong">ECOGESTOR</div>
      <div>Sistema de Gerenciamento de Reciclagens</div>
    </div>
  );
}

/**
 * Exibe um documento reduzido para caber na largura disponível, mantendo as
 * proporções da impressão. A marcação impressa continua a mesma.
 */
export function AjusteDeLargura({
  larguraMm,
  estilos,
  children,
}: {
  larguraMm: number;
  estilos: string;
  children: ReactNode;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [larguraArea, setLarguraArea] = useState(0);
  const larguraDocumento = larguraMm * PIXELS_POR_MM;
  const escala =
    larguraArea > 0 ? Math.min(1, larguraArea / larguraDocumento) : 1;

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
      <style>{estilos}</style>
      <div style={{ zoom: escala }}>{children}</div>
    </div>
  );
}

/** Cupom de pedido reduzido para caber na largura disponível. */
export function CupomAjustado({
  data,
  template,
  receiptId,
}: {
  data: OrderReceiptData;
  template: OrderReceiptTemplate;
  receiptId: string;
}) {
  return (
    <AjusteDeLargura
      larguraMm={template.paperWidthMm}
      estilos={getReceiptCss(template.paperWidthMm)}
    >
      <OrderReceipt data={data} template={template} receiptId={receiptId} />
    </AjusteDeLargura>
  );
}
