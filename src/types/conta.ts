export interface Conta {
  id: string;
  userId: string;
  nome: string;
  banco: string;
  tipo: 'Corrente' | 'Poupança' | 'Investimento' | 'Carteira';
  ativa: boolean;
  icone?: string;
  cor?: string;
}
