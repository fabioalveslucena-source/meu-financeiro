import type { LancamentoInput } from '../types';

export interface ValidationResult {
  valido: boolean;
  erros: string[];
}

/**
 * Valida dados de um lançamento antes de enviar ao backend
 * Substitui validações espalhadas em 3 motores de lançamento
 */
export function validarLancamento(dados: Partial<LancamentoInput>): ValidationResult {
  const erros: string[] = [];

  if (!dados.data) erros.push('Informe a data do lançamento.');
  if (!dados.tipo) erros.push('Selecione o tipo (Despesa, Receita ou Investimento).');
  if (!dados.valor || dados.valor <= 0) erros.push('Informe um valor maior que zero.');
  if (!dados.natureza) erros.push('Selecione a natureza.');
  const descFinal = (dados.descricao?.trim() || dados.categoria?.trim() || '');
  if (!descFinal) erros.push('Informe a descrição ou selecione a categoria.');
  if (!dados.pagamento) erros.push('Selecione a forma de pagamento.');
  
  if (dados.pagamento === '💳 Crédito' && !dados.cartao) {
    erros.push('Selecione o cartão de crédito.');
  }
  
  if (dados.pagamento && dados.pagamento !== '💵 Dinheiro' && 
      dados.pagamento !== '💳 Crédito' && !dados.conta) {
    erros.push('Selecione a conta bancária.');
  }

  if (dados.parcelas && (dados.parcelas < 1 || dados.parcelas > 48)) {
    erros.push('Número de parcelas deve ser entre 1 e 48.');
  }

  // Sanitização contra injeção de fórmulas
  if (dados.descricao && /^[=+\-@]/.test(dados.descricao.trim())) {
    erros.push('A descrição não pode começar com =, +, - ou @.');
  }

  return { valido: erros.length === 0, erros };
}

/**
 * Sanitiza string contra injeção de fórmulas (para migração de dados)
 */
export function sanitizarEntrada(valor: string): string {
  if (!valor) return '';
  return valor.replace(/^[=+\-@]+/, '').trim();
}
