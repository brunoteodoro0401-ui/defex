// ============================================================
// SAQM — Página: Reparo dos Técnicos
// Fonte: tabela triagem_tecnicos (via DataGrid genérico)
// ============================================================

import { useMemo } from 'react';
import { Loader2, Wrench, Users, Filter } from 'lucide-react';
import type { TriagemTecnico } from '../types/index';
import { useTableData } from '../hooks/useTableData';
import { useDataGrid } from '../components/datagrid/useDataGrid';
import { DataGrid } from '../components/datagrid/DataGrid';
import { Badge, EmptyCell, StatCard } from '../components/datagrid/cells';
import type { ColumnDef } from '../components/datagrid/types';

const COLUMNS: ColumnDef<TriagemTecnico>[] = [
  { key: 'imei',           label: 'IMEI',                 cellClassName: 'font-mono font-medium text-slate-800 dark:text-slate-200' },
  { key: 'marca',          label: 'Marca' },
  { key: 'modelo',         label: 'Modelo',               cellClassName: 'font-semibold text-slate-800 dark:text-slate-200 max-w-[220px] truncate' },
  { key: 'data_reparo',    label: 'Data Reparo',          type: 'date', cellClassName: 'font-mono text-[11px]' },
  { key: 'tipo_reparo',    label: 'Tipo Reparo',          render: (r) => r.tipo_reparo ? <Badge tone="indigo">{r.tipo_reparo}</Badge> : <EmptyCell /> },
  { key: 'motivo_reprova', label: 'Manutenção Executada', cellClassName: 'max-w-xs truncate' },
  { key: 'tecnico',        label: 'Técnico',              render: (r) => r.tecnico ? <Badge tone="brand" dot>{r.tecnico}</Badge> : <EmptyCell /> },
  { key: 'triador',        label: 'Triador' },
];

export function ReparosTecnicosPage() {
  const { rows, loading, error, reload } = useTableData<TriagemTecnico>('triagem_tecnicos');
  const grid = useDataGrid({ rows, columns: COLUMNS, storageKey: 'tecnicos' });

  const tecnicosNoFiltro = useMemo(
    () => new Set(grid.filteredRows.map((r) => r.tecnico).filter(Boolean)).size,
    [grid.filteredRows],
  );

  if (loading && rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Loader2 size={32} className="animate-spin text-brand-600 dark:text-brand-400" />
        <span className="text-xs font-medium text-slate-500">Buscando histórico de reparos...</span>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total de Reparos" value={rows.length} icon={<Wrench size={18} />} tone="brand" hint="na base atual" />
        <StatCard label="Técnicos" value={tecnicosNoFiltro} icon={<Users size={18} />} tone="indigo" hint="no resultado filtrado" />
        <StatCard label="Resultado do Filtro" value={grid.filteredRows.length} icon={<Filter size={18} />} tone="emerald"
          hint={rows.length ? `${((grid.filteredRows.length / rows.length) * 100).toFixed(1)}% da base` : undefined} />
      </div>

      <DataGrid grid={grid} exportFileName="reparos_tecnicos" onReload={reload} reloading={loading} />
    </div>
  );
}
