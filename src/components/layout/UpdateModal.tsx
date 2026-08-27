import React, { useEffect, useState } from 'react';
import { Sparkles, Download, X, CheckCircle } from 'lucide-react';
import { UpdaterService, UpdateInfo } from '../../services/updater/updater';

export const UpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    // Checa updates 3 segundos após abrir o sistema
    const timer = setTimeout(async () => {
      const info = await UpdaterService.checkForUpdates();
      if (info.hasUpdate) {
        setUpdateInfo(info);
        setModalOpen(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleDownloadClick = () => {
    const url = updateInfo?.downloadUrl || 'https://github.com/williandaviny/nexflowerp/releases';
    // Abre no navegador padrão do Windows
    window.open(url, '_blank');
  };

  if (!modalOpen || !updateInfo) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-3xl p-6 space-y-4 border border-emerald-500/40 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Nova Atualização Disponível!</h3>
              <p className="text-xs text-slate-400">
                Versão <strong className="text-emerald-400 font-mono">v{updateInfo.latestVersion}</strong> (Sua versão atual: v{updateInfo.currentVersion})
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Detalhes da Atualização */}
        <div className="space-y-2 text-xs">
          <p className="text-slate-300 font-semibold">O que há de novo nesta versão:</p>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 whitespace-pre-line max-h-36 overflow-y-auto leading-relaxed">
            {updateInfo.body}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center space-x-2">
          <CheckCircle size={14} className="text-emerald-400 shrink-0" />
          <span>Ao atualizar, todas as suas vendas, estoque e clientes permanecem intactos!</span>
        </div>

        <div className="flex space-x-2 pt-2">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Lembrar Depois
          </button>

          <button
            type="button"
            onClick={handleDownloadClick}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
          >
            <Download size={14} />
            <span>Baixar Atualização</span>
          </button>
        </div>
      </div>
    </div>
  );
};
