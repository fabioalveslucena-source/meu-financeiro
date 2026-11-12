import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda } from '../../lib/formatters';
import { obterProximaCompetencia } from '../../lib/cartaoFatura';
import { Settings, CalendarClock } from 'lucide-react';
import { ConfiguracoesBaseModal } from '../configuracoes/ConfiguracoesBaseModal';
import { CartaoVisual } from './CartaoVisual';

export const CartoesView: React.FC = () => {
  const { obterResumoCartoes, competenciaAtiva, usuario } = useFinanceStore();
  const [modalConfigAberto, setModalConfigAberto] = useState(false);
  const [verProximaFatura, setVerProximaFatura] = useState(false);
  const proximaCompetencia = obterProximaCompetencia(competenciaAtiva);
  const compExibida = verProximaFatura ? proximaCompetencia : competenciaAtiva;
  const resumoCartoes = obterResumoCartoes(compExibida);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Cabeçalho Compacto de Cartões & Faturas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        width: '100%',
        paddingBottom: '2px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
            Cartões de Crédito & Faturas
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
            Faturas, limites e compras parceladas • <strong style={{ color: '#F8D117' }}>{compExibida}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setVerProximaFatura((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '12px',
              backgroundColor: verProximaFatura ? 'rgba(248, 209, 23, 0.16)' : '#132F4C',
              border: verProximaFatura ? '1px solid rgba(248, 209, 23, 0.5)' : '1px solid #1E3A5F',
              color: verProximaFatura ? '#F8D117' : '#CBD5E1',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title={verProximaFatura ? 'Voltar para a fatura atual' : 'Visualizar fatura futura do próximo mês'}
          >
            <CalendarClock size={14} color={verProximaFatura ? '#F8D117' : '#5090D3'} />
            <span>{verProximaFatura ? `Fatura Atual (${competenciaAtiva})` : `Próx. Fatura (${proximaCompetencia})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setModalConfigAberto(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 13px',
              borderRadius: '12px',
              backgroundColor: '#132F4C',
              border: '1px solid #1E3A5F',
              color: '#F8D117',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Gerenciar Cartões, Bancos e Limites"
          >
            <Settings size={14} />
            <span>Gerenciar Cartões & Limites</span>
          </button>
        </div>
      </div>

      {/* Grid de Cartões */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {resumoCartoes.map((item) => {
          const { cartao, valorFatura, limiteDisponivel, percentualUsado, parcelamentos } = item;
          const nomeLower = (cartao.nome || '').toLowerCase();
          const isMercadoLivre = nomeLower.includes('mercado') || cartao.cor === '#FFE600';
          const isBB = !isMercadoLivre && (cartao.nome.includes('Banco do Brasil') || cartao.cor === '#F8D117');
          const isBradesco = cartao.nome.includes('Bradesco') || cartao.cor === '#CC092F';

          return (
            <div key={cartao.id} className="card" style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1.25rem',
              position: 'relative',
              overflow: 'hidden',
              padding: '16px',
              backgroundColor: '#0F2744',
              borderRadius: '20px',
              border: isBB 
                ? '1.5px solid #F8D117' 
                : isBradesco 
                ? '1.5px solid #CC092F' 
                : isMercadoLivre 
                ? '1.5px solid #FFE600' 
                : '1px solid #1E3A5F'
            }}>
              {/* Cartão Visual Fiel às Imagens Oficiais dos Bancos */}
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                <CartaoVisual 
                  cartao={cartao}
                  titularNome={usuario.nome}
                  agenciaUsuario={usuario.agencia}
                  contaUsuario={usuario.numeroConta}
                  valorFatura={valorFatura}
                  rotuloFatura={verProximaFatura ? `Fatura Próx. Mês (${compExibida})` : undefined}
                  limiteDisponivel={limiteDisponivel}
                  mostrarFatura={true}
                />
              </div>

              {/* Informações de Fechamento e Vencimento */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '10px',
                backgroundColor: '#132F4C',
                fontSize: '11.5px'
              }}>
                <span style={{ color: '#AAB4BE' }}>
                  Fechamento: <strong style={{ color: '#FFFFFF' }}>Dia {cartao.diaFechamento}</strong>
                </span>
                <span style={{ color: '#AAB4BE' }}>
                  Vencimento: <strong style={{ color: '#F8D117' }}>Dia {cartao.diaVencimento}</strong>
                </span>
              </div>

              {/* Barra de Limite */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Limite Utilizado:</span>
                  <span style={{ fontWeight: 700, color: percentualUsado > 80 ? 'var(--color-despesa)' : isBB ? '#F8D117' : isMercadoLivre ? '#FFE600' : 'var(--text-primary)' }}>
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
                    backgroundColor: percentualUsado > 80 ? 'var(--color-despesa)' : isBB ? '#F8D117' : isBradesco ? '#CC092F' : isMercadoLivre ? '#FFE600' : 'var(--brand-secondary)',
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
                  Parcelamentos Ativos ({parcelamentos.length}) • Fatura {compExibida}
                </span>
                {parcelamentos.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                    Nenhuma parcela pendente na fatura de {compExibida}.
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
