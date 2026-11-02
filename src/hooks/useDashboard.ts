// ============================================================
// TeodoroTech — Hook: useDashboard (100% Local / Demo + Upload .xlsx)
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { DashboardData } from '../types/index';
import {
  loadActiveDataset,
  buildDashboardData,
  parseAndStoreSpreadsheet,
  resetToDemoDataset,
  subscribeDatasetChanges,
} from '../lib/localDataStore';

interface UseDashboardReturn {
  data:          DashboardData | null;
  isDemo:        boolean;
  fileName:      string | null;
  loading:       boolean;
  error:         string | null;
  uploadSuccess: boolean;
  handleUpload:  (file: File) => Promise<void>;
  handleResetDemo: () => void;
}

export function useDashboard(): UseDashboardReturn {
  const [data,          setData]          = useState<DashboardData | null>(null);
  const [isDemo,        setIsDemo]        = useState<boolean>(true);
  const [fileName,      setFileName]      = useState<string | null>(null);
  const [loading,       setLoading]       = useState<boolean>(false);
  const [error,         setError]         = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const syncFromStore = useCallback(() => {
    const ds = loadActiveDataset();
    setIsDemo(ds.isDemo);
    setFileName(ds.fileName);
    setData(buildDashboardData(ds));
  }, []);

  useEffect(() => {
    syncFromStore();
    return subscribeDatasetChanges(syncFromStore);
  }, [syncFromStore]);

  const handleUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);
      setUploadSuccess(false);
      await parseAndStoreSpreadsheet(file);
      setUploadSuccess(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar a planilha.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResetDemo = useCallback(() => {
    setError(null);
    setUploadSuccess(false);
    resetToDemoDataset();
  }, []);

  return {
    data,
    isDemo,
    fileName,
    loading,
    error,
    uploadSuccess,
    handleUpload,
    handleResetDemo,
  };
}
