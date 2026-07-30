export type UserAuthenticated = {
  id: number;
  nome: string;
  cargoID: number;
  permissoes: string[];
  email: string;
};
export type LoginReponse = {
  user: UserAuthenticated;
  token: string;
};
export type ApiError = {
  nome: string;
  mensagem: string;
  statusCode: number;
  action: string;
};
