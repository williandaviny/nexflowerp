import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  Wallet,
  Database
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { metrics, backupDaysAlert } = useDatabase();

  const estoqueBaixoCount = metrics?.produtosEstoqueBaixo?.length || 0;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      highlight: false
    },
    {
      id: 'pdv',
      label: 'Frente de Caixa (PDV)',
      icon: ShoppingCart,
      highlight: true
    },
    {
      id: 'estoque',
      label: 'Estoque & Produtos',
      icon: Package,
      badge: estoqueBaixoCount > 0 ? estoqueBaixoCount : undefined,
      badgeColor: 'bg-rose-500'
    },
    {
      id: 'crm',
      label: 'Clientes & CRM',
      icon: Users
    },
    {
      id: 'vendas',
      label: 'Histórico de Vendas',
      icon: Receipt
    },
    {
      id: 'caixa',
      label: 'Controle de Caixa',
      icon: Wallet
    },
    {
      id: 'config',
      label: 'Backup & Nuvem',
      icon: Database,
      badge: backupDaysAlert !== null ? '!' : undefined,
      badgeColor: 'bg-amber-500'
    }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between p-4 select-none shrink-0">
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navegação Principal
          </p>

          <nav className="space-y-1.5 pt-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (item.highlight) {
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon size={18} className={isActive ? 'text-white' : 'text-emerald-400'} />
                      <span>{item.label}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/50 text-white font-mono">
                      F2
                    </span>
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700/80 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon size={18} className={isActive ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${item.badgeColor || 'bg-slate-700'}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
};
