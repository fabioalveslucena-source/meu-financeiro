import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda } from '../../lib/formatters';
import { CreditCard, Calendar, Settings } from 'lucide-react';
import { ConfiguracoesBaseModal } from '../configuracoes/ConfiguracoesBaseModal';

export const CartoesView: React.FC = () => {
  const { obterResumoCartoes, competenciaAtiva } = useFinanceStore();
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const resumoCartoes = obterResumoCartoes();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
            Cartões de Crédito & Faturas
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Acompanhamento de faturas, limites e compras parceladas ({competenciaAtiva})
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalConfigAberto(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '12px',
            backgroundColor: '#132F4C',
            border: '1px solid #1E3A5F',
            color: '#F8D117',
            fontSize: '12.5px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Settings size={15} />
          <span>Gerenciar Cartões & Limites</span>
        </button>
      </div>

      {/* Grid de Cartões */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {resumoCartoes.map((item) => {
          const { cartao, valorFatura, limiteDisponivel, percentualUsado, parcelamentos } = item;
          const isBB = cartao.nome.includes('Banco do Brasil') || cartao.cor === '#F8D117';
          const isBradesco = cartao.nome.includes('Bradesco') || cartao.cor === '#CC092F';

          // Definir gradiente de fundo autêntico de cada instituição financeira
          let cardGradient = 'linear-gradient(135deg, #1A237E 0%, #0F2744 100%)';
          let textColor = '#FFFFFF';
          let subtitleColor = 'rgba(255, 255, 255, 0.85)';
          let badgeBorder = '1px solid rgba(255, 255, 255, 0.2)';

          if (isBB) {
            // Estilo Ourocard Banco do Brasil (Amarelo vibrante com texto de contraste azul marinho)
            cardGradient = 'linear-gradient(135deg, #F8D117 0%, #E2B802 45%, #0B2238 100%)';
            textColor = '#0B1929';
            subtitleColor = '#173F5F';
            badgeBorder = '1px solid rgba(11, 25, 41, 0.3)';
          } else if (isBradesco) {
            // Estilo Bradesco Cartões (Vermelho institucional)
            cardGradient = 'linear-gradient(135deg, #CC092F 0%, #8A051C 60%, #0F2744 100%)';
            textColor = '#FFFFFF';
            subtitleColor = 'rgba(255, 255, 255, 0.85)';
            badgeBorder = '1px solid rgba(255, 255, 255, 0.2)';
          } else if (cartao.cor) {
            cardGradient = `linear-gradient(135deg, ${cartao.cor} 0%, #0F2744 100%)`;
          }

          return (
            <div key={cartao.id} className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              position: 'relative',
              overflow: 'hidden',
              borderColor: isBB ? '#F8D117' : isBradesco ? '#CC092F' : 'var(--border-subtle)'
            }}>
              {/* Estilo do Topo do Cartão com Gradiente */}
              <div style={{
                background: cardGradient,
                padding: '1.25rem',
                borderRadius: 'var(--radius-lg)',
                color: textColor,
                boxShadow: 'var(--shadow-md)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: badgeBorder,
                        backgroundColor: isBB ? 'rgba(11, 25, 41, 0.1)' : 'rgba(255, 255, 255, 0.15)',
                        color: textColor
                      }}>
                        {cartao.bandeira}
                      </span>
                      {isBB && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0B1929' }}>
                          🟡 OUROCARD
                        </span>
                      )}
                      {isBradesco && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FFFFFF' }}>
                          🔴 BRADESCO
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '6px 0 0 0', color: textColor }}>
                      {cartao.nome}
                    </h3>
                  </div>
                  <CreditCard size={28} color={textColor} opacity={0.9} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: subtitleColor, display: 'block', fontWeight: 700 }}>
                      Fatura em Aberto
                    </span>
                    <span style={{ fontSize: '1.45rem', fontWeight: 900, color: textColor }}>
                      {formatarMoeda(valorFatura)}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.68rem', color: subtitleColor, display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                      <Calendar size={11} /> Fech. / Venc.
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: textColor }}>
                      Dia {cartao.diaFechamento} / Dia {cartao.diaVencimento}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barra de Limite */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Limite Utilizado:</span>
                  <span style={{ fontWeight: 700, color: percentualUsado > 80 ? 'var(--color-despesa)' : isBB ? '#F8D117' : 'var(--text-primary)' }}>
                    {percentualUsado}%
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${percentualUsado}%`,
                    height: '100%',
                    backgroundColor: percentualUsado > 80 ? 'var(--color-despesa)' : isBB ? '#F8D117' : isBradesco ? '#CC092F' : 'var(--brand-secondary)',
                    transition: 'width var(--transition-normal)'
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
                  <span>Disponível: <strong style={{ color: 'var(--color-receita)' }}>{formatarMoeda(limiteDisponivel)}</strong></span>
                  <span>Total: <strong>{formatarMoeda(cartao.limite)}</strong></span>
                </div>
              </div>

              {/* Compras Parceladas Ativas */}
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                  Parcelamentos Ativos ({parcelamentos.length}) • Fatura {competenciaAtiva}
                </span>
                {parcelamentos.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                    Nenhuma parcela pendente na fatura de {competenciaAtiva}.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {parcelamentos.map((p, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.8rem',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-md)'
                      }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {p.descricao}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(138, 5, 190, 0.2)',
                            border: '1px solid rgba(192, 132, 252, 0.3)',
                            color: '#C084FC'
                          }}>
                            {p.parcelaAtual}/{p.totalParcelas}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {formatarMoeda(p.valorParcela)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Gerenciamento de Cartões e Limites */}
      <ConfiguracoesBaseModal
        aberto={modalConfigAberto}
        onFechar={() => setModalConfigAberto(false)}
        abaInicial="cartoes"
      />
    </div>
  );
};
