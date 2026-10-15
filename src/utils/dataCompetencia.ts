// Data de competência do pedido (`data_pedido`, YYYY-MM-DD): o dia em que o
// negócio ocorreu. A API define o "dia" pelo fuso de operação da empresa, então
// o front-end usa o mesmo fuso para não divergir perto da meia-noite.
const FUSO_OPERACAO = "America/Sao_Paulo";

const formatadorDia = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO_OPERACAO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Dia (YYYY-MM-DD) de um instante no fuso de operação. */
export function diaNoFuso(instante: Date | string) {
  return formatadorDia.format(new Date(instante));
}

/** Dia de hoje (YYYY-MM-DD) no fuso de operação. */
export function hojeNoFuso() {
  return diaNoFuso(new Date());
}

/** Verifica se o texto é uma data real no formato YYYY-MM-DD. */
export function dataValida(dia: string) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dia);
  if (!partes) return false;

  const [, ano, mes, data] = partes.map(Number);
  const instante = new Date(Date.UTC(ano, mes - 1, data));
  return (
    instante.getUTCFullYear() === ano &&
    instante.getUTCMonth() === mes - 1 &&
    instante.getUTCDate() === data
  );
}

/** Formata YYYY-MM-DD como DD/MM/AAAA sem passar por fuso horário. */
export function formatarDia(dia: string) {
  const [ano, mes, data] = dia.split("-");
  return `${data}/${mes}/${ano}`;
}
