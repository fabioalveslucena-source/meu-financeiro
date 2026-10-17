import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda, formatarData } from '../../lib/formatters';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  PiggyBank, 
  CreditCard, 
  Mic, 
  ArrowRight,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface InicioViewProps {
  onIrParaLancar?: () => void;
  onAbrirVoz: () => void;
  onIrParaGerenciar: () => void;
  onIrParaCartoes: () => void;
}

export const InicioView: React.FC<InicioViewProps> = ({
  onAbrirVoz,
  onIrParaGerenciar,
  onIrParaCartoes
}) => {
  const { 
    competenciaAtiva, 
    obterResumoLivroCaixa, 
    obterResumoCartoes, 
    lancamentos,
    usuario 
  } = useFinanceStore();

  const resumo = obterResumoLivroCaixa(competenciaAtiva);
  const cartoesResumo = obterResumoCartoes();
  const cartaoPrincipalResumo = cartoesResumo.find(c => 
    c.cartao.nome.toLowerCase().includes((usuario.bancoPrincipal || '').toLowerCase())
  ) || cartoesResumo[0];

  // Últimos 4 lançamentos do mês
  const ultimosLancamentos = lancamentos
    .filter(l => l.competencia === competenciaAtiva && l.status === 'Lançado')
    .slice(0, 4);

  // Controle de sanfona para parcelamentos em aberto
  const [mostrarParcelamentos, setMostrarParcelamentos] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cápsula Executiva de Comando de Voz Inteligente */}
      <div 
        onClick={onAbrirVoz}
        style={{
          cursor: 'pointer',
          padding: '12px 14px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, rgba(23, 63, 95, 0.75) 0%, rgba(40, 126, 165, 0.5) 100%)',
          border: '1px solid rgba(80, 144, 211, 0.35)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3), 0 0 15px rgba(40, 126, 165, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          {/* Microfone com pulso */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #287EA5 0%, #5090D3 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 0 14px rgba(80, 144, 211, 0.55)',
            flexShrink: 0
          }}>
            <Mic size={20} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ 
                fontSize: '13px', 
                color: '#FFFFFF', 
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Lançamento por Voz
              </strong>
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(248, 209, 23, 0.22)',
                color: '#F8D117',
                border: '1px solid rgba(248, 209, 23, 0.45)',
                flexShrink: 0
              }}>
                IA PT-BR
              </span>
            </div>
            <p style={{
              margin: '2px 0 0 0',
              fontSize: '10.5px',
              color: '#B0BEC5',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Toque e diga: <span style={{ color: '#E7EBF0', fontStyle: 'italic' }}>"Gastei 150 no mercado no crédito em 2x"</span>
            </p>
          </div>
        </div>

        {/* Botão de Ação à Direita */}
        <div style={{
          padding: '8px 12px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #F8D117 0%, #E5B20D 100%)',
          color: '#0B1929',
          fontWeight: 800,
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flexShrink: 0,
          boxShadow: '0 3px 10px rgba(248, 209, 23, 0.35)'
        }}>
          <span>Falar</span>
          <span style={{ fontSize: '14px' }}>🎙️</span>
        </div>
      </div>

      {/* =====================================================
           📊 VISÃO GERAL DO MÊS (TOMANDO CONTA DA PÁGINA)
         ===================================================== */}
      <div style={{
        backgroundColor: '#0F2744',
        border: '1px solid #1E3A5F',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 6px 20px rgba(11, 25, 41, 0.4)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid #1E3A5F',
          paddingBottom: '10px'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📊</span> Visão Geral do Mês
            </h3>
            <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
              Balanço consolidado da competência {competenciaAtiva}
            </span>
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '20px',
            backgroundColor: resumo.saldoFinal >= 0 ? 'rgba(76, 175, 80, 0.18)' : 'rgba(244, 67, 54, 0.18)',
            border: `1px solid ${resumo.saldoFinal >= 0 ? '#4CAF50' : '#F44336'}`,
            color: resumo.saldoFinal >= 0 ? '#4CAF50' : '#F44336'
          }}>
            {resumo.saldoFinal >= 0 ? '● Saldo Positivo' : '● Atenção ao Saldo'}
          </span>
        </div>

        {/* Grade com os 4 Cards Principais Responsiva */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {/* Receitas */}
          <div style={{
            padding: '14px 12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.18) 0%, rgba(20, 80, 35, 0.28) 100%)',
            border: '1.5px solid #4CAF50',
            boxShadow: '0 4px 14px rgba(76, 175, 80, 0.2)',
            minWidth: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#4CAF50' }}>🟢 Receitas</span>
              <ArrowUpRight size={15} color="#4CAF50" />
            </div>
            <div style={{ 
              marginTop: '5px', 
              fontSize: 'clamp(14px, 4.2vw, 19px)', 
              fontWeight: 900, 
              color: '#4CAF50',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatarMoeda(resumo.totalReceitas)}
            </div>
            <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Entradas registradas
            </span>
          </div>

          {/* Despesas */}
          <div style={{
            padding: '14px 12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.18) 0%, rgba(100, 20, 20, 0.28) 100%)',
            border: '1.5px solid #F44336',
            boxShadow: '0 4px 14px rgba(244, 67, 54, 0.2)',
            minWidth: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#F44336' }}>🔴 Despesas</span>
              <ArrowDownRight size={15} color="#F44336" />
            </div>
            <div style={{ 
              marginTop: '5px', 
              fontSize: 'clamp(14px, 4.2vw, 19px)', 
              fontWeight: 900, 
              color: '#F44336',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatarMoeda(resumo.totalDespesas)}
            </div>
            <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Gastos e saídas
            </span>
          </div>

          {/* Investimentos */}
          <div style={{
            padding: '14px 12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.18) 0%, rgba(15, 50, 100, 0.28) 100%)',
            border: '1.5px solid #2196F3',
            boxShadow: '0 4px 14px rgba(33, 150, 243, 0.2)',
            minWidth: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#5090D3' }}>🔵 Investimentos</span>
              <PiggyBank size={15} color="#5090D3" />
            </div>
            <div style={{ 
              marginTop: '5px', 
              fontSize: 'clamp(14px, 4.2vw, 19px)', 
              fontWeight: 900, 
              color: '#5090D3',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatarMoeda(resumo.totalInvestimentos)}
            </div>
            <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Aportes e reservas
            </span>
          </div>

          {/* Saldo Final */}
          <div style={{
            padding: '14px 12px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(248, 209, 23, 0.18) 0%, rgba(70, 60, 5, 0.3) 100%)',
            border: '1.5px solid #F8D117',
            boxShadow: '0 4px 14px rgba(248, 209, 23, 0.25)',
            minWidth: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#F8D117' }}>💰 Saldo Final</span>
              <TrendingUp size={15} color="#F8D117" />
            </div>
            <div style={{
              marginTop: '5px',
              fontSize: 'clamp(14px, 4.2vw, 19px)',
              fontWeight: 900,
              color: '#F8D117',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {formatarMoeda(resumo.saldoFinal)}
            </div>
            <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Saldo em conta
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
           💳 CARTÃO PRINCIPAL DA INSTITUIÇÃO ATIVA
          ===================================================== */}
      {cartaoPrincipalResumo && (() => {
        const c = cartaoPrincipalResumo.cartao;
        const isBB = c.nome.toLowerCase().includes('brasil') || c.cor === '#F8D117';
        const isBradesco = c.nome.toLowerCase().includes('bradesco') || c.cor === '#CC092F';
        const isNubank = c.nome.toLowerCase().includes('nubank') || c.cor === '#8A05BE';

        let cardBg = 'linear-gradient(135deg, #1A237E 0%, #0F2744 100%)';
        let cardTextColor = '#FFFFFF';
        let cardSubtitleColor = 'rgba(255, 255, 255, 0.85)';
        let cardBorder = `1.5px solid ${c.cor || '#F8D117'}`;

        if (isBB) {
          cardBg = 'linear-gradient(135deg, #F8D117 0%, #E5B800 45%, #0B2545 100%)';
          cardTextColor = '#0B1929';
          cardSubtitleColor = '#173F5F';
          cardBorder = '1.5px solid #F8D117';
        } else if (isBradesco) {
          cardBg = 'linear-gradient(135deg, #CC092F 0%, #8A051C 60%, #0F2744 100%)';
          cardTextColor = '#FFFFFF';
          cardSubtitleColor = 'rgba(255, 255, 255, 0.85)';
          cardBorder = '1.5px solid #CC092F';
        } else if (isNubank) {
          cardBg = 'linear-gradient(135deg, #8A05BE 0%, #52057B 60%, #0F2744 100%)';
          cardTextColor = '#FFFFFF';
          cardSubtitleColor = 'rgba(255, 255, 255, 0.85)';
          cardBorder = '1.5px solid #8A05BE';
        } else if (c.cor) {
          cardBg = `linear-gradient(135deg, ${c.cor} 0%, #0F2744 100%)`;
          cardBorder = `1.5px solid ${c.cor}`;
        }

        return (
          <div style={{
            backgroundColor: '#0F2744',
            border: cardBorder,
            borderRadius: '20px',
            padding: '20px',
            boxShadow: '0 6px 20px rgba(11, 25, 41, 0.4)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>💳</span>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
                    Cartão Principal • {c.nome}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                    {c.bandeira} • Fechamento Dia {c.diaFechamento} • Vencimento Dia {c.diaVencimento}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onIrParaCartoes}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#5090D3',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Ver todos</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Cartão Estilizado em Destaque */}
            <div style={{
              background: cardBg,
              padding: '18px 20px',
              borderRadius: '16px',
              color: cardTextColor,
              boxShadow: '0 8px 22px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
                <div>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 900,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    backgroundColor: isBB ? 'rgba(11, 25, 41, 0.12)' : 'rgba(255, 255, 255, 0.18)',
                    color: cardTextColor
                  }}>
                    {c.bandeira}
                  </span>
                  <h4 style={{ fontSize: '18px', fontWeight: 900, margin: '6px 0 0 0', color: cardTextColor }}>
                    {c.nome}
                  </h4>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: cardSubtitleColor }}>
                    Titular: {usuario.nome}
                  </span>
                </div>
                <CreditCard size={32} color={cardTextColor} opacity={0.85} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: cardSubtitleColor, display: 'block' }}>
                    Fatura Atual em Aberto
                  </span>
                  <span style={{ fontSize: '26px', fontWeight: 900, color: cardTextColor }}>
                    {formatarMoeda(cartaoPrincipalResumo.valorFatura)}
                  </span>
                </div>

                <div style={{ textAlign: 'right', color: cardTextColor }}>
                  <span style={{ fontSize: '11px', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                    <Calendar size={12} /> Fech. / Venc.
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800 }}>
                    Dia {c.diaFechamento} / Dia {c.diaVencimento}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de Limite do Cartão */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                <span style={{ color: '#AAB4BE' }}>Limite Utilizado:</span>
                <strong style={{ color: cartaoPrincipalResumo.percentualUsado > 80 ? '#F44336' : (isBB ? '#F8D117' : '#5090D3') }}>
                  {cartaoPrincipalResumo.percentualUsado}%
                </strong>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#132F4C',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${cartaoPrincipalResumo.percentualUsado}%`,
                  height: '100%',
                  backgroundColor: cartaoPrincipalResumo.percentualUsado > 80 ? '#F44336' : (isBB ? '#F8D117' : '#5090D3'),
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '11.5px', marginTop: '6px', color: '#AAB4BE' }}>
                <span>Disponível: <strong style={{ color: '#4CAF50' }}>{formatarMoeda(cartaoPrincipalResumo.limiteDisponivel)}</strong></span>
                <span>Limite Total: <strong style={{ color: '#FFFFFF' }}>{formatarMoeda(c.limite)}</strong></span>
              </div>
            </div>

            {/* Parcelamentos do Cartão (Acordeão Retrátil) */}
            {cartaoPrincipalResumo.parcelamentos.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #1E3A5F' }}>
                <button
                  type="button"
                  onClick={() => setMostrarParcelamentos(!mostrarParcelamentos)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    backgroundColor: mostrarParcelamentos ? 'rgba(80, 144, 211, 0.12)' : '#132F4C',
                    border: mostrarParcelamentos ? '1px solid #5090D3' : '1px solid #1E3A5F',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px' }}>📦</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#E7EBF0', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      Parcelamentos em Aberto
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '12px',
                      backgroundColor: 'rgba(192, 132, 252, 0.2)',
                      border: '1px solid rgba(192, 132, 252, 0.4)',
                      color: '#C084FC'
                    }}>
                      {cartaoPrincipalResumo.parcelamentos.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#5090D3', fontSize: '11px', fontWeight: 700 }}>
                    <span>{mostrarParcelamentos ? 'Recolher' : 'Ver parcelas'}</span>
                    {mostrarParcelamentos ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {mostrarParcelamentos && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }} className="animate-fade-in">
                    {cartaoPrincipalResumo.parcelamentos.map((p, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#132F4C',
                        fontSize: '12px',
                        border: '1px solid rgba(80, 144, 211, 0.15)'
                      }}>
                        <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{p.descricao}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(138, 5, 190, 0.25)',
                            border: '1px solid rgba(192, 132, 252, 0.4)',
                            color: '#C084FC'
                          }}>
                            {p.parcelaAtual}/{p.totalParcelas}
                          </span>
                          <strong style={{ color: '#E7EBF0' }}>{formatarMoeda(p.valorParcela)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* =====================================================
           📝 ÚLTIMOS LANÇAMENTOS DO MÊS (ACESSO RÁPIDO)
         ===================================================== */}
      <div style={{
        backgroundColor: '#0F2744',
        border: '1px solid #1E3A5F',
        borderRadius: '20px',
        padding: '18px 20px',
        boxShadow: '0 6px 20px rgba(11, 25, 41, 0.4)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
              Últimas Movimentações
            </h3>
            <span style={{ fontSize: '11px', color: '#AAB4BE' }}>Lançamentos recentes deste mês</span>
          </div>

          <button
            type="button"
            onClick={onIrParaGerenciar}
            style={{
              background: 'none',
              border: 'none',
              color: '#5090D3',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Gerenciar todos</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {ultimosLancamentos.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#607789', margin: '10px 0', textAlign: 'center' }}>
            Nenhum lançamento registrado neste mês ainda.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ultimosLancamentos.map((item) => {
              const isDespesa = item.tipo === 'Despesa';
              const isReceita = item.tipo === 'Receita';
              const corValor = isReceita ? '#4CAF50' : item.tipo === 'Investimento' ? '#5090D3' : '#F44336';

              return (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#132F4C',
                  border: '1px solid #1E3A5F'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>
                      {isReceita ? '🟢' : isDespesa ? '🔴' : '🔵'}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>{item.descricao}</strong>
                        {item.parcela && item.totalParcelas && item.totalParcelas > 1 ? (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(138, 5, 190, 0.25)',
                            color: '#C084FC'
                          }}>
                            {item.parcela}/{item.totalParcelas}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(40, 126, 165, 0.2)',
                            color: '#5090D3'
                          }}>
                            À vista
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                        {formatarData(item.data)} • {item.categoria} • {item.pagamento}
                      </span>
                    </div>
                  </div>

                  <strong style={{ fontSize: '14px', color: corValor }}>
                    {isDespesa ? '- ' : '+ '}
                    {formatarMoeda(item.valor)}
                  </strong>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
