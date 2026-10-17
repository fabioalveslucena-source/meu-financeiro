import type { FormaPagamento } from './lancamento';

export interface DespesaRecorrente {
  id: string;
  descricao: string;
  valor: number;
  diaVencimento: number;
  natureza: string;
  categoria: string;
  pagamento: FormaPagamento;
  cartao?: string;
  conta?: string;
  ativa: boolean;
  observacao?: string;
}

export const DESPESAS_RECORRENTES_PADRAO: DespesaRecorrente[] = [
  {
    id: 'rec-1',
    descricao: 'Aluguel / Condomínio',
    valor: 1850.00,
    diaVencimento: 10,
    natureza: '🏠 Moradia',
    categoria: 'Aluguel / Condomínio',
    pagamento: '📝 Boleto',
    conta: 'Banco do Brasil',
    ativa: true,
  },
  {
    id: 'rec-2',
    descricao: 'Energia Elétrica',
    valor: 240.00,
    diaVencimento: 15,
    natureza: '🏠 Moradia',
    categoria: 'Energia Elétrica',
    pagamento: '📱 Pix',
    conta: 'Banco do Brasil',
    ativa: true,
  },
  {
    id: 'rec-3',
    descricao: 'Internet Fibra Óptica',
    valor: 129.90,
    diaVencimento: 20,
    natureza: '🏠 Moradia',
    categoria: 'Internet / TV a Cabo',
    pagamento: '🏦 Débito',
    conta: 'Banco do Brasil',
    ativa: true,
  },
  {
    id: 'rec-4',
    descricao: 'Escola / Mensalidade Escolar',
    valor: 980.00,
    diaVencimento: 5,
    natureza: '📚 Educação',
    categoria: 'Mensalidade Escolar / Faculdade',
    pagamento: '📝 Boleto',
    conta: 'Banco do Brasil',
    ativa: true,
  },
  {
    id: 'rec-5',
    descricao: 'Streaming Netflix & Spotify',
    valor: 55.90,
    diaVencimento: 25,
    natureza: '🎨 Lazer',
    categoria: 'Streaming (Netflix, Spotify, etc)',
    pagamento: '💳 Crédito',
    cartao: 'Banco do Brasil Ourocard',
    ativa: true,
  },
  {
    id: 'rec-6',
    descricao: 'Academia & Musculação',
    valor: 120.00,
    diaVencimento: 10,
    natureza: '👤 Pessoal',
    categoria: 'Academia / Musculação / Esporte',
    pagamento: '💳 Crédito',
    cartao: 'Banco do Brasil Ourocard',
    ativa: true,
  },
];
