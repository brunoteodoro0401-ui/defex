// ============================================================
// SAQM — Tipos compartilhados do Front-end (nova estrutura)
// ============================================================

export interface ChartEntry {
  name:  string;
  value: number;
}

// ── Shape retornado por /dashboard-data ───────────────────
export interface KpiData {
  totalManutencao: number;   // Total de triagem_recebimentos
  taxaDevolucao:   number;   // % de devoluções sobre total
  totalDevolucoes?: number;  // Total de devoluções
  totalTecnicos?:   number;  // Total de reparos técnicos
}

export interface DashboardRecords {
  recebimentos: Omit<TriagemRecebimento, 'id' | 'created_at'>[];
  tecnicos:     Omit<TriagemTecnico, 'id' | 'created_at'>[];
  devolucoes:   Omit<Devolucao, 'id' | 'created_at'>[];
}

export interface DashboardData {
  kpis:       KpiData;
  categorias: ChartEntry[];  // Categorias de defeito via NLP
  origens:    ChartEntry[];  // Agrupamento por ORIGEM
  lastUpdate: string | null; // ISO timestamp do registro mais recente
  records?:   DashboardRecords;
}

// ── Shapes das tabelas (para as páginas de Data Grid) ─────
export interface TriagemTecnico {
  id:             string;
  imei:           string | null;
  marca:          string | null;
  modelo:         string | null;
  data_reparo:    string | null;
  tipo_reparo:    string | null;
  motivo_reprova: string | null;
  tecnico:        string | null;
  triador:        string | null;
  created_at:     string;
}

export interface TriagemRecebimento {
  id:           string;
  imei:         string | null;
  marca:        string | null;
  modelo:       string | null;
  data_triagem: string | null;
  origem:       string | null;
  observacoes:  string | null;
  triador:      string | null;
  created_at:   string;
}

export interface Devolucao {
  id:               string;
  cliente:          string | null;
  modelo:           string | null;
  imei:             string | null;
  origem:           string | null;
  motivo:           string | null;
  finalidade:       string | null;
  data_recebimento: string | null;
  created_at:       string;
}
