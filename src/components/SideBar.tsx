import {
  LayoutDashboard,
  Package,
  DollarSign,
  Users,
  TrendingUp,
  LogOut,
  Leaf,
  ShieldCheck,
  X,
  ClipboardList,
  UserCog,
} from "lucide-react";
import { ItemMenu } from "./ItemMenu";
import { useNavigate } from "react-router";
import { useState } from "react";

interface SidebarProps {
  tab: string;

  user: string;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  onLogout,
  user,
  tab,
}: SidebarProps) {
  const navigate = useNavigate();
  const menuItems = [
    {
      id: "dashboard",
      label: "Painel Geral",
      icon: LayoutDashboard,
      link: "/dashboard",
    },

    {
      id: "pedidos",
      label: "Gerenciar Pedidos",
      icon: ClipboardList,
      link: "/pedidos",
    },
    {
      id: "estoque",
      label: "Controle de Estoque",
      icon: Package,
      link: "/estoque",
    },
    {
      id: "precos",
      label: "Preços Praticados",
      icon: TrendingUp,
      link: "/precos",
    },
    {
      id: "financeiro",
      label: "Fluxo de Caixa",
      icon: DollarSign,
      link: "/financeiro",
    },
    {
      id: "registros",
      label: "Clientes e Fornecedores",
      icon: Users,
      link: "/registros",
    },
    {
      id: "usuarios",
      label: "Gestão de Usuários",
      icon: UserCog,
      link: "/usuarios",
    },
  ];
  const [activeTab, setActiveTab] = useState(tab);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 text-slate-200 w-64 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out z-40 flex flex-col justify-between`}
      >
        {/* Header Branding */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/20">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <span className="font-extrabold text-slate-100 tracking-tight flex items-center">
                  Eco
                  <span className="text-emerald-400 font-medium ml-1">
                    Gestor
                  </span>
                </span>
                <p className="text-[10px] font-mono tracking-wider text-slate-500 uppercase">
                  Suite de Reciclagem
                </p>
              </div>
            </div>
            {/* Close button on Mobile */}
            <button
              className="lg:hidden p-1 text-slate-400 hover:text-slate-100"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Operator Widget */}
          <div className="px-4 py-4 border-b border-slate-800 bg-slate-950/10">
            <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800/80">
              <div className="h-9 w-9 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-lg flex items-center justify-center text-slate-100 font-bold text-sm shadow-inner uppercase">
                a
              </div>
              <div className="overflow-hidden">
                <p className="text-xs text-slate-400 font-medium">
                  Operador Ativo
                </p>
                <p className="text-sm font-semibold text-slate-100 truncate">
                  {user}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <ItemMenu
                  Icon={item.icon}
                  isActive={isActive}
                  onClick={() => {
                    setIsOpen(false);
                    setActiveTab(item.id);
                    navigate(item.link);
                  }}
                  label={item.label}
                  key={item.id}
                />
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/15">
          <div className="mb-4 flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-500 text-xs font-mono">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Licença: Ativa (PRO)</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-slate-950 rounded-xl text-sm font-semibold transition-all duration-150 border border-rose-500/20 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}
