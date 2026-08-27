import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../context/DatabaseContext';
import { Cloud, HardDrive, AlertTriangle, ShieldCheck, Download, Clock } from 'lucide-react';
import { BackupService } from '../../services/backup/backup';

export const Navbar: React.FC<{ activeTab: string; onNavigate: (tab: string) => void }> = ({ activeTab, onNavigate }) => {
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
    } catch (err) {
      alert('Erro ao gerar backup');
    } finally {
      setBackingUp(false);
    }
  };

  const isCloud = config?.supabase_ativo && config?.supabase_url;

  return (
    <header className="h-16 px-6 glass-header flex items-center justify-between z-30 select-none">
      {/* Esquerda: Informações da Loja e Modo */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-white tracking-wider text-lg">
            N
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100 tracking-tight text-base">
                {config?.nome_fantasia || 'NexFlow ERP'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                v1.0 Local-First
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isCloud ? 'Modo Híbrido Conectado' : 'Modo Offline Nativo (100% no PC)'}
            </p>
          </div>
        </div>
      </div>

      {/* Direita: Alertas, Backup Rápido, Status e Hora */}
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

        {/* Status Modo Nuvem ou Offline */}
        <div
          onClick={() => onNavigate('config')}
          className={`cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            isCloud
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
          }`}
          title={isCloud ? 'Supabase Nuvem Ativo' : 'Banco SQLite Local'}
        >
          {isCloud ? (
            <>
              <Cloud size={14} className="text-emerald-400" />
              <span>Nuvem Supabase</span>
            </>
          ) : (
            <>
              <HardDrive size={14} className="text-blue-400" />
              <span>Banco SQL Local</span>
            </>
          )}
        </div>

        {/* Relógio */}
        <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs font-mono">
          <Clock size={13} className="text-slate-500" />
          <span>{time.toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>
    </header>
  );
};
