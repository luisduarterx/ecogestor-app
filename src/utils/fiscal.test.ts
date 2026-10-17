import { describe, expect, it } from "vitest";
import {
  CSOSN,
  CST_ICMS,
  descreverCodigo,
  emiteNaV1,
  formatarAliquota,
  formatarCest,
  formatarChaveAcesso,
  formatarCpfCnpj,
  formatarNcm,
  formatarNumeroNota,
  itemDaPendencia,
  mensagemErroFiscal,
  notaEditavel,
  opcoesIcms,
  separarPendencias,
  tempoProcessando,
  usaCsosn,
  validarDadosFiscaisMaterial,
} from "./fiscal";
import { MENSAGEM_ACESSO_NEGADO, NOME_ACESSO_NEGADO } from "./autorizacao";

describe("mensagemErroFiscal", () => {
  const padrao = "Não foi possível salvar.";

  it("usa a mensagem da API no acesso negado, ou a mensagem padrão de permissão", () => {
    expect(
      mensagemErroFiscal(
        { statusCode: 403, nome: NOME_ACESSO_NEGADO, mensagem: "Sem acesso." },
        padrao,
      ),
    ).toBe("Sem acesso.");
    expect(
      mensagemErroFiscal({ statusCode: 403, nome: NOME_ACESSO_NEGADO }, padrao),
    ).toBe(MENSAGEM_ACESSO_NEGADO);
  });

  it("avisa sobre sessão expirada no 401", () => {
    expect(mensagemErroFiscal({ statusCode: 401 }, padrao)).toBe(
      "Sua sessão expirou. Entre novamente.",
    );
  });

  it("repassa a mensagem de outros erros e usa o padrão quando não há", () => {
    expect(
      mensagemErroFiscal(
        { statusCode: 422, mensagem: "NCM inválido." },
        padrao,
      ),
    ).toBe("NCM inválido.");
    expect(mensagemErroFiscal(undefined, padrao)).toBe(padrao);
  });
});

describe("validarDadosFiscaisMaterial", () => {
  const base = { ncm: null, cest: null, origemMercadoria: null };

  it("aceita campos vazios no cadastro", () => {
    expect(validarDadosFiscaisMaterial(base)).toBeNull();
  });

  it("exige NCM com 8 dígitos e CEST com 7", () => {
    expect(validarDadosFiscaisMaterial({ ...base, ncm: "1234567" })).toBe(
      "O NCM deve ter 8 dígitos.",
    );
    expect(validarDadosFiscaisMaterial({ ...base, cest: "123456" })).toBe(
      "O CEST deve ter 7 dígitos.",
    );
    expect(
      validarDadosFiscaisMaterial({
        ...base,
        ncm: "12345678",
        cest: "1234567",
      }),
    ).toBeNull();
  });
});

describe("códigos de ICMS", () => {
  it("usa CSOSN no Simples Nacional e no MEI", () => {
    expect(usaCsosn("SIMPLES_NACIONAL")).toBe(true);
    expect(usaCsosn("MEI")).toBe(true);
    expect(usaCsosn("REGIME_NORMAL")).toBe(false);
    expect(usaCsosn("SIMPLES_EXCESSO_SUBLIMITE")).toBe(false);
  });

  it("oferece as opções conforme o regime", () => {
    expect(opcoesIcms("SIMPLES_NACIONAL")).toBe(CSOSN);
    expect(opcoesIcms("REGIME_NORMAL")).toBe(CST_ICMS);
    expect(opcoesIcms(null)).toEqual([...CSOSN, ...CST_ICMS]);
  });

  it("descreve códigos conhecidos e mantém os desconhecidos", () => {
    const [primeiro] = CSOSN;
    expect(descreverCodigo(CSOSN, primeiro.codigo)).toBe(
      `${primeiro.codigo} — ${primeiro.descricao}`,
    );
    expect(descreverCodigo(CSOSN, "000")).toBe("000");
    expect(emiteNaV1(CSOSN, "000")).toBe(false);
  });
});

describe("formatações fiscais", () => {
  it("formata NCM, CEST, CPF e CNPJ", () => {
    expect(formatarNcm("12345678")).toBe("1234.56.78");
    expect(formatarCest("1234567")).toBe("12.345.67");
    expect(formatarCpfCnpj("12345678901")).toBe("123.456.789-01");
    expect(formatarCpfCnpj("12345678000190")).toBe("12.345.678/0001-90");
    expect(formatarCpfCnpj("123")).toBe("123");
    expect(formatarCpfCnpj(null)).toBe("");
  });

  it("formata chave de acesso, número da nota e alíquota", () => {
    expect(formatarChaveAcesso("12345678")).toBe("1234 5678");
    expect(formatarNumeroNota(42)).toBe("000042");
    expect(formatarAliquota(null)).toBeNull();
    expect(formatarAliquota(1.5)).toBe("1,5%");
  });
});

describe("pendências da emissão", () => {
  it("separa as frases da mensagem de pendências", () => {
    expect(
      separarPendencias(
        "A nota possui pendências: Item 1 (PAPELÃO): informe o NCM. Informe o destinatário.",
      ),
    ).toEqual(["Item 1 (PAPELÃO): informe o NCM.", "Informe o destinatário."]);
  });

  it("ignora mensagens que não são de pendências", () => {
    expect(separarPendencias("Erro qualquer.")).toBeNull();
    expect(separarPendencias(undefined)).toBeNull();
  });

  it("identifica o item citado", () => {
    expect(itemDaPendencia("Item 12 (COBRE): informe o NCM.")).toBe(12);
    expect(itemDaPendencia("Informe o destinatário.")).toBeNull();
  });
});

describe("estado da nota", () => {
  it("só permite editar rascunhos e notas rejeitadas", () => {
    expect(notaEditavel("RASCUNHO")).toBe(true);
    expect(notaEditavel("REJEITADA")).toBe(true);
    expect(notaEditavel("AUTORIZADA")).toBe(false);
    expect(notaEditavel("PROCESSANDO")).toBe(false);
    expect(notaEditavel("CANCELADA")).toBe(false);
  });

  it("calcula o tempo em processamento sem valores negativos", () => {
    const agora = Date.parse("2026-01-01T00:01:00Z");
    expect(tempoProcessando({ emitidaEm: null }, agora)).toBe(0);
    expect(tempoProcessando({ emitidaEm: "2026-01-01T00:00:00Z" }, agora)).toBe(
      60_000,
    );
    expect(tempoProcessando({ emitidaEm: "2026-01-01T00:02:00Z" }, agora)).toBe(
      0,
    );
  });
});
