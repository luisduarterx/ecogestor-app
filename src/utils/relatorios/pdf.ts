import { jsPDF } from "jspdf";
import autoTable, { type RowInput } from "jspdf-autotable";
import {
  calcularTotais,
  formatarCelula,
  formatarDataHora,
  nomeArquivoRelatorio,
} from "./formatacao";
import type { ContextoEmissao, Relatorio, TipoColuna } from "./tipos";

type Cor = [number, number, number];

const COR_TEXTO: Cor = [15, 23, 42]; // slate-900
const COR_SECUNDARIA: Cor = [71, 85, 105]; // slate-600
const COR_SUAVE: Cor = [148, 163, 184]; // slate-400
const COR_BORDA: Cor = [226, 232, 240]; // slate-200
const COR_FUNDO: Cor = [248, 250, 252]; // slate-50
const COR_DESTAQUE: Cor = [4, 120, 87]; // emerald-700

const MARGEM = 36;
const ALTURA_MAXIMA_LOGO = 42;
const LARGURA_MAXIMA_LOGO = 150;
const TEMPO_MAXIMO_LOGO_MS = 4000;

const ALINHAMENTO: Record<TipoColuna, "left" | "right"> = {
  texto: "left",
  codigo: "left",
  data: "left",
  peso: "right",
  moeda: "right",
};

type Logo = { dados: string; largura: number; altura: number };

/**
 * Converte o logotipo em PNG por um canvas. Se a imagem não puder ser lida
 * (endereço inválido, bloqueio de CORS ou demora), o relatório sai sem logo.
 */
function carregarLogo(url?: string): Promise<Logo | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolver) => {
    const imagem = new Image();
    imagem.crossOrigin = "anonymous";
    const limite = window.setTimeout(
      () => resolver(null),
      TEMPO_MAXIMO_LOGO_MS,
    );
    imagem.onload = () => {
      window.clearTimeout(limite);
      try {
        // Reduz imagens grandes para não pesar o arquivo.
        const escala = Math.min(1, 600 / imagem.naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(imagem.naturalWidth * escala));
        canvas.height = Math.max(1, Math.round(imagem.naturalHeight * escala));
        canvas
          .getContext("2d")
          ?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
        resolver({
          dados: canvas.toDataURL("image/png"),
          largura: canvas.width,
          altura: canvas.height,
        });
      } catch {
        resolver(null);
      }
    };
    imagem.onerror = () => {
      window.clearTimeout(limite);
      resolver(null);
    };
    imagem.src = url;
  });
}

function definirTexto(doc: jsPDF, tamanho: number, cor: Cor, negrito = false) {
  doc.setFont("helvetica", negrito ? "bold" : "normal");
  doc.setFontSize(tamanho);
  doc.setTextColor(...cor);
}

/** Desenha o cabeçalho da empresa e retorna a posição vertical seguinte. */
function desenharCabecalho(
  doc: jsPDF,
  contexto: ContextoEmissao,
  logo: Logo | null,
) {
  const largura = doc.internal.pageSize.getWidth();
  const { empresa } = contexto;
  let x = MARGEM;
  let alturaCabecalho = 0;

  if (logo) {
    const escala = Math.min(
      ALTURA_MAXIMA_LOGO / logo.altura,
      LARGURA_MAXIMA_LOGO / logo.largura,
    );
    const larguraLogo = logo.largura * escala;
    const alturaLogo = logo.altura * escala;
    doc.addImage(logo.dados, "PNG", MARGEM, MARGEM, larguraLogo, alturaLogo);
    x += larguraLogo + 18;
    alturaCabecalho = alturaLogo;
  }

  const larguraTexto = largura - x - MARGEM;
  let y = MARGEM + 10;
  if (empresa.companyName) {
    definirTexto(doc, 13, COR_TEXTO, true);
    doc.text(empresa.companyName.toUpperCase(), x, y);
    y += 13;
  }
  definirTexto(doc, 8, COR_SECUNDARIA);
  const linhasEmpresa = [
    empresa.legalName,
    empresa.document &&
      `${empresa.documentLabel ?? "CNPJ/CPF"}: ${empresa.document}`,
    empresa.address,
    empresa.phone && `Telefone: ${empresa.phone}`,
  ].filter((linha): linha is string => Boolean(linha));
  linhasEmpresa.forEach((linha) => {
    const partes = doc.splitTextToSize(linha, larguraTexto) as string[];
    doc.text(partes, x, y);
    y += partes.length * 10;
  });

  const fimCabecalho = Math.max(MARGEM + alturaCabecalho, y - 4) + 10;
  doc.setDrawColor(...COR_DESTAQUE);
  doc.setLineWidth(1.5);
  doc.line(MARGEM, fimCabecalho, largura - MARGEM, fimCabecalho);
  return fimCabecalho + 22;
}

function desenharTituloEFiltros(
  doc: jsPDF,
  relatorio: Relatorio,
  contexto: ContextoEmissao,
  inicioY: number,
) {
  const largura = doc.internal.pageSize.getWidth();
  let y = inicioY;

  definirTexto(doc, 15, COR_TEXTO, true);
  doc.text(relatorio.titulo, MARGEM, y);
  definirTexto(doc, 8, COR_SECUNDARIA);
  doc.text(
    `Emitido em ${formatarDataHora(contexto.emitidoEm)} por ${contexto.usuario}`,
    largura - MARGEM,
    y,
    { align: "right" },
  );
  y += 16;

  if (relatorio.filtros.length > 0) {
    const texto = relatorio.filtros
      .map((filtro) => `${filtro.rotulo}: ${filtro.valor}`)
      .join("   •   ");
    definirTexto(doc, 8.5, COR_SECUNDARIA);
    const partes = doc.splitTextToSize(
      `Filtros: ${texto}`,
      largura - MARGEM * 2,
    ) as string[];
    doc.text(partes, MARGEM, y);
    y += partes.length * 11;
  }
  return y + 6;
}

function desenharResumo(doc: jsPDF, relatorio: Relatorio, inicioY: number) {
  if (relatorio.resumo.length === 0) return inicioY;
  const largura = doc.internal.pageSize.getWidth() - MARGEM * 2;
  const espaco = 8;
  const larguraCartao =
    (largura - espaco * (relatorio.resumo.length - 1)) /
    relatorio.resumo.length;
  const altura = 40;

  relatorio.resumo.forEach((item, indice) => {
    const x = MARGEM + indice * (larguraCartao + espaco);
    doc.setFillColor(...COR_FUNDO);
    doc.setDrawColor(...COR_BORDA);
    doc.setLineWidth(0.75);
    doc.roundedRect(x, inicioY, larguraCartao, altura, 4, 4, "FD");
    definirTexto(doc, 7, COR_SECUNDARIA, true);
    doc.text(item.rotulo.toUpperCase(), x + 10, inicioY + 14);
    definirTexto(doc, 11.5, COR_TEXTO, true);
    doc.text(item.valor, x + 10, inicioY + 30);
  });
  return inicioY + altura + 14;
}

function desenharRodapes(doc: jsPDF) {
  const total = doc.getNumberOfPages();
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  for (let pagina = 1; pagina <= total; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(...COR_BORDA);
    doc.setLineWidth(0.75);
    doc.line(MARGEM, altura - 34, largura - MARGEM, altura - 34);
    definirTexto(doc, 7.5, COR_TEXTO, true);
    doc.text("ECOGESTOR", MARGEM, altura - 22);
    definirTexto(doc, 7.5, COR_SUAVE);
    doc.text(
      "Sistema de Gerenciamento de Reciclagens",
      MARGEM + doc.getTextWidth("ECOGESTOR") + 6,
      altura - 22,
    );
    doc.text(`Página ${pagina} de ${total}`, largura - MARGEM, altura - 22, {
      align: "right",
    });
  }
}

export async function gerarPdfRelatorio(
  relatorio: Relatorio,
  contexto: ContextoEmissao,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const logo = await carregarLogo(contexto.empresa.logoUrl);

  let y = desenharCabecalho(doc, contexto, logo);
  y = desenharTituloEFiltros(doc, relatorio, contexto, y);
  y = desenharResumo(doc, relatorio, y);

  const totais = calcularTotais(relatorio);
  const rodapeTabela: RowInput[] | undefined = totais
    ? [
        totais.map((valor, indice) =>
          indice === 0
            ? "TOTAL"
            : valor === null
              ? ""
              : formatarCelula(valor, relatorio.colunas[indice], "pdf"),
        ),
      ]
    : undefined;

  autoTable(doc, {
    startY: y,
    margin: { top: MARGEM, left: MARGEM, right: MARGEM, bottom: 46 },
    head: [relatorio.colunas.map((coluna) => coluna.titulo)],
    body: relatorio.linhas.map((linha) =>
      linha.map((valor, indice) =>
        formatarCelula(valor, relatorio.colunas[indice], "pdf"),
      ),
    ),
    foot: rodapeTabela,
    showFoot: "lastPage",
    showHead: "everyPage",
    theme: "plain",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      textColor: COR_TEXTO,
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
      overflow: "linebreak",
      lineColor: COR_BORDA,
    },
    headStyles: {
      fillColor: COR_DESTAQUE,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    footStyles: {
      fillColor: COR_FUNDO,
      textColor: COR_TEXTO,
      fontStyle: "bold",
      lineWidth: { top: 1 },
      lineColor: COR_DESTAQUE,
    },
    alternateRowStyles: { fillColor: COR_FUNDO },
    columnStyles: Object.fromEntries(
      relatorio.colunas.map((coluna, indice) => [
        indice,
        {
          halign: ALINHAMENTO[coluna.tipo],
          cellWidth: coluna.tipo === "texto" ? "auto" : ("wrap" as const),
        },
      ]),
    ),
    didParseCell: (celula) => {
      // Mantém o alinhamento numérico também no cabeçalho e no total.
      if (celula.section !== "body") {
        celula.cell.styles.halign =
          ALINHAMENTO[relatorio.colunas[celula.column.index].tipo];
      }
    },
  });

  desenharRodapes(doc);
  doc.save(`${nomeArquivoRelatorio(relatorio.titulo, contexto.emitidoEm)}.pdf`);
}
