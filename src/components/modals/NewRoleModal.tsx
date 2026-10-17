import {
  AlertTriangle,
  BarChart3,
  Check,
  Contact,
  FileText,
  Key,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import {
  useCreateRole,
  useRoleModels,
  useUpdateRole,
} from "../../utils/queries";
import type {
  ApiError,
  PermissionResponse,
  RoleResponse,
} from "../../utils/types";
import PermissionItem from "../PermissionItem";
import PermissionModuleCard from "../PermissionModuleCard";

interface NewRoleModalProps {
  role?: RoleResponse;
  permissions: PermissionResponse[];
  onClose: () => void;
}

const moduleIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  pedidos: ShoppingCart,
  cadastros: Contact,
  estoque: Package,
  financeiro: Wallet,
  fiscal: FileText,
  relatorios: BarChart3,
  administracao: Settings,
};

type PermissionGroup = {
  id: string;
  nome: string;
  items: PermissionResponse[];
};

export default function NewRoleModal({
  role,
  permissions,
  onClose,
}: NewRoleModalProps) {
  const createRole = useCreateRole();
  const updateRole = useUpdateRole(role?.id);
  const modelsQuery = useRoleModels();
  const models = modelsQuery.data ?? [];
  const [name, setName] = useState(role?.nome ?? "");
  const [selected, setSelected] = useState<number[]>(
    role?.permissoes.map((item) => item.id) ?? [],
  );
  const [activeModels, setActiveModels] = useState<string[]>([]);
  const [error, setError] = useState("");
  const pending = createRole.isPending || updateRole.isPending;

  const idByName = useMemo(
    () => new Map(permissions.map((item) => [item.nome, item.id])),
    [permissions],
  );
  const labelByName = useMemo(
    () =>
      new Map(
        permissions.map((item) => [item.nome, item.descricao || item.nome]),
      ),
    [permissions],
  );

  // A API devolve as permissões já na ordem dos módulos.
  const groups = useMemo(() => {
    const grouped = new Map<string, PermissionGroup>();
    permissions.forEach((permission) => {
      const id = permission.modulo ?? "outros";
      const group = grouped.get(id) ?? {
        id,
        nome: permission.moduloNome ?? "Outras permissões",
        items: [],
      };
      group.items.push(permission);
      grouped.set(id, group);
    });
    return [...grouped.values()];
  }, [permissions]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  // Permissões marcadas cujas dependências estão desmarcadas.
  const missingByPermission = useMemo(() => {
    const missing = new Map<number, string[]>();
    permissions.forEach((permission) => {
      if (!selectedSet.has(permission.id)) return;
      const absent = (permission.requer ?? []).filter((nome) => {
        const id = idByName.get(nome);
        return id !== undefined && !selectedSet.has(id);
      });
      if (absent.length > 0) missing.set(permission.id, absent);
    });
    return missing;
  }, [permissions, selectedSet, idByName]);

  function idsOf(names: readonly string[]) {
    return names
      .map((nome) => idByName.get(nome))
      .filter((id): id is number => id !== undefined);
  }

  function toggle(ids: number[], enabled?: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) =>
        enabled === undefined
          ? next.has(id)
            ? next.delete(id)
            : next.add(id)
          : enabled
            ? next.add(id)
            : next.delete(id),
      );
      return [...next];
    });
  }

  // Ligar um modelo marca as permissões dele. Desligar desmarca só as que
  // nenhum outro modelo ligado usa, então dá para combinar modelos.
  function toggleModel(modelID: string) {
    const model = models.find((item) => item.id === modelID);
    if (!model) return;
    if (activeModels.includes(modelID)) {
      const stillUsed = new Set(
        models
          .filter(
            (item) => item.id !== modelID && activeModels.includes(item.id),
          )
          .flatMap((item) => item.permissoes),
      );
      toggle(
        idsOf(model.permissoes.filter((nome) => !stillUsed.has(nome))),
        false,
      );
      setActiveModels((current) => current.filter((id) => id !== modelID));
    } else {
      toggle(idsOf(model.permissoes), true);
      setActiveModels((current) => [...current, modelID]);
    }
  }

  function addMissingDependencies() {
    setSelected((current) => {
      const next = new Set(current);
      const pendingIds = [...current];
      while (pendingIds.length > 0) {
        const currentID = pendingIds.pop();
        const permission = permissions.find((item) => item.id === currentID);
        idsOf(permission?.requer ?? []).forEach((id) => {
          if (!next.has(id)) {
            next.add(id);
            pendingIds.push(id);
          }
        });
      }
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
      setError(
        (caught as ApiError).mensagem ?? "Não foi possível salvar o cargo.",
      );
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      <div className="my-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/40 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3
                id="role-modal-title"
                className="text-lg font-bold text-slate-100"
              >
                {role
                  ? `Editar Cargo: ${role.nome}`
                  : "Cadastrar Novo Cargo / Função"}
              </h3>
              <p className="text-xs text-slate-400">
                Dê um nome ao cargo e escolha o que ele pode fazer.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={(event) => void submit(event)}>
          <div className="max-h-[68vh] space-y-6 overflow-y-auto p-6">
            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
                {error}
              </div>
            )}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <label className="text-xs font-semibold text-slate-300">
                Nome do Cargo / Função *
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Operador de Balança e Pátio"
                  className="mt-1.5 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-100 outline-none focus:border-emerald-500"
                />
              </label>
            </div>
            {models.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    Começar de um modelo
                  </span>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Os modelos marcam as permissões de uma função comum. Dá para
                    combinar mais de um e ajustar abaixo antes de salvar.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {models.map((model) => {
                    const active = activeModels.includes(model.id);
                    return (
                      <button
                        key={model.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggleModel(model.id)}
                        className={`rounded-xl border p-3 text-left transition-all ${
                          active
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                        }`}
                      >
                        <span
                          className={`flex items-center gap-1.5 text-xs font-bold ${
                            active ? "text-emerald-300" : "text-slate-200"
                          }`}
                        >
                          {active && <Check className="h-3.5 w-3.5" />}
                          {model.nome}
                        </span>
                        <span className="mt-1 block text-[10px] leading-snug text-slate-400">
                          {model.descricao}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
                Permissões do cargo
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    toggle(
                      permissions.map((item) => item.id),
                      true,
                    )
                  }
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-400"
                >
                  + Marcar Todas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggle(
                      permissions.map((item) => item.id),
                      false,
                    );
                    setActiveModels([]);
                  }}
                  className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[11px] font-bold text-rose-400"
                >
                  - Desmarcar Todas
                </button>
              </div>
            </div>
            {missingByPermission.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  {missingByPermission.size === 1
                    ? "Uma permissão marcada depende de outra que está desmarcada."
                    : `${missingByPermission.size} permissões marcadas dependem de outras que estão desmarcadas.`}
                </span>
                <button
                  type="button"
                  onClick={addMissingDependencies}
                  className="rounded-lg border border-amber-500/40 px-3 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/10"
                >
                  Marcar as que faltam
                </button>
              </div>
            )}
            <div className="space-y-4">
              {groups.map((group) => {
                const marked = group.items.filter((item) =>
                  selectedSet.has(item.id),
                ).length;
                return (
                  <PermissionModuleCard
                    key={group.id}
                    title={group.nome}
                    icon={moduleIcons[group.id] ?? Key}
                    description={`${marked} de ${group.items.length} marcadas`}
                    onToggleAll={(enabled) =>
                      toggle(
                        group.items.map((item) => item.id),
                        enabled,
                      )
                    }
                  >
                    {group.items.map((permission) => {
                      const missing = missingByPermission.get(permission.id);
                      return (
                        <PermissionItem
                          key={permission.id}
                          label={permission.descricao || permission.nome}
                          detail={permission.descricao ? permission.nome : ""}
                          warning={
                            missing
                              ? `Precisa de: ${missing
                                  .map((nome) => labelByName.get(nome) ?? nome)
                                  .join("; ")}`
                              : undefined
                          }
                          checked={selectedSet.has(permission.id)}
                          onChange={() => toggle([permission.id])}
                        />
                      );
                    })}
                  </PermissionModuleCard>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 p-6">
            <span className="font-mono text-xs text-slate-400">
              {selected.length} de {permissions.length} permissões configuradas.
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold uppercase text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {pending ? "Salvando..." : "Salvar Cargo & Permissões"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
