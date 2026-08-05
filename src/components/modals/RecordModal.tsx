import { useState, type FormEvent } from "react";
import { Users, X, Check, ShieldAlert } from "lucide-react";
import { motion } from "motion/react";
import {
  useCreateRecord,
  useTables,
  useUpdateRecord,
} from "../../utils/queries";
import type { RecordResponse } from "../../utils/types";

interface RecordModalProps {
  setIsOpen: (value: boolean) => void;
  record?: RecordResponse;
  onCreated?: (record: RecordResponse) => void;
}

export default function RecordModal({
  setIsOpen,
  record,
  onCreated,
}: RecordModalProps) {
  const createRecord = useCreateRecord();
  const updateRecord = useUpdateRecord(record?.id ?? 0);
  const tablesQuery = useTables();
  const [name, setName] = useState(record?.nome ?? "");
  const [nickname, setNickname] = useState(record?.apelido ?? "");
  const [document, setDocument] = useState(record?.documento ?? "");
  const [birthDate, setBirthDate] = useState(record?.nascimento?.slice(0, 10) ?? "");
  const [stateRegistration, setStateRegistration] = useState(record?.ie ?? "");
  const [phone, setPhone] = useState(record?.telefone ?? "");
  const [email, setEmail] = useState(record?.email ?? "");
  const [address, setAddress] = useState(record?.endereco?.logradouro ?? "");
  const [zipCode, setZipCode] = useState(record?.endereco?.cep ?? "");
  const [city, setCity] = useState(record?.endereco?.cidade ?? "");
  const [state, setState] = useState(record?.endereco?.estado ?? "SP");
  const [district, setDistrict] = useState(record?.endereco?.bairro ?? "");
  const [addressNumber, setAddressNumber] = useState(record?.endereco?.numero ?? "");
  const [addressComplement, setAddressComplement] = useState(record?.endereco?.complemento ?? "");
  const [bank, setBank] = useState(record?.dados_pagamento?.banco ?? "");
  const [agency, setAgency] = useState(record?.dados_pagamento?.agencia ?? "");
  const [account, setAccount] = useState(record?.dados_pagamento?.conta ?? "");
  const [paymentCpf, setPaymentCpf] = useState(record?.dados_pagamento?.cpf ?? "");
  const [pix, setPix] = useState(record?.dados_pagamento?.chave ?? "");
  const [personType, setPersonType] = useState<"FISICA" | "JURIDICA">(
    record?.tipo ?? "JURIDICA",
  );
  const [priceTableId, setPriceTableId] = useState(
    record ? String(record.tabela.id) : "",
  );
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const normalizedDocument = document.replace(/\D/g, "");
    const normalizedPaymentCpf = paymentCpf.replace(/\D/g, "");
    const normalizedZipCode = zipCode.replace(/\D/g, "");
    const expectedLength = personType === "FISICA" ? 11 : 14;
    if (name.trim().length < 6) {
      setFormError("Informe um nome com pelo menos 6 caracteres.");
      return;
    }
    if (normalizedDocument.length !== expectedLength) {
      setFormError(
        personType === "FISICA"
          ? "O CPF deve conter 11 dígitos."
          : "O CNPJ deve conter 14 dígitos.",
      );
      return;
    }
    if (normalizedPaymentCpf && normalizedPaymentCpf.length !== 11) {
      setFormError("O CPF do titular do pagamento deve conter 11 dígitos.");
      return;
    }
    if (normalizedZipCode.length > 8) {
      setFormError("O CEP deve conter no máximo 8 dígitos.");
      return;
    }

    try {
      const commonData = {
        nome: name.trim(),
        apelido: nickname.trim() || undefined,
        email: email.trim() || undefined,
        telefone: phone.trim() || undefined,
        tabelaID: priceTableId ? Number(priceTableId) : undefined,
        pagamento:
          bank.trim() || agency.trim() || account.trim() || normalizedPaymentCpf || pix.trim()
            ? { banco: bank.trim() || undefined, agencia: agency.trim() || undefined, conta: account.trim() || undefined, cpf: normalizedPaymentCpf || undefined, pix: pix.trim() || undefined }
            : undefined,
        endereco:
          normalizedZipCode || address.trim() || city.trim() || district.trim() || addressNumber.trim() || addressComplement.trim()
            ? { cep: normalizedZipCode || undefined, logradouro: address.trim() || undefined, cidade: city.trim() || undefined, estado: state.trim().toUpperCase() || undefined, bairro: district.trim() || undefined, numero: addressNumber.trim() || undefined, complemento: addressComplement.trim() || undefined }
            : undefined,
      };
      if (record) {
        await updateRecord.mutateAsync({
          ...commonData,
          ...(personType === "FISICA"
            ? { fisica: { cpf: normalizedDocument, nascimento: birthDate || undefined } }
            : { juridica: { cnpj: normalizedDocument, ie: stateRegistration.trim() || undefined } }),
        });
      } else {
        const createdRecord = await createRecord.mutateAsync({
          ...commonData,
          tipo: personType,
          ...(personType === "FISICA"
            ? {
                cpf: normalizedDocument,
                nascimento: birthDate || undefined,
              }
            : {
                cnpj: normalizedDocument,
                ie: stateRegistration.trim() || undefined,
              }),
        });
        onCreated?.(createdRecord);
      }
      setIsOpen(false);
    } catch (error) {
      const apiError = error as { response?: { data?: { mensagem?: string } } };
      setFormError(
        apiError.response?.data?.mensagem ?? "Não foi possível salvar o registro.",
      );
    }
  };

  const inputClass =
    "w-full bg-slate-950/40 text-slate-100 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400";

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100">{record ? "Editar cliente / fornecedor" : "Cadastro de cliente / fornecedor"}</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/25 p-3.5 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipo de pessoa</label>
            <div className="grid grid-cols-2 gap-2">
              {(["FISICA", "JURIDICA"] as const).map((type) => (
                <button key={type} type="button" disabled={Boolean(record)} onClick={() => setPersonType(type)} className={`py-2 rounded-xl text-[10px] font-bold uppercase border disabled:cursor-not-allowed ${personType === type ? "bg-emerald-400 border-transparent text-slate-950" : "bg-slate-950/20 border-slate-800 text-slate-400"}`}>
                  {type === "FISICA" ? "Pessoa física" : "Pessoa jurídica"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Razão social / Nome completo *</label>
              <input required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">{personType === "FISICA" ? "CPF" : "CNPJ"} *</label>
              <input required inputMode="numeric" value={document} onChange={(event) => setDocument(event.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Apelido / Nome fantasia</label>
              <input value={nickname} onChange={(event) => setNickname(event.target.value)} className={inputClass} />
            </div>
            {personType === "FISICA" ? (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Data de nascimento</label>
                <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className={inputClass} />
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Inscrição estadual</label>
                <input value={stateRegistration} onChange={(event) => setStateRegistration(event.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Telefone" className={inputClass} />
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="E-mail" className={inputClass} />
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Endereço</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input inputMode="numeric" value={zipCode} onChange={(event) => setZipCode(event.target.value)} placeholder="CEP" className={inputClass} />
              <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Logradouro" className={`${inputClass} md:col-span-2`} />
              <input value={addressNumber} onChange={(event) => setAddressNumber(event.target.value)} placeholder="Número" className={inputClass} />
              <input value={district} onChange={(event) => setDistrict(event.target.value)} placeholder="Bairro" className={inputClass} />
              <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Cidade" className={inputClass} />
              <input maxLength={2} value={state} onChange={(event) => setState(event.target.value.toUpperCase())} placeholder="UF" className={inputClass} />
              <input value={addressComplement} onChange={(event) => setAddressComplement(event.target.value)} placeholder="Complemento" className={inputClass} />
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-800 pt-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Dados de pagamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input value={bank} onChange={(event) => setBank(event.target.value)} placeholder="Banco" className={inputClass} />
              <input value={agency} onChange={(event) => setAgency(event.target.value)} placeholder="Agência" className={inputClass} />
              <input value={account} onChange={(event) => setAccount(event.target.value)} placeholder="Conta" className={inputClass} />
              <input inputMode="numeric" value={paymentCpf} onChange={(event) => setPaymentCpf(event.target.value)} placeholder="CPF do titular" className={inputClass} />
              <input value={pix} onChange={(event) => setPix(event.target.value)} placeholder="Chave PIX" className={`${inputClass} md:col-span-2`} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Tabela de preços</label>
            <select value={priceTableId} onChange={(event) => setPriceTableId(event.target.value)} className={inputClass}>
              <option value="">Tabela padrão</option>
              {(tablesQuery.data ?? []).map((table) => (
                <option key={table.id} value={table.id}>{table.nome}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs uppercase cursor-pointer">Cancelar</button>
            <button type="submit" disabled={createRecord.isPending || updateRecord.isPending} className="px-5 py-2 bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold rounded-xl text-xs uppercase cursor-pointer flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              {createRecord.isPending || updateRecord.isPending ? "Salvando..." : record ? "Salvar alterações" : "Salvar cadastro"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
