# 💰 MEU FINANCEIRO PRO 2.0
### Sistema Moderno de Gestão Financeira, Livro Caixa & Cartões

Aplicação multiplataforma moderna (PC, Mac, Mobile - PWA) desenvolvida em **React 19, TypeScript 5, Vite, Firebase e Python**, substituindo a antiga base de scripts monolíticos do Google Apps Script com performance instantânea, zero dependência de planilhas lentas, tema escuro moderno azul escuro e comando de voz nativo em Português do Brasil.

---

## 🚀 Principais Funcionalidades

1. **🎨 Design Moderno Dark Blue (#0B1929, #0F2744, #287EA5):**
   - Paleta requintada inspirada no design original com melhorias substanciais de ergonomia, contraste WCAG AA e fluidez.
   - Layout responsivo unificado: **Sidebar no Desktop** e **Bottom Navigation no Mobile/Tablet**.

2. **🎙️ Comando de Voz Inteligente em Português (PT-BR):**
   - Reconhecimento automático via Web Speech API nativa.
   - Extrai valores por extenso ("cento e cinquenta reais", "dois mil e trezentos"), tipos (despesa/receita/investimento), naturezas ("mercado", "gasolina", "aluguel") e formas de pagamento ("crédito", "débito", "pix").
   - Pré-visualização com preenchimento em 1 clique.

3. **📒 Livro Caixa Oficial com Exportação de PDF:**
   - Cálculo automático do Saldo Anterior, Receitas (+), Despesas (-), Investimentos e Saldo Final.
   - Tabela progressiva com saldo acumulado linha a linha.
   - **Geração instantânea de PDF para impressão** direto no navegador com `@react-pdf/renderer` sem necessidade de Google Docs ou Drive.

4. **💳 Cartões de Crédito & Faturas:**
   - Visualização com barras dinâmicas de limite disponível e utilizado.
   - Controle de compras parceladas com identificador único (`compraId`), evitando duplicações ou descompassos de parcelas.
   - Suporte ilimitado de cartões (sem o limite fixo rígido de 3 cartões do código legado).

5. **🔍 Gerenciamento e Edição de Lançamentos:**
   - Pesquisa em tempo real com filtros combinados (tipo, natureza, competência).
   - Edição rápida e exclusão em lote de todas as parcelas vinculadas.

6. **📊 Gráficos e Análises Interativas:**
   - Gráfico donut de distribuição de despesas por natureza com Recharts.
   - Comparativo mensal de entradas, saídas e investimentos.

7. **🐍 Módulo de Inteligência Financeira em Python:**
   - `python/analise_financeira.py`: Cálculo vetorizado com Pandas/NumPy de taxa de poupança, média diária de gastos e projeções financeiras.
   - `python/migrar_sheets_para_firebase.py`: Conversor de dados das planilhas para o banco do novo sistema.

---

## 🛠️ Como Executar a Aplicação Web

No terminal do projeto (`C:\Users\Samsung\.gemini\antigravity\scratch\meu-financeiro`):

```bash
# Iniciar o servidor de desenvolvimento local
npm run dev
```

Abra o navegador em `http://localhost:5173`.

### Para Gerar a Versão de Produção:
```bash
npm run build
npm run preview
```

---

## 🐍 Como Executar as Análises em Python

```bash
cd python
pip install -r requirements.txt
python analise_financeira.py
```

---

## ☁️ Conexão com o Firebase / Firestore (Opcional)

Para ativar a sincronização em nuvem do Firebase:
1. Crie um projeto no console do Firebase: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Crie um arquivo `.env` na raiz do projeto com as chaves:
```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_id
VITE_FIREBASE_APP_ID=seu_app_id
```
*Caso não configure o `.env`, o sistema continuará operando 100% de forma autônoma e segura salvando os dados no LocalStorage do seu navegador.*
