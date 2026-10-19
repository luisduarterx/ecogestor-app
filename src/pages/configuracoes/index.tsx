import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  HelpCircle,
  Loader2,
  MapPin,
  Printer,
  QrCode,
  RotateCcw,
  Save,
  Settings,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { LayoutBase } from "../../components/LayoutBase";
import { CupomAjustado } from "../../components/OrderReceipt";
import {
  configuracaoParaModeloCupom,
  formatarCep,
  formatarDocumentoEmpresa,
  somenteDigitos,
  type OrderReceiptData,
  type OrderReceiptTemplate,
} from "../../components/modals/orderReceiptModel";
import { useLoggedUser } from "../../context/useLoggedUser";
import { AlterarSenha } from "./AlterarSenha";
import {
  useAtualizarConfiguracoesSistema,
  useConfiguracoesSistema,
} from "../../utils/queries";
import type {
  ApiError,
  AtualizarConfiguracaoSistemaInput,
  ConfiguracaoSistemaCampos,
  ConfiguracaoSistemaResponse,
  FormatoImpressao,
  TipoDocumentoEmpresa,
} from "../../utils/types";

type Aba = "empresa" | "impressao";

type CampoTexto = {
  [
    Campo in keyof ConfiguracaoSistemaCampos
  ]: ConfiguracaoSistemaCampos[Campo] extends string | null ? Campo : never;
}[keyof ConfiguracaoSistemaCampos];

type CampoBooleano = {
  [
    Campo in keyof ConfiguracaoSistemaCampos
  ]: ConfiguracaoSistemaCampos[Campo] extends boolean ? Campo : never;
}[keyof ConfiguracaoSistemaCampos];

type FormularioConfiguracao = Record<
  Exclude<CampoTexto, "tipoDocumento">,
  string
> &
  Pick<ConfiguracaoSistemaCampos, CampoBooleano | "formatoImpressaoPadrao"> & {
    tipoDocumento: TipoDocumentoEmpresa | "";
  };

type ErrosFormulario = Partial<Record<keyof FormularioConfiguracao, string>>;

const CAMPOS_TEXTO = [
  "razaoSocial",
  "nomeFantasia",
  "documento",
  "inscricaoEstadual",
  "telefone",
  "email",
  "logotipoUrl",
  "cep",
  "estado",
  "cidade",
  "bairro",
  "logradouro",
  "numero",
  "complemento",
  "mensagemCabecalho",
  "mensagemRodape",
] as const satisfies readonly Exclude<CampoTexto, "tipoDocumento">[];

const CAMPOS_BOOLEANOS = [
  "exibirDadosEmpresa",
  "exibirOperador",
  "imprimirAutomaticamente",
] as const satisfies readonly CampoBooleano[];

// Valores padrão definidos no schema da API para a primeira configuração.
const PADROES_BOOLEANOS: Pick<ConfiguracaoSistemaCampos, CampoBooleano> = {
  exibirDadosEmpresa: true,
  exibirOperador: true,
  imprimirAutomaticamente: false,
};

const LIMITES_TEXTO: Record<(typeof CAMPOS_TEXTO)[number], number> = {
  razaoSocial: 200,
  nomeFantasia: 200,
  documento: 20,
  inscricaoEstadual: 30,
  telefone: 30,
  email: 254,
  logotipoUrl: 2048,
  cep: 10,
  estado: 2,
  cidade: 120,
  bairro: 120,
  logradouro: 200,
  numero: 30,
  complemento: 120,
  mensagemCabecalho: 2000,
  mensagemRodape: 2000,
};

const ABA_DO_CAMPO: Partial<Record<keyof FormularioConfiguracao, Aba>> = {
  tipoDocumento: "empresa",
  documento: "empresa",
  email: "empresa",
  logotipoUrl: "empresa",
  cep: "empresa",
  estado: "empresa",
};

const UFS = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
];

// Pedido fictício usado apenas nas pré-visualizações do comprovante.
const PEDIDO_EXEMPLO: OrderReceiptData = {
  id: 894,
  type: "COMPRA",
  status: "FECHADO",
  issuedAt: "2026-10-13T10:05:00",
  finalizedAt: "2026-10-13T10:15:00",
  partnerName: "Recicla Vale Ltda",
  partnerDocument: "12.345.678/0001-95",
  partnerPhone: "(21) 99999-0000",
  partnerAddress: "Rua das Sucatas, 120 - Centro - Rio de Janeiro - RJ",
  operatorName: "Operador",
  items: [
    {
      id: 1,
      description: "PET Transparente",
      grossWeight: 1340,
      tare: 40,
      impurity: 5,
      quantity: 1235,
      unitPrice: 2.1,
      total: 2593.5,
    },
    {
      id: 2,
      description: "Alumínio Latinha",
      grossWeight: 215,
      tare: 15,
      impurity: 0,
      quantity: 200,
      unitPrice: 6.8,
      total: 1360,
    },
  ],
  total: 3953.5,
};

const CLASSE_CAMPO =
  "w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-60";

function paraFormulario(
  configuracao: ConfiguracaoSistemaResponse | null,
): FormularioConfiguracao {
  const formulario = {} as FormularioConfiguracao;
  CAMPOS_TEXTO.forEach((campo) => {
    formulario[campo] = configuracao?.[campo] ?? "";
  });
  CAMPOS_BOOLEANOS.forEach((campo) => {
    formulario[campo] = configuracao?.[campo] ?? PADROES_BOOLEANOS[campo];
  });
  formulario.documento = somenteDigitos(formulario.documento);
  formulario.cep = somenteDigitos(formulario.cep);
  formulario.tipoDocumento = configuracao?.tipoDocumento ?? "";
  formulario.formatoImpressaoPadrao =
    configuracao?.formatoImpressaoPadrao ?? "CUPOM_80MM";
  return formulario;
}

function paraEnvio(
  formulario: FormularioConfiguracao,
): ConfiguracaoSistemaCampos {
  const texto = (valor: string) => valor.trim() || null;
  const dados = {} as ConfiguracaoSistemaCampos;
  CAMPOS_TEXTO.forEach((campo) => {
    dados[campo] = texto(formulario[campo]);
  });
  CAMPOS_BOOLEANOS.forEach((campo) => {
    dados[campo] = formulario[campo];
  });
  dados.email = dados.email?.toLowerCase() ?? null;
  dados.estado = dados.estado?.toUpperCase() ?? null;
  dados.tipoDocumento = formulario.tipoDocumento || null;
  dados.formatoImpressaoPadrao = formulario.formatoImpressaoPadrao;
  return dados;
}

function calcularAlteracoes(
  original: ConfiguracaoSistemaCampos,
  atual: ConfiguracaoSistemaCampos,
): AtualizarConfiguracaoSistemaInput {
  const alteracoes: Record<string, unknown> = {};
  (Object.keys(atual) as (keyof ConfiguracaoSistemaCampos)[]).forEach(
    (campo) => {
      if (original[campo] !== atual[campo]) alteracoes[campo] = atual[campo];
    },
  );
  return alteracoes as AtualizarConfiguracaoSistemaInput;
}

function digitoVerificador(digitos: string, pesos: number[]) {
  const soma = pesos.reduce(
    (total, peso, indice) => total + Number(digitos[indice]) * peso,
    0,
  );
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
  const primeiro = digitoVerificador(cpf, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const segundo = digitoVerificador(cpf, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return primeiro === Number(cpf[9]) && segundo === Number(cpf[10]);
}

function cnpjValido(cnpj: string) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false;
  const primeiro = digitoVerificador(
    cnpj,
    [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  const segundo = digitoVerificador(
    cnpj,
    [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  );
  return primeiro === Number(cnpj[12]) && segundo === Number(cnpj[13]);
}

function urlValida(valor: string) {
  try {
    const url = new URL(valor);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validar(formulario: FormularioConfiguracao): ErrosFormulario {
  const erros: ErrosFormulario = {};
  const documento = formulario.documento;
  const email = formulario.email.trim();
  const logotipo = formulario.logotipoUrl.trim();

  if (documento && !formulario.tipoDocumento) {
    erros.tipoDocumento = "Selecione se o documento é CPF ou CNPJ.";
  } else if (formulario.tipoDocumento === "CPF" && documento) {
    if (!cpfValido(documento)) erros.documento = "Informe um CPF válido.";
  } else if (formulario.tipoDocumento === "CNPJ" && documento) {
    if (!cnpjValido(documento)) erros.documento = "Informe um CNPJ válido.";
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.email = "Informe um e-mail válido.";
  }
  if (logotipo && !urlValida(logotipo)) {
    erros.logotipoUrl = "Informe uma URL iniciada por http:// ou https://.";
  }
  if (formulario.cep && formulario.cep.length !== 8) {
    erros.cep = "O CEP deve ter 8 dígitos.";
  }
  if (formulario.estado && !UFS.includes(formulario.estado.toUpperCase())) {
    erros.estado = "Selecione uma UF válida.";
  }
  return erros;
}

function formatarDataHora(valor?: string) {
  if (!valor) return null;
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  return `${data.toLocaleDateString("pt-BR")} às ${data.toLocaleTimeString(
    "pt-BR",
    { hour: "2-digit", minute: "2-digit" },
  )}`;
}

export function Configuracoes() {
  const configuracaoQuery = useConfiguracoesSistema();
  const [abaAtiva, setAbaAtiva] = useState<Aba>("empresa");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    if (!mensagemSucesso) return;
    const temporizador = window.setTimeout(() => setMensagemSucesso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [mensagemSucesso]);

  return (
    <LayoutBase activeTab="configuracoes" pageTitle="Configurações">
      {configuracaoQuery.isPending ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-12 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          Carregando configurações do sistema...
        </div>
      ) : configuracaoQuery.isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
          <span>
            {configuracaoQuery.error.statusCode === 403
              ? "Você não tem permissão para visualizar as configurações do sistema."
              : (configuracaoQuery.error.mensagem ??
                "Não foi possível carregar as configurações do sistema.")}
          </span>
          {configuracaoQuery.error.statusCode !== 403 && (
            <button
              type="button"
              onClick={() => void configuracaoQuery.refetch()}
              className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950 hover:bg-rose-300"
            >
              Tentar novamente
            </button>
          )}
        </div>
      ) : (
        <FormularioConfiguracoes
          key={configuracaoQuery.data?.atualizadoEm ?? "nova"}
          configuracao={configuracaoQuery.data}
          abaAtiva={abaAtiva}
          setAbaAtiva={setAbaAtiva}
          mensagemSucesso={mensagemSucesso}
          setMensagemSucesso={setMensagemSucesso}
        />
      )}
      <AlterarSenha />
    </LayoutBase>
  );
}

interface FormularioConfiguracoesProps {
  configuracao: ConfiguracaoSistemaResponse | null;
  abaAtiva: Aba;
  setAbaAtiva: (aba: Aba) => void;
  mensagemSucesso: string;
  setMensagemSucesso: (mensagem: string) => void;
}

function FormularioConfiguracoes({
  configuracao,
  abaAtiva,
  setAbaAtiva,
  mensagemSucesso,
  setMensagemSucesso,
}: FormularioConfiguracoesProps) {
  const { user } = useLoggedUser();
  const atualizarConfiguracoes = useAtualizarConfiguracoesSistema();
  const [original] = useState(() => paraFormulario(configuracao));
  const [formulario, setFormulario] = useState(original);
  const [erros, setErros] = useState<ErrosFormulario>({});
  const [erroEnvio, setErroEnvio] = useState("");

  const alteracoes = calcularAlteracoes(
    paraEnvio(original),
    paraEnvio(formulario),
  );
  const possuiAlteracoes = Object.keys(alteracoes).length > 0;
  const configuracaoNova = configuracao === null;
  const podeSalvar =
    (possuiAlteracoes || configuracaoNova) && !atualizarConfiguracoes.isPending;
  const ultimaGravacao = formatarDataHora(configuracao?.atualizadoEm);
  const dadosCupom = paraEnvio(formulario);
  const modeloCupom = configuracaoParaModeloCupom({
    ...dadosCupom,
    logotipoUrl:
      dadosCupom.logotipoUrl && urlValida(dadosCupom.logotipoUrl)
        ? dadosCupom.logotipoUrl
        : null,
  });

  function alterar<Campo extends keyof FormularioConfiguracao>(
    campo: Campo,
    valor: FormularioConfiguracao[Campo],
  ) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    setErros((atuais) => ({ ...atuais, [campo]: undefined }));
    setErroEnvio("");
    setMensagemSucesso("");
  }

  function descartar() {
    setFormulario(original);
    setErros({});
    setErroEnvio("");
  }

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (!podeSalvar) return;

    const novosErros = validar(formulario);
    setErros(novosErros);
    const camposComErro = Object.keys(
      novosErros,
    ) as (keyof FormularioConfiguracao)[];
    if (camposComErro.length > 0) {
      setAbaAtiva(ABA_DO_CAMPO[camposComErro[0]] ?? abaAtiva);
      setErroEnvio("Corrija os campos destacados antes de salvar.");
      return;
    }

    try {
      // Na primeira gravação o registro ainda não existe; enviamos todos os campos.
      await atualizarConfiguracoes.mutateAsync(
        configuracaoNova ? paraEnvio(formulario) : alteracoes,
      );
      setMensagemSucesso("Configurações salvas com sucesso!");
    } catch (caught) {
      const erro = caught as ApiError;
      setErroEnvio(
        erro.statusCode === 403
          ? "Você não tem permissão para alterar as configurações do sistema."
          : erro.statusCode === 400
            ? "A API recusou os dados enviados. Revise os campos e tente novamente."
            : (erro.mensagem ?? "Não foi possível salvar as configurações."),
      );
    }
  }

  return (
    <form onSubmit={salvar} className="space-y-6" noValidate>
      {/* Cabeçalho */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
            <Settings className="h-7 w-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-100">
                Configurações do Sistema
              </h1>
              {configuracaoNova ? (
                <span className="flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
                  <AlertCircle className="h-3 w-3" /> Ainda não cadastrada
                </span>
              ) : possuiAlteracoes ? (
                <span className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                  <AlertCircle className="h-3 w-3" /> Alterações pendentes
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Atualizado
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Defina os dados oficiais da empresa e o padrão de impressão dos
              comprovantes.
            </p>
            <p className="mt-1 font-mono text-xs text-slate-500">
              {ultimaGravacao
                ? `Última gravação: ${ultimaGravacao}${
                    configuracao?.atualizadoPor
                      ? ` • Por: ${configuracao.atualizadoPor.nome}`
                      : ""
                  }`
                : "Nenhuma gravação registrada. Salve para criar a configuração inicial."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {possuiAlteracoes && (
            <button
              type="button"
              onClick={descartar}
              disabled={atualizarConfiguracoes.isPending}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:bg-slate-700 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Descartar
            </button>
          )}
          <button
            type="submit"
            disabled={!podeSalvar}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:cursor-default disabled:bg-emerald-600/80 disabled:text-slate-900 disabled:opacity-70 disabled:shadow-none"
          >
            {atualizarConfiguracoes.isPending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Save className="h-4.5 w-4.5" />
            )}
            {atualizarConfiguracoes.isPending
              ? "Salvando..."
              : "Salvar Configurações"}
          </button>
        </div>
      </div>

      {mensagemSucesso && (
        <div
          className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-emerald-300"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold">{mensagemSucesso}</p>
            <p className="text-xs text-emerald-400/80">
              Os novos parâmetros já valem para pedidos e comprovantes.
            </p>
          </div>
        </div>
      )}

      {erroEnvio && (
        <div
          className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          {erroEnvio}
        </div>
      )}

      {/* Abas */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        <BotaoAba
          ativa={abaAtiva === "empresa"}
          onClick={() => setAbaAtiva("empresa")}
          Icone={Building2}
          rotulo="Dados da Empresa"
        />
        <BotaoAba
          ativa={abaAtiva === "impressao"}
          onClick={() => setAbaAtiva("impressao")}
          Icone={Printer}
          rotulo="Impressão e Comprovantes"
        />
      </div>

      {/* ABA 1: DADOS DA EMPRESA */}
      {abaAtiva === "empresa" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Cartao
              Icone={Building2}
              titulo="Identificação Jurídica e Comercial"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Campo rotulo="Razão Social" erro={erros.razaoSocial}>
                  <input
                    type="text"
                    value={formulario.razaoSocial}
                    onChange={(e) => alterar("razaoSocial", e.target.value)}
                    maxLength={LIMITES_TEXTO.razaoSocial}
                    className={CLASSE_CAMPO}
                    placeholder="Nome empresarial completo"
                  />
                </Campo>
                <Campo rotulo="Nome Fantasia" erro={erros.nomeFantasia}>
                  <input
                    type="text"
                    value={formulario.nomeFantasia}
                    onChange={(e) => alterar("nomeFantasia", e.target.value)}
                    maxLength={LIMITES_TEXTO.nomeFantasia}
                    className={CLASSE_CAMPO}
                    placeholder="Nome exibido nos comprovantes"
                  />
                </Campo>
                <div className="grid grid-cols-[7rem_1fr] gap-3">
                  <Campo rotulo="Tipo" erro={erros.tipoDocumento}>
                    <select
                      value={formulario.tipoDocumento}
                      onChange={(e) => {
                        const tipo = e.target.value as
                          TipoDocumentoEmpresa | "";
                        alterar("tipoDocumento", tipo);
                        if (tipo === "CPF")
                          alterar(
                            "documento",
                            formulario.documento.slice(0, 11),
                          );
                      }}
                      className={`${CLASSE_CAMPO} cursor-pointer`}
                    >
                      <option value="">—</option>
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                    </select>
                  </Campo>
                  <Campo rotulo="Documento" erro={erros.documento}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatarDocumentoEmpresa(
                        formulario.documento,
                        formulario.tipoDocumento,
                      )}
                      onChange={(e) =>
                        alterar(
                          "documento",
                          somenteDigitos(e.target.value).slice(
                            0,
                            formulario.tipoDocumento === "CPF" ? 11 : 14,
                          ),
                        )
                      }
                      className={`${CLASSE_CAMPO} font-mono`}
                      placeholder={
                        formulario.tipoDocumento === "CPF"
                          ? "000.000.000-00"
                          : "00.000.000/0001-00"
                      }
                    />
                  </Campo>
                </div>
                <Campo
                  rotulo="Inscrição Estadual (I.E.)"
                  erro={erros.inscricaoEstadual}
                >
                  <input
                    type="text"
                    value={formulario.inscricaoEstadual}
                    onChange={(e) =>
                      alterar("inscricaoEstadual", e.target.value)
                    }
                    maxLength={LIMITES_TEXTO.inscricaoEstadual}
                    className={`${CLASSE_CAMPO} font-mono`}
                    placeholder="Isento ou número de inscrição"
                  />
                </Campo>
                <Campo
                  rotulo="URL do Logotipo"
                  erro={erros.logotipoUrl}
                  className="md:col-span-2"
                >
                  <input
                    type="url"
                    value={formulario.logotipoUrl}
                    onChange={(e) => alterar("logotipoUrl", e.target.value)}
                    maxLength={LIMITES_TEXTO.logotipoUrl}
                    className={CLASSE_CAMPO}
                    placeholder="https://exemplo.com.br/logotipo.png"
                  />
                </Campo>
              </div>
            </Cartao>

            <Cartao Icone={FileText} titulo="Contatos Oficiais">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Campo
                  rotulo="Telefone / WhatsApp Comercial"
                  erro={erros.telefone}
                >
                  <input
                    type="tel"
                    value={formulario.telefone}
                    onChange={(e) => alterar("telefone", e.target.value)}
                    maxLength={LIMITES_TEXTO.telefone}
                    className={CLASSE_CAMPO}
                    placeholder="(00) 00000-0000"
                  />
                </Campo>
                <Campo rotulo="E-mail" erro={erros.email}>
                  <input
                    type="email"
                    value={formulario.email}
                    onChange={(e) => alterar("email", e.target.value)}
                    maxLength={LIMITES_TEXTO.email}
                    className={CLASSE_CAMPO}
                    placeholder="contato@empresa.com.br"
                  />
                </Campo>
              </div>
            </Cartao>

            <Cartao Icone={MapPin} titulo="Endereço">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                <Campo rotulo="CEP" erro={erros.cep} className="md:col-span-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatarCep(formulario.cep)}
                    onChange={(e) =>
                      alterar("cep", somenteDigitos(e.target.value).slice(0, 8))
                    }
                    className={`${CLASSE_CAMPO} font-mono`}
                    placeholder="00000-000"
                  />
                </Campo>
                <Campo
                  rotulo="Logradouro"
                  erro={erros.logradouro}
                  className="md:col-span-4"
                >
                  <input
                    type="text"
                    value={formulario.logradouro}
                    onChange={(e) => alterar("logradouro", e.target.value)}
                    maxLength={LIMITES_TEXTO.logradouro}
                    className={CLASSE_CAMPO}
                    placeholder="Rua, avenida, rodovia..."
                  />
                </Campo>
                <Campo
                  rotulo="Número"
                  erro={erros.numero}
                  className="md:col-span-2"
                >
                  <input
                    type="text"
                    value={formulario.numero}
                    onChange={(e) => alterar("numero", e.target.value)}
                    maxLength={LIMITES_TEXTO.numero}
                    className={CLASSE_CAMPO}
                    placeholder="S/N"
                  />
                </Campo>
                <Campo
                  rotulo="Complemento"
                  erro={erros.complemento}
                  className="md:col-span-4"
                >
                  <input
                    type="text"
                    value={formulario.complemento}
                    onChange={(e) => alterar("complemento", e.target.value)}
                    maxLength={LIMITES_TEXTO.complemento}
                    className={CLASSE_CAMPO}
                    placeholder="Galpão, sala, referência..."
                  />
                </Campo>
                <Campo
                  rotulo="Bairro"
                  erro={erros.bairro}
                  className="md:col-span-2"
                >
                  <input
                    type="text"
                    value={formulario.bairro}
                    onChange={(e) => alterar("bairro", e.target.value)}
                    maxLength={LIMITES_TEXTO.bairro}
                    className={CLASSE_CAMPO}
                  />
                </Campo>
                <Campo
                  rotulo="Cidade"
                  erro={erros.cidade}
                  className="md:col-span-3"
                >
                  <input
                    type="text"
                    value={formulario.cidade}
                    onChange={(e) => alterar("cidade", e.target.value)}
                    maxLength={LIMITES_TEXTO.cidade}
                    className={CLASSE_CAMPO}
                  />
                </Campo>
                <Campo rotulo="UF" erro={erros.estado}>
                  <select
                    value={formulario.estado.toUpperCase()}
                    onChange={(e) => alterar("estado", e.target.value)}
                    className={`${CLASSE_CAMPO} cursor-pointer text-center font-bold`}
                  >
                    <option value="">—</option>
                    {formulario.estado &&
                      !UFS.includes(formulario.estado.toUpperCase()) && (
                        <option value={formulario.estado.toUpperCase()}>
                          {formulario.estado.toUpperCase()}
                        </option>
                      )}
                    {UFS.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>
            </Cartao>
          </div>

          {/* Pré-visualização do cabeçalho */}
          <div>
            <div className="sticky top-24 space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h3 className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-bold uppercase tracking-wider text-slate-200">
                <QrCode className="h-4 w-4 text-emerald-400" />
                Cabeçalho nos Documentos
              </h3>
              <p className="text-xs text-slate-400">
                Estes dados serão exibidos no cabeçalho do comprovante impresso
                nos pedidos:
              </p>
              <PreviaCupom
                modelo={modeloCupom}
                dados={{
                  ...PEDIDO_EXEMPLO,
                  operatorName: user?.nome ?? "Operador",
                }}
              />
              <div className="space-y-1 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-semibold text-slate-200">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-400" /> Dica
                  de validade fiscal
                </span>
                <p>
                  Mantenha o CNPJ e a Inscrição Estadual iguais aos cadastros
                  oficiais para evitar divergências em notas fiscais e
                  manifestos ambientais (MTR).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: IMPRESSÃO E COMPROVANTES */}
      {abaAtiva === "impressao" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Cartao Icone={Printer} titulo="Formato Padrão de Impressão">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <OpcaoFormato
                  valor="CUPOM_80MM"
                  selecionado={formulario.formatoImpressaoPadrao}
                  onChange={(valor) => alterar("formatoImpressaoPadrao", valor)}
                  titulo="Cupom Térmico 80mm"
                  descricao="Bobina padrão de cupom não fiscal (Bematech, Elgin, Daruma). Recomendado para o balcão de compras."
                />
                <OpcaoFormato
                  valor="FOLHA_A4"
                  selecionado={formulario.formatoImpressaoPadrao}
                  onChange={(valor) => alterar("formatoImpressaoPadrao", valor)}
                  titulo="Folha A4 (paisagem)"
                  descricao="Comprovante em folha A4 na horizontal, ideal para impressoras laser/jato de tinta ou geração de PDF."
                />
              </div>
            </Cartao>

            <Cartao Icone={FileText} titulo="Mensagens Personalizadas">
              <div className="space-y-4">
                <Campo
                  rotulo="Cabeçalho (exibido no topo, antes dos itens)"
                  erro={erros.mensagemCabecalho}
                >
                  <textarea
                    rows={2}
                    value={formulario.mensagemCabecalho}
                    onChange={(e) =>
                      alterar("mensagemCabecalho", e.target.value)
                    }
                    maxLength={LIMITES_TEXTO.mensagemCabecalho}
                    className={`${CLASSE_CAMPO} font-mono`}
                    placeholder="Ex.: Compramos sucata, papelão, PET e metais."
                  />
                </Campo>
                <Campo
                  rotulo="Rodapé (exibido após o valor total)"
                  erro={erros.mensagemRodape}
                >
                  <textarea
                    rows={2}
                    value={formulario.mensagemRodape}
                    onChange={(e) => alterar("mensagemRodape", e.target.value)}
                    maxLength={LIMITES_TEXTO.mensagemRodape}
                    className={`${CLASSE_CAMPO} font-mono`}
                    placeholder="Ex.: Obrigado pela preferência!"
                  />
                </Campo>
              </div>
            </Cartao>

            <Cartao Icone={UserCheck} titulo="Conteúdo e Comportamento">
              <div className="space-y-4">
                <LinhaChave
                  titulo="Exibir dados da empresa"
                  descricao="Inclui razão social, documento, endereço e contatos no topo dos comprovantes."
                  ativo={formulario.exibirDadosEmpresa}
                  onChange={(valor) => alterar("exibirDadosEmpresa", valor)}
                />
                <LinhaChave
                  titulo="Exibir operador"
                  descricao="Mostra o nome do usuário que lançou o pedido no comprovante."
                  ativo={formulario.exibirOperador}
                  onChange={(valor) => alterar("exibirOperador", valor)}
                />
                <LinhaChave
                  titulo="Imprimir automaticamente"
                  descricao="Abre a impressão do comprovante assim que o pedido é finalizado, sem precisar clicar em imprimir."
                  ativo={formulario.imprimirAutomaticamente}
                  onChange={(valor) =>
                    alterar("imprimirAutomaticamente", valor)
                  }
                />
              </div>
            </Cartao>
          </div>

          {/* Pré-visualização do comprovante */}
          <div className="sticky top-24 self-start">
            <PreviaCupom
              modelo={modeloCupom}
              dados={{
                ...PEDIDO_EXEMPLO,
                operatorName: user?.nome ?? "Operador",
              }}
              titulo={`Pré-visualização • ${
                formulario.formatoImpressaoPadrao === "CUPOM_80MM"
                  ? "Cupom 80mm"
                  : "Folha A4 paisagem"
              }`}
            />
          </div>
        </div>
      )}
    </form>
  );
}

function BotaoAba({
  ativa,
  onClick,
  Icone,
  rotulo,
}: {
  ativa: boolean;
  onClick: () => void;
  Icone: LucideIcon;
  rotulo: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
        ativa
          ? "border border-emerald-500/30 bg-emerald-500/10 font-semibold text-emerald-400"
          : "border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
      }`}
    >
      <Icone className="h-4.5 w-4.5" />
      {rotulo}
    </button>
  );
}

function Cartao({
  Icone,
  titulo,
  children,
}: {
  Icone: LucideIcon;
  titulo: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Icone className="h-5 w-5 text-emerald-400" />
        <h2 className="text-base font-semibold text-slate-100">{titulo}</h2>
      </div>
      {children}
    </div>
  );
}

function Campo({
  rotulo,
  erro,
  className = "",
  children,
}: {
  rotulo: string;
  erro?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {rotulo}
      </span>
      {children}
      {erro && <span className="mt-1 block text-xs text-rose-400">{erro}</span>}
    </label>
  );
}

function LinhaChave({
  titulo,
  descricao,
  ativo,
  onChange,
}: {
  titulo: string;
  descricao: string;
  ativo: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-slate-950 p-4">
      <div className="space-y-1">
        <span className="block text-sm font-semibold text-slate-200">
          {titulo}
        </span>
        <p className="text-xs text-slate-400">{descricao}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={ativo}
        aria-label={titulo}
        onClick={() => onChange(!ativo)}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          ativo ? "bg-emerald-500" : "bg-slate-800"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full border border-slate-300 bg-white transition-transform ${
            ativo ? "translate-x-5 border-white" : ""
          }`}
        />
      </button>
    </div>
  );
}

function OpcaoFormato({
  valor,
  selecionado,
  onChange,
  titulo,
  descricao,
}: {
  valor: FormatoImpressao;
  selecionado: FormatoImpressao;
  onChange: (valor: FormatoImpressao) => void;
  titulo: string;
  descricao: string;
}) {
  const ativo = valor === selecionado;
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
        ativo
          ? "border-emerald-500/50 bg-emerald-500/10 text-slate-100"
          : "border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700"
      }`}
    >
      <input
        type="radio"
        name="formatoImpressaoPadrao"
        value={valor}
        checked={ativo}
        onChange={() => onChange(valor)}
        className="mt-1 accent-emerald-500"
      />
      <div>
        <span className="block text-sm font-bold text-slate-200">{titulo}</span>
        <p className="mt-0.5 text-xs text-slate-400">{descricao}</p>
      </div>
    </label>
  );
}

function PreviaCupom({
  modelo,
  dados,
  titulo,
}: {
  modelo: OrderReceiptTemplate;
  dados: OrderReceiptData;
  titulo?: string;
}) {
  const idCupom = `previa-cupom-${useId().replaceAll(":", "")}`;

  return (
    <div className="space-y-2">
      {titulo && (
        <p className="text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {titulo}
        </p>
      )}
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
        <CupomAjustado data={dados} template={modelo} receiptId={idCupom} />
      </div>
    </div>
  );
}
