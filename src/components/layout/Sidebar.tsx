import React from 'react';
import { 
  PlusCircle, 
  BookOpen, 
  CreditCard, 
  ListFilter, 
  PieChart, 
  Mic 
} from 'lucide-react';

export type SecaoAtiva = 'inicio' | 'extrato' | 'lancar' | 'cartoes' | 'analises' | 'livro-caixa' | 'gerenciamento';

interface SidebarProps {
  secaoAtiva: SecaoAtiva;
  onSelecionarSecao: (secao: SecaoAtiva) => void;
  onAbrirVoz: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  secaoAtiva, 
  onSelecionarSecao,
  onAbrirVoz 
}) => {
  const itens = [
    { id: 'lancar', label: 'Lançar Movimento', icone: PlusCircle, cor: 'var(--brand-secondary)' },
    { id: 'livro-caixa', label: 'Livro Caixa', icone: BookOpen, cor: '#4CAF50' },
    { id: 'cartoes', label: 'Cartões & Faturas', icone: CreditCard, cor: '#8A05BE' },
    { id: 'gerenciamento', label: 'Gerenciador', icone: ListFilter, cor: '#FF9800' },
    { id: 'analises', label: 'Análises & Gráficos', icone: PieChart, cor: '#2196F3' },
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1.5rem 1rem',
      height: 'calc(100vh - 65px)',
      position: 'sticky',
      top: '65px'
    }}>
      {/* Menu Principal */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <p style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '0 0.75rem 0.5rem 0.75rem',
          margin: 0
        }}>Navegação</p>

        {itens.map((item) => {
          const Icone = item.icone;
          const ativo = secaoAtiva === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelecionarSecao(item.id as SecaoAtiva)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: ativo ? 'var(--bg-elevated)' : 'transparent',
                color: ativo ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: ativo ? '1px solid var(--border-default)' : '1px solid transparent',
                fontWeight: ativo ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icone size={18} color={ativo ? item.cor : 'var(--text-secondary)'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Botão de Comando de Voz no Rodapé da Sidebar */}
      <div style={{
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <button
          onClick={onAbrirVoz}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.875rem',
            background: 'linear-gradient(135deg, #173F5F 0%, #287EA5 100%)',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <Mic size={18} />
          <span>Lançar por Voz</span>
        </button>
      </div>
    </aside>
  );
};
