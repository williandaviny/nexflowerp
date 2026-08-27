import React, { createContext, useContext, useEffect, useState } from 'react';
import { IDatabaseService, DashboardMetrics } from '../services/database/adapter';
import { localDatabase } from '../services/database/sqlite';
import { EmpresaConfig } from '../types/database';

interface DatabaseContextType {
  db: IDatabaseService;
  config: EmpresaConfig | null;
  metrics: DashboardMetrics | null;
  isReady: boolean;
  backupDaysAlert: number | null; // dias desde o último backup
  refreshConfig: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({} as DatabaseContextType);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [config, setConfig] = useState<EmpresaConfig | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [backupDaysAlert, setBackupDaysAlert] = useState<number | null>(null);

  const calculateBackupAlert = (cfg: EmpresaConfig) => {
    if (!cfg.ultimo_backup_at) {
      setBackupDaysAlert(999); // Nunca fez backup!
      return;
    }
    const ultimo = new Date(cfg.ultimo_backup_at).getTime();
    const agora = new Date().getTime();
    const diffDias = Math.floor((agora - ultimo) / (1000 * 60 * 60 * 24));
    setBackupDaysAlert(diffDias >= 7 ? diffDias : null);
  };

  const refreshConfig = async () => {
    const cfg = await localDatabase.getConfig();
    setConfig(cfg);
    calculateBackupAlert(cfg);
  };

  const refreshMetrics = async () => {
    const met = await localDatabase.getDashboardMetrics();
    setMetrics(met);
  };

  const refreshAll = async () => {
    await refreshConfig();
    await refreshMetrics();
  };

  useEffect(() => {
    const initDb = async () => {
      await localDatabase.init();
      await refreshAll();
      setIsReady(true);
    };
    initDb();
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        db: localDatabase,
        config,
        metrics,
        isReady,
        backupDaysAlert,
        refreshConfig,
        refreshMetrics,
        refreshAll
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext);
