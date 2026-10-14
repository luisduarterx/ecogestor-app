import {
  baixarArquivo,
  calcularTotais,
  formatarCelula,
  nomeArquivoRelatorio,
} from "./formatacao";
import type { Relatorio } from "./tipos";

function escaparCelula(valor: string) {
  // Evita que planilhas interpretem o conteúdo como fórmula.
  const seguro = /^\s*[=+@\-\t\r\n]/.test(valor) ? `'${valor}` : valor;
  return `"${seguro.replace(/"/g, '""')}"`;
}

export function gerarCsvRelatorio(relatorio: Relatorio, emitidoEm: Date) {
  const linhas = relatorio.linhas.map((linha) =>
    linha.map((valor, indice) =>
      formatarCelula(valor, relatorio.colunas[indice], "csv"),
    ),
  );
  const totais = calcularTotais(relatorio);
  if (totais) {
    linhas.push(
      totais.map((valor, indice) =>
        indice === 0
          ? "TOTAL"
          : valor === null
            ? ""
            : formatarCelula(valor, relatorio.colunas[indice], "csv"),
      ),
    );
  }

  const conteudo =
    "﻿" +
    [relatorio.colunas.map((coluna) => coluna.titulo), ...linhas]
      .map((linha) => linha.map(escaparCelula).join(";"))
      .join("\n");

  baixarArquivo(
    new Blob([conteudo], { type: "text/csv;charset=utf-8;" }),
    `${nomeArquivoRelatorio(relatorio.titulo, emitidoEm)}.csv`,
  );
}
