import { Bell, Clock, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useLoggedUser } from "../context/useLoggedUser";
import Sidebar from "./SideBar";

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  pageTitle: string;
}

export const LayoutBase = ({ children, activeTab, pageTitle }: LayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user, logout } = useLoggedUser();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans antialiased text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        tab={activeTab}
        user={user?.nome ?? "Operador"}
        onLogout={handleLogout}
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
      />

      {/* Main Content Layout Container */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Controls bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu trigger */}
            <button
              id="menu-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-100 rounded-lg lg:hidden transition-colors cursor-pointer"
            >
              <Menu className="h-5.5 w-5.5" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-slate-100 leading-tight tracking-tight uppercase font-mono">
                {pageTitle}
              </h2>
              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                <Clock className="h-3 w-3 text-emerald-400" />
                <span>Base Operacional: Usina Leste</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Simple notification bell */}
            <button className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800/40 border border-slate-800 hover:border-emerald-500/10 rounded-xl transition-all relative cursor-pointer">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </button>

            {/* Operator Quick Profile */}
            <div className="flex items-center gap-2.5 border-l border-slate-800 pl-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200">
                  {user?.nome ?? "Operador"}
                </p>
                <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-mono font-semibold">
                  Admin Geral
                </span>
              </div>
              <div className="h-8.5 w-8.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-semibold font-mono text-sm shadow-sm select-none uppercase">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Core Screen Stage */}
        <main className="p-6 flex-1 overflow-y-auto max-w-7xl w-full mx-auto pb-12">
          {children}
        </main>
      </div>
    </div>
  );
};
