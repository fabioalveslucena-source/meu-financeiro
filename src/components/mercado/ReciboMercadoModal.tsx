import React from 'react';
import type { DetalhesMercado } from '../../types';
import { formatarMoeda } from '../../lib/formatters';
import { 
  X, 
  ShoppingCart, 
  Receipt, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  Copy, 
  Sparkles 
} from 'lucide-react';

interface ReciboMercadoModalProps {
  aberto: boolean;
  onFechar: () => void;
  detalhes?: DetalhesMercado;
  valorTotalLancamento?: number;
  formaPagamento?: string;
}

export const ReciboMercadoModal: React.FC<ReciboMercadoModalProps> = ({
  aberto,
  onFechar,
  detalhes,
  valorTotalLancamento,
  formaPagamento,
}) => {
  if (!aberto || !detalhes) return null;

  const total = detalhes.valorTotal || valorTotalLancamento || 0;
  const mercadoNome = detalhes.mercadoNome || 'Supermercado';

  const copiarResumo = () => {
    const linhas = [
      `🛒 ${mercadoNome} - Cupom Detalhado`,
      `📅 Data: ${detalhes.dataCompra || 'Hoje'}`,
      `💳 Pagamento: ${detalhes.formaPagamentoUtilizada || formaPagamento || 'Registrado'}`,
      `----------------------------------------`,
      ...detalhes.itens.map((it) => 
        `• ${it.nome} (${it.quantidade}${it.unidade ? ' ' + it.unidade : 'x'} a ${formatarMoeda(it.precoUnitario)}) = ${formatarMoeda(it.precoTotal)}`
      ),
      `----------------------------------------`,
      `💰 TOTAL: ${formatarMoeda(total)}`,
      `✨ Sincronizado via Meu Mercado -> Meu Financeiro`
    ];
    navigator.clipboard.writeText(linhas.join('\n'));
    alert('📋 Resumo da compra copiado para a área de transferência!');
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
      padding: '16px'
    }}>
      <div 
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F2744',
          borderRadius: '20px',
          border: '1px solid #287EA5',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.65)',
          overflow: 'hidden',
          animation: 'fadeIn 0.25s ease-out'
        }}
      >
        {/* Cabeçalho do Recibo */}
        <div style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #173F5F 0%, #205B7D 60%, #287EA5 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}>
              <ShoppingCart size={22} color="#F8D117" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  {mercadoNome}
                </h3>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(76, 175, 80, 0.25)',
                  color: '#66BB6A',
                  border: '1px solid rgba(76, 175, 80, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}>
                  <CheckCircle2 size={10} /> Meu Mercado
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#E7EBF0', opacity: 0.85, margin: 0 }}>
                Cupom detalhado da compra
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            style={{
              width: '32px',
              height: '32px',
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
            <X size={18} />
          </button>
        </div>

        {/* Metadados da Compra */}
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#0B1929',
          borderBottom: '1px solid #1E3A5F',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: '#AAB4BE'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Calendar size={13} color="#5090D3" />
            <span>{detalhes.dataCompra || 'Data da compra'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <CreditCard size={13} color="#F8D117" />
            <span>{detalhes.formaPagamentoUtilizada || formaPagamento || 'Forma de Pagamento'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Receipt size={13} color="#66BB6A" />
            <span><strong>{detalhes.itens.length}</strong> itens registrados</span>
          </div>
        </div>

        {/* Lista de Produtos (Rolável) */}
        <div style={{
          padding: '14px 20px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {detalhes.itens.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 12px',
                backgroundColor: '#132F4C',
                borderRadius: '10px',
                border: '1px solid #1E3A5F',
                transition: 'background-color 0.15s ease'
              }}
            >
              <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#5090D3',
                    minWidth: '20px'
                  }}>
                    #{index + 1}
                  </span>
                  <strong style={{
                    fontSize: '13px',
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block'
                  }}>
                    {item.nome}
                  </strong>
                </div>
                <span style={{ fontSize: '11px', color: '#AAB4BE', marginLeft: '26px', display: 'block' }}>
                  {item.quantidade} {item.unidade || 'un'} × {formatarMoeda(item.precoUnitario)}
                  {item.categoriaItem && <span style={{ opacity: 0.7 }}> • {item.categoriaItem}</span>}
                </span>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{
                  fontSize: '13.5px',
                  fontWeight: 800,
                  color: '#FFFFFF'
                }}>
                  {formatarMoeda(item.precoTotal)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé com Totalizador e Ações */}
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#0B1929',
          borderTop: '2px solid #1E3A5F',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11px', color: '#AAB4BE', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                Total Consolidado
              </span>
              <span style={{ fontSize: '11px', color: '#66BB6A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} /> Lançado no Meu Financeiro
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#F44336'
              }}>
                - {formatarMoeda(total)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={copiarResumo}
              className="btn-secondary"
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Copy size={14} />
              <span>Copiar Lista</span>
            </button>

            <button
              type="button"
              onClick={onFechar}
              className="btn-primary"
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '9px 12px'
              }}
            >
              Concluído
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
