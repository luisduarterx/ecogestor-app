import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Check,
  DollarSign,
  Plus,
  ShoppingBag,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import {
  useAddOrderItem,
  useApplyOrderRecordTable,
  useFinalizeOrder,
  useFinancialAccounts,
  useMaterials,
  useOrder,
  useRecords,
  useRemoveOrderItem,
  useSetOrderRecord,
  useTable,
  useTables,
  fetchTable,
} from "../utils/queries";
import type { ApiError } from "../utils/types";
import type { RecordResponse } from "../utils/types";
import RecordModal from "./modals/RecordModal";

interface NewOrderProps {
  pedidoID: number;
  tipo: "COMPRA" | "VENDA";
}

function mensagemDoErro(error: unknown, fallback: string) {
  return (error as ApiError)?.mensagem ?? fallback;
}

function dataLocalISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function adicionarDias(dias: number) {
  const date = new Date();
  date.setDate(date.getDate() + dias);
  return dataLocalISO(date);
}

function adicionarDiasNaData(data: string, dias: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const date = new Date(ano, mes - 1, dia);
  date.setDate(date.getDate() + dias);
  return dataLocalISO(date);
}

function dividirEmCentavos(total: number, quantidade: number) {
  const totalEmCentavos = Math.round(total * 100);
  const valorBase = Math.floor(totalEmCentavos / quantidade);
  const resto = totalEmCentavos % quantidade;

  return Array.from(
    { length: quantidade },
    (_, indice) => (valorBase + (indice < resto ? 1 : 0)) / 100,
  );
}

export default function NewOrder({ pedidoID, tipo }: NewOrderProps) {
  const pedidoQuery = useOrder(pedidoID);
  const registrosQuery = useRecords();
  const materiaisQuery = useMaterials();
  const tabelasQuery = useTables();
  const registroSelecionado = registrosQuery.data?.find(
    (registro) => registro.id === pedidoQuery.data?.regID,
  );
  const tabelaDoRegistroQuery = useTable(
    tipo === "COMPRA" ? registroSelecionado?.tabela.id : undefined,
  );
  const definirRegistro = useSetOrderRecord(pedidoID);
  const aplicarTabelaDoRegistro = useApplyOrderRecordTable(pedidoID);
  const adicionarItem = useAddOrderItem(pedidoID);
  const removerItem = useRemoveOrderItem(pedidoID);
  const contasQuery = useFinancialAccounts();
  const finalizarPedido = useFinalizeOrder(pedidoID);

  const [materialID, setMaterialID] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [recordSearchTouched, setRecordSearchTouched] = useState(false);
  const [pesoBruto, setPesoBruto] = useState("");
  const [tara, setTara] = useState("0");
  const [impureza, setImpureza] = useState("0");
  const [preco, setPreco] = useState("");
  const [feedback, setFeedback] = useState("");
  const [prazo, setPrazo] = useState<"vista" | "30d" | "60d">("vista");
  const [quantidadeTitulos, setQuantidadeTitulos] = useState(1);
  const [vencimentos, setVencimentos] = useState([dataLocalISO()]);
  const [baixarAgora, setBaixarAgora] = useState(true);
  const [contaID, setContaID] = useState("");
  const [titulo, setTitulo] = useState(
    tipo === "COMPRA" ? "COMPRA DE MATERIAIS" : "VENDA DE MATERIAIS",
  );
  const [descricao, setDescricao] = useState(
    tipo === "COMPRA" ? "PAGAMENTO DO PEDIDO" : "RECEBIMENTO DO PEDIDO",
  );
  const [checkoutError, setCheckoutError] = useState("");
  const [isTableConfirmationOpen, setIsTableConfirmationOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const pedido = pedidoQuery.data;
  const normalizedRecordSearch = recordSearch.trim().toLocaleLowerCase("pt-BR");
  const documentSearch = recordSearch.replace(/\D/g, "");
  const filteredRecords = (registrosQuery.data ?? [])
    .filter((registro) => {
      if (!normalizedRecordSearch) return true;
      return (
        registro.nome
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedRecordSearch) ||
        registro.apelido
          ?.toLocaleLowerCase("pt-BR")
          .includes(normalizedRecordSearch) ||
        (Boolean(documentSearch) && registro.documento.includes(documentSearch))
      );
    })
    .slice(0, 8);
  const normalizedMaterialSearch = materialSearch
    .trim()
    .toLocaleLowerCase("pt-BR");
  const filteredMaterials = (materiaisQuery.data ?? [])
    .filter((material) => {
      if (!normalizedMaterialSearch) return true;
      return (
        material.nome
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedMaterialSearch) ||
        material.categoria.nome
          .toLocaleLowerCase("pt-BR")
          .includes(normalizedMaterialSearch)
      );
    })
    .slice(0, 8);
  const carregando =
    pedidoQuery.isPending ||
    registrosQuery.isPending ||
    materiaisQuery.isPending ||
    tabelasQuery.isPending ||
    (tipo === "COMPRA" &&
      Boolean(registroSelecionado) &&
      tabelaDoRegistroQuery.isPending) ||
    contasQuery.isPending;
  const erroDeCarga =
    pedidoQuery.isError ||
    registrosQuery.isError ||
    materiaisQuery.isError ||
    tabelasQuery.isError ||
    (tipo === "COMPRA" && tabelaDoRegistroQuery.isError) ||
    contasQuery.isError;

  function selecionarMaterial(value: string) {
    setMaterialID(value);
    const material = materiaisQuery.data?.find(
      (item) => item.id === Number(value),
    );
    const precoNaTabelaDoRegistro =
      tipo === "COMPRA" && registroSelecionado
        ? tabelaDoRegistroQuery.data?.materiais.find(
            (item) => item.materialID === Number(value),
          )?.preco_compra
        : undefined;
    setPreco(
      material
        ? String(
            tipo === "COMPRA"
              ? precoNaTabelaDoRegistro
                ? precoNaTabelaDoRegistro
                : material.preco_compra
              : material.preco_venda,
          )
        : "",
    );
  }

  async function alterarRegistro(value: string) {
    setFeedback("");
    try {
      const novoRegistro = registrosQuery.data?.find(
        (registro) => registro.id === Number(value),
      );
      await definirRegistro.mutateAsync(value ? Number(value) : null);
      if (tipo === "COMPRA" && materialID) {
        const material = materiaisQuery.data?.find(
          (item) => item.id === Number(materialID),
        );
        if (novoRegistro) {
          const tabela = await fetchTable(novoRegistro.tabela.id);
          const precoDoRegistro = tabela.materiais.find(
            (item) => item.materialID === Number(materialID),
          )?.preco_compra;
          setPreco(
            material ? String(precoDoRegistro ?? material.preco_compra) : "",
          );
        } else {
          setPreco(material ? String(material.preco_compra) : "");
        }
      }
      const tabelaPadrao = tabelasQuery.data?.find((tabela) => tabela.padrao);
      if (
        tipo === "COMPRA" &&
        novoRegistro &&
        tabelaPadrao &&
        novoRegistro.tabela.id !== tabelaPadrao.id &&
        (pedido?.items.length ?? 0) > 0
      ) {
        setIsTableConfirmationOpen(true);
      }
    } catch (error) {
      setFeedback(
        mensagemDoErro(error, "Não foi possível definir o registro."),
      );
    }
  }

  async function selecionarRegistroCriado(record: RecordResponse) {
    setFeedback("");
    setRecordSearch(`${record.apelido || record.nome} — ${record.documento}`);
    setRecordSearchTouched(false);

    try {
      const refreshedRecords = await registrosQuery.refetch();
      const createdRecord =
        refreshedRecords.data?.find((item) => item.id === record.id) ?? record;
      await definirRegistro.mutateAsync(record.id);

      if (tipo === "COMPRA" && materialID && createdRecord.tabela?.id) {
        const material = materiaisQuery.data?.find(
          (item) => item.id === Number(materialID),
        );
        const tabela = await fetchTable(createdRecord.tabela.id);
        const precoDoRegistro = tabela.materiais.find(
          (item) => item.materialID === Number(materialID),
        )?.preco_compra;
        setPreco(
          material ? String(precoDoRegistro ?? material.preco_compra) : "",
        );
      }

      const tabelaPadrao = tabelasQuery.data?.find((tabela) => tabela.padrao);
      if (
        tipo === "COMPRA" &&
        createdRecord.tabela?.id &&
        tabelaPadrao &&
        createdRecord.tabela.id !== tabelaPadrao.id &&
        (pedido?.items.length ?? 0) > 0
      ) {
        setIsTableConfirmationOpen(true);
      }
    } catch (error) {
      setFeedback(
        mensagemDoErro(
          error,
          "O registro foi criado, mas não foi possível vinculá-lo ao pedido.",
        ),
      );
    }
  }

  async function incluirItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");

    const item = {
      materialID: Number(materialID),
      pesoBruto: Number(pesoBruto),
      tara: Number(tara),
      impureza: Number(impureza),
      preco: Number(preco),
    };

    if (
      !item.materialID ||
      item.pesoBruto <= 0 ||
      item.tara < 0 ||
      item.impureza < 0 ||
      item.impureza >= 100 ||
      item.preco <= 0
    ) {
      setFeedback("Preencha material, pesos, impureza e preço corretamente.");
      return;
    }

    try {
      await adicionarItem.mutateAsync(item);
      setMaterialID("");
      setMaterialSearch("");
      setPesoBruto("");
      setTara("0");
      setImpureza("0");
      setPreco("");
    } catch (error) {
      setFeedback(mensagemDoErro(error, "Não foi possível incluir o item."));
    }
  }

  async function excluirItem(itemID: number) {
    setFeedback("");
    try {
      await removerItem.mutateAsync(itemID);
    } catch (error) {
      setFeedback(mensagemDoErro(error, "Não foi possível remover o item."));
    }
  }

  async function confirmarAtualizacaoDePrecos() {
    setFeedback("");
    try {
      await aplicarTabelaDoRegistro.mutateAsync();
      setIsTableConfirmationOpen(false);
      setFeedback(
        "Preços atualizados pela tabela do registro. Materiais sem preço específico mantiveram o preço da tabela padrão.",
      );
    } catch (error) {
      setFeedback(
        mensagemDoErro(
          error,
          "Não foi possível atualizar os preços do pedido.",
        ),
      );
    }
  }

  function selecionarPrazo(novoPrazo: "vista" | "30d" | "60d") {
    const primeiroVencimento =
      novoPrazo === "vista"
        ? dataLocalISO()
        : adicionarDias(novoPrazo === "30d" ? 30 : 60);

    setPrazo(novoPrazo);
    setVencimentos(
      Array.from({ length: quantidadeTitulos }, (_, indice) =>
        adicionarDiasNaData(primeiroVencimento, indice * 30),
      ),
    );
    if (novoPrazo !== "vista") {
      setBaixarAgora(false);
      setContaID("");
    }
  }

  function alterarQuantidadeTitulos(quantidade: number) {
    const novaQuantidade = Math.min(12, Math.max(1, quantidade));
    const primeiroVencimento = vencimentos[0] ?? dataLocalISO();

    setQuantidadeTitulos(novaQuantidade);
    setVencimentos(
      Array.from({ length: novaQuantidade }, (_, indice) =>
        adicionarDiasNaData(primeiroVencimento, indice * 30),
      ),
    );
  }

  function alterarVencimento(indice: number, data: string) {
    setVencimentos((atuais) =>
      atuais.map((vencimentoAtual, indiceAtual) =>
        indiceAtual === indice ? data : vencimentoAtual,
      ),
    );
  }

  async function finalizar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckoutError("");

    if (!pedido) {
      setCheckoutError("Os dados do pedido ainda não foram carregados.");
      return;
    }

    if (!pedido.regID) {
      setCheckoutError("Selecione um cliente ou fornecedor para finalizar.");
      return;
    }
    if (pedido.items.length === 0 || pedido.valor_total <= 0) {
      setCheckoutError("Adicione ao menos um item antes de finalizar.");
      return;
    }
    if (titulo.trim().length < 3 || descricao.trim().length < 3) {
      setCheckoutError("Preencha o título e a descrição.");
      return;
    }
    if (baixarAgora && !contaID) {
      setCheckoutError("Selecione a conta para realizar a baixa imediata.");
      return;
    }

    if (vencimentos.some((data) => !data)) {
      setCheckoutError("Informe o vencimento de todos os títulos.");
      return;
    }

    const valoresDosTitulos = dividirEmCentavos(
      pedido.valor_total,
      quantidadeTitulos,
    );

    try {
      await finalizarPedido.mutateAsync({
        regID: pedido.regID,
        titulos: valoresDosTitulos.map((valor, indice) => {
          const identificacao =
            quantidadeTitulos > 1 ? ` ${indice + 1}/${quantidadeTitulos}` : "";

          return {
            valor,
            vencimento: vencimentos[indice],
            titulo: `${titulo.trim()}${identificacao}`,
            descricao: descricao.trim(),
            baixar_agora: baixarAgora,
            ...(baixarAgora ? { conta_id: Number(contaID) } : {}),
          };
        }),
      });
    } catch (error) {
      setCheckoutError(
        mensagemDoErro(error, "Não foi possível finalizar o pedido."),
      );
    }
  }

  if (carregando) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
        Carregando dados do pedido...
      </div>
    );
  }

  if (erroDeCarga || !pedido) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-rose-300">
        Não foi possível carregar os dados necessários para o pedido.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {pedido.status === "FECHADO" && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-bold text-emerald-300">
            <Check className="h-4 w-4" />
            Pedido finalizado com sucesso.
          </div>
        )}
        {feedback && (
          <div
            className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            {feedback}
          </div>
        )}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <User className="h-4 w-4 text-emerald-400" />
                Registro do pedido
              </h3>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(true)}
                disabled={pedido.status !== "ABERTO"}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-bold uppercase text-emerald-400 transition-colors hover:bg-emerald-400 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Novo cliente / fornecedor
              </button>
            </div>
            <div className="relative">
              <input
                type="search"
                value={
                  recordSearchTouched
                    ? recordSearch
                    : registroSelecionado
                      ? `${registroSelecionado.apelido || registroSelecionado.nome} — ${registroSelecionado.documento}`
                      : ""
                }
                onChange={(event) => {
                  setRecordSearchTouched(true);
                  setRecordSearch(event.target.value);
                }}
                disabled={
                  definirRegistro.isPending || pedido.status !== "ABERTO"
                }
                placeholder="Digite o nome, apelido, CPF ou CNPJ"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              {recordSearchTouched && (
                <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/95 p-1 shadow-xl">
                  {filteredRecords.map((registro) => (
                    <button
                      key={registro.id}
                      type="button"
                      onClick={() => {
                        setRecordSearch(
                          `${registro.apelido || registro.nome} — ${registro.documento}`,
                        );
                        setRecordSearchTouched(false);
                        void alterarRegistro(String(registro.id));
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800"
                    >
                      <span className="font-semibold">
                        {registro.apelido || registro.nome}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {registro.documento}
                      </span>
                    </button>
                  ))}
                  {filteredRecords.length === 0 && (
                    <p className="px-3 py-2 text-xs text-slate-500">
                      Nenhum registro encontrado.
                    </p>
                  )}
                </div>
              )}
              {pedido.regID && (
                <button
                  type="button"
                  onClick={() => {
                    setRecordSearch("");
                    setRecordSearchTouched(true);
                    void alterarRegistro("");
                  }}
                  className="mt-2 text-[10px] font-bold uppercase text-rose-400 hover:text-rose-300"
                >
                  Remover registro vinculado
                </button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="mb-4 flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
              Itens do pedido #{pedidoID}
            </h3>

            <form
              onSubmit={(event) => void incluirItem(event)}
              className="grid grid-cols-1 items-end gap-3 md:grid-cols-6"
            >
              <label className="relative md:col-span-2 text-[10px] font-bold uppercase text-slate-400">
                Material
                <input
                  required={!materialID}
                  type="search"
                  value={materialSearch}
                  onChange={(event) => {
                    setMaterialSearch(event.target.value);
                    setMaterialID("");
                    setPreco("");
                  }}
                  placeholder="Digite o material ou categoria"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-200"
                />
                {materialSearch && !materialID && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/95 p-1 shadow-xl">
                    {filteredMaterials.map((material) => (
                      <button
                        key={material.id}
                        type="button"
                        onClick={() => {
                          setMaterialSearch(
                            `${material.nome} — ${material.categoria.nome}`,
                          );
                          selecionarMaterial(String(material.id));
                        }}
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs normal-case text-slate-300 hover:bg-slate-800"
                      >
                        <span className="font-semibold">{material.nome}</span>
                        <span className="text-[10px] text-slate-500">
                          {material.categoria.nome}
                        </span>
                      </button>
                    ))}
                    {filteredMaterials.length === 0 && (
                      <p className="px-3 py-2 text-xs normal-case text-slate-500">
                        Nenhum material encontrado.
                      </p>
                    )}
                  </div>
                )}
              </label>
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Peso bruto (kg)
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={pesoBruto}
                  onChange={(event) => setPesoBruto(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-100"
                />
              </label>
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Tara (kg)
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={tara}
                  onChange={(event) => setTara(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-100"
                />
              </label>
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Impureza (%)
                <input
                  required
                  type="number"
                  min="0"
                  max="99.99"
                  step="0.01"
                  value={impureza}
                  onChange={(event) => setImpureza(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-100"
                />
              </label>
              <label className="text-[10px] font-bold uppercase text-slate-400">
                Preço / kg
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={preco}
                  onChange={(event) => setPreco(event.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-100"
                />
              </label>
              <button
                type="submit"
                disabled={adicionarItem.isPending || pedido.status !== "ABERTO"}
                className="md:col-span-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {adicionarItem.isPending ? "Incluindo..." : "Incluir no pedido"}
              </button>
            </form>

            <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-400">
                <thead className="border-b border-slate-800 bg-slate-950/30 font-mono uppercase text-slate-500">
                  <tr>
                    <th className="p-3">Material</th>
                    <th className="p-3 text-right">Peso líquido</th>
                    <th className="p-3 text-right">Preço/kg</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pedido.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-slate-200">
                        {item.material.nome}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {item.quantidade.toLocaleString("pt-BR")} kg
                      </td>
                      <td className="p-3 text-right font-mono">
                        R$ {item.preco.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        R${" "}
                        {item.subtotal.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => void excluirItem(item.id)}
                          disabled={
                            removerItem.isPending || pedido.status !== "ABERTO"
                          }
                          title="Remover item"
                          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {pedido.items.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-slate-500"
                      >
                        Nenhum item adicionado ao pedido.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end text-sm font-bold text-slate-200">
              Total do pedido: R${" "}
              <span className="ml-1 text-emerald-400">
                {pedido.valor_total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </section>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 h-fit space-y-5">
        <h3 className="flex items-center gap-1.5 border-b border-slate-800/60 pb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          3. Faturamento & {tipo === "COMPRA" ? "Pagamento" : "Recebimento"}
        </h3>

        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Total do pedido:</span>
            <span className="font-mono font-bold text-slate-200">
              R${" "}
              {pedido.valor_total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-800/60 pt-2 text-sm font-bold text-slate-200">
            <span>Total dos títulos:</span>
            <span className="font-mono text-base text-emerald-400">
              R${" "}
              {pedido.valor_total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>

        {checkoutError && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            {checkoutError}
          </div>
        )}

        <form onSubmit={(event) => void finalizar(event)} className="space-y-4">
          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Quantidade de títulos
            <select
              value={quantidadeTitulos}
              onChange={(event) =>
                alterarQuantidadeTitulos(Number(event.target.value))
              }
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-300"
            >
              {Array.from({ length: 12 }, (_, indice) => indice + 1).map(
                (quantidade) => (
                  <option key={quantidade} value={quantidade}>
                    {quantidade} {quantidade === 1 ? "título" : "títulos"}
                  </option>
                ),
              )}
            </select>
          </label>

          <div>
            <span className="mb-1.5 block text-[10px] font-bold uppercase text-slate-400">
              Prazo do título
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: "vista" as const, label: "À vista" },
                { id: "30d" as const, label: "30 dias" },
                { id: "60d" as const, label: "60 dias" },
              ].map((term) => (
                <button
                  key={term.id}
                  type="button"
                  onClick={() => selecionarPrazo(term.id)}
                  className={`rounded-lg border py-2 text-[10px] font-bold uppercase ${
                    prazo === term.id
                      ? "border-transparent bg-emerald-400 text-slate-950"
                      : "border-slate-800 bg-slate-950/20 text-slate-400"
                  }`}
                >
                  {term.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-[10px] font-bold uppercase text-slate-400">
              Títulos e vencimentos
            </span>
            {dividirEmCentavos(pedido.valor_total, quantidadeTitulos).map(
              (valor, indice) => (
                <label
                  key={indice}
                  className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/30 p-2"
                >
                  <span className="text-[10px] font-semibold text-slate-400">
                    {indice + 1}/{quantidadeTitulos} — R${" "}
                    {valor.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <input
                    required
                    type="date"
                    value={vencimentos[indice] ?? ""}
                    onChange={(event) =>
                      alterarVencimento(indice, event.target.value)
                    }
                    className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-[10px] text-slate-200"
                  />
                </label>
              ),
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300">
            <input
              type="checkbox"
              checked={baixarAgora}
              onChange={(event) => {
                setBaixarAgora(event.target.checked);
                if (!event.target.checked) setContaID("");
              }}
            />
            Realizar baixa imediatamente
          </label>

          {baixarAgora && (
            <label className="block text-[10px] font-bold uppercase text-slate-400">
              Conta financeira
              <select
                required
                value={contaID}
                onChange={(event) => setContaID(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-300"
              >
                <option value="">Selecione</option>
                {(contasQuery.data ?? []).map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome} — R${" "}
                    {conta.saldo_atual.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Título
            <input
              required
              minLength={3}
              maxLength={94}
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-100"
            />
          </label>

          <label className="block text-[10px] font-bold uppercase text-slate-400">
            Descrição
            <textarea
              required
              minLength={3}
              maxLength={250}
              rows={2}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-xs text-slate-100"
            />
          </label>

          <button
            type="submit"
            disabled={finalizarPedido.isPending || pedido.status !== "ABERTO"}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-400 py-3 text-xs font-bold uppercase text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="h-4.5 w-4.5" />
            {finalizarPedido.isPending
              ? "Finalizando..."
              : pedido.status === "FECHADO"
                ? "Pedido finalizado"
                : `Confirmar e ${tipo === "COMPRA" ? "pagar" : "receber"}`}
          </button>
        </form>
      </div>

      {isRecordModalOpen && (
        <RecordModal
          setIsOpen={setIsRecordModalOpen}
          onCreated={(record) => void selecionarRegistroCriado(record)}
        />
      )}

      {isTableConfirmationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">
                  Tabela de preços diferente
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  O registro selecionado utiliza uma tabela diferente da tabela
                  padrão. Deseja atualizar os preços dos itens já lançados?
                  Materiais sem preço nessa tabela usarão o preço da tabela
                  padrão.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={aplicarTabelaDoRegistro.isPending}
                onClick={() => setIsTableConfirmationOpen(false)}
                className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300 disabled:opacity-50"
              >
                Manter preços
              </button>
              <button
                type="button"
                disabled={aplicarTabelaDoRegistro.isPending}
                onClick={() => void confirmarAtualizacaoDePrecos()}
                className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-bold uppercase text-slate-950 disabled:opacity-50"
              >
                {aplicarTabelaDoRegistro.isPending
                  ? "Atualizando..."
                  : "Atualizar preços"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
