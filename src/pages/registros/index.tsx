import { useDeferredValue, useState } from "react";
import { Users, Search, Plus, Phone, Mail, DollarSign, Pencil } from "lucide-react";
import { LayoutBase } from "../../components/LayoutBase";
import RecordModal from "../../components/modals/RecordModal";
import EditRecordModal from "../../components/modals/EditRecordModal";
import { useRecords } from "../../utils/queries";

export function Registro() {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearch = useDeferredValue(searchTerm);
  const [typeFilter, setTypeFilter] = useState<"all" | "FISICA" | "JURIDICA">(
    "all",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editRecordID, setEditRecordID] = useState<number | null>(null);
  const recordsQuery = useRecords({ search: deferredSearch, take: 100 });
  const filteredRecords = (recordsQuery.data ?? []).filter(
    (record) => typeFilter === "all" || record.tipo === typeFilter,
  );

  return (
    <LayoutBase activeTab="registros" pageTitle="Gestão de registros">
      <div className="space-y-6 font-sans">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Clientes & Fornecedores cadastrados
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gestão unificada dos registros utilizados em compras e vendas.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Parceiro
          </button>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, apelido, CPF ou CNPJ..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 text-xs border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as typeof typeFilter)
            }
            className="bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="all">Todos os tipos</option>
            <option value="FISICA">Pessoa física</option>
            <option value="JURIDICA">Pessoa jurídica</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-slate-900 border border-slate-800/80 hover:border-emerald-500/30 rounded-2xl p-5 shadow-xs transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    #{record.id}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${record.tipo === "FISICA" ? "bg-sky-500/10 text-sky-400" : "bg-amber-500/10 text-amber-400"}`}>
                    {record.tipo === "FISICA" ? "PESSOA FÍSICA" : "PESSOA JURÍDICA"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mt-2">
                  {record.nome}
                </h3>
                {record.apelido && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {record.apelido}
                  </p>
                )}
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  CPF/CNPJ: {record.documento}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-800/50 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{record.telefone || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{record.email || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-800/20 text-emerald-400 font-medium">
                    <DollarSign className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Tabela: <span className="text-slate-200 font-semibold">{record.tabela.nome}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-800/50 flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-slate-500">
                  Cadastrado: {new Date(record.criado_em).toLocaleDateString("pt-BR")}
                </span>
                <button
                  type="button"
                  onClick={() => setEditRecordID(record.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-300 hover:border-emerald-500/30 hover:text-emerald-400"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </button>
              </div>
            </div>
          ))}

          {!recordsQuery.isPending && filteredRecords.length === 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center col-span-3">
              <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-300">
                Nenhum parceiro comercial encontrado
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Ajuste os filtros de pesquisa ou insira um novo registro.
              </p>
            </div>
          )}
        </div>

        {isModalOpen && <RecordModal setIsOpen={setIsModalOpen} />}
        {editRecordID && (
          <EditRecordModal
            recordID={editRecordID}
            setIsOpen={(open) => {
              if (!open) setEditRecordID(null);
            }}
          />
        )}
      </div>
    </LayoutBase>
  );
}
