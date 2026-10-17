export type TipoLancamento = 'Despesa' | 'Receita' | 'Investimento';

export type FormaPagamento = '📱 Pix' | '🏦 Débito' | '💳 Crédito' | '💵 Dinheiro' | '📝 Boleto';

export type StatusLancamento = 'Lançado' | 'Pendente' | 'Cancelado';

export interface Lancamento {
  id: string;
  userId: string;
  data: Date;
  competencia: string; // MM/YYYY
  valor: number;
  tipo: TipoLancamento;
  natureza: string;
  categoria: string;
  descricao: string;
  pagamento: FormaPagamento;
  cartao?: string;
  conta?: string;
  status: StatusLancamento;
  compraId?: string;
  parcela?: number;
  totalParcelas?: number;
  vencimento?: Date;
  fatura?: string; // MM/YYYY
  origem: 'app' | 'planilha' | 'voz' | 'importacao';
  criadoEm: Date;
  atualizadoEm: Date;
}

export interface LancamentoInput {
  data: string; // YYYY-MM-DD
  valor: number;
  tipo: TipoLancamento;
  natureza: string;
  categoria: string;
  descricao: string;
  pagamento: FormaPagamento;
  cartao?: string;
  conta?: string;
  parcelas?: number;
}

export interface FiltroLancamento {
  competencia?: string;
  tipo?: TipoLancamento;
  natureza?: string;
  categoria?: string;
  pagamento?: FormaPagamento;
  busca?: string;
  limite?: number;
}
