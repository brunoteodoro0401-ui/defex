// ============================================================
// SAQM — Página: Triagem Recebimentos
// Fonte: tabela triagem_recebimentos (via DataGrid genérico)
// ============================================================

import { useMemo } from 'react';
import { Loader2, ClipboardList, MapPin, UserCheck } from 'lucide-react';
import type { TriagemRecebimento } from '../types/index';
import { useTableData } from '../hooks/useTableData';
import { useDataGrid } from '../components/datagrid/useDataGrid';
import { DataGrid } from '../components/datagrid/DataGrid';
import { Badge, EmptyCell, StatCard } from '../components/datagrid/cells';
import type { ColumnDef } from '../components/datagrid/types';

const COLUMNS: ColumnDef<TriagemRecebimento>[] = [
  { key: 'imei',         label: 'IMEI',                cellClassName: 'font-mono font-medium text-slate-800 dark:text-slate-200' },
  { key: 'marca',        label: 'Marca' },
  { key: 'modelo',       label: 'Modelo',              cellClassName: 'font-semibold text-slate-800 dark:text-slate-200 max-w-[200px] truncate' },
  { key: 'data_triagem', label: 'Data Triagem',        type: 'date', cellClassName: 'font-mono text-[11px]' },
  { key: 'origem',       label: 'Origem',              render: (r) => r.origem ? <Badge tone="sky">{r.origem}</Badge> : <EmptyCell /> },
  { key: 'observacoes',  label: 'Observações Triagem', cellClassName: 'max-w-sm truncate' },
  { key: 'triador',      label: 'Triador',             render: (r) => r.triador ? <Badge tone="slate">{r.triador}</Badge> : <EmptyCell /> },
];

export function TriagemRecebimentosPage() {
  const { rows, loading, error, reload } = useTableData<TriagemRecebimento>('triagem_recebimentos');
  const grid = useDataGrid({ rows, columns: COLUMNS, storageKey: 'recebimentos' });

  const { origens, triadores } = useMemo(() => ({
    origens:   new Set(grid.filteredRows.map((r) => r.origem).filter(Boolean)).size,
    triadores: new Set(grid.filteredRows.map((r) => r.triador).filter(Boolean)).size,
  }), [grid.filteredRows]);

  if (loading && rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Loader2 size={32} className="animate-spin text-brand-600 dark:text-brand-400" />
        <span className="text-xs font-medium text-slate-500">Buscando recebimentos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Falha ao carregar dados: {error}</p>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">Verifique as permissões de acesso ao banco (RLS).</p>
      </div>
    );
  }

  const filtrado = grid.filteredRows.length !== rows.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Recebidos" value={grid.filteredRows.length} icon={<ClipboardList size={18} />} tone="brand"
          hint={filtrado ? `de ${rows.length.toLocaleString('pt-BR')} na base` : 'na base atual'} />
        <StatCard label="Canais / Origens" value={origens} icon={<MapPin size={18} />} tone="sky" hint="no resultado filtrado" />
        <StatCard label="Triadores" value={triadores} icon={<UserCheck size={18} />} tone="emerald" hint="no resultado filtrado" />
      </div>

      <DataGrid grid={grid} exportFileName="triagem_recebimentos" onReload={reload} reloading={loading} />
    </div>
  );
}
