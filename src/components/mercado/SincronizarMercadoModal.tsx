import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { 
  X, 
  ShoppingCart, 
  RefreshCw, 
  CheckCircle2, 
  Link, 
  Trash2,
  Copy,
  Code,
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Globe
} from 'lucide-react';

interface SincronizarMercadoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

const STORAGE_KEY_URL_MERCADO = 'mf_url_meu_mercado_v1';
const URL_PADRAO_MEU_MERCADO = 'https://script.google.com/macros/s/AKfycbyVzn-uiAsqoXOxDGDqeVTTr3pFWPEc6SfqmiTH8j3YTAnr4MPrKRAXtQjbPI7VHp3x9w/exec';

const CODIGO_APPS_SCRIPT = `// ============================================================
// 🛒 INTEGRAÇÃO OFICIAL: MEU MERCADO → MEU FINANCEIRO
// Cole este bloco no final do Codigo.gs (ou substitua o doGet)
// e clique no DISQUETE 💾 (Salvar) antes de implantar!
// ============================================================

function doGet(e) {
  // Se a requisição veio do Meu Financeiro com ?api=extrato
  if (e && e.parameter && (e.parameter.api === 'extrato' || e.parameter.api === 'compras')) {
    return responderApiMeuFinanceiro(e);
  }
  // Caso contrário, carrega o app visual do Meu Mercado
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Meu Mercado')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function responderApiMeuFinanceiro(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheets = ss.getSheets();
    
    var abaListas = null;
    var abaCompras = null;
    for (var s = 0; s < sheets.length; s++) {
      var n = sheets[s].getName().toUpperCase();
      if (n.indexOf('LISTAS') !== -1) abaListas = sheets[s];
      if (n.indexOf('COMPRAS') !== -1) abaCompras = sheets[s];
    }
    
    if (!abaListas || !abaCompras) {
      return ContentService.createTextOutput(JSON.stringify({
        sucesso: false,
        erro: 'Abas LISTAS ou COMPRAS não encontradas na planilha.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var comprasPorLista = {};
    var uLinhaCompras = abaCompras.getLastRow();
    if (uLinhaCompras >= 2) {
      var dadosCompras = abaCompras.getRange(2, 1, uLinhaCompras - 1, Math.min(8, abaCompras.getLastColumn())).getValues();
      dadosCompras.forEach(function(linha) {
        var idLista = String(linha[1] || '').trim();
        var produto = String(linha[3] || '').trim();
        var qtd = Number(linha[4]) || 1;
        var unit = Number(linha[5]) || 0;
        var total = Number(linha[6]) || (qtd * unit);

        if (!idLista || !produto) return;
        if (!comprasPorLista[idLista]) {
          comprasPorLista[idLista] = [];
        }
        comprasPorLista[idLista].push({
          nome: produto,
          quantidade: qtd,
          precoUnitario: unit,
          precoTotal: total
        });
      });
    }

    var uLinhaListas = abaListas.getLastRow();
    var resultado = [];
    if (uLinhaListas >= 2) {
      var dadosListas = abaListas.getRange(2, 1, uLinhaListas - 1, Math.min(7, abaListas.getLastColumn())).getValues();
      dadosListas.forEach(function(linha) {
        var id = String(linha[0] || '').trim();
        var nome = String(linha[1] || 'Compras de Supermercado').trim();
        var dataCriacao = linha[2];
        var dataFechamento = linha[4];
        var status = String(linha[5] || '').toUpperCase();

        var itens = comprasPorLista[id] || [];
        var totalCompra = 0;
        itens.forEach(function(it) { totalCompra += (it.precoTotal || 0); });

        if (id && (status === 'FECHADA' || totalCompra > 0)) {
          var dataFinal = dataFechamento instanceof Date ? dataFechamento : (dataCriacao instanceof Date ? dataCriacao : new Date());
          var ano = dataFinal.getFullYear();
          var mes = String(dataFinal.getMonth() + 1).padStart(2, '0');
          var dia = String(dataFinal.getDate()).padStart(2, '0');

          resultado.push({
            id: 'mercado_lista_' + id,
            idListaOriginal: id,
            nomeLista: nome,
            data: ano + '-' + mes + '-' + dia,
            competencia: mes + '/' + ano,
            valorTotal: totalCompra,
            totalItens: itens.length,
            itens: itens
          });
        }
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      sucesso: true,
      origem: 'Meu Mercado',
      totalCompras: resultado.length,
      compras: resultado
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      sucesso: false,
      erro: String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const SincronizarMercadoModal: React.FC<SincronizarMercadoModalProps> = ({
  aberto,
  onFechar,
}) => {
  const { adicionarCompraMercado, lancamentos, excluirLancamento, mostrarToast } = useFinanceStore();

  const [urlApp, setUrlApp] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_URL_MERCADO) || URL_PADRAO_MEU_MERCADO;
  });
  const [carregando, setCarregando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [abaAjuda, setAbaAjuda] = useState<'planilha' | 'script'>('planilha');
  const [mostrarCodigo, setMostrarCodigo] = useState(false);

  if (!aberto) return null;

  const salvarUrl = (novaUrl: string) => {
    setUrlApp(novaUrl);
    localStorage.setItem(STORAGE_KEY_URL_MERCADO, novaUrl);
  };

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(CODIGO_APPS_SCRIPT);
    mostrarToast('📋 Código copiado! Cole no Codigo.gs do Apps Script e clique no disquete (Salvar).', 'sucesso');
  };

  const handleInserirExemploTeste = () => {
    adicionarCompraMercado({
      mercadoNome: 'Supermercado Modelo (Exemplo Teste)',
      data: new Date().toISOString().slice(0, 10),
      valorTotal: 184.50,
      formaPagamento: '💳 Crédito',
      itens: [
        { nome: 'Arroz Branco Tipo 1 (5kg)', quantidade: 1, precoUnitario: 29.90, precoTotal: 29.90 },
        { nome: 'Feijão Carioca Especial (1kg)', quantidade: 2, precoUnitario: 8.50, precoTotal: 17.00 },
        { nome: 'Azeite de Oliva Extra Virgem (500ml)', quantidade: 1, precoUnitario: 42.00, precoTotal: 42.00 },
        { nome: 'Café Torrado e Moído (500g)', quantidade: 2, precoUnitario: 18.80, precoTotal: 37.60 },
        { nome: 'Leite Integral UHT (1L)', quantidade: 6, precoUnitario: 4.80, precoTotal: 28.80 },
        { nome: 'Detergente Líquido Neutro (500ml)', quantidade: 4, precoUnitario: 2.30, precoTotal: 9.20 },
        { nome: 'Sabão em Pó Alta Eficiência (1kg)', quantidade: 1, precoUnitario: 20.00, precoTotal: 20.00 },
      ]
    });
    setMensagemStatus('✅ Compra de teste inserida com sucesso! Você já pode fechar esta janela e ver os 7 itens detalhados no seu Extrato.');
    mostrarToast('🛒 Compra teste de R$ 184,50 adicionada ao extrato com cupom!', 'sucesso');
  };

  // Leitura direta da Planilha Google (GViz / TQ) sem precisar de Apps Script
  const sincronizarDiretoPlanilha = async (sheetId: string) => {
    const buscarAba = async (nomesPossiveis: string[]) => {
      for (const nome of nomesPossiveis) {
        try {
          const enc = encodeURIComponent(nome);
          const u = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${enc}`;
          const r = await fetch(u);
          if (!r.ok) continue;
          const t = await r.text();
          const jsonStr = t.substring(t.indexOf('{'), t.lastIndexOf('}') + 1);
          const j = JSON.parse(jsonStr);
          if (j.status === 'ok' && j.table?.rows) {
            return j.table.rows.map((row: any) => (row.c || []).map((c: any) => c?.v ?? ''));
          }
        } catch {
          // tenta o proximo nome
        }
      }
      return null;
    };

    const linhasListas = await buscarAba(['LISTAS', '📋 LISTAS', 'Listas']);
    const linhasCompras = await buscarAba(['COMPRAS', '🧾 COMPRAS', 'Compras']);

    if (!linhasListas && !linhasCompras) {
      throw new Error('Não foi possível ler as abas LISTAS e COMPRAS. Verifique se a planilha está compartilhada com "Qualquer pessoa com o link pode ver".');
    }

    const comprasPorLista: Record<string, any[]> = {};
    if (linhasCompras && linhasCompras.length > 0) {
      linhasCompras.forEach((linha: any[]) => {
        const idLista = String(linha[1] || '').trim();
        const produto = String(linha[3] || '').trim();
        const qtd = Number(linha[4]) || 1;
        const unit = Number(linha[5]) || 0;
        const total = Number(linha[6]) || (qtd * unit);

        if (!idLista || !produto) return;
        if (!comprasPorLista[idLista]) {
          comprasPorLista[idLista] = [];
        }
        comprasPorLista[idLista].push({
          nome: produto,
          quantidade: qtd,
          precoUnitario: unit,
          precoTotal: total
        });
      });
    }

    let importadas = 0;
    if (linhasListas && linhasListas.length > 0) {
      linhasListas.forEach((linha: any[]) => {
        const id = String(linha[0] || '').trim();
        const nome = String(linha[1] || 'Compras de Supermercado').trim();
        const status = String(linha[5] || '').toUpperCase();
        const itens = comprasPorLista[id] || [];

        let totalCompra = 0;
        itens.forEach(it => { totalCompra += it.precoTotal; });

        if (id && (status === 'FECHADA' || totalCompra > 0)) {
          const dataBruta = linha[4] || linha[2] || '';
          let dataFinal = new Date().toISOString().slice(0, 10);
          if (typeof dataBruta === 'string' && dataBruta.includes('Date(')) {
            // formato Date(ano, mes, dia) do gviz
            const matchDate = dataBruta.match(/Date\((\d+),(\d+),(\d+)\)/);
            if (matchDate) {
              const ano = matchDate[1];
              const mes = String(Number(matchDate[2]) + 1).padStart(2, '0');
              const dia = String(matchDate[3]).padStart(2, '0');
              dataFinal = `${ano}-${mes}-${dia}`;
            }
          }

          adicionarCompraMercado({
            mercadoNome: nome,
            data: dataFinal,
            valorTotal: totalCompra > 0 ? totalCompra : Number(linha[6]) || 0,
            formaPagamento: '💳 Crédito',
            itens: itens
          });
          importadas++;
        }
      });
    }

    if (importadas === 0) {
      setMensagemStatus('ℹ️ Planilha conectada! Porém não encontramos nenhuma compra fechada nas abas LISTAS e COMPRAS.');
      mostrarToast('Planilha lida com sucesso, mas sem compras finalizadas.', 'info');
      return;
    }

    setMensagemStatus(`✅ ${importadas} compra(s) sincronizada(s) diretamente da Planilha Google!`);
    mostrarToast(`🛒 ${importadas} compra(s) importadas com sucesso!`, 'sucesso');
  };

  // Sincronização via WebApp do Apps Script
  const sincronizarViaAppsScript = async (urlLimpa: string) => {
    const urlFinal = urlLimpa.includes('?') ? `${urlLimpa}&api=extrato` : `${urlLimpa}?api=extrato`;
    const res = await fetch(urlFinal, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      if (text.includes('<!doctype') || text.includes('<html') || text.includes('accounts.google.com') || text.includes('ppConfig')) {
        throw new Error('WEBAPP_RETORNOU_HTML');
      }
      throw new Error('A resposta do script não foi um JSON válido.');
    }

    if (!json || !json.sucesso || !Array.isArray(json.compras)) {
      throw new Error(json.erro || 'Formato de resposta inesperado do Google Apps Script.');
    }

    if (json.compras.length === 0) {
      setMensagemStatus('ℹ️ Conexão estabelecida! Porém não há compras fechadas registradas.');
      mostrarToast('Nenhuma compra fechada no Meu Mercado.', 'info');
      return;
    }

    let importadas = 0;
    json.compras.forEach((compra: any) => {
      adicionarCompraMercado({
        mercadoNome: compra.nomeLista || 'Meu Mercado',
        data: compra.data,
        valorTotal: compra.valorTotal,
        formaPagamento: '💳 Crédito',
        itens: compra.itens || []
      });
      importadas++;
    });

    setMensagemStatus(`✅ ${importadas} compra(s) sincronizada(s) com sucesso via WebApp!`);
    mostrarToast(`🛒 ${importadas} compra(s) integradas ao extrato!`, 'sucesso');
  };

  const handleSincronizarGeral = async () => {
    const urlLimpa = urlApp.trim();
    if (!urlLimpa) {
      setMensagemStatus('⚠️ Informe o link da sua Planilha Google OU a URL da WebApp no campo.');
      mostrarToast('Informe o link da Planilha ou da WebApp.', 'erro');
      return;
    }

    try {
      setCarregando(true);
      setMensagemStatus('🔄 Conectando aos dados do Meu Mercado...');

      // Verifica se é link direto da Planilha Google (docs.google.com/spreadsheets/d/...)
      const matchSheet = urlLimpa.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (matchSheet && matchSheet[1]) {
        await sincronizarDiretoPlanilha(matchSheet[1]);
      } else {
        await sincronizarViaAppsScript(urlLimpa);
      }
    } catch (err: any) {
      console.error('Erro na sincronização:', err);
      if (err?.message === 'WEBAPP_RETORNOU_HTML' || String(err?.message || '').toLowerCase().includes('failed to fetch')) {
        setMensagemStatus('⚠️ O Google retornou a página visual do Meu Mercado em vez dos dados da integração.\n\n👉 Para resolver no Apps Script:\n1. Clique em "Copiar Código Apps Script" abaixo.\n2. No Apps Script, cole no final do Codigo.gs e clique no DISQUETE 💾 (Salvar).\n3. Em Implantar > Gerenciar implantações > Editar ✏️, mude a Versão para "Nova versão" e clique em Implantar.\n\n💡 OU MAIS FÁCIL AINDA: Cole aqui o link normal da sua Planilha Google (docs.google.com/spreadsheets/d/...)!');
      } else {
        setMensagemStatus(`⚠️ Falha na sincronização: ${err.message || 'Verifique as permissões de acesso.'}`);
      }
    } finally {
      setCarregando(false);
    }
  };

  const comprasMercadoAtuais = lancamentos.filter(l => l.origem === 'meu-mercado' || l.detalhesMercado);

  const handleLimparComprasMercado = () => {
    if (confirm('Deseja remover todas as compras importadas do Meu Mercado?')) {
      comprasMercadoAtuais.forEach(c => excluirLancamento(c.id, false));
      setMensagemStatus('🧹 Todas as compras do Meu Mercado foram removidas do extrato.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 12, 22, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '12px'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          backgroundColor: '#0F2744',
          borderRadius: '18px',
          border: '1.5px solid #287EA5',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.75)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Cabeçalho Fixo */}
        <div style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #173F5F 0%, #205B7D 60%, #287EA5 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShoppingCart size={19} color="#F8D117" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
                Sincronizar Meu Mercado
              </h3>
              <span style={{ fontSize: '11px', color: '#E7EBF0', opacity: 0.85 }}>
                Cupons e itens detalhados integrados ao extrato
              </span>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Campo de URL / Link com Destaque */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <Link size={12} color="#5090D3" />
              <span>Link da Planilha Google OU URL da WebApp</span>
            </label>
            <input 
              type="text"
              placeholder="Cole aqui docs.google.com/spreadsheets/d/... ou script.google.com/.../exec"
              value={urlApp}
              onChange={(e) => salvarUrl(e.target.value)}
              style={{
                width: '100%',
                fontSize: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #287EA5',
                backgroundColor: '#071626',
                color: '#FFFFFF'
              }}
            />
            <span style={{ fontSize: '10.5px', color: '#66BB6A', marginTop: '4px', display: 'block' }}>
              💡 <strong>Dica fácil:</strong> Você pode colar o link direto da sua <strong>Planilha Google</strong> aberta no navegador!
            </span>
          </div>

          {/* Botões Principais de Ação (Sempre Visíveis no Topo) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={handleSincronizarGeral}
              disabled={carregando}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '13px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={15} className={carregando ? 'animate-spin' : ''} />
              <span>{carregando ? 'Buscando Compras...' : 'Buscar Compras do Meu Mercado'}</span>
            </button>

            <button
              type="button"
              onClick={handleInserirExemploTeste}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'rgba(248, 209, 23, 0.12)',
                border: '1px solid rgba(248, 209, 23, 0.5)',
                color: '#F8D117',
                borderRadius: '10px',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={14} color="#F8D117" />
              <span>🧪 Carregar Compra de Teste no Extrato (Cupom Completo)</span>
            </button>
          </div>

          {/* Mensagem de Status */}
          {mensagemStatus && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: mensagemStatus.startsWith('✅') ? 'rgba(76, 175, 80, 0.15)' : mensagemStatus.startsWith('ℹ️') ? 'rgba(33, 150, 243, 0.15)' : 'rgba(255, 152, 0, 0.15)',
              border: `1px solid ${mensagemStatus.startsWith('✅') ? '#4CAF50' : mensagemStatus.startsWith('ℹ️') ? '#2196F3' : '#FF9800'}`,
              fontSize: '11.5px',
              fontWeight: 600,
              color: mensagemStatus.startsWith('✅') ? '#66BB6A' : mensagemStatus.startsWith('ℹ️') ? '#60A5FA' : '#F8D117',
              whiteSpace: 'pre-line',
              lineHeight: 1.45
            }}>
              {mensagemStatus}
            </div>
          )}

          {/* Guia com Abas Alternáveis */}
          <div style={{
            backgroundColor: '#0A1A2E',
            borderRadius: '12px',
            border: '1px solid #1E3A5F',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #1E3A5F' }}>
              <button
                type="button"
                onClick={() => setAbaAjuda('planilha')}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: abaAjuda === 'planilha' ? '#173F5F' : 'transparent',
                  color: abaAjuda === 'planilha' ? '#FFFFFF' : '#AAB4BE',
                  fontWeight: 700,
                  fontSize: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <FileSpreadsheet size={13} color="#4CAF50" />
                <span>Modo 1: Link da Planilha (Fácil)</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAjuda('script')}
                style={{
                  flex: 1,
                  padding: '9px',
                  background: abaAjuda === 'script' ? '#173F5F' : 'transparent',
                  color: abaAjuda === 'script' ? '#FFFFFF' : '#AAB4BE',
                  fontWeight: 700,
                  fontSize: '11px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <Globe size={13} color="#5090D3" />
                <span>Modo 2: WebApp Apps Script</span>
              </button>
            </div>

            <div style={{ padding: '12px' }}>
              {abaAjuda === 'planilha' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#E7EBF0', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: '#66BB6A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} />
                    <span>Como usar o Link Direto da Planilha (Zero código):</span>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '16px', color: '#AAB4BE' }}>
                    <li>Abra a planilha do <strong>Meu Mercado</strong> no seu computador.</li>
                    <li>No topo direito da planilha, clique no botão <strong>Compartilhar</strong>.</li>
                    <li>Em <i>Acesso geral</i>, marque <strong>Qualquer pessoa com o link pode ler</strong>.</li>
                    <li>Copie o link do navegador (<code>https://docs.google.com/spreadsheets/d/...</code>) e cole no campo acima!</li>
                  </ol>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', color: '#E7EBF0', lineHeight: 1.45 }}>
                  <div style={{ fontWeight: 800, color: '#F8D117', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={13} />
                    <span>Como configurar a WebApp no Google Apps Script:</span>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: '16px', color: '#AAB4BE' }}>
                    <li>Abra a planilha &gt; <strong>Extensões &gt; Apps Script</strong>.</li>
                    <li>Clique no botão <strong>"Copiar Código Apps Script"</strong> abaixo.</li>
                    <li>No arquivo <code>Codigo.gs</code>, cole no final e clique no <strong>disquete 💾 (Salvar)</strong>.</li>
                    <li>Clique em <strong>Implantar &gt; Gerenciar implantações &gt; Editar ✏️</strong>.</li>
                    <li>No campo Versão, selecione obrigatoriamente <strong>"Nova versão"</strong> e clique em <strong>Implantar</strong>.</li>
                  </ol>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handleCopiarCodigo}
                      style={{
                        backgroundColor: '#1E3A5F',
                        color: '#FFFFFF',
                        border: '1px solid #287EA5',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      <Copy size={12} color="#F8D117" />
                      <span>Copiar Código Apps Script</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMostrarCodigo(!mostrarCodigo)}
                      style={{
                        background: 'none',
                        color: '#5090D3',
                        border: 'none',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Code size={12} />
                      <span>{mostrarCodigo ? 'Ocultar código' : 'Ver código'}</span>
                    </button>
                  </div>

                  {mostrarCodigo && (
                    <pre style={{
                      backgroundColor: '#071320',
                      padding: '8px',
                      borderRadius: '6px',
                      color: '#66BB6A',
                      fontSize: '10px',
                      overflowX: 'auto',
                      maxHeight: '140px',
                      border: '1px solid #1E3A5F',
                      marginTop: '4px'
                    }}>
                      {CODIGO_APPS_SCRIPT}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Limpar Compras se houver */}
          {comprasMercadoAtuais.length > 0 && (
            <button
              type="button"
              onClick={handleLimparComprasMercado}
              style={{
                background: 'none',
                border: 'none',
                color: '#EF5350',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4px'
              }}
            >
              <Trash2 size={12} />
              <span>Limpar compras do Meu Mercado ({comprasMercadoAtuais.length} ativas)</span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};
