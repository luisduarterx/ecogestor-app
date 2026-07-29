import React, { useState } from "react";
import {
  Users,
  Search,
  Plus,
  MapPin,
  Phone,
  Mail,
  Star,
  Trash2,
  DollarSign,
} from "lucide-react";

import { LayoutBase } from "../../components/LayoutBase";

import RecordModal from "../../components/modals/RecordModal";

export function Registro() {
  const handleDeleteSupplier = (id: string) => {
    if (
      confirm(
        "Tem certeza que deseja desvincular este parceiro do cadastro comercial?",
      )
    ) {
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Filter Logic
  const [suppliers, setSuppliers] = useState([]);
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.document.includes(searchTerm) ||
      s.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === "all" ||
      s.type === typeFilter ||
      (typeFilter === "supplier" && s.type === "both") ||
      (typeFilter === "customer" && s.type === "both");
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "supplier" | "customer" | "both"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <LayoutBase activeTab="registros" pageTitle="Gestão de registros">
      <div className="space-y-6 font-sans">
        {/* Banner Area */}
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-400" />
              Clientes & Fornecedores cadastrados
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Gestão unificada de cooperativas parceiras, indústrias
              recicladoras e catadores autônomos.
            </p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow-md cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            Cadastrar Parceiro
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, CPF/CNPJ ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/40 text-slate-100 placeholder-slate-500 text-xs border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="all">Filtro: Todos os Tipos</option>
            <option value="supplier">Apenas Fornecedores</option>
            <option value="customer">Apenas Clientes (Compradores)</option>
            <option value="both">Apenas Clientes e Fornecedores (Ambos)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950/40 text-slate-300 border border-slate-800 text-xs rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          >
            <option value="all">Filtro: Todos os Status</option>
            <option value="active">Apenas Ativos</option>
            <option value="inactive">Apenas Inativos</option>
          </select>
        </div>

        {/* Supplier Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className={`bg-slate-900 border ${sup.status === "active" ? "border-slate-800/80 hover:border-emerald-500/30" : "border-slate-800/50 opacity-70"} rounded-2xl p-5 shadow-xs transition-all duration-200 relative group flex flex-col justify-between`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    {sup.id}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        sup.type === "supplier"
                          ? "bg-amber-500/10 text-amber-400"
                          : sup.type === "customer"
                            ? "bg-sky-500/10 text-sky-400"
                            : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {sup.type === "supplier"
                        ? "FORNECEDOR"
                        : sup.type === "customer"
                          ? "CLIENTE"
                          : "AMBOS"}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${sup.status === "active" ? "bg-emerald-400" : "bg-slate-600"}`}
                    ></span>
                  </div>
                </div>

                {/* Title & Classification */}
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mt-2">
                  {sup.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  CNPJ/CPF: {sup.document}
                </p>

                {/* Rating stars if supplier */}
                {sup.type !== "customer" && (
                  <div className="flex items-center gap-0.5 mt-1.5 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < sup.rating ? "fill-amber-400 text-amber-400" : "text-slate-700"}`}
                      />
                    ))}
                    <span className="text-[10px] text-slate-500 font-mono ml-1">
                      ({sup.rating}.0)
                    </span>
                  </div>
                )}

                {/* Info Rows */}
                <div className="mt-4 space-y-2 border-t border-slate-800/50 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {sup.address ? `${sup.address}, ` : ""}
                      {sup.city} - {sup.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  {sup.type !== "customer" && (
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800/20 text-emerald-400 font-medium">
                      <DollarSign className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Tabela:{" "}
                        <span className="text-slate-200 font-semibold">
                          {customPriceTables.find(
                            (tbl) => tbl.id === sup.priceTableId,
                          )?.name || "Padrão (Pátio)"}
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes block */}
                {sup.notes && (
                  <div className="mt-3 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 italic">
                    {sup.notes}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="mt-5 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  Cadastrado: {sup.createdAt}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteSupplier(sup.id)}
                    className="p-1.5 hover:bg-rose-500/15 hover:text-rose-400 text-slate-500 rounded-lg transition-colors cursor-pointer"
                    title="Excluir parceiro"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredSuppliers.length === 0 && (
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

        {/* FORM MODAL (Screen 1: Cadastro de Fornecedor / Cliente) */}
        {isModalOpen && <RecordModal setIsOpen={setIsModalOpen} />}
      </div>
    </LayoutBase>
  );
}
