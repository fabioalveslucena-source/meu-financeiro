export interface Natureza {
  id: string;
  nome: string;
  emoji: string;
  label: string; // emoji + nome
}

export interface Categoria {
  id: string;
  userId: string;
  natureza: string;
  nome: string;
  tipo: 'Despesa' | 'Receita' | 'Investimento' | 'Todos';
  ativa: boolean;
}

export const NATUREZAS_PADRAO: Natureza[] = [
  { id: 'moradia', nome: 'Moradia', emoji: '🏠', label: '🏠 Moradia' },
  { id: 'alimentacao', nome: 'Alimentação', emoji: '🛒', label: '🛒 Alimentação' },
  { id: 'transporte', nome: 'Transporte', emoji: '🚗', label: '🚗 Transporte' },
  { id: 'saude', nome: 'Saúde', emoji: '🏥', label: '🏥 Saúde' },
  { id: 'educacao', nome: 'Educação', emoji: '📚', label: '📚 Educação' },
  { id: 'lazer', nome: 'Lazer', emoji: '🎨', label: '🎨 Lazer' },
  { id: 'vestuario', nome: 'Vestuário', emoji: '👕', label: '👕 Vestuário' },
  { id: 'servicos', nome: 'Serviços', emoji: '🛠️', label: '🛠️ Serviços' },
  { id: 'impostos', nome: 'Impostos', emoji: '💰', label: '💰 Impostos' },
  { id: 'pessoal', nome: 'Pessoal', emoji: '👤', label: '👤 Pessoal' },
  { id: 'familia', nome: 'Família', emoji: '👨‍👩‍👧', label: '👨‍👩‍👧 Família' },
  { id: 'pets', nome: 'Pets', emoji: '🐾', label: '🐾 Pets' },
  { id: 'outros', nome: 'Outros', emoji: '📦', label: '📦 Outros' },
];
