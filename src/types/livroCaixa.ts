export interface LivroCaixaResumo {
  competencia: string;
  saldoAnterior: number;
  totalReceitas: number;
  totalDespesas: number;
  totalInvestimentos: number;
  saldoFinal: number;
}

export interface LivroCaixaItem {
  data: string;
  descricao: string;
  natureza: string;
  categoria: string;
  tipo: 'Despesa' | 'Receita' | 'Investimento';
  pagamento: string;
  valor: number;
  saldoAcumulado: number;
}

export interface LivroCaixaDados {
  resumo: LivroCaixaResumo;
  lancamentos: LivroCaixaItem[];
  distribuicao: DistribuicaoNatureza[];
}

export interface DistribuicaoNatureza {
  natureza: string;
  total: number;
  percentual: number;
  categorias: DistribuicaoCategoria[];
}

export interface DistribuicaoCategoria {
  categoria: string;
  total: number;
  percentual: number;
  quantidade: number;
}
