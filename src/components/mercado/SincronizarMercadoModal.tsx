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
  AlertTriangle
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
  const [mostrarCodigo, setMostrarCodigo] = useState(false);

  if (!aberto) return null;

  const salvarUrl = (novaUrl: string) => {
    setUrlApp(novaUrl);
    localStorage.setItem(STORAGE_KEY_URL_MERCADO, novaUrl);
  };

  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(CODIGO_APPS_SCRIPT);
    mostrarToast('📋 Código copiado! Cole no Codigo.gs do seu Apps Script.', 'sucesso');
  };

  const handleInserirExemploTeste = () => {
    adicionarCompraMercado({
      mercadoNome: 'Supermercado Modelo (Cupom Exemplo)',
      data: new Date().toISOString().slice(0, 10),
      valorTotal: 184.50,
      formaPagamento: '💳 Crédito',
      itens: [
        { nome: 'Arroz Tipo 1 (5kg)', quantidade: 1, precoUnitario: 29.90, precoTotal: 29.90 },
        { nome: 'Feijão Carioca (1kg)', quantidade: 2, precoUnitario: 8.50, precoTotal: 17.00 },
        { nome: 'Azeite Extra Virgem (500ml)', quantidade: 1, precoUnitario: 42.00, precoTotal: 42.00 },
        { nome: 'Café Tradicional (500g)', quantidade: 2, precoUnitario: 18.80, precoTotal: 37.60 },
        { nome: 'Leite Integral (1L)', quantidade: 6, precoUnitario: 4.80, precoTotal: 28.80 },
        { nome: 'Detergente Líquido (500ml)', quantidade: 4, precoUnitario: 2.30, precoTotal: 9.20 },
        { nome: 'Sabão em Pó (1kg)', quantidade: 1, precoUnitario: 20.00, precoTotal: 20.00 },
      ]
    });
    setMensagemStatus('✅ Compra de teste inserida com sucesso no Extrato! Toque nela no Extrato para ver os 7 itens do cupom detalhado.');
    mostrarToast('🛒 Compra teste adicionada com cupom detalhado!', 'sucesso');
  };

  const handleSincronizarWeb = async () => {
    const urlLimpa = urlApp.trim();
    if (!urlLimpa) {
      setMensagemStatus('⚠️ Por favor, cole a URL da WebApp do seu Meu Mercado no campo abaixo para sincronizar.');
      mostrarToast('Informe a URL da WebApp do Meu Mercado.', 'erro');
      return;
    }

    try {
      setCarregando(true);
      setMensagemStatus('🔄 Conectando ao Meu Mercado...');

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
          throw new Error('A URL ainda está devolvendo a página web antiga em vez dos dados JSON. No Google Apps Script, vá em "Implantar > Gerenciar implantações > Editar ✏️", no campo Versão selecione obrigatoriamente "Nova versão" e clique em "Implantar".');
        }
        throw new Error('A resposta do script não foi um JSON válido. Verifique se a URL termina com /exec');
      }

      if (!json || !json.sucesso || !Array.isArray(json.compras)) {
        throw new Error(json.erro || 'Formato de resposta inesperado do Google Apps Script.');
      }

      if (json.compras.length === 0) {
        setMensagemStatus('ℹ️ Conexão estabelecida! Porém não há nenhuma compra com status "FECHADA" na aba LISTAS da sua planilha.');
        mostrarToast('Nenhuma compra fechada encontrada no Meu Mercado.', 'info');
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

      setMensagemStatus(`✅ ${importadas} compra(s) sincronizada(s) com sucesso! Todos os cupons e itens foram integrados ao extrato.`);
      mostrarToast(`🛒 ${importadas} compra(s) do Meu Mercado integradas ao extrato!`, 'sucesso');
    } catch (err: any) {
      console.error('Erro ao sincronizar com Meu Mercado:', err);
      const isFailedFetch = String(err?.message || '').toLowerCase().includes('failed to fetch');
      const msgErro = isFailedFetch
        ? '⚠️ O Google retornou HTML em vez de JSON (CORS bloqueado). No Google Apps Script da sua planilha, vá em "Implantar > Gerenciar implantações > Editar ✏️", no campo Versão mude para "Nova versão" e salve.'
        : `⚠️ Falha: ${err.message || 'Verifique a URL e a versão da implantação.'}`;
      setMensagemStatus(msgErro);
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
      backgroundColor: 'rgba(5, 12, 22, 0.78)',
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
          maxWidth: '540px',
          maxHeight: '92vh',
          backgroundColor: '#0F2744',
          borderRadius: '20px',
          border: '1.5px solid #287EA5',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Cabeçalho */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #173F5F 0%, #205B7D 60%, #287EA5 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShoppingCart size={20} color="#F8D117" />
            </div>
            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: 800, margin: 0 }}>
                Sincronizar Meu Mercado
              </h3>
              <span style={{ fontSize: '11.5px', color: '#E7EBF0', opacity: 0.85 }}>
                Importar compras com cupom detalhado de itens
              </span>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo */}
        <div style={{ padding: '0 18px 18px 18px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
          
          <div style={{
            padding: '11px 13px',
            backgroundColor: '#132F4C',
            borderRadius: '12px',
            border: '1px solid #1E3A5F',
            fontSize: '12.5px',
            color: '#E7EBF0',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#66BB6A' }}>
              <CheckCircle2 size={15} />
              <span>Conexão Direta com a Planilha do Meu Mercado</span>
            </div>
            <p style={{ margin: 0, color: '#AAB4BE', lineHeight: 1.45, fontSize: '11.5px' }}>
              Ao sincronizar, suas listas finalizadas no <strong>Meu Mercado</strong> viram despesas no extrato com o <strong>cupom detalhado</strong> (itens, quantidades, preço unitário e total).
            </p>
          </div>

          {/* O motivo do "Failed to fetch" e passo a passo claro */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(23, 58, 94, 0.55)',
            borderRadius: '12px',
            border: '1px solid #287EA5',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#F8D117', fontSize: '12.5px' }}>
              <AlertTriangle size={15} />
              <span>Por que deu erro mesmo com "Qualquer pessoa"?</span>
            </div>
            <p style={{ margin: 0, color: '#E7EBF0', fontSize: '11.5px', lineHeight: 1.5 }}>
              No Google Apps Script, salvar o código <strong>NÃO atualiza a URL da Web automaticamente</strong>. Ele continua servindo a versão congelada anterior que devolve página web em vez de dados JSON.
            </p>
            <div style={{
              backgroundColor: '#0A1929',
              padding: '10px 12px',
              borderRadius: '8px',
              borderLeft: '3px solid #F8D117'
            }}>
              <strong style={{ fontSize: '11.5px', color: '#FFFFFF', display: 'block', marginBottom: '4px' }}>
                Como resolver em 3 passos rápidos:
              </strong>
              <ol style={{ margin: 0, paddingLeft: '16px', color: '#AAB4BE', lineHeight: 1.5, fontSize: '11px' }}>
                <li>Na sua planilha do Meu Mercado, abra <strong>Extensões &gt; Apps Script</strong>.</li>
                <li>Clique em <strong>Implantar &gt; Gerenciar implantações</strong> e clique no lápis ✏️ (<strong>Editar</strong>).</li>
                <li><strong style={{ color: '#F8D117' }}>MUITO IMPORTANTE:</strong> No campo <strong>Versão</strong>, clique e mude de "Versão 1" para <span style={{ color: '#66BB6A', fontWeight: 800 }}>"Nova versão"</span>. Mantenha "Quem tem acesso: Qualquer pessoa" e clique em <strong>Implantar</strong>.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <button
                type="button"
                onClick={handleCopiarCodigo}
                style={{
                  backgroundColor: '#1E3A5F',
                  color: '#FFFFFF',
                  border: '1px solid #287EA5',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Copy size={13} color="#F8D117" />
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
                <Code size={13} />
                <span>{mostrarCodigo ? 'Ocultar código' : 'Ver código que deve estar no Apps Script'}</span>
              </button>
            </div>

            {mostrarCodigo && (
              <pre style={{
                backgroundColor: '#071320',
                padding: '10px',
                borderRadius: '8px',
                color: '#66BB6A',
                fontSize: '10.5px',
                overflowX: 'auto',
                maxHeight: '160px',
                border: '1px solid #1E3A5F'
              }}>
                {CODIGO_APPS_SCRIPT}
              </pre>
            )}
          </div>

          {/* Campo de URL da WebApp do Meu Mercado */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
              <Link size={13} color="#5090D3" />
              <span>URL da WebApp do Meu Mercado</span>
            </label>
            <input 
              type="text"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={urlApp}
              onChange={(e) => salvarUrl(e.target.value)}
              style={{ fontSize: '12px', padding: '10px 12px' }}
            />
          </div>

          {mensagemStatus && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: mensagemStatus.startsWith('✅') ? 'rgba(76, 175, 80, 0.18)' : mensagemStatus.startsWith('ℹ️') ? 'rgba(33, 150, 243, 0.18)' : 'rgba(255, 152, 0, 0.18)',
              border: `1px solid ${mensagemStatus.startsWith('✅') ? '#4CAF50' : mensagemStatus.startsWith('ℹ️') ? '#2196F3' : '#FF9800'}`,
              fontSize: '11.5px',
              fontWeight: 600,
              color: mensagemStatus.startsWith('✅') ? '#66BB6A' : mensagemStatus.startsWith('ℹ️') ? '#60A5FA' : '#F8D117',
              lineHeight: 1.45
            }}>
              {mensagemStatus}
            </div>
          )}

          {/* Botões de Ação */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={handleSincronizarWeb}
              disabled={carregando}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '13px',
                gap: '8px'
              }}
            >
              <RefreshCw size={16} className={carregando ? 'animate-spin' : ''} />
              <span>{carregando ? 'Sincronizando...' : 'Buscar Compras do Meu Mercado'}</span>
            </button>

            {/* Botão de Teste Imediato */}
            <button
              type="button"
              onClick={handleInserirExemploTeste}
              style={{
                width: '100%',
                padding: '9px 12px',
                backgroundColor: 'rgba(248, 209, 23, 0.12)',
                border: '1px solid rgba(248, 209, 23, 0.45)',
                color: '#F8D117',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
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

            {comprasMercadoAtuais.length > 0 && (
              <button
                type="button"
                onClick={handleLimparComprasMercado}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF5350',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginTop: '4px',
                  padding: '6px'
                }}
              >
                <Trash2 size={13} />
                <span>Limpar compras do Meu Mercado ({comprasMercadoAtuais.length} ativas)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
