# 🚀 TeodoroTech — SAQM Pro (Portfólio & SaaS Edition)

Versão **100% independente e desacoplada** do **SAQM (Sistema de Análise de Qualidade de Manutenção)** desenvolvida pela **TeodoroTech** para demonstração comercial, portfólio e implantação White-Label em assistências técnicas e operações de e-commerce de smartphones.

## ✨ Diferenciais desta Versão

- **Zero dependência do banco da empresa anterior:** Nenhum dado real de clientes, IMEIs ou credenciais da operação antiga está presente.
- **Base de Demonstração Realista Integrada:** Já abre com **585 registros fictícios** (280 triagens de entrada, 195 reparos de bancada com casos de reincidência e 110 devoluções de Mercado Livre, Site Oficial e Shopee).
- **Upload de Planilhas `.xlsx` / `.xls` 100% no Navegador:** Qualquer visitante ou cliente em potencial pode arrastar uma planilha Excel para testar os gráficos e filtros em tempo real — tudo processado localmente via `SheetJS` sem enviar dados para servidores externos.
- **Gerador de Planilha Modelo (`.xlsx`):** Botão na barra lateral para baixar uma planilha `.xlsx` já formatada com as 3 abas (`Triagem Recebimentos`, `Reparos Técnicos` e `Devolução`) pronta para edição e teste.
- **Botão "Voltar aos Dados Demo":** Permite restaurar a base fictícia original com 1 clique após testar uma planilha personalizada.

## 🛠️ Como Executar Localmente

```bash
npm install
npm run dev
```

Para gerar o pacote de produção (`dist/`):

```bash
npm run build
```
