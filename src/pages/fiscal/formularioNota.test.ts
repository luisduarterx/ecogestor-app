import { describe, expect, it } from "vitest";
import { criarItemNotaFiscal, criarNotaFiscal } from "../../testes/fabricas";
import {
  LIMITE_INFORMACOES,
  LIMITE_ITENS,
  LIMITE_TEXTO,
  alteracoesCabecalho,
  cabecalhoDaNota,
  consumidorFinalTravado,
  itensAlterados,
  itensParaEnvio,
  lerDecimal,
  linhaVazia,
  linhasDaNota,
  possuiErros,
  validarFormulario,
  type LinhaItem,
} from "./formularioNota";

function linhaValida(parcial: Partial<LinhaItem> = {}): LinhaItem {
  return {
    ...linhaVazia(),
    materialID: "7",
    quantidade: "10",
    valorUnitario: "1,50",
    ...parcial,
  };
}

describe("lerDecimal", () => {
  it.each([
    ["12", 12],
    ["12,5", 12.5],
    ["12.5", 12.5],
    ["1.250,50", 1250.5],
    [" 3,25 ", 3.25],
    ["0", 0],
  ])("lê %s como %d", (texto, esperado) => {
    expect(lerDecimal(texto)).toBe(esperado);
  });

  it.each(["", "abc", "-1", "1,234", "1.250", "1,2,3", "1e3"])(
    "recusa %s",
    (texto) => {
      expect(lerDecimal(texto)).toBeNull();
    },
  );
});

describe("conversão da nota para o formulário", () => {
  it("preenche os textos e usa vírgula decimal nos itens", () => {
    const nota = criarNotaFiscal({
      itens: [criarItemNotaFiscal({ icmsAliquota: 4.5 })],
    });
    const cabecalho = cabecalhoDaNota(nota);
    expect(cabecalho.destinatario.nome).toBe("Recicla Ltda");
    expect(cabecalho.destinatario.email).toBe("");
    expect(cabecalho.informacoesComplementares).toBe("");

    const [linha] = linhasDaNota(nota);
    expect(linha.chave).toBe("item-10");
    expect(linha.quantidade).toBe("12,5");
    expect(linha.valorUnitario).toBe("0,8");
    expect(linha.tributacao.icmsAliquota).toBe("4,5");
    expect(linha.tributacao.cfop).toBe("");
  });

  it("gera chaves únicas para linhas novas", () => {
    expect(linhaVazia().chave).not.toBe(linhaVazia().chave);
  });
});

describe("alteracoesCabecalho", () => {
  it("não envia nada quando o formulário não mudou", () => {
    const nota = criarNotaFiscal();
    expect(alteracoesCabecalho(cabecalhoDaNota(nota), nota)).toEqual({});
  });

  it("envia apenas os campos alterados, já normalizados", () => {
    const nota = criarNotaFiscal();
    const formulario = cabecalhoDaNota(nota);
    formulario.destinatario.documento = "12.345.678/0001-99";
    formulario.destinatario.uf = "sp";
    formulario.destinatario.email = "  ";
    formulario.veiculo.placa = "abc-1d23";
    formulario.informacoesComplementares = "  Entrega na doca 2 ";

    expect(alteracoesCabecalho(formulario, nota)).toEqual({
      destinatario: { documento: "12345678000199", uf: "SP" },
      veiculo: { placa: "ABC1D23" },
      informacoesComplementares: "Entrega na doca 2",
    });
  });

  it("ignora os blocos que serão substituídos pela ação", () => {
    const nota = criarNotaFiscal();
    const formulario = cabecalhoDaNota(nota);
    formulario.destinatario.nome = "Outro";
    formulario.consumidorFinal = true;
    formulario.transportadora.nome = "Transportes";
    formulario.modalidadeFrete = "EMITENTE";

    expect(
      alteracoesCabecalho(formulario, nota, ["destinatario", "transportadora"]),
    ).toEqual({ modalidadeFrete: "EMITENTE" });
  });
});

describe("itensParaEnvio", () => {
  it("converte números e omite a tributação vazia", () => {
    const linha = linhaValida({ quantidade: "1.000,25" });
    linha.tributacao.cfop = " 5102 ";
    linha.tributacao.icmsAliquota = "12,5";

    expect(itensParaEnvio([linha])).toEqual([
      {
        materialID: 7,
        quantidade: 1000.25,
        valorUnitario: 1.5,
        cfop: "5102",
        icmsAliquota: 12.5,
      },
    ]);
  });

  it("detecta quando os itens diferem da nota salva", () => {
    const nota = criarNotaFiscal({ itens: [criarItemNotaFiscal()] });
    const linhas = linhasDaNota(nota);
    expect(itensAlterados(linhas, nota)).toBe(false);

    linhas[0] = { ...linhas[0], quantidade: "13" };
    expect(itensAlterados(linhas, nota)).toBe(true);
  });
});

describe("validarFormulario", () => {
  const nota = criarNotaFiscal();

  it("aceita um formulário válido", () => {
    const erros = validarFormulario(cabecalhoDaNota(nota), [linhaValida()]);
    expect(erros).toEqual({ cabecalho: [], itens: {} });
    expect(possuiErros(erros)).toBe(false);
  });

  it("valida o documento conforme o tipo do destinatário", () => {
    const formulario = cabecalhoDaNota(nota);
    formulario.destinatario.documento = "123.456.789-01";
    expect(validarFormulario(formulario, []).cabecalho).toContain(
      "Documento do destinatário: o CNPJ deve ter 14 dígitos.",
    );

    formulario.destinatario.tipo = "FISICA";
    formulario.destinatario.documento = "12345678000190";
    expect(validarFormulario(formulario, []).cabecalho).toContain(
      "Documento do destinatário: o CPF deve ter 11 dígitos.",
    );

    formulario.destinatario.tipo = "";
    formulario.destinatario.documento = "123";
    expect(validarFormulario(formulario, []).cabecalho).toContain(
      "Documento do destinatário: informe um CPF (11) ou CNPJ (14 dígitos).",
    );
  });

  it("valida textos longos, UF, CEP e e-mail do destinatário", () => {
    const formulario = cabecalhoDaNota(nota);
    formulario.destinatario.nome = "x".repeat(LIMITE_TEXTO + 1);
    formulario.destinatario.uf = "XX";
    formulario.destinatario.cep = "2000-000";
    formulario.destinatario.email = "contato@empresa";

    expect(validarFormulario(formulario, []).cabecalho).toEqual([
      `Nome do destinatário: use no máximo ${LIMITE_TEXTO} caracteres.`,
      "UF do destinatário: UF inválida.",
      "CEP do destinatário: informe 8 dígitos.",
      "E-mail do destinatário inválido.",
    ]);
  });

  it("só valida transportadora e veículo quando há frete", () => {
    const formulario = cabecalhoDaNota(nota);
    formulario.transportadora.uf = "ZZ";
    formulario.veiculo.placa = "AB12345";
    expect(validarFormulario(formulario, []).cabecalho).toEqual([]);

    formulario.modalidadeFrete = "EMITENTE";
    expect(validarFormulario(formulario, []).cabecalho).toEqual([
      "UF da transportadora: UF inválida.",
      "Placa do veículo: use ABC1234 ou ABC1D23.",
      "Informe a UF do veículo.",
    ]);
  });

  it("aceita placas nos padrões antigo e Mercosul", () => {
    const formulario = cabecalhoDaNota(nota);
    formulario.modalidadeFrete = "DESTINATARIO";
    formulario.veiculo.uf = "RJ";
    for (const placa of ["ABC-1234", "abc1d23"]) {
      formulario.veiculo.placa = placa;
      expect(validarFormulario(formulario, []).cabecalho).toEqual([]);
    }
  });

  it("limita informações complementares e quantidade de itens", () => {
    const formulario = cabecalhoDaNota(nota);
    formulario.informacoesComplementares = "x".repeat(LIMITE_INFORMACOES + 1);
    const linhas = Array.from({ length: LIMITE_ITENS + 1 }, () =>
      linhaValida(),
    );
    expect(validarFormulario(formulario, linhas).cabecalho).toEqual([
      `Informações complementares: use no máximo ${LIMITE_INFORMACOES} caracteres.`,
      `A nota pode ter no máximo ${LIMITE_ITENS} itens.`,
    ]);
  });

  it("aponta os problemas de cada item sem repetir mensagens", () => {
    const linha = linhaValida({
      materialID: "",
      quantidade: "0",
      valorUnitario: "1,234",
    });
    linha.tributacao.cfop = "1102";
    linha.tributacao.icmsAliquota = "101";
    linha.tributacao.pisAliquota = "abc";

    const erros = validarFormulario(cabecalhoDaNota(nota), [linha]);
    expect(erros.itens[linha.chave]).toBe(
      "Corrija: escolha o material, quantidade positiva com até 2 casas, " +
        "valor unitário positivo com até 2 casas, " +
        "CFOP com 4 dígitos iniciado em 5 ou 6, alíquotas de 0 a 100.",
    );
    expect(possuiErros(erros)).toBe(true);
  });
});

describe("consumidorFinalTravado", () => {
  it("trava o consumidor final para não contribuintes", () => {
    expect(consumidorFinalTravado("NAO_CONTRIBUINTE")).toBe(true);
    expect(consumidorFinalTravado("CONTRIBUINTE")).toBe(false);
  });
});
