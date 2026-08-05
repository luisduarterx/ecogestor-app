import { Check, Key, ShieldCheck, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { useCreateRole, useUpdateRole } from "../../utils/queries";
import type { ApiError, PermissionResponse, RoleResponse } from "../../utils/types";
import PermissionItem from "../PermissionItem";
import PermissionModuleCard from "../PermissionModuleCard";

interface NewRoleModalProps {
  role?: RoleResponse;
  permissions: PermissionResponse[];
  onClose: () => void;
}

const actionLabels: Record<string, string> = {
  create: "Criar",
  read: "Visualizar",
  update: "Editar",
  delete: "Excluir",
  finalize: "Finalizar",
  cancel: "Cancelar",
  reopen: "Reabrir",
  reverse: "Estornar",
};

export default function NewRoleModal({ role, permissions, onClose }: NewRoleModalProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id);
  const [name, setName] = useState(role?.nome ?? "");
  const [selected, setSelected] = useState<number[]>(role?.permissoes.map((item) => item.id) ?? []);
  const [error, setError] = useState("");
  const pending = createRole.isPending || updateRole.isPending;
  const groups = useMemo(() => {
    const grouped = new Map<string, PermissionResponse[]>();
    permissions.forEach((permission) => {
      const resource = permission.nome.split(":")[1] ?? "geral";
      const normalized = resource.replace(/s$/, "");
      grouped.set(normalized, [...(grouped.get(normalized) ?? []), permission]);
    });
    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  }, [permissions]);

  function toggle(ids: number[], enabled?: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) => enabled === undefined ? (next.has(id) ? next.delete(id) : next.add(id)) : enabled ? next.add(id) : next.delete(id));
      return [...next];
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 3) {
      setError("Informe um nome com pelo menos 3 caracteres.");
      return;
    }
    try {
      const input = { nome: name.trim(), permissoes: selected };
      if (role) await updateRole.mutateAsync(input);
      else await createRole.mutateAsync(input);
      onClose();
    } catch (caught) {
      setError((caught as ApiError).mensagem ?? "Não foi possível salvar o cargo.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
      <div className="my-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 p-6">
          <div className="flex items-center gap-3"><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400"><ShieldCheck className="h-6 w-6" /></div><div><h3 id="role-modal-title" className="text-lg font-bold text-slate-100">{role ? `Editar Cargo: ${role.nome}` : "Cadastrar Novo Cargo / Função"}</h3><p className="text-xs text-slate-400">Defina o cargo e configure sua matriz de permissões.</p></div></div>
          <button type="button" onClick={onClose} disabled={pending} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <div className="max-h-[68vh] space-y-6 overflow-y-auto p-6">
            {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><label className="text-xs font-semibold text-slate-300">Nome do Cargo / Função *<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Operador de Balança e Pátio" className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-100 outline-none focus:border-emerald-500" /></label></div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3.5"><span className="flex items-center gap-2 text-xs font-bold text-slate-200"><SlidersHorizontal className="h-4 w-4 text-emerald-400" />Configuração da Matriz de Permissões do Cargo</span><div className="flex gap-2"><button type="button" onClick={() => toggle(permissions.map((item) => item.id), true)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400">+ Marcar Todas</button><button type="button" onClick={() => toggle(permissions.map((item) => item.id), false)} className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold text-rose-400">- Desmarcar Todas</button></div></div>
            <div className="space-y-4">{groups.map(([resource, items]) => <PermissionModuleCard key={resource} title={resource.replaceAll("_", " ").toUpperCase()} icon={Key} description={`Permissões disponíveis para ${resource.replaceAll("_", " ")}.`} onToggleAll={(enabled) => toggle(items.map((item) => item.id), enabled)}>{items.map((permission) => { const action = permission.nome.split(":")[0]; return <PermissionItem key={permission.id} label={permission.descricao || `${actionLabels[action] ?? action} ${resource.replaceAll("_", " ")}`} checked={selected.includes(permission.id)} onChange={() => toggle([permission.id])} />; })}</PermissionModuleCard>)}</div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 p-6"><span className="font-mono text-xs text-slate-400">{selected.length} de {permissions.length} permissões configuradas.</span><div className="flex gap-3"><button type="button" onClick={onClose} disabled={pending} className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700">Cancelar</button><button type="submit" disabled={pending} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-400 disabled:opacity-50"><Check className="h-4 w-4" />{pending ? "Salvando..." : "Salvar Cargo & Permissões"}</button></div></div>
        </form>
      </div>
    </div>
  );
}
