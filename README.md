# 🚀 Defex — Plataforma de Qualidade e Devoluções

> **Defex** é uma plataforma analítica desenvolvida pela **TeodoroTech** voltada para e-commerces e assistências técnicas de eletrônicos e smartphones seminovos e recondicionados. O sistema transforma planilhas operacionais em dashboards executivos em tempo real, auditando devoluções por canal (Mercado Livre, Shopee, Site) e rastreando reincidência de aparelhos por IMEI.

---

## ✨ Principais Funcionalidades

- **Raio-X de Devoluções por Canal:** visualização rápida do volume de devoluções no Mercado Livre, Site e Shopee com drill-down para lista detalhada.
- **Classificação Inteligente de Motivos (NLP):** o sistema lê automaticamente o relato aberto do cliente e categoriza entre *Tela/Touch*, *Bateria/Energia*, *Arrependimento* e *Defeitos Gerais*.
- **Radar de Auditoria de IMEIs:** alerta em tempo real de aparelhos com múltiplos reparos ou que sofreram devolução pós-manutenção.
- **Motor DataGrid Avançado:** busca multi-termo, filtros em cascata por coluna no estilo Excel, paginação e exportação em `.csv`.
- **Arquitetura 100% Client-Side:** processamento e parsing de planilhas `.xlsx` em memória direto no navegador (via SheetJS), sem dependência de banco de dados externo ou riscos de vazamento de dados.
- **Base de Demonstração Integrada:** abre automaticamente com mais de 580 registros fictícios e permite baixar uma planilha modelo com 1 clique para testes.

---

## 🛠️ Stack Tecnológica

- **Front-end:** React 18, TypeScript, Tailwind CSS
- **Bundler:** Vite
- **Visualização de Dados:** Recharts
- **Parsing de Planilhas:** SheetJS (xlsx)
- **Ícones:** Lucide React

---

## 💻 Executando o Projeto

```bash
# Instalar dependências
npm install

# Iniciar servidor local
npm run dev

# Gerar build de produção
npm run build
```

---

Desenvolvido por **TeodoroTech**.
