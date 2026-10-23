import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { 
  X, 
  ShoppingCart, 
  RefreshCw, 
  Trash2, 
  Cloud,
  CheckCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

interface SincronizarMercadoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

const URL_MEU_MERCADO_APP = 'https://meu-mercado-1db5c.web.app';

export const SincronizarMercadoModal: React.FC<SincronizarMercadoModalProps> = ({
  aberto,
  onFechar,
}) => {
  const { 
    lancamentos, 
    excluirLancamento, 
    sincronizarComNuvem,
    mostrarToast
  } = useFinanceStore();

  const [carregandoNuvem, setCarregandoNuvem] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [statusSincronizacao, setStatusSincronizacao] = useState<'idle' | 'sincronizado_sem_novidades' | 'novos_adicionados'>('idle');
  const [novosLancamentosCount, setNovosLancamentosCount] = useState<number>(0);
  const [bloqueioCliqueRapido, setBloqueioCliqueRapido] = useState(false);

  if (!aberto) return null;

  // Compras reais do Meu Mercado salvas no Meu Financeiro
  const comprasMercado = lancamentos.filter(l => l.origem === 'meu-mercado' || l.detalhesMercado);
  const totalMercadoGeral = comprasMercado.reduce((acc, curr) => acc + curr.valor, 0);

  // Sincronizar com a Nuvem Firestore com verificação inteligente de duplicidade
  const handleSincronizarNuvemAgora = async () => {
    if (carregandoNuvem || bloqueioCliqueRapido) return;

    if (statusSincronizacao === 'sincronizado_sem_novidades') {
      const qtdAtual = comprasMercado.length;
      setMensagemStatus(
        'ℹ️ Os lançamentos do Meu Mercado já estão em dia!\n\n' +
        `Você já possui ${qtdAtual} compra(s) registrada(s) no valor total de R$ ${totalMercadoGeral.toFixed(2)}.\n\n` +
        '🛡️ O sistema protege seus dados e nunca duplica lançamentos.'
      );
      mostrarToast('Lançamentos já realizados! Nenhuma nova compra pendente.', 'info');
      return;
    }

    setCarregandoNuvem(true);
    setMensagemStatus('🔄 Verificando compras do Meu Mercado na nuvem...');

    const comprasAntes = lancamentos.filter(l => l.origem === 'meu-mercado' || l.detalhesMercado);
    const idsAntes = new Set(comprasAntes.map(l => l.id));

    try {
      await sincronizarComNuvem();

      const lancamentosAtualizados = useFinanceStore.getState().lancamentos;
      const comprasDepois = lancamentosAtualizados.filter(l => l.origem === 'meu-mercado' || l.detalhesMercado);
      const novosDoMercado = comprasDepois.filter(c => !idsAntes.has(c.id));

      if (novosDoMercado.length > 0) {
        setStatusSincronizacao('novos_adicionados');
        setNovosLancamentosCount(novosDoMercado.length);

        const resumo = novosDoMercado.map(n => `• ${n.descricao}: R$ ${n.valor.toFixed(2)} (${n.competencia})`).join('\n');
        setMensagemStatus(
          `🎉 ${novosDoMercado.length} novo(s) lançamento(s) do Meu Mercado inserido(s) com sucesso!\n\n${resumo}\n\n👉 Extrato, faturas e saldos atualizados sem duplicidades!`
        );
        mostrarToast(`✓ ${novosDoMercado.length} novo(s) lançamento(s) inserido(s)!`, 'sucesso');

        setBloqueioCliqueRapido(true);
        setTimeout(() => {
          setBloqueioCliqueRapido(false);
          setStatusSincronizacao('sincronizado_sem_novidades');
        }, 4000);
      } else {
        setStatusSincronizacao('sincronizado_sem_novidades');
        setNovosLancamentosCount(0);

        if (comprasDepois.length > 0) {
          setMensagemStatus(
            'ℹ️ Esses lançamentos do Meu Mercado já foram feitos anteriormente!\n\n' +
            `Todas as suas ${comprasDepois.length} compras (Total: R$ ${comprasDepois.reduce((a, b) => a + b.valor, 0).toFixed(2)}) já constam no seu extrato e cartões.\n\n` +
            '🛡️ O sistema não duplica lançamentos.'
          );
          mostrarToast('Lançamentos em dia! Nenhuma compra pendente.', 'info');
        } else {
          setMensagemStatus(
            'ℹ️ Nenhuma compra pendente encontrada no Meu Mercado.\n\n' +
            'Quando você finalizar uma lista de compras no app Meu Mercado, ela sincronizará automaticamente aqui.'
          );
          mostrarToast('Nenhuma compra pendente no Meu Mercado.', 'info');
        }

        setBloqueioCliqueRapido(true);
        setTimeout(() => {
          setBloqueioCliqueRapido(false);
        }, 2000);
      }
    } catch (err: any) {
      setMensagemStatus(`⚠️ Erro ao sincronizar nuvem: ${err?.message || 'Falha de comunicação'}`);
      mostrarToast('Erro ao conectar com a nuvem.', 'erro');
    } finally {
      setCarregandoNuvem(false);
    }
  };

  // Excluir todas as compras do Meu Mercado
  const handleLimparTodasCompras = () => {
    if (comprasMercado.length === 0) return;
    if (confirm(`Deseja realmente remover todas as ${comprasMercado.length} compras do Meu Mercado do extrato e da nuvem?`)) {
      comprasMercado.forEach(c => {
        excluirLancamento(c.id, true);
      });
      setStatusSincronizacao('idle');
      setMensagemStatus('🧹 Todas as compras do Meu Mercado foram removidas com sucesso.');
      mostrarToast('Todas as compras do Meu Mercado foram removidas.', 'info');
    }
  };

  // Excluir uma única compra
  const handleExcluirUmaCompra = (id: string, descricao: string) => {
    if (confirm(`Deseja remover "${descricao}"?`)) {
      excluirLancamento(id, true);
      setStatusSincronizacao('idle');
      mostrarToast(`Compra "${descricao}" removida.`, 'info');
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
                Integração Meu Mercado
              </h3>
              <span style={{ fontSize: '11px', color: '#E7EBF0', opacity: 0.85 }}>
                Conexão Nuvem Direta • Firebase Firestore
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
          
          {/* Card de Status da Nuvem e Botão Principal */}
          <div style={{
            backgroundColor: '#0A1A2E',
            borderRadius: '12px',
            border: '1.5px solid #287EA5',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={18} color="#60A5FA" />
                <div>
                  <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                    Sincronização em Tempo Real
                  </strong>
                  <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                    Finalizou no Meu Mercado, entra imediatamente aqui
                  </span>
                </div>
              </div>
              <a
                href={URL_MEU_MERCADO_APP}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color: '#38bdf8',
                  textDecoration: 'none',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontWeight: 700
                }}
              >
                <span>Abrir App</span>
                <ExternalLink size={11} />
              </a>
            </div>

            <button
              type="button"
              onClick={handleSincronizarNuvemAgora}
              disabled={carregandoNuvem}
              style={{
                width: '100%',
                padding: '13px',
                background: carregandoNuvem
                  ? 'linear-gradient(135deg, #1e3a5f 0%, #205b7d 100%)'
                  : statusSincronizacao === 'novos_adicionados'
                  ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
                  : statusSincronizacao === 'sincronizado_sem_novidades'
                  ? 'linear-gradient(135deg, #0f2c4d 0%, #173f5f 100%)'
                  : 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)',
                border: carregandoNuvem
                  ? '1.5px solid #287EA5'
                  : statusSincronizacao === 'novos_adicionados'
                  ? '1.5px solid #4ade80'
                  : statusSincronizacao === 'sincronizado_sem_novidades'
                  ? '1.5px solid #60a5fa'
                  : '1.5px solid #4ade80',
                color: '#FFFFFF',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 900,
                cursor: carregandoNuvem ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: statusSincronizacao === 'sincronizado_sem_novidades'
                  ? '0 4px 15px rgba(32, 91, 125, 0.4)'
                  : '0 4px 15px rgba(22, 163, 74, 0.35)',
                transition: 'all 0.3s ease'
              }}
            >
              {carregandoNuvem ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verificando novos lançamentos na nuvem...</span>
                </>
              ) : statusSincronizacao === 'novos_adicionados' ? (
                <>
                  <CheckCircle size={16} color="#4ade80" />
                  <span>✓ {novosLancamentosCount} Novo(s) Lançamento(s) Adicionado(s)!</span>
                </>
              ) : statusSincronizacao === 'sincronizado_sem_novidades' ? (
                <>
                  <CheckCircle size={16} color="#60a5fa" />
                  <span>✓ Lançamentos já realizados (Em dia)</span>
                </>
              ) : (
                <>
                  <Cloud size={16} color="#FFFFFF" />
                  <span>☁️ Atualizar e Sincronizar Nuvem Agora</span>
                </>
              )}
            </button>

            {/* Aviso de Proteção Anti-Duplicação */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '11px',
              color: '#94a3b8',
              textAlign: 'center',
              padding: '2px 4px'
            }}>
              <ShieldCheck size={13} color="#4ade80" />
              <span><strong>Proteção inteligente:</strong> o sistema impede duplicações no extrato e faturas.</span>
            </div>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
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
              backgroundColor: mensagemStatus.startsWith('✅') || mensagemStatus.startsWith('🎉') ? 'rgba(76, 175, 80, 0.15)' : mensagemStatus.startsWith('ℹ️') ? 'rgba(33, 150, 243, 0.15)' : 'rgba(255, 152, 0, 0.15)',
              border: `1px solid ${mensagemStatus.startsWith('✅') || mensagemStatus.startsWith('🎉') ? '#4CAF50' : mensagemStatus.startsWith('ℹ️') ? '#2196F3' : '#FF9800'}`,
              fontSize: '11.5px',
              fontWeight: 600,
              color: mensagemStatus.startsWith('✅') || mensagemStatus.startsWith('🎉') ? '#66BB6A' : mensagemStatus.startsWith('ℹ️') ? '#60A5FA' : '#F8D117',
              whiteSpace: 'pre-line',
              lineHeight: 1.45
            }}>
              {mensagemStatus}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};