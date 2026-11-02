// ============================================================
// SAQM — Motor Analítico da Tela Inicial (Home)
// Processa e cruza as 3 tabelas (Recebimentos, Técnicos,
// Devoluções) com higienização automática de marcas, modelos,
// datas e NLP sobre observações/motivos.
// ============================================================

import { DashboardData } from '../types/index';
import { formatDateDisplay } from './formatters';

export type PeriodFilter = 'all' | 'last30' | 'last90' | '2026' | '2025' | '2024' | string; // ou 'YYYY-MM'
export type BrandFilter  = 'ALL' | 'Apple' | 'Samsung' | 'Motorola' | 'Outras';

// ── Normalização de Marca (corrige typos e infere pelo modelo) ─
export function normalizeBrand(marca?: string | null, modelo?: string | null): 'Apple' | 'Samsung' | 'Motorola' | 'Outras' {
  const combined = `${marca ?? ''} ${modelo ?? ''}`.toLowerCase();
  if (/apple|iphone|ipad|airpods|\bse\s*\(|1[1-6]\s*pro|1[23]\s*mini|\bxr\b|\bxs\b/.test(combined)) {
    return 'Apple';
  }
  if (/sams|amsung|galaxy|\bs2[0-5]\b|\ba[0-7][0-9]|\bm[1-6][0-9]|z\s*flip|z\s*fold|note\s*20/.test(combined)) {
    return 'Samsung';
  }
  if (/motorola|\bmoto\b|razr|rave\s*40|\bedge\s*\d|\bg[0-9]{1,3}\b|\be[0-9]{1,2}\b|one\s*(fusion|macro|vision|zoom)/.test(combined)) {
    return 'Motorola';
  }
  return 'Outras';
}

// ── Normalização de Nome de Modelo (agrupa SKUs no mesmo modelo) ─
export function normalizeModel(marca?: string | null, modelo?: string | null): string {
  const raw = (modelo ?? '').trim();
  if (!raw) return 'Não Informado';

  const brand = normalizeBrand(marca, raw);
  let clean = raw
    .toUpperCase()
    .replace(/\s*-\s*(GRADE\s*[A-Z]|SN|OPEN).*$/i, '')
    .replace(/\b(32|64|128|256|512)\s*GB\b/gi, '')
    .replace(/\b[48]GB\s*RAM\b/gi, '')
    .replace(/\b(DUAL\s*SIM|5G|4G|\(EXYNOS\)|\(SNAPDRAGON\)|SNAP)\b/gi, '')
    .replace(/\b(PRETO|BRANCO|AZUL|VERDE|ROSA|ROXO|DOURADO|GRAFITE|PRATA|PRATEADO|AMARELO|VERMELHO|CINZA|ESPACIAL|ESCURO|CLARO|INDIGO|METALICO|BRONZE|LAVANDA|MARROM|VIOLETA|TITANIO|VANILLA|DARK\s*PRISM|COPPER|COBRE|COR)\b/gi, '')
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return 'Não Informado';

  if (brand === 'Apple') {
    clean = clean.replace(/^APPLE\s*/i, '').replace(/^IPHONE\s*/i, '').trim();
    if (/^SE\b/i.test(clean)) return 'iPhone SE';
    const m = clean.match(/^(1[1-6]|X[RS]?|[678])(\s*(PRO\s*MAX|PRO|PLUS|MINI|MAX))?/i);
    if (m) {
      const num = m[1].toUpperCase();
      const suf = (m[3] ?? '').toUpperCase().replace(/\s+/g, ' ').trim();
      const prettySuf = suf
        ? ' ' + suf.split(' ').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')
        : '';
      return `iPhone ${num}${prettySuf}`;
    }
    return `iPhone ${clean}`.slice(0, 26);
  }

  if (brand === 'Samsung') {
    clean = clean
      .replace(/^(S?AMSUNG|SAMSAUNG)\s*/i, '')
      .replace(/^SMARTPHONE\s*/i, '')
      .replace(/^GALAXY\s*/i, '')
      .trim();
    const m = clean.match(/^(S2[0-5]\s*(ULTRA|PLUS|FE)?|A[0-8][0-9][ES]?(\s*CORE)?|M[1-6][0-9][S]?|Z\s*FLIP\s*\d?|Z\s*FOLD\s*\d?|NOTE\s*20(\s*ULTRA)?)/i);
    if (m) {
      return `Galaxy ${m[1].toUpperCase().replace(/\s+/g, ' ').trim()}`;
    }
    return `Galaxy ${clean}`.slice(0, 26);
  }

  if (brand === 'Motorola') {
    clean = clean
      .replace(/^SM?ARTPHONE\s*/i, '')
      .replace(/^MOTOROLA\s*/i, '')
      .replace(/^MOTO\s*/i, '')
      .replace(/^RAZE\b/i, 'RAZR')
      .trim();
    const m = clean.match(/^(G\d{1,3}(\s*(PLUS|PLAY|POWER(\s*LITE)?|LITE))?|E\d{1,2}[IS]?(\s*(PLUS|POWER|PLAY))?|EDGE\s*\d{2}(\s*(PRO|ULTRA|NEO|FUSION|LITE))?|RAZR\s*\d{2}(\s*ULTRA)?|ONE(\s*(FUSION(\s*PLUS)?|MACRO|VISION|ZOOM))?)/i);
    if (m) {
      return `Moto ${m[1].toUpperCase().replace(/\s+/g, ' ').trim()}`;
    }
    return `Moto ${clean}`.slice(0, 26);
  }

  return clean.slice(0, 26);
}

// ── Datas: extrai YYYY-MM-DD de DD/MM/YYYY, YYYY-MM-DD ou serial ─
export function extractIsoDate(val?: string | null): string | null {
  const disp = formatDateDisplay(val);
  if (disp === '—') return null;
  const m = disp.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const year = Number(m[3]);
  if (year < 2020 || year > 2030) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  return `${MONTH_SHORT[idx] ?? m}/${y.slice(2)}`;
}

// ── Regras NLP de Defeitos na Triagem ─────────────────────
const DEFECT_RULES = [
  { name: 'Tela / Display',        pattern: /tela|touch|display|burn[- ]?in|burning|mancha|pixel|listra|rosad[ao]|amarelad[ao]|esverdead[ao]|trincad[ao]|quebrad[ao]|frontal|imagem|chuvisc|piscando|fantasma/i },
  { name: 'Bateria / Energia',     pattern: /bateria|saude|saúde|ciclo|estufad[ao]|inchad[ao]|descarreg/i },
  { name: 'Carcaça / Estética',    pattern: /tampa|rear|aro|frame|carca[cç]a|est[eé]tico|descoland|descolad[ao]|marca[s]?|risco[s]?|amassad/i },
  { name: 'Conectividade / Carga', pattern: /conector|carga|carrega|usb|dock|wi[- ]?fi|bluetooth|bloetooth|rede|chip|sinal|gaveta|sim\b|e-sim/i },
  { name: 'Câmera / Face ID',      pattern: /c[aâ]mera|c[aâ]mra|lente|foco|foca|emba[cç]ad|face[- ]?id|truedepth|lidar|flash|lanterna/i },
  { name: 'Áudio / Microfone',     pattern: /alto[- ]?falante|autofalante|auto[- ]?falante|auricular|earpiece|microfone|chiando|estourado|abafado|\bsom\b|[aá]udio|fone/i },
  { name: 'Botões / Sensores',     pattern: /bot[aã]o|bot[oõ]es|power|volume|biometria|biom[eé]trico|digital|sensor|proximidade|vibra|b[uú]ssola|bar[oô]metro|girosc[oó]pio|home/i },
  { name: 'Sistema / Placa',       pattern: /n[aã]o liga|reinicia|loop|bloquead|bloqueio|placa|sistema|icloud|conta|payjoy|dimo|knox|anatel|travando|aquecendo|esquentando/i },
];

export function categorizeDefect(obs?: string | null): string[] {
  if (!obs || !obs.trim()) return [];
  if (/^\s*(ok|tudo ok|triagem ok|nenhum defeito.*)\s*\.?\s*$/i.test(obs)) return [];
  const matched = DEFECT_RULES.filter((r) => r.pattern.test(obs)).map((r) => r.name);
  return matched.length > 0 ? matched : ['Outros'];
}

// ── Regras NLP de Serviços Executados pelos Técnicos ──────
const SERVICE_RULES = [
  { name: 'Troca / Ajuste Bateria',   pattern: /bateria|solda/i },
  { name: 'Troca de Frontal / Tela',  pattern: /frontal|tela|display|fpc/i },
  { name: 'Troca de Tampa / Carcaça', pattern: /troca.*(tampa|rear|carca[cç]a)|trocado.*(tampa|rear|carca[cç]a)|carca[cç]a/i },
  { name: 'Recolagem / Vedação',      pattern: /recolagem|colagem/i },
  { name: 'Câmera / Lente',           pattern: /c[aâ]mera|lente|flash/i },
  { name: 'Placa Sub / Conector',     pattern: /placa|conector|dock/i },
  { name: 'Áudio / Vibra / Botões',   pattern: /bot[aã]o|bot[oõ]es|power|vibra|alto[- ]?falante|fone|gaveta|biometria|b[uú]ssola/i },
  { name: 'Desbloqueio / Software',   pattern: /desbloqueio|sistema|regravado/i },
];

export function categorizeService(serv?: string | null): string[] {
  if (!serv || !serv.trim()) return ['Outros Ajustes'];
  const matched = SERVICE_RULES.filter((r) => r.pattern.test(serv)).map((r) => r.name);
  return matched.length > 0 ? matched : ['Outros Ajustes'];
}

// ── Regras NLP de Motivos de Devolução de Clientes ────────
export type ReturnMacroCategory = 'Tela' | 'Bateria' | 'Arrependimento' | 'Defeitos Gerais';

export const RETURN_MACRO_META: { id: ReturnMacroCategory; title: string; description: string }[] = [
  {
    id: 'Tela',
    title: 'Tela',
    description: 'Tela, linha verde, Touch, Frontal e outros motivos relacionados à frontal ou tela do celular',
  },
  {
    id: 'Bateria',
    title: 'Bateria',
    description: 'Problemas de bateria, não carrega, não liga, reiniciando e superaquecimento',
  },
  {
    id: 'Arrependimento',
    title: 'Arrependimento',
    description: 'Arrependimento da compra, estética e outros motivos comerciais',
  },
  {
    id: 'Defeitos Gerais',
    title: 'Defeitos Gerais',
    description: 'Outros motivos de devoluções em menores quantidades (Rede/Chip, Áudio, Câmera, Botões)',
  },
];

const RETURN_REASON_RULES = [
  { name: 'Tela / Linha Verde / Touch', pattern: /tela|touch|toque|display|frontal|linha|listra|lista|faixa|mancha|pixel|piscando|verde|rosa|burn|fantasma|vidro/i },
  { name: 'Bateria / Não Carrega',      pattern: /bateria|carrega|carregamento|descarrega|estuf|inch|dura\b|1%/i },
  { name: 'Não Liga / Reiniciando',     pattern: /n[aã]o liga|desliga|reinicia|apagou|loop|ma[cç][aã]|travad|parou de funcionar/i },
  { name: 'Superaquecimento',           pattern: /esquenta|quente|aquecimento/i },
  { name: 'Rede / Chip / Bloqueio',     pattern: /chip|rede|sinal|bloqueio|bloqueado|imei|pin\b|dimo|wi[- ]?fi/i },
  { name: 'Áudio / Microfone / Som',    pattern: /[aá]udio|som\b|microfone|falante|autofalante|chiado|volume|mudo/i },
  { name: 'Câmera / Lente / Foco',      pattern: /c[aâ]mera|lente|foco|focando|flash|lanterna/i },
  { name: 'Botões / Biometria',         pattern: /bot[aã]o|power|digital|biometria|face[- ]?id/i },
  { name: 'Arrependimento / Estética',  pattern: /arrepend|desist|seminovo|recondicionado|novo|marcas|ralado|arranh|amassad|est[eé]tic|tampa|carca[cç]a|embalagem|caixa|carregador|modelo errado|endere[cç]o|n[aã]o gostou|perdeu o interesse/i },
];

export function categorizeReturnReason(motivo?: string | null): string {
  if (!motivo || !motivo.trim()) return 'Não Especificado';
  for (const r of RETURN_REASON_RULES) {
    if (r.pattern.test(motivo)) return r.name;
  }
  return 'Outros Motivos';
}

export function categorizeReturnMacroReason(motivo?: string | null): ReturnMacroCategory {
  const m = (motivo ?? '').trim();
  if (!m) return 'Defeitos Gerais';

  if (/tela|touch|toque|display|frontal|linha|listra|lista|faixa|mancha|pixel|piscando|verde|rosa|burn|fantasma|vidro/i.test(m)) {
    return 'Tela';
  }
  if (/bateria|carrega|carregamento|descarrega|estuf|inch|dura\b|1%|n[aã]o liga|desliga|reinicia|apagou|loop|ma[cç][aã]|parou de funcionar|esquenta|quente|aquecimento/i.test(m)) {
    return 'Bateria';
  }
  if (/arrepend|desist|seminovo|recondicionado|achando que era novo|produto nao eh novo|marcas|ralado|arranh|amassad|est[eé]tic|tampa|carca[cç]a|embalagem|caixa|carregador|modelo errado|endere[cç]o|n[aã]o gostou|perdeu o interesse/i.test(m)) {
    return 'Arrependimento';
  }
  return 'Defeitos Gerais';
}

export function normalizeOriginReceb(origem?: string | null): string {
  const s = (origem ?? '').trim().toUpperCase();
  if (!s || s === 'NÃO') return 'Não Informado';
  if (s.includes('COMPRA DIRETA'))   return 'Compra Direta';
  if (s.includes('COMPRA INDIRETA')) return 'Compra Indireta';
  if (s.includes('PARCEIRO'))        return 'Parceiro';
  if (s.includes('QUIOSQUE'))        return 'Quiosque';
  if (s.includes('DEVOLU'))          return 'Devolução';
  if (s.includes('ASSIST'))          return 'Assistência';
  if (s.includes('TRADE'))           return 'Trade-In';
  if (s.includes('FORMUL'))          return 'Formulários';
  if (s.includes('TIM'))             return 'TIM';
  if (s.includes('CONTRAPROPOSTA'))  return 'Contraproposta';
  if (s.includes('EMPRESTIMO'))      return 'Empréstimo';
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function normalizeOriginDev(origem?: string | null): string {
  const s = (origem ?? '').trim().toUpperCase();
  if (!s) return 'Outros';
  if (s === 'ML' || s.includes('MERCADO')) return 'Mercado Livre';
  if (s.includes('SHOP'))                  return 'Shopee';
  if (s.includes('SITE'))                  return 'Site Oficial';
  if (s.includes('TEMU'))                  return 'Temu';
  return s.charAt(0) + s.slice(1).toLowerCase();
}

// ── Interfaces do Resultado Analítico ─────────────────────
export interface TechnicianStat {
  name:          string;
  total:         number;
  avancado:      number;
  simples:       number;
  outros:        number;
  pctAvancado:   number;
  reincidentes:  number;
}

export interface ModelIncident {
  model:       string;
  brand:       string;
  triagem:     number;
  reparos:     number;
  devolucoes:  number;
  total:       number;
}

export interface RepeatImeiAlert {
  imei:        string;
  model:       string;
  brand:       string;
  reparosCount: number;
  devolucoesCount: number;
  tecnicos:    string[];
  ultimoDefeito: string;
}

export interface MonthlyPoint {
  ym:           string;
  label:        string;
  recebimentos: number;
  reparos:      number;
  devolucoes:   number;
}

export interface ReturnMacroStat {
  id:          ReturnMacroCategory;
  title:       string;
  description: string;
  value:       number;
  pct:         number;
}

export interface ComputedDashboard {
  availableMonths: string[]; // ['2026-09', '2026-08', ...]
  kpis: {
    totalRecebimentos: number;
    totalReparos:      number;
    totalDevolucoes:   number;
    taxaDevolucao:     number;
    pctAvancado:       number;
    reparoAvancado:    number;
    reparoSimples:     number;
    imeisReincidentes: number;
    devolvidosPosReparo: number;
    topDefectName:     string;
    topDefectPct:      number;
    topModelName:      string;
    topModelCount:     number;
  };
  monthlyTrend:                MonthlyPoint[];
  categorias:                  { name: string; value: number; pct: number }[];
  origens:                     { name: string; value: number; pct: number }[];
  tecnicosStats:               TechnicianStat[];
  servicosBancada:             { name: string; value: number; pct: number }[];
  triadoresRanking:            { name: string; triagem: number; bancada: number; total: number }[];
  marcasBreakdown:             { name: string; recebimentos: number; reparos: number; devolucoes: number; total: number }[];
  topModelos:                  ModelIncident[];
  devolucoesCanais:            { name: string; value: number; pct: number }[];
  devolucoesMotivos:           { name: string; value: number; pct: number }[];
  devolucoesPrincipaisMotivos: ReturnMacroStat[];
  alertasReincidencia:         RepeatImeiAlert[];
}

// ── Verifica se uma data ISO passa no filtro de período ───
function matchesPeriod(iso: string | null, period: PeriodFilter, latestIso: string): boolean {
  if (period === 'all') return true;
  if (!iso) return false;

  if (period === 'last30' || period === 'last90') {
    const days = period === 'last30' ? 30 : 90;
    const ref = new Date(latestIso + 'T00:00:00Z');
    const min = new Date(ref);
    min.setUTCDate(min.getUTCDate() - days);
    const minIso = min.toISOString().slice(0, 10);
    return iso >= minIso && iso <= latestIso;
  }

  // Ano específico: '2026', '2025', '2024'
  if (/^\d{4}$/.test(period)) {
    return iso.startsWith(period);
  }

  // Mês específico: 'YYYY-MM'
  if (/^\d{4}-\d{2}$/.test(period)) {
    return iso.startsWith(period);
  }

  return true;
}

export function computeDashboardAnalytics(
  data: DashboardData,
  period: PeriodFilter,
  brandFilter: BrandFilter,
): ComputedDashboard {
  const rawRec = data.records?.recebimentos ?? [];
  const rawTec = data.records?.tecnicos ?? [];
  const rawDev = data.records?.devolucoes ?? [];

  // Fallback caso `records` ainda não esteja presente
  if (rawRec.length === 0 && rawTec.length === 0 && rawDev.length === 0) {
    const totalRec = data.kpis.totalManutencao ?? 0;
    const totalDev = data.kpis.totalDevolucoes ?? 0;
    const totalCat = data.categorias.reduce((a, b) => a + b.value, 0) || 1;
    const totalOrig = data.origens.reduce((a, b) => a + b.value, 0) || 1;
    return {
      availableMonths: [],
      kpis: {
        totalRecebimentos: totalRec,
        totalReparos: data.kpis.totalTecnicos ?? 0,
        totalDevolucoes: totalDev,
        taxaDevolucao: data.kpis.taxaDevolucao ?? 0,
        pctAvancado: 0,
        reparoAvancado: 0,
        reparoSimples: 0,
        imeisReincidentes: 0,
        devolvidosPosReparo: 0,
        topDefectName: data.categorias[0]?.name ?? '—',
        topDefectPct: data.categorias[0] ? Math.round((data.categorias[0].value / totalCat) * 100) : 0,
        topModelName: '—',
        topModelCount: 0,
      },
      monthlyTrend: [],
      categorias: data.categorias.map((c) => ({ ...c, pct: Math.round((c.value / totalCat) * 100) })),
      origens: data.origens.map((o) => ({ ...o, pct: Math.round((o.value / totalOrig) * 100) })),
      tecnicosStats: [],
      servicosBancada: [],
      triadoresRanking: [],
      marcasBreakdown: [],
      topModelos: [],
      devolucoesCanais: [],
      devolucoesMotivos: [],
      devolucoesPrincipaisMotivos: RETURN_MACRO_META.map((m) => ({ ...m, value: 0, pct: 0 })),
      alertasReincidencia: [],
    };
  }

  // Pré-processa datas e marcas
  const allMonthsSet = new Set<string>();
  let latestIso = '2020-01-01';

  const recList = rawRec.map((r) => {
    const iso = extractIsoDate(r.data_triagem);
    if (iso) {
      allMonthsSet.add(iso.slice(0, 7));
      if (iso > latestIso) latestIso = iso;
    }
    const brand = normalizeBrand(r.marca, r.modelo);
    const model = normalizeModel(r.marca, r.modelo);
    return { ...r, iso, brand, model };
  });

  const tecList = rawTec.map((t) => {
    const iso = extractIsoDate(t.data_reparo);
    if (iso) {
      allMonthsSet.add(iso.slice(0, 7));
      if (iso > latestIso) latestIso = iso;
    }
    const brand = normalizeBrand(t.marca, t.modelo);
    const model = normalizeModel(t.marca, t.modelo);
    return { ...t, iso, brand, model };
  });

  const devList = rawDev.map((d) => {
    const iso = extractIsoDate(d.data_recebimento);
    if (iso) {
      allMonthsSet.add(iso.slice(0, 7));
      if (iso > latestIso) latestIso = iso;
    }
    const brand = normalizeBrand(null, d.modelo);
    const model = normalizeModel(null, d.modelo);
    return { ...d, iso, brand, model };
  });

  const availableMonths = Array.from(allMonthsSet).sort().reverse();

  // Aplica filtros de Período e Marca
  const passBrand = (b: string) => brandFilter === 'ALL' || b === brandFilter;

  const fRec = recList.filter((r) => passBrand(r.brand) && matchesPeriod(r.iso, period, latestIso));
  const fTec = tecList.filter((t) => passBrand(t.brand) && matchesPeriod(t.iso, period, latestIso));
  const fDev = devList.filter((d) => passBrand(d.brand) && matchesPeriod(d.iso, period, latestIso));

  // ── 1. Evolução Mensal (últimos 14 meses com atividade) ────
  const monthMap = new Map<string, MonthlyPoint>();
  for (const ym of Array.from(allMonthsSet).sort()) {
    monthMap.set(ym, { ym, label: formatYearMonth(ym), recebimentos: 0, reparos: 0, devolucoes: 0 });
  }
  for (const r of recList) {
    if (!passBrand(r.brand) || !r.iso) continue;
    const pt = monthMap.get(r.iso.slice(0, 7));
    if (pt) pt.recebimentos++;
  }
  for (const t of tecList) {
    if (!passBrand(t.brand) || !t.iso) continue;
    const pt = monthMap.get(t.iso.slice(0, 7));
    if (pt) pt.reparos++;
  }
  for (const d of devList) {
    if (!passBrand(d.brand) || !d.iso) continue;
    const pt = monthMap.get(d.iso.slice(0, 7));
    if (pt) pt.devolucoes++;
  }
  const monthlyTrend = Array.from(monthMap.values())
    .filter((m) => m.recebimentos + m.reparos + m.devolucoes > 0)
    .slice(-14);

  // ── 2. Categorias de Defeito (NLP na Triagem) ──────────────
  const catCounts = new Map<string, number>();
  for (const r of fRec) {
    const cats = categorizeDefect(r.observacoes);
    for (const c of cats) catCounts.set(c, (catCounts.get(c) ?? 0) + 1);
  }
  const recBase = Math.max(1, fRec.length);
  const categorias = Array.from(catCounts.entries())
    .map(([name, value]) => ({ name, value, pct: Math.round((value / recBase) * 100) }))
    .sort((a, b) => b.value - a.value);

  // ── 3. Canais de Origem na Triagem ─────────────────────────
  const origCounts = new Map<string, number>();
  for (const r of fRec) {
    const o = normalizeOriginReceb(r.origem);
    origCounts.set(o, (origCounts.get(o) ?? 0) + 1);
  }
  const origens = Array.from(origCounts.entries())
    .map(([name, value]) => ({ name, value, pct: Math.round((value / recBase) * 100) }))
    .sort((a, b) => b.value - a.value);

  // ── 4. Reincidência de IMEIs e Cruzamento com Devoluções ──
  const imeiTecMap = new Map<string, typeof fTec>();
  for (const t of fTec) {
    const imei = (t.imei ?? '').trim();
    if (!imei || imei.length < 8) continue;
    const arr = imeiTecMap.get(imei) ?? [];
    arr.push(t);
    imeiTecMap.set(imei, arr);
  }

  const devImeiSet = new Set<string>();
  const devImeiCount = new Map<string, number>();
  for (const d of fDev) {
    const imei = (d.imei ?? '').trim();
    if (!imei || imei.length < 8) continue;
    devImeiSet.add(imei);
    devImeiCount.set(imei, (devImeiCount.get(imei) ?? 0) + 1);
  }

  let imeisReincidentes = 0;
  let devolvidosPosReparo = 0;
  const repeatAlerts: RepeatImeiAlert[] = [];

  for (const [imei, list] of imeiTecMap.entries()) {
    const devCount = devImeiCount.get(imei) ?? 0;
    if (list.length >= 2) imeisReincidentes++;
    if (devImeiSet.has(imei)) devolvidosPosReparo++;

    if (list.length >= 2 || devCount > 0) {
      const sample = list[0];
      const tecnicosUnicos = Array.from(new Set(list.map((x) => (x.tecnico ?? '').trim().toUpperCase()).filter(Boolean)));
      repeatAlerts.push({
        imei,
        model: sample.model !== 'Não Informado' ? sample.model : (sample.modelo ?? 'Aparelho'),
        brand: sample.brand,
        reparosCount: list.length,
        devolucoesCount: devCount,
        tecnicos: tecnicosUnicos,
        ultimoDefeito: sample.motivo_reprova ?? '—',
      });
    }
  }

  repeatAlerts.sort((a, b) => (b.reparosCount * 2 + b.devolucoesCount * 3) - (a.reparosCount * 2 + a.devolucoesCount * 3));

  // ── 5. Performance por Técnico ─────────────────────────────
  const tecMap = new Map<string, { total: number; avancado: number; simples: number; outros: number; imeis: string[] }>();
  let reparoAvancado = 0;
  let reparoSimples  = 0;

  for (const t of fTec) {
    const name = (t.tecnico ?? '').trim().toUpperCase() || 'NÃO INFORMADO';
    const tipo = (t.tipo_reparo ?? '').trim().toUpperCase();
    const entry = tecMap.get(name) ?? { total: 0, avancado: 0, simples: 0, outros: 0, imeis: [] };
    entry.total++;
    if (tipo.includes('AVAN')) {
      entry.avancado++;
      reparoAvancado++;
    } else if (tipo.includes('SIMP')) {
      entry.simples++;
      reparoSimples++;
    } else {
      entry.outros++;
    }
    if (t.imei) entry.imeis.push(t.imei.trim());
    tecMap.set(name, entry);
  }

  const tecnicosStats: TechnicianStat[] = Array.from(tecMap.entries())
    .map(([name, s]) => {
      const reincidentes = new Set(s.imeis.filter((im) => (imeiTecMap.get(im)?.length ?? 0) >= 2)).size;
      return {
        name,
        total: s.total,
        avancado: s.avancado,
        simples: s.simples,
        outros: s.outros,
        pctAvancado: s.total > 0 ? Math.round((s.avancado / s.total) * 100) : 0,
        reincidentes,
      };
    })
    .sort((a, b) => b.total - a.total);

  // ── 6. Tipos de Serviços Executados na Bancada ─────────────
  const servCounts = new Map<string, number>();
  for (const t of fTec) {
    const servs = categorizeService(t.motivo_reprova);
    for (const s of servs) servCounts.set(s, (servCounts.get(s) ?? 0) + 1);
  }
  const tecBase = Math.max(1, fTec.length);
  const servicosBancada = Array.from(servCounts.entries())
    .map(([name, value]) => ({ name, value, pct: Math.round((value / tecBase) * 100) }))
    .sort((a, b) => b.value - a.value);

  // ── 7. Produtividade por Triador (Recebimentos + Bancada) ──
  const triadMap = new Map<string, { triagem: number; bancada: number }>();
  for (const r of fRec) {
    const tr = (r.triador ?? '').trim().toUpperCase();
    if (!tr) continue;
    const cur = triadMap.get(tr) ?? { triagem: 0, bancada: 0 };
    cur.triagem++;
    triadMap.set(tr, cur);
  }
  for (const t of fTec) {
    const tr = (t.triador ?? '').trim().toUpperCase();
    if (!tr) continue;
    const cur = triadMap.get(tr) ?? { triagem: 0, bancada: 0 };
    cur.bancada++;
    triadMap.set(tr, cur);
  }
  const triadoresRanking = Array.from(triadMap.entries())
    .map(([name, v]) => ({ name, triagem: v.triagem, bancada: v.bancada, total: v.triagem + v.bancada }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ── 8. Distribuição por Marca & Top Modelos ────────────────
  const brandStats = new Map<string, { recebimentos: number; reparos: number; devolucoes: number }>();
  const modelStats = new Map<string, ModelIncident>();

  const touchModel = (model: string, brand: string, kind: 'triagem' | 'reparos' | 'devolucoes') => {
    if (model === 'Não Informado') return;
    const cur = modelStats.get(model) ?? { model, brand, triagem: 0, reparos: 0, devolucoes: 0, total: 0 };
    cur[kind]++;
    cur.total++;
    modelStats.set(model, cur);
  };

  for (const r of fRec) {
    const b = brandStats.get(r.brand) ?? { recebimentos: 0, reparos: 0, devolucoes: 0 };
    b.recebimentos++;
    brandStats.set(r.brand, b);
    touchModel(r.model, r.brand, 'triagem');
  }
  for (const t of fTec) {
    const b = brandStats.get(t.brand) ?? { recebimentos: 0, reparos: 0, devolucoes: 0 };
    b.reparos++;
    brandStats.set(t.brand, b);
    touchModel(t.model, t.brand, 'reparos');
  }
  for (const d of fDev) {
    const b = brandStats.get(d.brand) ?? { recebimentos: 0, reparos: 0, devolucoes: 0 };
    b.devolucoes++;
    brandStats.set(d.brand, b);
    touchModel(d.model, d.brand, 'devolucoes');
  }

  const marcasBreakdown = Array.from(brandStats.entries())
    .map(([name, v]) => ({
      name,
      recebimentos: v.recebimentos,
      reparos: v.reparos,
      devolucoes: v.devolucoes,
      total: v.recebimentos + v.reparos + v.devolucoes,
    }))
    .sort((a, b) => b.total - a.total);

  const topModelos = Array.from(modelStats.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // ── 9. Devoluções: Canais e Motivos Relatados ──────────────
  const devBase = Math.max(1, fDev.length);
  const devCanalMap = new Map<string, number>();
  const devMotivoMap = new Map<string, number>();
  const devMacroMap = new Map<ReturnMacroCategory, number>([
    ['Tela', 0],
    ['Bateria', 0],
    ['Arrependimento', 0],
    ['Defeitos Gerais', 0],
  ]);

  for (const d of fDev) {
    const canal = normalizeOriginDev(d.origem);
    devCanalMap.set(canal, (devCanalMap.get(canal) ?? 0) + 1);

    const mot = categorizeReturnReason(d.motivo);
    devMotivoMap.set(mot, (devMotivoMap.get(mot) ?? 0) + 1);

    const macro = categorizeReturnMacroReason(d.motivo);
    devMacroMap.set(macro, (devMacroMap.get(macro) ?? 0) + 1);
  }

  const devolucoesCanais = Array.from(devCanalMap.entries())
    .map(([name, value]) => ({ name, value, pct: Math.round((value / devBase) * 100) }))
    .sort((a, b) => b.value - a.value);

  const devolucoesMotivos = Array.from(devMotivoMap.entries())
    .map(([name, value]) => ({ name, value, pct: Math.round((value / devBase) * 100) }))
    .sort((a, b) => b.value - a.value);

  const devolucoesPrincipaisMotivos: ReturnMacroStat[] = RETURN_MACRO_META.map((meta) => {
    const value = devMacroMap.get(meta.id) ?? 0;
    return {
      ...meta,
      value,
      pct: fDev.length > 0 ? Math.round((value / devBase) * 100) : 0,
    };
  });

  // ── KPIs Consolidados ──────────────────────────────────────
  const totalRecebimentos = fRec.length;
  const totalReparos      = fTec.length;
  const totalDevolucoes   = fDev.length;
  const baseFluxo         = totalRecebimentos + totalDevolucoes;
  const taxaDevolucao     = baseFluxo > 0 ? parseFloat(((totalDevolucoes / baseFluxo) * 100).toFixed(1)) : 0;
  const pctAvancado       = totalReparos > 0 ? Math.round((reparoAvancado / totalReparos) * 100) : 0;

  return {
    availableMonths,
    kpis: {
      totalRecebimentos,
      totalReparos,
      totalDevolucoes,
      taxaDevolucao,
      pctAvancado,
      reparoAvancado,
      reparoSimples,
      imeisReincidentes,
      devolvidosPosReparo,
      topDefectName: categorias[0]?.name ?? '—',
      topDefectPct:  categorias[0]?.pct ?? 0,
      topModelName:  topModelos[0]?.model ?? '—',
      topModelCount: topModelos[0]?.total ?? 0,
    },
    monthlyTrend,
    categorias,
    origens,
    tecnicosStats,
    servicosBancada,
    triadoresRanking,
    marcasBreakdown,
    topModelos,
    devolucoesCanais,
    devolucoesMotivos,
    devolucoesPrincipaisMotivos,
    alertasReincidencia: repeatAlerts.slice(0, 8),
  };
}
