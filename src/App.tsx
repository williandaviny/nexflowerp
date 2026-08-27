import React, { useState, useEffect } from 'react';
import { DatabaseProvider, useDatabase } from './context/DatabaseContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { UpdateModal } from './components/layout/UpdateModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { PDVView } from './components/pdv/PDVView';
import { EstoqueView } from './components/estoque/EstoqueView';
import { CRMView } from './components/crm/CRMView';
import { VendasView } from './components/vendas/VendasView';
import { CaixaView } from './components/caixa/CaixaView';
import { ConfigView } from './components/config/ConfigView';

const MainLayout: React.FC = () => {
  const { isReady } = useDatabase();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Atalhos Globais de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pdv');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('estoque');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('crm');
      } else if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isReady) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center font-bold text-white text-2xl shadow-xl shadow-emerald-500/25 animate-pulse">
          N
        </div>
        <div className="text-slate-300 font-medium text-sm">Carregando Banco de Dados Local...</div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-slate-900/40 to-slate-950">
          <ErrorBoundary>
            {activeTab === 'dashboard' && <DashboardView onNavigate={setActiveTab} />}
            {activeTab === 'pdv' && <PDVView />}
            {activeTab === 'estoque' && <EstoqueView />}
            {activeTab === 'crm' && <CRMView />}
            {activeTab === 'vendas' && <VendasView />}
            {activeTab === 'caixa' && <CaixaView />}
            {activeTab === 'config' && <ConfigView />}
          </ErrorBoundary>
        </main>
      </div>
      {/* Verificador de Novas Versões */}
      <UpdateModal />
    </div>
  );
};

export function App() {
  return (
    <DatabaseProvider>
      <CartProvider>
        <MainLayout />
      </CartProvider>
    </DatabaseProvider>
  );
}

export default App;
