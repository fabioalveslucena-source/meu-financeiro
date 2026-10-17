export interface Cartao {
  id: string;
  userId: string;
  nome: string;
  bandeira: string;
  limite: number;
  diaFechamento: number;
  diaVencimento: number;
  ativo: boolean;
  cor?: string;
  icone?: string;
}

export interface ResumoCartao {
  cartao: Cartao;
  faturaAtual: string; // MM/YYYY
  valorFatura: number;
  limiteDisponivel: number;
  percentualUsado: number;
  parcelamentos: Parcelamento[];
}

export interface Parcelamento {
  descricao: string;
  valorTotal: number;
  valorParcela: number;
  parcelaAtual: number;
  totalParcelas: number;
  compraId: string;
}

export interface Fatura {
  competencia: string; // MM/YYYY
  cartaoId: string;
  valor: number;
  lancamentos: string[]; // IDs dos lançamentos
}
