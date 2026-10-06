import axios from "axios";
import type { ApiError } from "./types";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim() || "http://localhost:4000/v1/",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error(
        `[API Error ${error.response.status}]:`,
        error.response.data,
      );

      // Retorna o objeto de erro formatado pelo backend (ApiError)
      return Promise.reject(error.response.data);
    }

    if (error.request) {
      console.error("Sem resposta do servidor (Erro de rede/timeout)");
    }

    // Erros genéricos de rede ou timeout
    return Promise.reject({
      nome: "NetworkError",
      mensagem: "Não foi possível conectar ao servidor. Tente novamente.",
      statusCode: 500,
      action: "Verifique sua conexão",
    } as ApiError);
  },
);
