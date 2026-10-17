// Fonte única de verdade para constantes do sistema
// Substitui MF_TIPOS, MF_PAGAMENTOS, MF_ABAS, etc. espalhados por 12 arquivos .gs

import type { TipoLancamento, FormaPagamento } from '../types';

export const TIPOS_LANCAMENTO: TipoLancamento[] = ['Despesa', 'Receita', 'Investimento'];

export const FORMAS_PAGAMENTO: FormaPagamento[] = [
  '📱 Pix',
  '🏦 Débito', 
  '💳 Crédito',
  '💵 Dinheiro',
  '📝 Boleto',
];

export const MESES_PT: string[] = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const TIPO_CORES: Record<TipoLancamento, string> = {
  'Despesa': '#EF4444',
  'Receita': '#22C55E', 
  'Investimento': '#3B82F6',
};

export const PAGAMENTO_ICONES: Record<FormaPagamento, string> = {
  '📱 Pix': '📱',
  '🏦 Débito': '🏦',
  '💳 Crédito': '💳',
  '💵 Dinheiro': '💵',
  '📝 Boleto': '📝',
};
