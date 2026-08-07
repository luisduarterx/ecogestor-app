import {
  CheckCircle2,
  Edit3,
  Key,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { LayoutBase } from "../../components/LayoutBase";
import NewRoleModal from "../../components/modals/NewRoleModal";
import NewUserModal from "../../components/modals/NewUserModal";
import { useLoggedUser } from "../../context/useLoggedUser";
import {
  useDeleteRole,
  useDeleteUser,
  usePermissions,
  useRoleDetails,
  useRoles,
  useUsers,
} from "../../utils/queries";
import type {
  ApiError,
  RoleResponse,
  UserManagementResponse,
} from "../../utils/types";

export function Usuarios() {
  const [activeSubTab, setActiveSubTab] = useState<"users" | "roles">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserManagementResponse | null>(
    null,
  );
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "user" | "role";
    id: number;
    name: string;
  } | null>(null);
  const [feedback, setFeedback] = useState("");
  const { user: loggedUser } = useLoggedUser();
  const usersQuery = useUsers();
  const rolesQuery = useRoles();
  const roleIDs = useMemo(
    () => (rolesQuery.data ?? []).map((role) => role.id),
    [rolesQuery.data],
  );
  const roleDetailsQuery = useRoleDetails(roleIDs);
  const permissionsQuery = usePermissions();
  const deleteUser = useDeleteUser();
  const deleteRole = useDeleteRole();
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const roles = useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const roleDetails = useMemo(
    () => roleDetailsQuery.data ?? [],
    [roleDetailsQuery.data],
  );
  const roleByID = new Map(roles.map((role) => [role.id, role]));
  const detailByID = new Map(roleDetails.map((role) => [role.id, role]));

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    return users.filter((item) => {
      const matchesTerm =
        !term ||
        [item.nome, item.email, item.telefone, String(item.id)]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("pt-BR")
          .includes(term);
      return (
        matchesTerm &&
        (roleFilter === "all" || String(item.cargoID) === roleFilter)
      );
    });
  }, [roleFilter, searchTerm, users]);

  const adminCount = users.filter((item) =>
    roleByID.get(item.cargoID)?.nome.toUpperCase().includes("ADMIN"),
  ).length;
  const loading =
    usersQuery.isPending || rolesQuery.isPending || permissionsQuery.isPending;
  const loadErrors = [
    usersQuery.isError ? "usuários" : null,
    rolesQuery.isError ? "cargos" : null,
    permissionsQuery.isError ? "permissões" : null,
  ].filter(Boolean);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setFeedback("");
    try {
      if (deleteTarget.type === "user")
        await deleteUser.mutateAsync(deleteTarget.id);
      else await deleteRole.mutateAsync(deleteTarget.id);
      setFeedback(
        `${deleteTarget.type === "user" ? "Usuário" : "Cargo"} excluído com sucesso.`,
      );
      setDeleteTarget(null);
    } catch (caught) {
      setFeedback(
        (caught as ApiError).mensagem ??
          "Não foi possível concluir a exclusão.",
      );
    }
  }

  return (
    <LayoutBase activeTab="usuarios" pageTitle="Usuários">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-2 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveSubTab("users")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeSubTab === "users" ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-400" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}
          >
            <Wallet className="h-4 w-4" />
            Gestão de Usuários
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("roles")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${activeSubTab === "roles" ? "border border-amber-500/30 bg-amber-500/15 text-amber-400" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}
          >
            <Shield className="h-4 w-4" />
            Gestão de Cargos
            <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-400">
              {roles.length}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-6 font-sans">
        {feedback && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            {feedback}
          </div>
        )}
        {loadErrors.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            <span>Não foi possível carregar: {loadErrors.join(", ")}.</span>
            <button
              type="button"
              onClick={() => {
                void usersQuery.refetch();
                void rolesQuery.refetch();
                void permissionsQuery.refetch();
              }}
              className="rounded-lg bg-rose-400 px-3 py-2 text-xs font-bold uppercase text-slate-950 hover:bg-rose-300"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {activeSubTab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl md:flex-row md:items-center">
              <div>
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-slate-100">
                  <UserCog className="h-6 w-6 text-emerald-400" />
                  Gestão de Usuários
                </h2>
                <p className="mt-1 max-w-2xl text-xs text-slate-400">
                  Cadastro, atualização e atribuição de cargos. As permissões
                  são herdadas exclusivamente do cargo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setUserModalOpen(true);
                }}
                disabled={roles.length === 0}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-mono text-xs font-bold uppercase text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                <UserPlus className="h-4.5 w-4.5" />
                Cadastrar Novo Usuário
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Metric
                icon={Users}
                label="Total de Usuários"
                value={users.length}
                color="text-slate-100"
              />
              <Metric
                icon={CheckCircle2}
                label="Acessos Ativos"
                value={users.length}
                color="text-emerald-400"
              />
              <Metric
                icon={ShieldCheck}
                label="Administradores"
                value={adminCount}
                color="text-amber-400"
              />
            </div>

            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg lg:flex-row">
              <div className="relative w-full lg:w-96">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, e-mail, ID ou telefone..."
                  className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pr-9 pl-10 text-xs text-slate-100 outline-none focus:ring-1 focus:ring-emerald-400"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="flex w-full items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-1.5 lg:w-auto">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-200 outline-none"
                >
                  <option value="all">Todos os Cargos</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-200">
                  <Users className="h-4 w-4 text-emerald-400" />
                  Usuários Cadastrados ({filteredUsers.length})
                </h3>
                <span className="font-mono text-[10px] text-slate-500">
                  {filteredUsers.length} de {users.length} usuários exibidos
                </span>
              </div>
              {loading ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Carregando usuários...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/50 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3.5">Usuário / Identificação</th>
                        <th className="px-4 py-3.5">Cargo</th>
                        <th className="px-4 py-3.5">Contato</th>
                        <th className="px-4 py-3.5">Permissões do Cargo</th>
                        <th className="px-4 py-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.map((item) => {
                        const role = roleByID.get(item.cargoID);
                        const roleDetail = detailByID.get(item.cargoID);
                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 font-black text-slate-950">
                                  {item.nome.slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-100">
                                    {item.nome}{" "}
                                    <span className="font-mono text-[10px] text-slate-500">
                                      ({item.id})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {item.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold">
                                <ShieldCheck className="h-3 w-3" />
                                {role?.nome ?? `Cargo #${item.cargoID}`}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-mono text-slate-400">
                              {item.telefone || "Não informado"}
                            </td>
                            <td className="px-4 py-4">
                              <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                                {roleDetail?.permissoes.length ?? 0} acessos
                                herdados
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingUser(item);
                                    setUserModalOpen(true);
                                  }}
                                  title="Editar Dados do Usuário"
                                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-blue-500/20 hover:text-blue-400"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={item.id === loggedUser?.id}
                                  onClick={() =>
                                    setDeleteTarget({
                                      type: "user",
                                      id: item.id,
                                      name: item.nome,
                                    })
                                  }
                                  title={
                                    item.id === loggedUser?.id
                                      ? "Você não pode excluir seu próprio usuário"
                                      : "Excluir Usuário"
                                  }
                                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSubTab === "roles" && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl md:flex-row md:items-center">
              <div>
                <h2 className="flex items-center gap-2.5 text-xl font-bold text-slate-100">
                  <UserCog className="h-6 w-6 text-emerald-400" />
                  Gestão de Cargos e Permissões
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Cadastro de cargos e controle granular das permissões de
                  acesso.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingRole(null);
                  setRoleModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-mono text-xs font-bold uppercase text-slate-950 hover:bg-emerald-400"
              >
                <UserPlus className="h-4.5 w-4.5" />
                Cadastrar Novo Cargo
              </button>
            </div>
            {roleDetailsQuery.isPending ? (
              <div className="p-12 text-center text-xs text-slate-400">
                Carregando cargos...
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => {
                  const detail = detailByID.get(role.id);
                  const assigned = users.filter(
                    (item) => item.cargoID === role.id,
                  );
                  return (
                    <div
                      key={role.id}
                      className="flex flex-col justify-between space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl transition-all hover:border-slate-700"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-emerald-500 p-3 text-slate-950">
                          <Shield className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100">
                            {role.nome}
                          </h3>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {assigned.length} usuário(s) vinculado(s)
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                        <div className="flex justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                            <Key className="h-3.5 w-3.5 text-emerald-400" />
                            Permissões Habilitadas
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {detail?.permissoes.length ?? 0} /{" "}
                            {permissionsQuery.data?.length ?? 0}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={!detail}
                          onClick={() => {
                            if (detail) {
                              setEditingRole(detail);
                              setRoleModalOpen(true);
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-emerald-400" />
                          Editar
                        </button>
                        <button
                          type="button"
                          disabled={assigned.length > 0}
                          onClick={() =>
                            setDeleteTarget({
                              type: "role",
                              id: role.id,
                              name: role.nome,
                            })
                          }
                          title={
                            assigned.length > 0
                              ? "Remova ou altere os usuários vinculados antes de excluir"
                              : "Excluir cargo"
                          }
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {userModalOpen && (
        <NewUserModal
          user={editingUser ?? undefined}
          roles={roles}
          onClose={() => {
            setUserModalOpen(false);
            setEditingUser(null);
          }}
        />
      )}
      {roleModalOpen && (
        <NewRoleModal
          role={editingRole ?? undefined}
          permissions={permissionsQuery.data ?? []}
          onClose={() => {
            setRoleModalOpen(false);
            setEditingRole(null);
          }}
        />
      )}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100">
              Excluir {deleteTarget.type === "user" ? "usuário" : "cargo"}?
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Confirma a exclusão de{" "}
              <strong className="text-slate-200">{deleteTarget.name}</strong>?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleteUser.isPending || deleteRole.isPending}
                className="rounded-xl bg-rose-400 px-4 py-2.5 text-xs font-bold text-slate-950 disabled:opacity-50"
              >
                {deleteUser.isPending || deleteRole.isPending
                  ? "Excluindo..."
                  : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </LayoutBase>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="h-3.5 w-3.5 text-emerald-400" />
        {label}
      </span>
      <p className={`font-mono text-3xl font-black ${color}`}>{value}</p>
    </div>
  );
}
