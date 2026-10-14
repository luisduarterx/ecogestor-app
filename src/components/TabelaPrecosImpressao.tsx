import { AssinaturaEcoGestor, CabecalhoCupom } from "./OrderReceipt";
import type { OrderReceiptTemplate } from "./modals/orderReceiptModel";
import {
  AVISO_TABELA_PRECOS,
  formatarPreco,
  type OpcoesTabelaPrecos,
  type PrecoImpresso,
} from "./modals/tabelaPrecosModelo";

type PropsTabelaPrecos = OpcoesTabelaPrecos & {
  idDocumento: string;
  nomeTabela: string;
  emitidoEm: string;
  precos: PrecoImpresso[];
  empresa: OrderReceiptTemplate;
};

/** Tabela de preços no mesmo modelo do cupom de pedidos (80mm). */
export function CupomTabelaPrecos({
  idDocumento,
  nomeTabela,
  emitidoEm,
  precos,
  empresa,
  mostrarVenda,
}: PropsTabelaPrecos) {
  return (
    <article
      id={idDocumento}
      className="receipt bg-white p-4 font-mono text-[10px] leading-tight text-black shadow-sm"
      style={{ width: "80mm" }}
    >
      <CabecalhoCupom template={empresa} />

      <div className="receipt-separator" />
      <h2 className="receipt-title">TABELA DE PREÇOS</h2>
      <div className="receipt-center receipt-strong">
        {nomeTabela.toUpperCase()}
      </div>
      <div className="receipt-center">EMISSÃO: {emitidoEm}</div>

      <div className="receipt-separator" />
      <div className="receipt-row receipt-strong">
        <span>MATERIAL</span>
        <span>COMPRA/KG</span>
      </div>
      {precos.map((item) => (
        <div className="receipt-item" key={item.id}>
          <div className="receipt-row">
            <span className="receipt-strong">{item.nome.toUpperCase()}</span>
            <span className="receipt-strong">
              {formatarPreco(item.precoCompra)}
            </span>
          </div>
          {mostrarVenda && (
            <div className="receipt-row">
              <span style={{ paddingLeft: "8px" }}>Venda por kg</span>
              <span>{formatarPreco(item.precoVenda)}</span>
            </div>
          )}
        </div>
      ))}

      <div className="receipt-separator" />
      <footer className="receipt-center receipt-footer">
        <div>{AVISO_TABELA_PRECOS}</div>
        <AssinaturaEcoGestor />
      </footer>
    </article>
  );
}

/** Tabela de preços em folha A4 retrato, no estilo de papel timbrado. */
export function TabelaPrecosA4({
  idDocumento,
  nomeTabela,
  emitidoEm,
  precos,
  empresa,
  mostrarVenda,
}: PropsTabelaPrecos) {
  return (
    <article id={idDocumento} className="tabela-a4">
      <header className="tabela-a4-cabecalho">
        {empresa.logoUrl && (
          <img
            src={empresa.logoUrl}
            alt=""
            className="tabela-a4-logo"
            onError={(evento) => {
              evento.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="tabela-a4-empresa">
          {empresa.companyName && <h1>{empresa.companyName}</h1>}
          {empresa.legalName && <div>{empresa.legalName}</div>}
          {empresa.document && (
            <div>
              {empresa.documentLabel ?? "CNPJ/CPF"}: {empresa.document}
            </div>
          )}
          {empresa.address && <div>{empresa.address}</div>}
          {empresa.phone && <div>Telefone: {empresa.phone}</div>}
          {empresa.headerLines?.map((linha, indice) => (
            <div key={`${indice}-${linha}`}>{linha}</div>
          ))}
        </div>
        <div className="tabela-a4-emissao">
          <div className="tabela-a4-selo">TABELA DE PREÇOS</div>
          <div>Emissão: {emitidoEm}</div>
        </div>
      </header>

      <section className="tabela-a4-titulo">
        <h2>{nomeTabela}</h2>
        <p>Preços vigentes por quilo para materiais recicláveis.</p>
      </section>

      <table>
        <thead>
          <tr>
            <th>Material</th>
            <th>Compra/kg</th>
            {mostrarVenda && <th>Venda/kg</th>}
          </tr>
        </thead>
        <tbody>
          {precos.map((item) => (
            <tr key={item.id}>
              <td>{item.nome}</td>
              <td className="tabela-a4-compra">
                {formatarPreco(item.precoCompra)}
              </td>
              {mostrarVenda && (
                <td className="tabela-a4-venda">
                  {formatarPreco(item.precoVenda)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="tabela-a4-observacoes">
        <div>{AVISO_TABELA_PRECOS}</div>
      </div>

      <footer className="tabela-a4-rodape">
        <strong>ECOGESTOR</strong> — Sistema de Gerenciamento de Reciclagens
      </footer>
    </article>
  );
}
