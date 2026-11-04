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
  ChevronDown,
  ChevronUp,
  ShoppingCart
} from 'lucide-react';
import type { Lancamento, TipoLancamento } from '../../types';
import { CartaoVisual } from '../cartoes/CartaoVisual';
import { ReciboMercadoModal } from '../mercado/ReciboMercadoModal';
import { DetalhesLancamentoModal } from '../extrato/DetalhesLancamentoModal';

interface InicioViewProps {
  onIrParaLancar?: (tipo?: TipoLancamento) => void;
  onAbrirVoz: () => void;
  onIrParaGerenciar: () => void;
  onIrParaCartoes: () => void;
  onCadastrarCartao?: () => void;
}

export const InicioView: React.FC<InicioViewProps> = ({
  onIrParaLancar,
  onAbrirVoz,
  onIrParaGerenciar,
  onIrParaCartoes,
  onCadastrarCartao
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

  const [mostrarUltimasMovimentacoes, setMostrarUltimasMovimentacoes] = useState(false);
  const [lancamentoMercado, setLancamentoMercado] = useState<Lancamento | null>(null);
  const [lancamentoDetalhes, setLancamentoDetalhes] = useState<Lancamento | null>(null);

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

      {/* Alerta Persistente se não houver nenhum cartão cadastrado */}
      {cartoesResumo.length === 0 && (
        <div style={{
          backgroundColor: 'rgba(248, 209, 23, 0.12)',
          border: '1.5px solid #F8D117',
          borderRadius: '18px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(248, 209, 23, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CreditCard size={20} color="#F8D117" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>
                Cadastre sua Conta e Cartão de Crédito
              </h4>
              <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#CBD5E1', lineHeight: 1.35 }}>
                Para que o sistema agrupe suas faturas por fechamento e calcule seus limites com precisão, configure seu primeiro cartão.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCadastrarCartao || onIrParaCartoes}
            style={{
              backgroundColor: '#F8D117',
              color: '#0B1929',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              alignSelf: 'flex-start'
            }}
          >
            <span>Cadastrar Agora</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* =====================================================
           📊 VISÃO GERAL DO MÊS (MODERNA E RESPONSIVA)
         ===================================================== */}
      <div style={{
        backgroundColor: '#0F2744',
        border: '1px solid #1E3A5F',
        borderRadius: '20px',
        padding: '18px 16px',
        boxShadow: '0 6px 20px rgba(11, 25, 41, 0.4)'
      }}>
        {/* Cabeçalho Compacto da Visão Geral: Mês e Indicador de Tendência Bancária em Linha Única */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid #1E3A5F',
          paddingBottom: '12px',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>📊</span>
            <h3 style={{ fontSize: '15px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
              Visão Geral do Mês
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#5090D3',
              backgroundColor: 'rgba(80, 144, 211, 0.12)',
              border: '1px solid rgba(80, 144, 211, 0.35)',
              padding: '2px 10px',
              borderRadius: '10px'
            }}>
              {competenciaAtiva}
            </span>

            {/* Setas Indicativas Modernas de Tendência Oficial dos Bancos */}
            <span style={{
              fontSize: '11.5px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '20px',
              backgroundColor: resumo.saldoFinal >= 0 ? 'rgba(76, 175, 80, 0.16)' : 'rgba(244, 67, 54, 0.16)',
              border: `1.5px solid ${resumo.saldoFinal >= 0 ? '#4CAF50' : '#F44336'}`,
              color: resumo.saldoFinal >= 0 ? '#4CAF50' : '#F44336',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {resumo.saldoFinal >= 0 ? (
                <>
                  <TrendingUp size={14} color="#4CAF50" />
                  <span>Positivo</span>
                </>
              ) : (
                <>
                  <ArrowDownRight size={14} color="#F44336" />
                  <span>Negativo</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Grade com os 4 Cards Principais Interativos (Com Hover e Redirecionamento) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {/* Receitas */}
          <div 
            onClick={() => onIrParaLancar?.('Receita')}
            style={{
              padding: '14px 12px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.18) 0%, rgba(20, 80, 35, 0.28) 100%)',
              border: '1.5px solid #4CAF50',
              boxShadow: '0 4px 14px rgba(76, 175, 80, 0.2)',
              minWidth: 0,
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(76, 175, 80, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(76, 175, 80, 0.2)';
            }}
            title="Clique para lançar uma nova Receita"
          >
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
            <span style={{ fontSize: '10px', color: '#475569', display: 'block', marginTop: '2px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Entradas registradas
            </span>
          </div>

          {/* Despesas */}
          <div 
            onClick={() => onIrParaLancar?.('Despesa')}
            style={{
              padding: '14px 12px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.18) 0%, rgba(100, 20, 20, 0.28) 100%)',
              border: '1.5px solid #F44336',
              boxShadow: '0 4px 14px rgba(244, 67, 54, 0.2)',
              minWidth: 0,
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(244, 67, 54, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(244, 67, 54, 0.2)';
            }}
            title="Clique para lançar uma nova Despesa"
          >
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
            <span style={{ fontSize: '10px', color: '#475569', display: 'block', marginTop: '2px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Gastos e saídas
            </span>
          </div>

          {/* Investimentos */}
          <div 
            onClick={() => onIrParaLancar?.('Investimento')}
            style={{
              padding: '14px 12px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.18) 0%, rgba(15, 50, 100, 0.28) 100%)',
              border: '1.5px solid #2196F3',
              boxShadow: '0 4px 14px rgba(33, 150, 243, 0.2)',
              minWidth: 0,
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(33, 150, 243, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(33, 150, 243, 0.2)';
            }}
            title="Clique para lançar um Investimento"
          >
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
            <span style={{ fontSize: '10px', color: '#475569', display: 'block', marginTop: '2px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Aportes e reservas
            </span>
          </div>

          {/* Saldo Final */}
          <div 
            onClick={onIrParaGerenciar}
            style={{
              padding: '14px 12px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(248, 209, 23, 0.18) 0%, rgba(70, 60, 5, 0.3) 100%)',
              border: '1.5px solid #F8D117',
              boxShadow: '0 4px 14px rgba(248, 209, 23, 0.25)',
              minWidth: 0,
              cursor: 'pointer',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(248, 209, 23, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(248, 209, 23, 0.25)';
            }}
            title="Clique para ver o Extrato e Histórico Financeiro"
          >
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
            <span style={{ fontSize: '10px', color: '#475569', display: 'block', marginTop: '2px', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

        return (
          <div style={{
            backgroundColor: '#0F2744',
            border: '1px solid #1E3A5F',
            borderRadius: '20px',
            padding: '18px 16px',
            boxShadow: '0 6px 20px rgba(11, 25, 41, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}>
            {/* Cartão Visual Fiel com Logos Oficiais, Datas, Limites e Parcelamentos Integrados */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <CartaoVisual 
                cartao={c}
                titularNome={usuario.nome}
                valorFatura={cartaoPrincipalResumo.valorFatura}
                limiteDisponivel={cartaoPrincipalResumo.limiteDisponivel}
                percentualUsado={cartaoPrincipalResumo.percentualUsado}
                parcelamentos={cartaoPrincipalResumo.parcelamentos}
                mostrarFatura={true}
                mostrarDetalhesCorpo={true}
                onClick={onIrParaCartoes}
              />
            </div>

            {/* Ação Limpa e Sem Redundância "Ver Fatura Completa" */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onIrParaCartoes}
                style={{
                  background: 'rgba(80, 144, 211, 0.12)',
                  border: '1px solid rgba(80, 144, 211, 0.35)',
                  borderRadius: '12px',
                  padding: '7px 16px',
                  color: '#5090D3',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>Ver Fatura Completa</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* =====================================================
           💳 CONVITE PARA CADASTRAR CARTÃO (SE NÃO HOUVER CARTÃO)
         ===================================================== */}
      {!cartaoPrincipalResumo && (
        <div 
          onClick={onIrParaCartoes}
          style={{
            backgroundColor: '#0F2744',
            border: '1.5px dashed rgba(80, 144, 211, 0.4)',
            borderRadius: '20px',
            padding: '24px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}
        >
          <CreditCard size={32} color="#5090D3" />
          <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>Nenhum cartão cadastrado</strong>
          <p style={{ fontSize: '12px', color: '#AAB4BE', margin: 0, maxWidth: '280px' }}>
            Toque aqui para cadastrar seus cartões de crédito e limites pessoais.
          </p>
        </div>
      )}

      {/* =====================================================
           📝 ÚLTIMOS LANÇAMENTOS DO MÊS (ACESSO RÁPIDO)
         ===================================================== */}
      {/* Janela Recolhível de Últimas Movimentações (abre apenas no toque) */}
      <div style={{
        backgroundColor: '#0F2744',
        border: '1px solid #1E3A5F',
        borderRadius: '20px',
        padding: '16px 20px',
        boxShadow: '0 6px 20px rgba(11, 25, 41, 0.4)'
      }}>
        {/* Cabeçalho Clicável: Apenas a barra com o título quando recolhido */}
        <div 
          onClick={() => setMostrarUltimasMovimentacoes(!mostrarUltimasMovimentacoes)}
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <h3 style={{ 
              fontSize: '15px', 
              fontWeight: 800, 
              margin: 0, 
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Últimas Movimentações
            </h3>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: 'rgba(80, 144, 211, 0.15)',
            border: '1px solid rgba(80, 144, 211, 0.3)',
            padding: '4px 10px',
            borderRadius: '12px',
            color: '#5090D3',
            fontSize: '11.5px',
            fontWeight: 700,
            flexShrink: 0
          }}>
            <span>{mostrarUltimasMovimentacoes ? 'Fechar' : `Ver (${ultimosLancamentos.length})`}</span>
            {mostrarUltimasMovimentacoes ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </div>
        </div>

        {/* Conteúdo exibido APENAS quando o usuário clicar na janela */}
        {mostrarUltimasMovimentacoes && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(30, 58, 95, 0.5)' }}>
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
                    <div 
                      key={item.id} 
                      onClick={() => setLancamentoDetalhes(item)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        backgroundColor: '#132F4C',
                        border: '1px solid #1E3A5F',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      title="Toque para ver os detalhes completos deste lançamento"
                    >
                      {/* Coluna Esquerda: Exatamente 2 linhas */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        {/* Linha 1: Data + Descrição + Parcelamento (apenas se parcelado) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#82B1FF',
                            backgroundColor: 'rgba(40, 126, 165, 0.2)',
                            padding: '1.5px 6px',
                            borderRadius: '5px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                            {formatarData(item.data).slice(0, 5)}
                          </span>

                          <strong style={{
                            fontSize: '13.5px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={item.descricao}>
                            {item.descricao}
                          </strong>

                          {/* Mostra APENAS se for parcelado */}
                          {item.totalParcelas && item.totalParcelas > 1 ? (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '1.5px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(138, 5, 190, 0.25)',
                              color: '#C084FC',
                              border: '1px solid rgba(192, 132, 252, 0.4)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              📦 {item.totalParcelas}x de {formatarMoeda(item.valor / item.totalParcelas)}
                            </span>
                          ) : null}
                        </div>

                        {/* Linha 2: Natureza • Categoria • Forma de Pagamento */}
                        <div style={{
                          fontSize: '11px',
                          color: '#AAB4BE',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{ color: '#8899A6' }}>{item.natureza}</span>
                          <span>•</span>
                          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{item.categoria}</span>
                          <span>•</span>
                          <span style={{ color: '#5090D3' }}>{item.pagamento}</span>

                          {item.detalhesMercado && (
                            <button
                              type="button"
                              onClick={() => setLancamentoMercado(item)}
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(76, 175, 80, 0.22)',
                                color: '#66BB6A',
                                border: '1px solid rgba(76, 175, 80, 0.45)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                marginLeft: '2px',
                                flexShrink: 0
                              }}
                              title="Ver cupom detalhado do Meu Mercado"
                            >
                              <ShoppingCart size={10} />
                              <span>Cupom</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Coluna Direita: Valor Monetário Responsivo Alinhado à Direita */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <strong style={{
                          fontSize: '14.5px',
                          fontWeight: 900,
                          color: corValor,
                          whiteSpace: 'nowrap'
                        }}>
                          {isDespesa ? '- ' : '+ '}
                          {formatarMoeda(item.valor)}
                        </strong>
                      </div>
                    </div>
                  );
                })}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
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
                      gap: '4px',
                      padding: '4px 0'
                    }}
                  >
                    <span>Gerenciar todos os lançamentos</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Detalhes Explodidos do Lançamento */}
      <DetalhesLancamentoModal
        lancamento={lancamentoDetalhes}
        aoFechar={() => setLancamentoDetalhes(null)}
        aoAbrirCupomMercado={(l) => {
          setLancamentoDetalhes(null);
          setLancamentoMercado(l);
        }}
      />

      {/* Modal de Detalhes da Compra do Meu Mercado */}
      <ReciboMercadoModal
        aberto={Boolean(lancamentoMercado)}
        onFechar={() => setLancamentoMercado(null)}
        detalhes={lancamentoMercado?.detalhesMercado}
        valorTotalLancamento={lancamentoMercado?.valor}
        formaPagamento={lancamentoMercado?.pagamento}
      />
    </div>
  );
};
