// ============================================================
// TeodoroTech — Hook: useTableData (Lê dados locais / Demo + Upload)
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { loadActiveDataset, subscribeDatasetChanges } from '../lib/localDataStore';

export function useTableData<T>(table: 'triagem_recebimentos' | 'triagem_tecnicos' | 'devolucoes' | string) {
  const [rows, setRows]       = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const ds = loadActiveDataset();
      if (table === 'triagem_recebimentos') {
        setRows(ds.recebimentos as unknown as T[]);
      } else if (table === 'triagem_tecnicos') {
        setRows(ds.tecnicos as unknown as T[]);
      } else if (table === 'devolucoes') {
        setRows(ds.devolucoes as unknown as T[]);
      } else {
        setRows([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [table]);

  useEffect(() => {
    reload();
    return subscribeDatasetChanges(reload);
  }, [reload]);

  return { rows, loading, error, reload };
}
