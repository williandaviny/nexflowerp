import React, { useEffect, useState } from 'react';
import { Sparkles, Download, X, CheckCircle, RefreshCw, Zap } from 'lucide-react';
import { UpdaterService, UpdateInfo, APP_VERSION } from '../../services/updater/updater';

export const UpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [progresso, setProgresso] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  useEffect(() => {
    // Checa se há atualização 3 segundos após abrir o sistema
    const timer = setTimeout(async () => {
      try {
        const info = await UpdaterService.checkForUpdates();
        if (info.hasUpdate) {
          setUpdateInfo(info);
          setModalOpen(true);
        }
      } catch (err) {
        console.log('Verificação de update:', err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAtualizarSilencioso = async () => {
    const targetUrl = updateInfo?.downloadUrl || 'https://github.com/williandaviny/nexflowerp/releases';

    try {
      setAtualizando(true);
      setStatusMsg('Conectando e iniciando download...');
      setProgresso(2);

      const { invoke } = await import('@tauri-apps/api/core');
      const { listen } = await import('@tauri-apps/api/event');

      // Escuta o evento de progresso vindo do Rust
      const unlisten = await listen<number>('update-progress', (event) => {
        const pct = event.payload;
        setProgresso(pct);
        if (pct < 100) {
          setStatusMsg(`Baixando atualização: ${pct}% concluído...`);
        } else {
          setStatusMsg('Download finalizado! Instalando e reiniciando...');
        }
      });

      // Dispara o download nativo em segundo plano
      await invoke('download_and_install_update', { url: targetUrl });
      unlisten();
    } catch (err: any) {
      console.error('Erro na atualização nativa, abrindo navegador como fallback:', err);
      setStatusMsg('Redirecionando para download...');
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('open_url', { url: targetUrl });
      } catch {
        window.open(targetUrl, '_blank');
      }
      setAtualizando(false);
    }
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
                Versão <strong className="text-emerald-400 font-mono">v{updateInfo.latestVersion}</strong> (Sua versão: v{APP_VERSION})
              </p>
            </div>
          </div>
          {!atualizando && (
            <button
              onClick={() => setModalOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Detalhes da Atualização */}
        <div className="space-y-2 text-xs">
          <p className="text-slate-300 font-semibold">O que há de novo nesta versão:</p>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 whitespace-pre-line max-h-32 overflow-y-auto leading-relaxed">
            {updateInfo.body}
          </div>
        </div>

        {/* Barra de Progresso de Download / Instalação */}
        {atualizando ? (
          <div className="space-y-2.5 py-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center space-x-2">
                <RefreshCw size={13} className="animate-spin text-emerald-400" />
                <span className="font-medium text-emerald-300">{statusMsg}</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{progresso}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700">
              <div
                style={{ width: `${progresso}%` }}
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-200 shadow-lg shadow-emerald-500/30"
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center space-x-1.5 pt-1">
              <Zap size={12} className="text-amber-400" />
              <span>O sistema reiniciará sozinho em poucos segundos. Não feche a janela.</span>
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center space-x-2">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span>Atualização 100% segura: suas vendas, estoque e clientes permanecem intactos!</span>
          </div>
        )}

        {!atualizando && (
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
              onClick={handleAtualizarSilencioso}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
            >
              <Download size={14} />
              <span>Atualizar Agora (Automático)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
