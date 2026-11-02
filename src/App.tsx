// ============================================================
// TeodoroTech SAQM — App.tsx — Roteamento principal
// ============================================================

import { Routes, Route } from 'react-router-dom';
import { Layout }                  from './components/Layout';
import { useDashboard }            from './hooks/useDashboard';
import { HomePage }                from './pages/HomePage';
import { ReparosTecnicosPage }     from './pages/ReparosTecnicosPage';
import { TriagemRecebimentosPage } from './pages/TriagemRecebimentosPage';
import { DevolucoesPage }          from './pages/DevolucoesPage';

export default function App() {
  const {
    data,
    isDemo,
    fileName,
    loading,
    error,
    uploadSuccess,
    handleUpload,
    handleResetDemo,
  } = useDashboard();

  const lastUpdate = data?.lastUpdate ?? null;

  return (
    <Layout
      lastUpdate={lastUpdate}
      isDemo={isDemo}
      fileName={fileName}
      loading={loading}
      onUpload={handleUpload}
      onResetDemo={handleResetDemo}
      uploadSuccess={uploadSuccess}
      error={error}
    >
      <Routes>
        <Route path="/"             element={<HomePage data={data} loading={loading} />} />
        <Route path="/tecnicos"     element={<ReparosTecnicosPage />} />
        <Route path="/recebimentos" element={<TriagemRecebimentosPage />} />
        <Route path="/devolucoes"   element={<DevolucoesPage />} />
      </Routes>
    </Layout>
  );
}
