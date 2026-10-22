import React from 'react';
import type { Lancamento } from '../../types';
import { formatarMoeda, formatarData } from '../../lib/formatters';
import { 
  X, 
  Calendar, 
  CreditCard, 
  Tag, 
  Folder, 
  Building2, 
  Mic, 
  Smartphone, 
  ShoppingCart,
  Trash2,
  Edit3
} from 'lucide-react';

interface DetalhesLancamentoModalProps {
  lancamento: Lancamento | null;
  aoFechar: () => void;
  aoEditar?: (lancamento: Lancamento) => void;
  aoExcluir?: (lancamento: Lancamento) => void;
  aoAbrirCupomMercado?: (lancamento: Lancamento) => void;
}

export const DetalhesLancamentoModal: React.FC<DetalhesLancamentoModalProps> = ({
  lancamento,
  aoFechar,
  aoEditar,
  aoExcluir,
  aoAbrirCupomMercado,
}) => {
  if (!lancamento) return null;

  const isDespesa = lancamento.tipo === 'Despesa';
  const isReceita = lancamento.tipo === 'Receita';
  const corTipo = isReceita ? '#4CAF50' : isDespesa ? '#F44336' : '#2196F3';
  const bgTipo = isReceita ? 'rgba(76, 175, 80, 0.15)' : isDespesa ? 'rgba(244, 67, 54, 0.15)' : 'rgba(33, 150, 243, 0.15)';

  return (
    <div 
      onClick={aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 15, 25, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0F2744',
          borderRadius: '24px',
          border: '1.5px solid #287EA5',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 25px rgba(40, 126, 165, 0.25)',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative'
        }}
      >
        {/* =====================================================
             CABEÇALHO DO MODAL COM BOTÃO FECHAR
           ===================================================== */}
        <div style={{
          padding: '18px 20px 14px 20px',
          borderBottom: '1px solid #1E3A5F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📋</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
                Detalhes da Movimentação
              </h3>
              <span style={{ fontSize: '11px', color: '#5090D3', fontWeight: 600 }}>
                Informações completas e sem cortes
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={aoFechar}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '12px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#AAB4BE',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Fechar detalhes"
          >
            <X size={18} />
          </button>
        </div>

        {/* =====================================================
             CORPO DO MODAL COM INFORMAÇÕES EXPLODIDAS
           ===================================================== */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* 1. Card de Destaque Financeiro */}
          <div style={{
            backgroundColor: '#132F4C',
            border: `1.5px solid ${corTipo}55`,
            borderRadius: '18px',
            padding: '16px',
            textAlign: 'center',
            boxShadow: `0 4px 16px ${corTipo}15`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: '8px',
                backgroundColor: bgTipo,
                color: corTipo,
                border: `1px solid ${corTipo}60`,
                textTransform: 'uppercase',
                letterSpacing: '0.6px'
              }}>
                {isDespesa ? '🔴 Despesa' : isReceita ? '🟢 Receita' : '🔵 Investimento'}
              </span>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                color: '#B0BEC5'
              }}>
                Competência: {lancamento.competencia}
              </span>
            </div>

            <div style={{
              fontSize: 'clamp(26px, 7vw, 34px)',
              fontWeight: 900,
              color: corTipo,
              letterSpacing: '-0.5px',
              margin: '6px 0 2px 0'
            }}>
              {isDespesa ? '- ' : isReceita ? '+ ' : ''}
              {formatarMoeda(lancamento.valor)}
            </div>

            {lancamento.totalParcelas && lancamento.totalParcelas > 1 ? (
              <div style={{
                marginTop: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(192, 132, 252, 0.15)',
                border: '1px solid rgba(192, 132, 252, 0.4)',
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#C084FC'
              }}>
                <span>📦 Parcela {lancamento.parcela || 1} de {lancamento.totalParcelas}</span>
                <span>•</span>
                <span>{formatarMoeda(lancamento.valor)} cada</span>
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                ⚡ Pagamento à vista em parcela única
              </span>
            )}
          </div>

          {/* 2. Descrição Completa Explodida (Texto Sem Cortes) */}
          <div style={{
            backgroundColor: '#132F4C',
            border: '1px solid #1E3A5F',
            borderRadius: '16px',
            padding: '14px 16px'
          }}>
            <label style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: '#F8D117',
              textTransform: 'uppercase',
              letterSpacing: '0.6px',
              display: 'block',
              marginBottom: '6px'
            }}>
              📝 Descrição Completa do Lançamento
            </label>
            <p style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.45,
              wordBreak: 'break-word',
              whiteSpace: 'normal'
            }}>
              {lancamento.descricao || 'Sem descrição informada'}
            </p>
          </div>

          {/* 3. Grade Detalhada de Informações */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '10px'
          }}>
            {/* Data do Lançamento */}
            <div style={{
              backgroundColor: 'rgba(19, 47, 76, 0.65)',
              border: '1px solid rgba(30, 58, 95, 0.8)',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Calendar size={18} color="#5090D3" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block' }}>
                  Data do Movimento
                </span>
                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>
                  {formatarData(lancamento.data)}
                </strong>
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div style={{
              backgroundColor: 'rgba(19, 47, 76, 0.65)',
              border: '1px solid rgba(30, 58, 95, 0.8)',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CreditCard size={18} color="#F8D117" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block' }}>
                  Forma de Pagamento
                </span>
                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>
                  {lancamento.pagamento}
                </strong>
              </div>
            </div>

            {/* Natureza */}
            <div style={{
              backgroundColor: 'rgba(19, 47, 76, 0.65)',
              border: '1px solid rgba(30, 58, 95, 0.8)',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Tag size={18} color="#4CAF50" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block' }}>
                  Natureza de Gastos
                </span>
                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>
                  {lancamento.natureza}
                </strong>
              </div>
            </div>

            {/* Categoria */}
            <div style={{
              backgroundColor: 'rgba(19, 47, 76, 0.65)',
              border: '1px solid rgba(30, 58, 95, 0.8)',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Folder size={18} color="#00BCD4" style={{ flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block' }}>
                  Categoria Específica
                </span>
                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>
                  {lancamento.categoria}
                </strong>
              </div>
            </div>

            {/* Cartão de Crédito ou Conta Bancária */}
            {(lancamento.cartao || lancamento.conta) && (
              <div style={{
                backgroundColor: 'rgba(19, 47, 76, 0.65)',
                border: '1px solid rgba(30, 58, 95, 0.8)',
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                gridColumn: '1 / -1'
              }}>
                <Building2 size={18} color="#FF9800" style={{ flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block' }}>
                    {lancamento.cartao ? 'Cartão de Crédito Utilizado' : 'Conta Bancária'}
                  </span>
                  <strong style={{ fontSize: '13px', color: '#F8D117' }}>
                    {lancamento.cartao || lancamento.conta}
                  </strong>
                </div>
              </div>
            )}

            {/* Origem e Registro */}
            <div style={{
              backgroundColor: 'rgba(19, 47, 76, 0.65)',
              border: '1px solid rgba(30, 58, 95, 0.8)',
              borderRadius: '14px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              gridColumn: '1 / -1'
            }}>
              {lancamento.origem === 'voz' ? (
                <Mic size={18} color="#2196F3" style={{ flexShrink: 0 }} />
              ) : lancamento.origem === 'meu-mercado' ? (
                <ShoppingCart size={18} color="#4CAF50" style={{ flexShrink: 0 }} />
              ) : (
                <Smartphone size={18} color="#5090D3" style={{ flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block' }}>
                  Canal de Registro & Status
                </span>
                <span style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: 600 }}>
                  {lancamento.origem === 'voz' 
                    ? '🎙️ Cadastrado por Comando de Voz' 
                    : lancamento.origem === 'meu-mercado'
                    ? '🛒 Integrado pelo Meu Mercado'
                    : '📱 Lançamento Manual no App'} • Status: <strong style={{ color: '#4CAF50' }}>{lancamento.status}</strong>
                </span>
              </div>

              {lancamento.detalhesMercado && aoAbrirCupomMercado && (
                <button
                  type="button"
                  onClick={() => aoAbrirCupomMercado(lancamento)}
                  style={{
                    backgroundColor: 'rgba(76, 175, 80, 0.25)',
                    border: '1px solid #4CAF50',
                    color: '#66BB6A',
                    borderRadius: '10px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <ShoppingCart size={13} />
                  <span>Ver Cupom</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =====================================================
             RODAPÉ COM BOTÕES DE AÇÃO
           ===================================================== */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #1E3A5F',
          backgroundColor: '#0B1929',
          borderRadius: '0 0 24px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {aoEditar && (
              <button
                type="button"
                onClick={() => {
                  aoFechar();
                  aoEditar(lancamento);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(40, 126, 165, 0.2)',
                  border: '1px solid rgba(80, 144, 211, 0.4)',
                  color: '#5090D3',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Edit3 size={14} />
                <span>Editar</span>
              </button>
            )}

            {aoExcluir && (
              <button
                type="button"
                onClick={() => {
                  aoFechar();
                  aoExcluir(lancamento);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(244, 67, 54, 0.15)',
                  border: '1px solid rgba(244, 67, 54, 0.35)',
                  color: '#F44336',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Trash2 size={14} />
                <span>Excluir</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={aoFechar}
            style={{
              padding: '9px 20px',
              borderRadius: '12px',
              backgroundColor: '#173F5F',
              border: '1px solid #287EA5',
              color: '#FFFFFF',
              fontSize: '12.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};