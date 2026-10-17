import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { Zap, ChevronDown, ChevronUp } from 'lucide-react';

export const RealtimeConsole: React.FC = () => {
  const [expandido, setExpandido] = useState(false);
  const { logsRealtime, simularMovimentoRealtime } = useFinanceStore();

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '16px',
      zIndex: 60,
      maxWidth: expandido ? '480px' : '320px',
      width: '100%',
      transition: 'all var(--transition-normal)'
    }}>
      <div className="card glass" style={{
        padding: '0.6rem 0.85rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--border-default)',
        backgroundColor: 'rgba(11, 25, 41, 0.95)'
      }}>
        {/* Barra Superior do Console */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => setExpandido(!expandido)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px #10B981',
              display: 'inline-block'
            }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              REAL-TIME SYNC
            </span>
            <span style={{
              fontSize: '0.65rem',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34D399',
              fontWeight: 700
            }}>
              LIVE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                simularMovimentoRealtime();
              }}
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(40, 126, 165, 0.3)',
                color: 'var(--brand-secondary)',
                border: '1px solid var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                cursor: 'pointer'
              }}
              title="Disparar uma transação ao vivo estilo npm run dev"
            >
              <Zap size={12} />
              <span>Simular Ao Vivo</span>
            </button>

            <button style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {expandido ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Linha Recente (Modo Mini) */}
        {!expandido && logsRealtime.length > 0 && (
          <div style={{
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            marginTop: '0.4rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontFamily: 'monospace'
          }}>
            <span style={{ color: 'var(--brand-secondary)' }}>{logsRealtime[0].timestamp}</span> {logsRealtime[0].acao}
          </div>
        )}

        {/* Janela de Logs Estilo Terminal (Modo Expandido) */}
        {expandido && (
          <div style={{
            marginTop: '0.75rem',
            maxHeight: '220px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.5rem'
          }}>
            {logsRealtime.map((log) => {
              const corAcao = log.tipo === 'sucesso' ? '#34D399' : log.tipo === 'alerta' ? '#F87171' : '#60A5FA';
              return (
                <div key={log.id} style={{
                  padding: '3px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  lineHeight: '1.3'
                }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <span style={{ color: 'var(--text-tertiary)' }}>[{log.timestamp}]</span>
                    <strong style={{ color: corAcao }}>{log.acao}</strong>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', paddingLeft: '0.5rem', marginTop: '1px' }}>
                    ↳ {log.detalhes}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
