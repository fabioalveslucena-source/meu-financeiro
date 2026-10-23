import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { 
  X, 
  ShoppingCart, 
  RefreshCw, 
  Trash2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Link, 
  Cloud,
  CheckCircle
} from 'lucide-react';

interface SincronizarMercadoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

const STORAGE_KEY_URL_MERCADO = 'mf_url_meu_mercado_v1';
const URL_PADRAO_MEU_MERCADO = 'https://docs.google.com/spreadsheets/d/1yzFMAn67heVuMMprPVIw5lH5alL7hpi31A1K6AnERZk/edit';

function parseNumeroPtBr(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const s = String(val).trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export const SincronizarMercadoModal: React.FC<SincronizarMercadoModalProps> = ({
  aberto,
  onFechar,
}) => {
  const { 
    lancamentos, 
    excluirLancamento, 
    adicionarCompraMercado,
    sincronizarComNuvem,
    mostrarToast,
    competenciaAtiva 
  } = useFinanceStore();

  const [urlApp, setUrlApp] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_URL_MERCADO) || URL_PADRAO_MEU_MERCADO;
  });
  const [competenciaDestino, setCompetenciaDestino] = useState(competenciaAtiva || '10/2026');
  const [carregandoNuvem, setCarregandoNuvem] = useState(false);
  const [carregandoPlanilha, setCarregandoPlanilha] = useState(false);
  const [mostrarAvancado, setMostrarAvancado] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);

  if (!aberto) return null;

  const salvarUrl = (novaUrl: string) => {
    setUrlApp(novaUrl);
    localStorage.setItem(STORAGE_KEY_URL_MERCADO, novaUrl);
  };

  // Compras reais do Meu Mercado que estão salvas no Meu Financeiro
  const comprasMercado = lancamentos.filter(l => l.origem === 'meu-mercado' || l.detalhesMercado);
  const totalMercadoGeral = comprasMercado.reduce((acc, curr) => acc + curr.valor, 0);

  // Sincronizar com a Nuvem Firestore agora
  const handleSincronizarNuvemAgora = async () => {
    setCarregandoNuvem(true);
    setMensagemStatus('🔄 Conectando com a nuvem Firestore...');
    try {
      const res = await sincronizarComNuvem();
      if (res && res.sucesso) {
        setMensagemStatus(`✅ Nuvem sincronizada com sucesso!\n${res.mensagem}`);
      } else {
        setMensagemStatus('✅ Sincronização finalizada!');
      }
    } catch (err: any) {
      setMensagemStatus(`⚠️ Erro ao sincronizar nuvem: ${err?.message || 'Falha de comunicação'}`);
    } finally {
      setCarregandoNuvem(false);
    }
  };

  // Excluir todas as compras do Meu Mercado (do estado local e da nuvem Firestore)
  const handleLimparTodasCompras = () => {
    if (comprasMercado.length === 0) return;
    if (confirm(`Deseja realmente remover todas as ${comprasMercado.length} compras do Meu Mercado do extrato e da nuvem?`)) {
      comprasMercado.forEach(c => {
        excluirLancamento(c.id, true);
      });
      setMensagemStatus('🧹 Todas as compras do Meu Mercado foram removidas com sucesso.');
      mostrarToast('Todas as compras do Meu Mercado foram removidas.', 'info');
    }
  };

  // Excluir uma única compra
  const handleExcluirUmaCompra = (id: string, descricao: string) => {
    if (confirm(`Deseja remover "${descricao}"?`)) {
      excluirLancamento(id, true);
      mostrarToast(`Compra "${descricao}" removida.`, 'info');
    }
  };

  // Sincronização opcional direta da Planilha Google (GViz / TQ)
  const handleSincronizarPlanilha = async () => {
    const urlLimpa = urlApp.trim();
    if (!urlLimpa) {
      mostrarToast('Informe o link da sua Planilha Google.', 'erro');
      return;
    }

    try {
      setCarregandoPlanilha(true);
      setMensagemStatus('🔄 Lendo abas da Planilha Google...');

      const matchSheet = urlLimpa.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (!matchSheet || !matchSheet[1]) {
        throw new Error('Link da Planilha inválido. Deve conter /spreadsheets/d/...');
      }

      const sheetId = matchSheet[1];

      const buscarAba = async (nomesPossiveis: string[], colIdentificadora: string) => {
        for (const nome of nomesPossiveis) {
          try {
            const enc = encodeURIComponent(nome);
            const u = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${enc}`;
            const r = await fetch(u);
            if (!r.ok) continue;
            const t = await r.text();
            const jsonStr = t.substring(t.indexOf('{'), t.lastIndexOf('}') + 1);
            const j = JSON.parse(jsonStr);
            if (j.status === 'ok' && j.table) {
              const colLabels = (j.table.cols || []).map((c: any) => String(c?.label || '').toUpperCase());
              const encontrouCol = colLabels.some((lbl: string) => lbl.includes(colIdentificadora.toUpperCase()));
              if (encontrouCol) {
                const rows = (j.table.rows || []).map((row: any) => (row.c || []).map((c: any) => c?.v ?? ''));
                return { cols: colLabels, rows };
              }
            }
          } catch {
            // tenta proximo nome
          }
        }
        return null;
      };

      const dadosListas = await buscarAba(['📋 LISTAS', 'LISTAS', 'Listas'], 'ID_LISTA');
      const dadosCompras = await buscarAba(['🧾 COMPRAS', 'COMPRAS', 'Compras'], 'ID_COMPRA');
      const dadosItens = await buscarAba(['🛒 ITENS_LISTA', 'ITENS_LISTA', 'ITENS', 'Itens'], 'ID_ITEM');

      if (!dadosListas && !dadosCompras) {
        throw new Error('Abas 📋 LISTAS ou 🧾 COMPRAS não encontradas na planilha informada.');
      }

      const comprasPorLista: Record<string, any[]> = {};
      if (dadosCompras && dadosCompras.rows.length > 0) {
        dadosCompras.rows.forEach((linha: any[]) => {
          const idLista = String(linha[1] || '').trim();
          const produto = String(linha[3] || '').trim();
          const qtd = parseNumeroPtBr(linha[4]) || 1;
          const unit = parseNumeroPtBr(linha[5]);
          const subtotal = parseNumeroPtBr(linha[6]) || (qtd * unit);

          if (!produto) return;
          const chaveLista = idLista || 'avulso';
          if (!comprasPorLista[chaveLista]) comprasPorLista[chaveLista] = [];
          comprasPorLista[chaveLista].push({
            nome: produto,
            quantidade: qtd,
            precoUnitario: unit > 0 ? unit : (subtotal > 0 && qtd > 0 ? subtotal / qtd : 0),
            precoTotal: subtotal
          });
        });
      }

      if (dadosItens && dadosItens.rows.length > 0) {
        dadosItens.rows.forEach((linha: any[]) => {
          const idLista = String(linha[1] || '').trim();
          const produto = String(linha[3] || '').trim();
          const qtd = parseNumeroPtBr(linha[4]) || 1;
          const precoEst = parseNumeroPtBr(linha[6]);
          const comprado = String(linha[7] || '').toUpperCase() === 'TRUE';

          if (!produto || !comprado) return;
          const chaveLista = idLista || 'avulso';
          if (!comprasPorLista[chaveLista]) comprasPorLista[chaveLista] = [];
          const jaExiste = comprasPorLista[chaveLista].some(it => it.nome.toLowerCase() === produto.toLowerCase());
          if (!jaExiste) {
            comprasPorLista[chaveLista].push({
              nome: produto,
              quantidade: qtd,
              precoUnitario: precoEst,
              precoTotal: qtd * precoEst
            });
          }
        });
      }

      const [mesDestino, anoDestino] = competenciaDestino.split('/');
      let importadas = 0;

      if (dadosListas && dadosListas.rows.length > 0) {
        dadosListas.rows.forEach((linha: any[]) => {
          const id = String(linha[0] || '').trim();
          const nome = String(linha[1] || 'Compras de Supermercado').trim();
          const status = String(linha[5] || '').toUpperCase();
          const itens = comprasPorLista[id] || [];
          let totalCompra = 0;
          itens.forEach(it => { totalCompra += (it.precoTotal || 0); });

          if (id && (itens.length > 0 || status === 'FECHADA' || totalCompra > 0)) {
            adicionarCompraMercado({
              mercadoNome: nome,
              data: `${anoDestino}-${mesDestino}-22`,
              competencia: competenciaDestino,
              valorTotal: totalCompra > 0 ? totalCompra : 50.00,
              formaPagamento: '💳 Crédito',
              cartao: 'Banco do Brasil Ourocard',
              itens: itens
            });
            importadas++;
          }
        });
      }

      if (importadas > 0) {
        setMensagemStatus(`✅ ${importadas} compra(s) importada(s) da planilha para ${competenciaDestino}!`);
        mostrarToast(`🛒 ${importadas} compra(s) importadas!`, 'sucesso');
      } else {
        setMensagemStatus('ℹ️ Planilha conectada, mas não foram encontradas compras fechadas nas abas.');
      }
    } catch (err: any) {
      setMensagemStatus(`⚠️ ${err?.message || 'Falha ao sincronizar planilha'}`);
      mostrarToast(err?.message || 'Erro na planilha', 'erro');
    } finally {
      setCarregandoPlanilha(false);
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
        {/* Cabeçalho */}
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
                Integração automática em tempo real com extrato e cartões
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
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Card de Explicação e Botão Principal da Nuvem */}
          <div style={{
            backgroundColor: '#0A1A2E',
            borderRadius: '12px',
            border: '1.5px solid #287EA5',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cloud size={18} color="#60A5FA" />
              <div>
                <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                  Integração Direta em Tempo Real
                </strong>
                <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                  Ao finalizar compras no app Meu Mercado, elas entram automaticamente aqui
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSincronizarNuvemAgora}
              disabled={carregandoNuvem}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                border: '1.5px solid #4ade80',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(22, 163, 74, 0.35)'
              }}
            >
              <RefreshCw size={16} className={carregandoNuvem ? 'animate-spin' : ''} />
              <span>{carregandoNuvem ? 'Buscando da Nuvem...' : '☁️ Atualizar e Sincronizar Nuvem Agora'}</span>
            </button>
          </div>

          {/* Lista REAL das Compras do Meu Mercado */}
          <div style={{
            backgroundColor: '#0A1A2E',
            borderRadius: '12px',
            border: '1px solid #1E3A5F',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E3A5F', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} color="#4ade80" />
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#FFFFFF' }}>
                  Compras Integradas ({comprasMercado.length})
                </span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#4ade80' }}>
                Total: R$ {totalMercadoGeral.toFixed(2)}
              </span>
            </div>

            {comprasMercado.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#AAB4BE', fontSize: '12px', lineHeight: 1.5 }}>
                <ShoppingCart size={28} color="#287EA5" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <strong>Nenhuma compra do Meu Mercado importada no momento.</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#7E8B9B' }}>
                  Quando você finaliza uma lista no Meu Mercado, ela sincroniza com o extrato e faturas do cartão em tempo real!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                {comprasMercado.map(c => (
                  <div 
                    key={c.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      backgroundColor: '#132F4C',
                      borderRadius: '8px',
                      border: '1px solid #1E3A5F',
                      fontSize: '11.5px',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                      <strong style={{ color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.descricao}
                      </strong>
                      <span style={{ fontSize: '10px', color: '#AAB4BE' }}>
                        📅 {c.competencia} • {c.pagamento} {c.cartao ? `(${c.cartao})` : ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <strong style={{ color: '#4ade80', fontSize: '12px' }}>
                        R$ {c.valor.toFixed(2)}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleExcluirUmaCompra(c.id, c.descricao)}
                        title="Remover esta compra"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#EF5350',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {comprasMercado.length > 0 && (
              <button
                type="button"
                onClick={handleLimparTodasCompras}
                style={{
                  background: 'none',
                  border: '1px solid rgba(239, 83, 80, 0.4)',
                  color: '#EF5350',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
              >
                <Trash2 size={13} />
                <span>Limpar todas as {comprasMercado.length} compras do Meu Mercado</span>
              </button>
            )}
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

          {/* Seção Opcional Avançada: Importar Planilha Google */}
          <div style={{
            borderTop: '1px solid #1E3A5F',
            paddingTop: '8px',
            marginTop: '2px'
          }}>
            <button
              type="button"
              onClick={() => setMostrarAvancado(!mostrarAvancado)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#60A5FA',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link size={13} />
                <span>Opções Avançadas: Importar da Planilha Google</span>
              </div>
              {mostrarAvancado ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {mostrarAvancado && (
              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Seletor da competência de destino para a planilha */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  backgroundColor: '#071626',
                  borderRadius: '8px',
                  border: '1px solid #1E3A5F'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="#F8D117" />
                    <span style={{ fontSize: '11px', color: '#E7EBF0', fontWeight: 600 }}>Lançar planilha no mês:</span>
                  </div>
                  <select
                    value={competenciaDestino}
                    onChange={(e) => setCompetenciaDestino(e.target.value)}
                    style={{
                      backgroundColor: '#173F5F',
                      color: '#FFFFFF',
                      border: '1px solid #287EA5',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    <option value="10/2026">Outubro / 2026</option>
                    <option value="09/2026">Setembro / 2026</option>
                    <option value="11/2026">Novembro / 2026</option>
                  </select>
                </div>

                <input 
                  type="text"
                  placeholder="docs.google.com/spreadsheets/d/..."
                  value={urlApp}
                  onChange={(e) => salvarUrl(e.target.value)}
                  style={{
                    width: '100%',
                    fontSize: '11.5px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #287EA5',
                    backgroundColor: '#071626',
                    color: '#FFFFFF'
                  }}
                />

                <button
                  type="button"
                  onClick={handleSincronizarPlanilha}
                  disabled={carregandoPlanilha}
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: '#173F5F',
                    border: '1px solid #287EA5',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <RefreshCw size={13} className={carregandoPlanilha ? 'animate-spin' : ''} />
                  <span>{carregandoPlanilha ? 'Lendo Planilha...' : `Importar Dados da Planilha em ${competenciaDestino}`}</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
