export type TipoLancamento = 'Despesa' | 'Receita' | 'Investimento';

export type FormaPagamento = '📱 Pix' | '🏦 Débito' | '💳 Crédito' | '💵 Dinheiro' | '📝 Boleto';

export type StatusLancamento = 'Lançado' | 'Pendente' | 'Cancelado';

export interface ItemCompraMercado {
  id?: string;
  nome: string;          // Ex: "Tomate", "Toddy", "Feijão Carioca"
  quantidade: number;     // Ex: 1.5 ou 2
  unidade?: string;      // Ex: "kg", "un", "pct"
  precoUnitario: number; // Ex: 8.50
  precoTotal: number;    // Ex: 17.00
  categoriaItem?: string;// Ex: "Hortifruti", "Mercearia"
}

export interface DetalhesMercado {
  mercadoNome?: string;        // Ex: "Pão de Açúcar", "Atacadão", "Supermercado"
  cupomNumero?: string;
  itens: ItemCompraMercado[];
  totalItens: number;
  valorTotal: number;
  dataCompra: string;          // YYYY-MM-DD
  formaPagamentoUtilizada?: string;
  observacoes?: string;
}

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
  origem: 'app' | 'planilha' | 'voz' | 'importacao' | 'meu-mercado';
  detalhesMercado?: DetalhesMercado;
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
