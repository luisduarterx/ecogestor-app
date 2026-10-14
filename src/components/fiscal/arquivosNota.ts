import { mensagemErroFiscal } from "../../utils/fiscal";
import { baixarArquivoNotaFiscal } from "../../utils/queries";
import type { ArquivoNotaFiscal } from "../../utils/types";

/**
 * Abre um PDF da nota em nova aba ou baixa um XML com o nome informado.
 * Retorna a mensagem de erro, ou null em caso de sucesso.
 */
export async function abrirArquivoNota(
  notaID: number,
  arquivo: ArquivoNotaFiscal,
  { rotulo, nome, pdf }: { rotulo: string; nome: string; pdf: boolean },
) {
  // A aba do PDF é aberta já no clique, para não ser bloqueada pelo navegador.
  const janela = pdf ? window.open("", "_blank") : null;
  janela?.document.write(
    `<title>${rotulo}</title><p style="font-family:sans-serif">Carregando ${rotulo}...</p>`,
  );
  try {
    const blob = await baixarArquivoNotaFiscal(notaID, arquivo);
    const url = URL.createObjectURL(blob);
    if (janela) {
      janela.location.href = url;
    } else {
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return null;
  } catch (caught) {
    janela?.close();
    return mensagemErroFiscal(
      caught,
      `Não foi possível baixar o ${rotulo}. Tente novamente.`,
    );
  }
}
