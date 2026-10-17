import { AxiosError, type AxiosAdapter } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";

function responderCom(adapter: AxiosAdapter) {
  api.defaults.adapter = adapter;
}

describe("api", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("envia os cookies de sessão em todas as requisições", async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => ({
      data: { ok: true },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    responderCom(adapter);

    const resposta = await api.get("pedidos");

    expect(resposta.data).toEqual({ ok: true });
    expect(adapter.mock.calls[0][0].withCredentials).toBe(true);
    expect(api.defaults.baseURL).toMatch(/\/v1\/$/);
  });

  it("rejeita com o ApiError devolvido pelo backend", async () => {
    const erroApi = {
      nome: "Acesso Negado",
      mensagem: "Você não tem permissão.",
      statusCode: 403,
      action: "Fale com o administrador.",
    };
    responderCom(async (config) => {
      throw new AxiosError("403", "ERR_BAD_REQUEST", config, null, {
        data: erroApi,
        status: 403,
        statusText: "Forbidden",
        headers: {},
        config,
      });
    });

    await expect(api.get("usuarios")).rejects.toEqual(erroApi);
  });

  it.each([
    ["sem resposta do servidor", { request: {} }],
    ["falha antes do envio", {}],
  ])("padroniza o erro de rede (%s)", async (_caso, extras) => {
    responderCom(async (config) => {
      throw Object.assign(
        new AxiosError("timeout", "ECONNABORTED", config),
        extras,
      );
    });

    await expect(api.get("pedidos")).rejects.toEqual({
      nome: "NetworkError",
      mensagem: "Não foi possível conectar ao servidor. Tente novamente.",
      statusCode: 500,
      action: "Verifique sua conexão",
    });
  });
});
