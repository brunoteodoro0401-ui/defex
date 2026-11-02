// ============================================================
// TeodoroTech — SAQM Pro (Portfólio & SaaS Demo Engine)
// Motor 100% local no navegador:
// - Gera base de demonstração realista e anonimizada (sem dados reais)
// - Processa upload de planilhas .xlsx/.xls direto no browser via SheetJS
// - Permite baixar planilha .xlsx modelo para testes imediatos
// - Persiste uploads localmente no navegador (localStorage)
// ============================================================

import * as XLSX from 'xlsx';
import type {
  DashboardData,
  Devolucao,
  TriagemRecebimento,
  TriagemTecnico,
} from '../types/index';

export interface StoredDataset {
  isDemo:       boolean;
  fileName:     string | null;
  lastUpdate:   string;
  recebimentos: TriagemRecebimento[];
  tecnicos:     TriagemTecnico[];
  devolucoes:   Devolucao[];
}

const STORAGE_KEY = 'teodorotech-saqm:dataset-v1';
const UPDATE_EVENT = 'teodorotech-saqm-data-changed';

// ── Gerador determinístico para dados de demonstração ─────
function createRng(seed = 20261102) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function formatIsoToBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function generateDemoDataset(): StoredDataset {
  const rng = createRng(4202026);

  const models = [
    { marca: 'Apple',    modelo: 'iPhone 13 128GB' },
    { marca: 'Apple',    modelo: 'iPhone 13 Pro Max 256GB' },
    { marca: 'Apple',    modelo: 'iPhone 12 128GB' },
    { marca: 'Apple',    modelo: 'iPhone 14 Pro 128GB' },
    { marca: 'Apple',    modelo: 'iPhone 11 64GB' },
    { marca: 'Apple',    modelo: 'iPhone 15 128GB' },
    { marca: 'Samsung',  modelo: 'Galaxy S23 Ultra 256GB' },
    { marca: 'Samsung',  modelo: 'Galaxy S22 128GB' },
    { marca: 'Samsung',  modelo: 'Galaxy A54 5G 128GB' },
    { marca: 'Samsung',  modelo: 'Galaxy S21 FE 128GB' },
    { marca: 'Samsung',  modelo: 'Galaxy Z Flip 4 128GB' },
    { marca: 'Motorola', modelo: 'Moto G84 5G 256GB' },
    { marca: 'Motorola', modelo: 'Motorola Edge 40 Neo' },
    { marca: 'Motorola', modelo: 'Moto G54 128GB' },
  ] as const;

  const origensTriagem = [
    'COMPRA DIRETA', 'COMPRA DIRETA', 'TRADE-IN', 'PARCEIRO', 'QUIOSQUE', 'DEVOLUÇÃO',
  ] as const;

  const triadores = ['LUCAS M.', 'FERNANDA S.', 'RAFAEL C.', 'CAMILA R.', 'GABRIEL T.'] as const;
  const tecnicosNomes = ['DIEGO ALVES', 'MARCOS VINICIUS', 'RODRIGO ROCHA', 'THIAGO MENDES', 'BRUNO COSTA'] as const;

  const obsTriagemPool = [
    'Tela com mancha leve e touch falhando no canto superior',
    'Display com linha verde fina lateral, requer troca de frontal',
    'Saúde da bateria em 74%, descarregando rápido no teste',
    'Bateria inchada empurrando a tela frontal',
    'Tampa traseira trincada e aro com marcas de uso',
    'Carcaça com riscos profundos nas bordas',
    'Conector de carga USB-C com mau contato, não ativa turbo',
    'Sem sinal de rede no Slot 1 do chip SIM',
    'Câmera traseira 1x tremendo ao focar de perto',
    'Face ID indisponível após teste de sensores',
    'Alto-falante auricular com som abafado e chiado',
    'Microfone inferior baixo em gravação de áudio',
    'Botão power sem clique, biometria intermitente',
    'Aparelho reiniciando em loop na tela inicial',
    'Triagem OK',
    'Triagem OK',
  ] as const;

  const servicosPool = [
    { tipo: 'AVANÇADO', serv: 'Troca de Frontal / Tela Display Original' },
    { tipo: 'SIMPLES',  serv: 'Substituição de Bateria + Solda BMS' },
    { tipo: 'SIMPLES',  serv: 'Troca de Tampa Traseira e Carcaça' },
    { tipo: 'SIMPLES',  serv: 'Recolagem de Frontal e Vedação' },
    { tipo: 'AVANÇADO', serv: 'Reparo em Placa Sub / Conector de Carga Dock' },
    { tipo: 'SIMPLES',  serv: 'Troca de Câmera Traseira e Lente' },
    { tipo: 'SIMPLES',  serv: 'Substituição de Alto-falante, Vibra e Botões' },
    { tipo: 'AVANÇADO', serv: 'Desbloqueio e Regravação de Sistema' },
  ] as const;

  const clientesPool = [
    'Carlos Eduardo Silva', 'Mariana Costa Oliveira', 'Roberto Almeida Santos',
    'Juliana Ferreira Lima', 'Pedro Henrique Souza', 'Fernanda Rodrigues',
    'Lucas Gabriel Martins', 'Camila Beatriz Rocha', 'Rafael Pereira Gomes',
    'Patrícia Ribeiro Alves', 'Gustavo Henrique Dias', 'Amanda Carolina Castro',
    'Bruno César Barbosa', 'Letícia Moreira Cardoso', 'Thiago Nascimento Pinto',
    'Vanessa Cristina Moura', 'Diego Fernandes Araújo', 'Beatriz Cavalcanti Melo',
    'Felipe Augusto Teixeira', 'Larissa Mendes Nunes', 'André Luiz Monteiro',
    'Carolina Duarte Freitas', 'Marcelo Vieira Campos', 'Natália Barros Pires',
  ] as const;

  const motivosDevolucaoPool = [
    // Tela (~35%)
    'Aparelho apresentou uma linha verde vertical na tela após 4 dias de uso.',
    'O touch screen parou de responder na faixa inferior do display.',
    'Tela começou a piscar de forma intermitente e apareceu mancha roxa no canto.',
    'Frontal está descolando na lateral direita e vazando luz do display.',
    'Tela com toque fantasma abrindo aplicativos sozinho durante a navegação.',
    'Celular chegou com listra rosa no display OLED.',
    // Bateria (~36%)
    'A duração da bateria não chega a 4 horas mesmo em uso leve.',
    'Aparelho não carrega, testei com dois cabos e carregadores diferentes.',
    'Celular desliga sozinho quando a bateria chega em 25% e entra em loop.',
    'Aparelho parou de funcionar e não liga mais mesmo conectado na tomada.',
    'O aparelho está apresentando superaquecimento excessivo ao carregar e reiniciando.',
    'Bateria começou a estufar após a primeira semana de uso.',
    // Arrependimento (~14%)
    'O produto está funcionando bem, mas me arrependi da compra pelo tamanho.',
    'Comprei achando que era aparelho lacrado novo, porém é seminovo recondicionado.',
    'Aparelho veio com marcas de uso estéticas no aro mais visíveis que o esperado.',
    'Não veio com adaptador de carregador original na embalagem, prefiro devolver.',
    // Defeitos Gerais (~15%)
    'Smartphone não reconhece o chip da operadora em nenhuma das entradas SIM.',
    'Câmera traseira não está focando de perto e apresenta borrão nas fotos.',
    'O áudio do alto-falante fica chiando durante chamadas e vídeos.',
    'Botão power e leitor de impressão digital falham várias vezes ao dia.',
  ] as const;

  const canaisPool = [
    'ML', 'ML', 'ML', 'ML', 'ML', 'ML', 'ML',
    'SITE', 'SITE',
    'SHOPEE',
  ] as const;

  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

  const randomDateBR = () => {
    const ym = pick(rng, months);
    const day = String(Math.floor(rng() * 28) + 1).padStart(2, '0');
    return formatIsoToBR(`${ym}-${day}`);
  };

  // Pool de IMEIs compartilhados para demonstrar rastreamento e reincidência
  const sharedImeis = Array.from({ length: 18 }, (_, i) => ({
    imei: `35894109${String(100000 + i * 137).slice(0, 6)}${i % 9}`,
    item: models[i % models.length],
  }));

  const randomImei = () => {
    const p1 = 35100000 + Math.floor(rng() * 899999);
    const p2 = 1000000 + Math.floor(rng() * 8999999);
    return `${p1}${p2}`.slice(0, 15);
  };

  // 1. Triagem de Recebimentos (280 registros)
  const recebimentos: TriagemRecebimento[] = [];
  for (let i = 0; i < 280; i++) {
    const shared = i < sharedImeis.length ? sharedImeis[i] : null;
    const m = shared ? shared.item : pick(rng, models);
    const imei = shared ? shared.imei : randomImei();
    recebimentos.push({
      id:           `rec-${i + 1}`,
      imei,
      marca:        m.marca,
      modelo:       m.modelo,
      data_triagem: randomDateBR(),
      origem:       pick(rng, origensTriagem),
      observacoes:  pick(rng, obsTriagemPool),
      triador:      pick(rng, triadores),
      created_at:   new Date().toISOString(),
    });
  }

  // 2. Reparos Técnicos (195 registros, incluindo reincidentes)
  const tecnicos: TriagemTecnico[] = [];
  for (let i = 0; i < 195; i++) {
    // Primeiros 24 registros usam os 12 primeiros sharedImeis duplicados (reincidência)
    const isReincident = i < 24;
    const shared = isReincident ? sharedImeis[i % 12] : null;
    const m = shared ? shared.item : pick(rng, models);
    const imei = shared ? shared.imei : randomImei();
    const s = pick(rng, servicosPool);

    tecnicos.push({
      id:             `tec-${i + 1}`,
      imei,
      marca:          m.marca,
      modelo:         m.modelo,
      data_reparo:    randomDateBR(),
      tipo_reparo:    s.tipo,
      motivo_reprova: s.serv,
      tecnico:        pick(rng, tecnicosNomes),
      triador:        pick(rng, triadores),
      created_at:     new Date().toISOString(),
    });
  }

  // 3. Devoluções de Clientes (110 registros)
  const devolucoes: Devolucao[] = [];
  for (let i = 0; i < 110; i++) {
    const shared = i < 8 ? sharedImeis[i] : null;
    const m = shared ? shared.item : pick(rng, models);
    const imei = shared ? shared.imei : randomImei();
    devolucoes.push({
      id:               `dev-${i + 1}`,
      cliente:          pick(rng, clientesPool),
      modelo:           m.modelo,
      imei,
      origem:           pick(rng, canaisPool),
      motivo:           pick(rng, motivosDevolucaoPool),
      finalidade:       rng() > 0.25 ? 'Garantia / Reparo' : 'Reembolso',
      data_recebimento: randomDateBR(),
      created_at:       new Date().toISOString(),
    });
  }

  return {
    isDemo:       true,
    fileName:     null,
    lastUpdate:   new Date().toISOString(),
    recebimentos,
    tecnicos,
    devolucoes,
  };
}

// ── Leitura e Escrita no Storage Local ────────────────────
export function loadActiveDataset(): StoredDataset {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredDataset;
      if (parsed && Array.isArray(parsed.recebimentos) && Array.isArray(parsed.tecnicos) && Array.isArray(parsed.devolucoes)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[TeodoroTech Store] Falha ao ler localStorage, usando base demo:', err);
  }
  return generateDemoDataset();
}

export function saveCustomDataset(dataset: StoredDataset): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
  } catch (err) {
    console.warn('[TeodoroTech Store] Cota do localStorage excedida:', err);
  }
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function resetToDemoDataset(): StoredDataset {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  const demo = generateDemoDataset();
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  return demo;
}

export function subscribeDatasetChanges(cb: () => void): () => void {
  window.addEventListener(UPDATE_EVENT, cb);
  return () => window.removeEventListener(UPDATE_EVENT, cb);
}

// ── Converte StoredDataset em DashboardData ───────────────
export function buildDashboardData(ds: StoredDataset): DashboardData {
  const totalManutencao = ds.recebimentos.length;
  const totalDevolucoes = ds.devolucoes.length;
  const totalTecnicos   = ds.tecnicos.length;
  const base            = totalManutencao + totalDevolucoes;
  const taxaDevolucao   = base > 0 ? parseFloat(((totalDevolucoes / base) * 100).toFixed(1)) : 0;

  return {
    kpis: {
      totalManutencao,
      taxaDevolucao,
      totalDevolucoes,
      totalTecnicos,
    },
    categorias: [],
    origens: [],
    lastUpdate: ds.lastUpdate,
    records: {
      recebimentos: ds.recebimentos,
      tecnicos:     ds.tecnicos,
      devolucoes:   ds.devolucoes,
    },
  };
}

// ── Parser de Planilha .xlsx / .xls no Navegador ──────────
function str(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function parseDateCell(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const dia = String(v.getDate()).padStart(2, '0');
    const mes = String(v.getMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${v.getFullYear()}`;
  }
  if (typeof v === 'number' && v > 10000 && v < 80000) {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${d.getUTCFullYear()}`;
  }
  const s = String(v).trim();
  if (!s) return null;
  const num = Number(s);
  if (!isNaN(num) && num > 10000 && num < 80000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    return `${dia}/${mes}/${d.getUTCFullYear()}`;
  }
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[3]}/${ymd[2]}/${ymd[1]}`;
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) return `${dmy[1].padStart(2, '0')}/${dmy[2].padStart(2, '0')}/${dmy[3]}`;
  return s;
}

function findSheet(wb: XLSX.WorkBook, candidates: string[]): Record<string, unknown>[] {
  const normCandidates = candidates.map(normalize);
  const found = wb.SheetNames.find((n) => normCandidates.includes(normalize(n)));
  if (!found) return [];
  return XLSX.utils.sheet_to_json(wb.Sheets[found], { defval: '' });
}

export async function parseAndStoreSpreadsheet(file: File): Promise<StoredDataset> {
  if (!/\.(xlsx|xls)$/i.test(file.name)) {
    throw new Error('Envie um arquivo válido nos formatos .xlsx ou .xls.');
  }

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });

  const tecnicosRows = findSheet(wb, [
    'Reparos Técnicos', 'Reparos Tecnicos', 'Reparo Técnicos', 'Reparo Tecnicos', 'Tecnicos', 'Técnicos',
  ]);
  const recebimentosRows = findSheet(wb, [
    'Traigem Recebimentos', 'Triagem Recebimentos', 'Recebimentos', 'Triagem',
  ]);
  const devolucoesRows = findSheet(wb, [
    'Devolução', 'Devolucao', 'Devoluçao', 'Devoluções', 'Devolucoes',
  ]);

  if (tecnicosRows.length === 0 && recebimentosRows.length === 0 && devolucoesRows.length === 0) {
    throw new Error(
      `Nenhuma aba reconhecida em "${file.name}". Use as abas: "Triagem Recebimentos", "Reparos Técnicos" e "Devolução".`,
    );
  }

  const nowIso = new Date().toISOString();

  const tecnicos: TriagemTecnico[] = tecnicosRows.map((row, idx) => ({
    id:             `up-tec-${idx + 1}`,
    imei:           str(row['IMEI']) || null,
    marca:          str(row['MARCA']) || null,
    modelo:         str(row['MODELO']) || null,
    data_reparo:    parseDateCell(row['DATA REPARO']),
    tipo_reparo:    str(row['TIPO DE REPARO']) || null,
    motivo_reprova: str(row['MANUTEÇÃO EXECUTADA'] ?? row['MANUTENÇÃO EXECUTADA']) || null,
    tecnico:        str(row['TÉCNICO RESPONSÁVEL'] ?? row['TECNICO RESPONSAVEL']) || null,
    triador:        str(row['TRIADOR']) || null,
    created_at:     nowIso,
  }));

  const recebimentos: TriagemRecebimento[] = recebimentosRows.map((row, idx) => ({
    id:           `up-rec-${idx + 1}`,
    imei:         str(row['IMEI 1'] ?? row['IMEI']) || null,
    marca:        str(row['MARCA']) || null,
    modelo:       str(row['MODELO']) || null,
    data_triagem: parseDateCell(row['DATA TRIAGEM']),
    origem:       str(row['ORIGEM']) || null,
    observacoes:  str(row['OBSERVAÇÕES TRIAGEM'] ?? row['OBSERVACOES TRIAGEM']) || null,
    triador:      str(row['TRIADOR']) || null,
    created_at:   nowIso,
  }));

  const devolucoes: Devolucao[] = devolucoesRows.map((row, idx) => ({
    id:               `up-dev-${idx + 1}`,
    cliente:          str(row['NOME DO CLIENTE'] ?? row['CLIENTE']) || null,
    modelo:           str(row['MODELO']) || null,
    imei:             str(row['IMEI']) || null,
    origem:           str(row['ORIGEM']) || null,
    motivo:           str(row['MOTIVO']) || null,
    finalidade:       str(row['FINALIDADE']) || null,
    data_recebimento: parseDateCell(row['DATA DE RECEBIMENTO'] ?? row['DATA RECEBIMENTO']),
    created_at:       nowIso,
  }));

  const dataset: StoredDataset = {
    isDemo:       false,
    fileName:     file.name,
    lastUpdate:   nowIso,
    recebimentos,
    tecnicos,
    devolucoes,
  };

  saveCustomDataset(dataset);
  return dataset;
}

// ── Gera e faz download de uma Planilha Modelo (.xlsx) ────
export function downloadSampleSpreadsheet(): void {
  const demo = generateDemoDataset();
  const wb = XLSX.utils.book_new();

  const recSheetData = demo.recebimentos.slice(0, 40).map((r) => ({
    'IMEI 1':              r.imei ?? '',
    'MARCA':               r.marca ?? '',
    'MODELO':              r.modelo ?? '',
    'DATA TRIAGEM':        r.data_triagem ?? '',
    'ORIGEM':              r.origem ?? '',
    'OBSERVAÇÕES TRIAGEM': r.observacoes ?? '',
    'TRIADOR':             r.triador ?? '',
  }));

  const tecSheetData = demo.tecnicos.slice(0, 40).map((t) => ({
    'IMEI':                t.imei ?? '',
    'MARCA':               t.marca ?? '',
    'MODELO':              t.modelo ?? '',
    'DATA REPARO':         t.data_reparo ?? '',
    'TIPO DE REPARO':      t.tipo_reparo ?? '',
    'MANUTEÇÃO EXECUTADA': t.motivo_reprova ?? '',
    'TÉCNICO RESPONSÁVEL': t.tecnico ?? '',
    'TRIADOR':             t.triador ?? '',
  }));

  const devSheetData = demo.devolucoes.slice(0, 40).map((d) => ({
    'NOME DO CLIENTE':     d.cliente ?? '',
    'MODELO':              d.modelo ?? '',
    'IMEI':                d.imei ?? '',
    'ORIGEM':              d.origem ?? '',
    'MOTIVO':              d.motivo ?? '',
    'FINALIDADE':          d.finalidade ?? '',
    'DATA DE RECEBIMENTO': d.data_recebimento ?? '',
  }));

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recSheetData), 'Triagem Recebimentos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tecSheetData), 'Reparos Técnicos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(devSheetData), 'Devolução');

  XLSX.writeFile(wb, 'Planilha_Modelo_SAQM_TeodoroTech.xlsx');
}
