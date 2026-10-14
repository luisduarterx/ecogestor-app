const TEMPO_MAXIMO_IMAGENS_MS = 3000;
const ID_IFRAME_IMPRESSAO = "ecogestor-iframe-impressao";

function aguardarImagens(documento: Document) {
  const pendentes = Array.from(documento.images).filter(
    (imagem) => !imagem.complete,
  );
  const carregamentos = pendentes.map(
    (imagem) =>
      new Promise<void>((resolver) => {
        imagem.addEventListener("load", () => resolver(), { once: true });
        imagem.addEventListener("error", () => resolver(), { once: true });
      }),
  );
  const limite = new Promise<void>((resolver) =>
    window.setTimeout(resolver, TEMPO_MAXIMO_IMAGENS_MS),
  );
  return Promise.race([Promise.all(carregamentos), limite]);
}

/**
 * Imprime um documento HTML por um iframe oculto. Diferente de um pop-up,
 * o iframe não é bloqueado pelo navegador quando a impressão é disparada
 * fora de um clique, como na impressão automática após finalizar um pedido.
 */
export async function imprimirHtml(
  titulo: string,
  estilos: string,
  corpo: string,
) {
  // Um único iframe é mantido; cada nova impressão substitui o anterior.
  document.getElementById(ID_IFRAME_IMPRESSAO)?.remove();
  const iframe = document.createElement("iframe");
  iframe.id = ID_IFRAME_IMPRESSAO;
  iframe.setAttribute("aria-hidden", "true");
  iframe.title = titulo;
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
  });
  document.body.appendChild(iframe);

  const janela = iframe.contentWindow;
  const documento = iframe.contentDocument;
  if (!janela || !documento) {
    iframe.remove();
    throw new Error("Não foi possível preparar a impressão.");
  }

  documento.open();
  documento.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${titulo}</title><style>${estilos}</style></head><body>${corpo}</body></html>`,
  );
  documento.close();

  await aguardarImagens(documento);
  janela.focus();
  janela.print();
}
