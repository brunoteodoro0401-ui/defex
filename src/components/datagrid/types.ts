// ============================================================
// SAQM — DataGrid: tipos
// ============================================================

import type { ReactNode } from 'react';

export type ColumnType = 'text' | 'date';

export interface ColumnDef<T> {
  key:            keyof T & string;
  label:          string;
  type?:          ColumnType;            // padrão: 'text'
  render?:        (row: T) => ReactNode; // renderização customizada (badges etc.)
  cellClassName?: string;
  defaultHidden?: boolean;
}

export type TextOperator =
  | 'contains' | 'notContains' | 'equals'
  | 'startsWith' | 'endsWith' | 'empty' | 'notEmpty';

/** Um filtro por coluna — lista de valores (Excel), condição de texto ou período. */
export type ColumnFilter =
  | { kind: 'values'; values: string[] }
  | { kind: 'text';   op: TextOperator; value: string }
  | { kind: 'date';   from: string | null; to: string | null }; // ISO yyyy-mm-dd

export interface SortState {
  key: string | null;
  dir: 'asc' | 'desc' | null;
}

export interface FilterOption {
  label: string;
  count: number;
}
