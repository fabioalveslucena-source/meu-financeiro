// Design System - Meu Financeiro
// Tema Escuro com paleta azul escuro

export const theme = {
  colors: {
    // Backgrounds
    bg: {
      primary: '#0B1929',      // Fundo principal (azul muito escuro)
      secondary: '#0F2744',    // Cards e painéis
      tertiary: '#132F4C',     // Campos de input, hovers
      elevated: '#173A5E',     // Elementos elevados
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    // Textos
    text: {
      primary: '#E7EBF0',      // Texto principal (branco suave)
      secondary: '#AAB4BE',    // Texto secundário
      tertiary: '#6B7A90',     // Texto desabilitado / placeholder
      inverse: '#0B1929',      // Texto sobre fundos claros
    },
    // Bordas
    border: {
      subtle: '#1E3A5F',       // Borda sutil
      default: '#265D97',      // Borda padrão
      focus: '#5090D3',        // Borda de foco
    },
    // Brand / Acentos
    brand: {
      primary: '#287EA5',      // Azul principal (herdado do design original)
      secondary: '#5090D3',    // Azul claro
      hover: '#3A9BD5',        // Hover do brand
      light: '#1A4971',        // Brand com opacidade
    },
    // Status / Semânticas
    status: {
      despesa: '#F44336',      // Vermelho para despesas
      despesaBg: 'rgba(244, 67, 54, 0.12)',
      receita: '#4CAF50',      // Verde para receitas
      receitaBg: 'rgba(76, 175, 80, 0.12)',
      investimento: '#2196F3', // Azul para investimentos
      investimentoBg: 'rgba(33, 150, 243, 0.12)',
      alerta: '#FF9800',       // Laranja para alertas
      alertaBg: 'rgba(255, 152, 0, 0.12)',
      erro: '#EF5350',         // Vermelho erro
      erroBg: 'rgba(239, 83, 80, 0.12)',
      sucesso: '#66BB6A',      // Verde sucesso
      sucessoBg: 'rgba(102, 187, 106, 0.12)',
    },
    // Cartões de crédito
    cartao: {
      gradient1: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)',
      gradient2: 'linear-gradient(135deg, #004D40 0%, #00695C 100%)',
      gradient3: 'linear-gradient(135deg, #4A148C 0%, #6A1B9A 100%)',
      gradient4: 'linear-gradient(135deg, #B71C1C 0%, #C62828 100%)',
    },
  },
  fonts: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
    glow: '0 0 15px rgba(40, 126, 165, 0.3)',
    cardHover: '0 8px 30px rgba(40, 126, 165, 0.15)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

export type Theme = typeof theme;
