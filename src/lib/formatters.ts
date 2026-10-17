/**
 * Formata valor numérico para moeda brasileira (BRL)
 * Substitui formatarMoeda() e formatarMoedaApp() duplicados no sistema original
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

/**
 * Formata data para exibição DD/MM/YYYY
 */
export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data + 'T00:00:00') : data;
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata competência para exibição "Mês / Ano"
 */
export function formatarCompetencia(competencia: string): string {
  const [mes, ano] = competencia.split('/');
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return `${meses[parseInt(mes) - 1]} / ${ano}`;
}

/**
 * Converte string monetária brasileira para número
 * Aceita: "1.500,50" | "1500,50" | "1500.50" | "150"
 * Corrige o bug do input type="number" que rejeita vírgula
 */
export function parseMoedaBR(valor: string): number {
  if (!valor) return 0;
  const limpo = valor.replace(/[^\d,.-]/g, '');
  // Se tem vírgula, é formato brasileiro
  if (limpo.includes(',')) {
    return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
  }
  return parseFloat(limpo) || 0;
}

/**
 * Formata data para input date (YYYY-MM-DD)
 */
export function formatarDataInput(data?: Date): string {
  const d = data || new Date();
  return d.toISOString().split('T')[0];
}

/**
 * Retorna a competência atual (MM/YYYY)
 */
export function competenciaAtual(): string {
  const hoje = new Date();
  return `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
}

/**
 * Escapa HTML para prevenir XSS
 * Substitui escapeHtmlLivroCaixa() e escaparHtmlApp() duplicados
 */
export function escapeHtml(texto: string): string {
  const mapa: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return texto.replace(/[&<>"']/g, (char) => mapa[char] || char);
}

/**
 * Formata número de parcela
 */
export function formatarParcela(parcela?: number, total?: number): string {
  if (!parcela || !total || total <= 1) return 'À vista';
  return `${parcela}/${total}`;
}
