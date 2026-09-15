import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Exports tabular data to a CSV file.
 * Automatically adds UTF-8 BOM to prevent Excel character encoding issues with Portuguese accents.
 */
export function exportToCSV(
  headers: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const escapeCell = (cell: string | number) => {
    let value =
      typeof cell === "number"
        ? cell.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
        : cell;
    if (typeof cell === "string" && /^\s*[=+@\-\t\r\n]/.test(cell))
      value = "'" + value;
    return `"${value.replace(/"/g, '""')}"`;
  };
  const csvContent =
    "\uFEFF" +
    [
      headers.map(escapeCell).join(";"),
      ...rows.map((row) => row.map(escapeCell).join(";")),
    ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Exports data to a beautifully styled PDF document (A4 Landscape).
 * Features a custom header banner, brand accent coloring, date-stamping, and metadata.
 */
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  subtitle?: string,
  stats?: { label: string; value: string }[],
) {
  const doc = new jsPDF("landscape", "pt", "a4");

  // Slate-900 primary and Emerald-500 brand accent colors
  const brandColor = [15, 23, 42];
  const accentColor = [16, 185, 129];

  // Header Banner Rectangle
  doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
  doc.rect(40, 40, 762, 60, "F");

  // Emerald Accent Strip
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(40, 100, 762, 4, "F");

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("ECOGESTOR - SISTEMA DE CONTROLE AMBIENTAL", 55, 75);

  // Subtitle
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 55, 93);

  // Metadata block (right aligned)
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  const dateStr = new Date().toLocaleDateString("pt-BR");
  const timeStr = new Date().toLocaleTimeString("pt-BR");
  doc.text(`Data Emissão: ${dateStr} às ${timeStr}`, 600, 65);
  doc.text(`Unidade: Usina Leste / Base Operacional`, 600, 78);
  doc.text(`Autorização: Relatório Comercial Oficial`, 600, 91);

  let currentY = 125;

  // Render subtitle text
  if (subtitle) {
    doc.setTextColor(30, 41, 59); // slate-800
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(subtitle, 745);
    doc.text(lines, 45, currentY);
    currentY += lines.length * 13 + 10;
  }

  // Render Stats summary card block if supplied
  if (stats && stats.length > 0) {
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(40, currentY, 762, 35, "F");
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.rect(40, currentY, 762, 35, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600

    let startX = 60;
    stats.forEach((stat) => {
      doc.text(`${stat.label.toUpperCase()}:`, startX, currentY + 20);
      const textW = doc.getTextWidth(`${stat.label.toUpperCase()}: `);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // emerald-500 for stats values
      doc.text(stat.value, startX + textW, currentY + 20);

      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      startX += 180;
    });

    currentY += 50;
  } else {
    currentY += 10;
  }

  // Render table with autoTable
  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: rows.map((row) =>
      row.map((cell) =>
        typeof cell === "number"
          ? cell.toLocaleString("pt-BR", { maximumFractionDigits: 2 })
          : cell,
      ),
    ),
    margin: { left: 40, right: 40, bottom: 45 },
    theme: "striped",
    headStyles: {
      fillColor: brandColor as [number, number, number],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      overflow: "linebreak",
      cellPadding: 5,
    },
  });
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Ecogestor Suite • Relatório Operacional Consolidado • Página ${page} de ${totalPages}`,
      40,
      doc.internal.pageSize.height - 25,
    );
  }

  doc.save(`${filename}.pdf`);
}
