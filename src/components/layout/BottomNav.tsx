import React from 'react';
import type { SecaoAtiva } from './Sidebar';
import { Plus } from 'lucide-react';

interface BottomNavProps {
  secaoAtiva: SecaoAtiva;
  onSelecionarSecao: (secao: SecaoAtiva) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  secaoAtiva,
  onSelecionarSecao,
}) => {
  const isExtratoAtivo = secaoAtiva === 'extrato' || secaoAtiva === 'livro-caixa' || secaoAtiva === 'gerenciamento';

  return (
    <nav 
      aria-label="Navegação Principal"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: 'rgba(11, 25, 41, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid #1E3A5F',
        boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.5)',
        padding: '6px 12px env(safe-area-inset-bottom, 8px) 12px'
      }}
    >
      <div style={{
        maxWidth: '680px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        alignItems: 'center',
        gap: '4px'
      }}>
        {/* 1. Início */}
        <button
          onClick={() => onSelecionarSecao('inicio')}
          type="button"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px 0',
            borderRadius: '12px',
            border: 'none',
            background: secaoAtiva === 'inicio' ? 'rgba(40, 126, 165, 0.22)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ 
            fontSize: '18px',
            transform: secaoAtiva === 'inicio' ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.15s ease'
          }}>
            🏠
          </span>
          <span style={{ 
            fontSize: '11px',
            color: secaoAtiva === 'inicio' ? '#F8D117' : '#8A99AD',
            fontWeight: secaoAtiva === 'inicio' ? 800 : 500
          }}>
            Início
          </span>
        </button>

        {/* 2. Extrato (Livro Caixa + Gerenciador) */}
        <button
          onClick={() => onSelecionarSecao('extrato')}
          type="button"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px 0',
            borderRadius: '12px',
            border: 'none',
            background: isExtratoAtivo ? 'rgba(40, 126, 165, 0.22)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ 
            fontSize: '18px',
            transform: isExtratoAtivo ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.15s ease'
          }}>
            📒
          </span>
          <span style={{ 
            fontSize: '11px',
            color: isExtratoAtivo ? '#F8D117' : '#8A99AD',
            fontWeight: isExtratoAtivo ? 800 : 500
          }}>
            Extrato
          </span>
        </button>

        {/* 3. Lançar (Botão Central Elevado em Destaque) */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-16px',
          position: 'relative'
        }}>
          <button
            onClick={() => onSelecionarSecao('lancar')}
            type="button"
            title="Novo Lançamento"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid #0B1929',
              background: 'linear-gradient(135deg, #F8D117 0%, #E5B20D 100%)',
              color: '#0B1929',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 18px rgba(248, 209, 23, 0.45)',
              cursor: 'pointer',
              transform: secaoAtiva === 'lancar' ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <Plus size={26} strokeWidth={3} />
          </button>
          <span style={{ 
            fontSize: '10.5px',
            fontWeight: 800,
            color: secaoAtiva === 'lancar' ? '#FFFFFF' : '#F8D117',
            marginTop: '2px',
            letterSpacing: '0.01em'
          }}>
            Lançar
          </span>
        </div>

        {/* 4. Cartões */}
        <button
          onClick={() => onSelecionarSecao('cartoes')}
          type="button"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px 0',
            borderRadius: '12px',
            border: 'none',
            background: secaoAtiva === 'cartoes' ? 'rgba(40, 126, 165, 0.22)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ 
            fontSize: '18px',
            transform: secaoAtiva === 'cartoes' ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.15s ease'
          }}>
            💳
          </span>
          <span style={{ 
            fontSize: '11px',
            color: secaoAtiva === 'cartoes' ? '#F8D117' : '#8A99AD',
            fontWeight: secaoAtiva === 'cartoes' ? 800 : 500
          }}>
            Cartões
          </span>
        </button>

        {/* 5. Análises */}
        <button
          onClick={() => onSelecionarSecao('analises')}
          type="button"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            padding: '6px 0',
            borderRadius: '12px',
            border: 'none',
            background: secaoAtiva === 'analises' ? 'rgba(40, 126, 165, 0.22)' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ 
            fontSize: '18px',
            transform: secaoAtiva === 'analises' ? 'scale(1.1)' : 'scale(1)',
            transition: 'transform 0.15s ease'
          }}>
            📊
          </span>
          <span style={{ 
            fontSize: '11px',
            color: secaoAtiva === 'analises' ? '#F8D117' : '#8A99AD',
            fontWeight: secaoAtiva === 'analises' ? 800 : 500
          }}>
            Análises
          </span>
        </button>
      </div>
    </nav>
  );
};
