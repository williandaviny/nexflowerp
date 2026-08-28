import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Cloud, AlertTriangle, Download, Clock } from 'lucide-react';
import { BackupService } from '../../services/backup/backup';
import { APP_VERSION } from '../../services/updater/updater';

export const Navbar: React.FC<{ activeTab: string; onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { config, db, backupDaysAlert, refreshConfig } = useDatabase();
  const [time, setTime] = useState(new Date());
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickBackup = async () => {
    try {
      setBackingUp(true);
      await BackupService.gerarBackup(db);
      await refreshConfig();
    } catch {
      alert('Erro ao gerar backup');
    } finally {
      setBackingUp(false);
    }
  };

  const isCloud = config?.supabase_ativo && config?.supabase_url;

  return (
    <header className="h-16 px-6 glass-header flex items-center justify-between z-30 select-none">
      {/* Esquerda: Informações da Loja */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-white tracking-wider text-lg">
          N
        </div>
        <div className="flex items-center space-x-2.5">
          <span className="font-bold text-slate-100 tracking-tight text-base">
            {config?.nome_fantasia || 'NexFlow ERP'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
            v{APP_VERSION}
          </span>
        </div>
      </div>

      {/* Direita: Alertas, Backup Rápido, Status Nuvem e Hora */}
      <div className="flex items-center space-x-3">
        {/* Alerta de Backup Pendente */}
        {backupDaysAlert !== null && (
          <button
            onClick={() => onNavigate('config')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 transition"
            title="Clique para abrir a central de backup"
          >
            <AlertTriangle size={14} className="animate-pulse text-amber-400" />
            <span>
              {backupDaysAlert >= 900
                ? 'Nenhum backup realizado ainda!'
                : `Último backup há ${backupDaysAlert} dias`}
            </span>
          </button>
        )}

        {/* Botão de Backup Rápido */}
        <button
          onClick={handleQuickBackup}
          disabled={backingUp}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition shadow-sm"
        >
          <Download size={14} className={backingUp ? 'animate-bounce text-emerald-400' : 'text-slate-400'} />
          <span>{backingUp ? 'Gerando...' : 'Backup Rápido (.nexflow)'}</span>
        </button>

        {/* Indicador Nuvem (Aparece apenas quando a sincronização estiver ligada) */}
        {isCloud && (
          <div
            onClick={() => onNavigate('config')}
            className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 transition"
            title="Sincronização Nuvem Supabase Ativa"
          >
            <Cloud size={14} className="text-emerald-400" />
            <span>Nuvem Ativa</span>
          </div>
        )}

        {/* Relógio */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-mono">
          <Clock size={13} className="text-slate-500" />
          <span>{time.toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>
    </header>
  );
};
