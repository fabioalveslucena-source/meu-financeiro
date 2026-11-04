export interface Conta {
  id: string;
  userId: string;
  nome: string;
  banco: string;
  tipo: 'Corrente' | 'Poupança' | 'Investimento' | 'Carteira' | 'Salário';
  ativa: boolean;
  agencia?: string;
  numeroConta?: string;
  icone?: string;
  cor?: string;
}
