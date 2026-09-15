import { exportToCSV, exportToPDF } from "./reportExportStylized";

export interface Report {
  title: string;
  filters: string;
  columns: string[];
  rows: (string | number)[][];
}

export function exportReport(report: Report, format: "csv" | "pdf"): string {
  if (!report.rows.length)
    return "Não há registros para exportar com os filtros atuais.";
  const filename = `${report.title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .toLowerCase()}-${new Date().toISOString().slice(0, 10)}`;
  try {
    if (format === "pdf") {
      exportToPDF(
        report.title,
        report.columns,
        report.rows,
        filename,
        `${report.filters}\nEscopo: registros carregados e filtrados na tela; pode não incluir todo o histórico.`,
        [{ label: "Registros", value: String(report.rows.length) }],
      );
    } else {
      exportToCSV(report.columns, report.rows, filename);
    }
    return `${format.toUpperCase()} gerado com ${report.rows.length} registros filtrados.`;
  } catch {
    return "Não foi possível gerar o relatório. Tente novamente.";
  }
}
