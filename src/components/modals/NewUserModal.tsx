import { Check, UserCog, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import {
  useCreateUser,
  useUpdateUser,
} from "../../utils/queries";
import type {
  ApiError,
  RolesResponse,
  UserManagementResponse,
} from "../../utils/types";

interface NewUserModalProps {
  user?: UserManagementResponse;
  roles: RolesResponse[];
  onClose: () => void;
}

export default function NewUserModal({ user, roles, onClose }: NewUserModalProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.id);
  const [name, setName] = useState(user?.nome ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.telefone ?? "");
  const [roleID, setRoleID] = useState(String(user?.cargoID ?? roles[0]?.id ?? ""));
  const [error, setError] = useState("");
  const pending = createUser.isPending || updateUser.isPending;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 3 || !email.trim() || !roleID) {
      setError("Preencha nome, e-mail e cargo.");
      return;
    }
    const input = {
      nome: name.trim(),
      email: email.trim().toLowerCase(),
      telefone: phone.trim() || undefined,
      cargoID: Number(roleID),
    };
    try {
      if (user) await updateUser.mutateAsync(input);
      else await createUser.mutateAsync(input);
      onClose();
    } catch (caught) {
      setError((caught as ApiError).mensagem ?? "Não foi possível salvar o usuário.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
      <div className="my-8 w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-emerald-400"><UserCog className="h-5 w-5" /></div>
            <div><h3 id="user-modal-title" className="text-lg font-bold text-slate-100">{user ? `Editar Usuário: ${user.nome}` : "Cadastrar Novo Usuário no Sistema"}</h3><p className="text-xs text-slate-400">Informe os dados de acesso e atribua um cargo. As permissões são definidas pelo cargo.</p></div>
          </div>
          <button type="button" onClick={onClose} disabled={pending} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={(event) => void submit(event)}>
          <div className="max-h-[65vh] space-y-5 overflow-y-auto p-6">
            {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-xs font-bold text-slate-300">Nome Completo *<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400" /></label>
              <label className="text-xs font-bold text-slate-300">E-mail Corporativo *<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400" /></label>
              <label className="text-xs font-bold text-slate-300">Telefone / WhatsApp<input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400" /></label>
              <label className="text-xs font-bold text-slate-300">Cargo / Função no Sistema *<select required value={roleID} onChange={(e) => setRoleID(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"><option value="">Selecione um cargo</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.nome}</option>)}</select></label>
            </div>
            {!user && <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-[11px] leading-5 text-slate-400">O novo usuário receberá a senha padrão configurada na API. Nenhuma permissão é atribuída diretamente: todas são herdadas do cargo selecionado.</div>}
          </div>
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 bg-slate-950/60 p-4">
            <button type="button" onClick={onClose} disabled={pending} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300 hover:bg-slate-700">Cancelar</button>
            <button type="submit" disabled={pending || roles.length === 0} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-400 disabled:opacity-50"><Check className="h-4 w-4" />{pending ? "Salvando..." : user ? "Salvar Alterações" : "Confirmar Cadastro"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
