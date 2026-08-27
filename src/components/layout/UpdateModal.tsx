import React, { useEffect, useState } from 'react';
import { Sparkles, Download, X, CheckCircle, RefreshCw } from 'lucide-react';
import { UpdaterService, UpdateInfo } from '../../services/updater/updater';

export const UpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [progresso, setProgresso] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  useEffect(() => {
    // Checa se há atualização 2 segundos após abrir
    const timer = setTimeout(async () => {
      try {
        // Tenta checar via Tauri updater primeiro
        const tauriUpdater = await import('@tauri-apps/plugin-updater').catch(() => null);
        if (tauriUpdater && typeof tauriUpdater.check === 'function') {
          const update = await tauriUpdater.check();
          if (update && update.available) {
            setUpdateInfo({
              hasUpdate: true,
              currentVersion: update.currentVersion || UpdaterService.getCurrentVersion(),
              latestVersion: update.version,
              body: update.body || 'Correções de estabilidade e novas funcionalidades.',
              downloadUrl: ''
            });
            setModalOpen(true);
            return;
          }
        }

        // Fallback: API GitHub
        const info = await UpdaterService.checkForUpdates();
        if (info.hasUpdate) {
          setUpdateInfo(info);
          setModalOpen(true);
        }
      } catch (err) {
        console.log('Verificação de update:', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleAtualizarAutomatico = async () => {
    try {
      setAtualizando(true);
      setStatusMsg('Iniciando download da atualização...');
      setProgresso(5);

      const tauriUpdater = await import('@tauri-apps/plugin-updater').catch(() => null);
      if (tauriUpdater && typeof tauriUpdater.check === 'function') {
        const update = await tauriUpdater.check();
        if (update && update.available) {
          let baixado = 0;
          let total = 0;

          await update.downloadAndInstall((event: any) => {
            if (event.event === 'Started' && event.data?.contentLength) {
              total = event.data.contentLength;
              setStatusMsg('Baixando arquivos em segundo plano...');
            } else if (event.event === 'Progress') {
              baixado += event.data?.chunkLength || 0;
              if (total > 0) {
                const pct = Math.min(99, Math.round((baixado / total) * 100));
                setProgresso(pct);
                setStatusMsg(`Baixando: ${pct}% concluído`);
              }
            } else if (event.event === 'Finished') {
              setProgresso(100);
              setStatusMsg('Instalação concluída! Reiniciando sistema...');
            }
          });

          setStatusMsg('Reiniciando aplicativo atualizado...');
          const tauriProcess = await import('@tauri-apps/plugin-process').catch(() => null);
          if (tauriProcess && typeof tauriProcess.relaunch === 'function') {
            await tauriProcess.relaunch();
          } else {
            window.location.reload();
          }
          return;
        }
      }

      // Fallback se não estiver dentro do binário nativo do Tauri
      const url = updateInfo?.downloadUrl || 'https://github.com/williandaviny/nexflowerp/releases';
      window.open(url, '_blank');
      setAtualizando(false);
    } catch (err: any) {
      console.error('Erro na atualização automática:', err);
      setStatusMsg('Redirecionando para download direto...');
      const url = updateInfo?.downloadUrl || 'https://github.com/williandaviny/nexflowerp/releases';
      window.open(url, '_blank');
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
                Versão <strong className="text-emerald-400 font-mono">v{updateInfo.latestVersion}</strong> (Sua versão: v{updateInfo.currentVersion})
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
          <p className="text-slate-300 font-semibold">Novidades desta versão:</p>
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 whitespace-pre-line max-h-32 overflow-y-auto leading-relaxed">
            {updateInfo.body}
          </div>
        </div>

        {/* Barra de Progresso de Download / Instalação */}
        {atualizando ? (
          <div className="space-y-2 py-2">
            <div className="flex justify-between text-xs text-slate-300">
              <span className="flex items-center space-x-2">
                <RefreshCw size={13} className="animate-spin text-emerald-400" />
                <span>{statusMsg}</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">{progresso}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                style={{ width: `${progresso}%` }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              />
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              O sistema será reiniciado automaticamente assim que concluir.
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-center space-x-2">
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            <span>Atualização 100% segura: nenhum dado de vendas ou estoque será apagado!</span>
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
              onClick={handleAtualizarAutomatico}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/20"
            >
              <Download size={14} />
              <span>Atualizar Automaticamente</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
