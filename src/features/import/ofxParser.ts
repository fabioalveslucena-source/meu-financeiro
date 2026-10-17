import { identificarNaturezaECategoria } from '../voice/voiceInterpreter';
import type { TipoLancamento, FormaPagamento } from '../../types';

export interface TransacaoImportada {
  id: string;
  data: string; // YYYY-MM-DD
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  natureza: string;
  categoria: string;
  pagamento: FormaPagamento;
  fitId?: string;
  selecionada: boolean;
}

/**
 * Converte data no formato OFX (YYYYMMDD ou YYYYMMDDHHMMSS) para YYYY-MM-DD
 */
function parseDataOFX(rawDate: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const limpo = rawDate.trim().replace(/[^0-9]/g, '');
  if (limpo.length >= 8) {
    const ano = limpo.substring(0, 4);
    const mes = limpo.substring(4, 6);
    const dia = limpo.substring(6, 8);
    return `${ano}-${mes}-${dia}`;
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Parser universal para arquivos OFX (SGML e XML) de bancos brasileiros
 */
export function parseOFX(conteudo: string): TransacaoImportada[] {
  const transacoes: TransacaoImportada[] = [];

  // Padrão que captura blocos STMTTRN mesmo sem tags de fechamento (SGML clássico bancário)
  const regexTransacao = /<STMTTRN>([\s\S]*?)(?=<STMTTRN>|<\/BANKTRANLIST>|$)/gi;
  let match;

  let index = 0;
  while ((match = regexTransacao.exec(conteudo)) !== null) {
    const bloco = match[1];

    // Extrair campos individuais com regex flexível para SGML e XML
    const fitIdMatch = bloco.match(/<FITID>([^<\r\n]+)/i);
    const dtPostedMatch = bloco.match(/<DTPOSTED>([^<\r\n]+)/i);
    const trnAmtMatch = bloco.match(/<TRNAMT>([^<\r\n]+)/i);
    const memoMatch = bloco.match(/<MEMO>([^<\r\n]+)/i);
    const nameMatch = bloco.match(/<NAME>([^<\r\n]+)/i);

    if (!trnAmtMatch || !trnAmtMatch[1]) continue;

    const valorBruto = parseFloat(trnAmtMatch[1].trim().replace(',', '.'));
    if (isNaN(valorBruto) || valorBruto === 0) continue;

    const rawData = dtPostedMatch ? dtPostedMatch[1].trim() : '';
    const dataFormatada = parseDataOFX(rawData);

    const fitId = fitIdMatch ? fitIdMatch[1].trim() : `ofx-${Date.now()}-${index}`;
    const rawMemo = memoMatch ? memoMatch[1].trim() : (nameMatch ? nameMatch[1].trim() : 'Movimentação Bancária');

    // Limpar caracteres comuns em extratos de bancos brasileiros (ex: "COMPRA CARTAO -", "TED RECEBIDA", etc)
    const descricaoLimpa = rawMemo
      .replace(/^(?:compra\s+(?:com\s+)?cartao\s*[-:]?|pix\s+enviado\s*[-:]?|pix\s+recebido\s*[-:]?|ted\s*[-:]?|doc\s*[-:]?|debito\s*[-:]?)/i, '')
      .replace(/\s+/g, ' ')
      .trim();

    const isReceita = valorBruto > 0;
    const tipo: TipoLancamento = isReceita ? 'Receita' : 'Despesa';
    const valorPositivo = Math.abs(valorBruto);

    const { natureza, categoria } = identificarNaturezaECategoria(descricaoLimpa, tipo);

    // Identificar forma de pagamento baseada no extrato
    let pagamento: FormaPagamento = '🏦 Débito';
    if (/pix/i.test(rawMemo)) {
      pagamento = '📱 Pix';
    } else if (/cartao|visa|master|elo|compra/i.test(rawMemo)) {
      pagamento = '💳 Crédito';
    } else if (/boleto|titulo|arrecada/i.test(rawMemo)) {
      pagamento = '📝 Boleto';
    }

    transacoes.push({
      id: `imp-${fitId}-${index}`,
      fitId,
      data: dataFormatada,
      descricao: descricaoLimpa || rawMemo,
      valor: valorPositivo,
      tipo,
      natureza,
      categoria,
      pagamento,
      selecionada: true,
    });

    index++;
  }

  return transacoes;
}

/**
 * Parser para extratos em formato CSV (suporta delimitadores vírgula e ponto-e-vírgula)
 */
export function parseCSV(conteudo: string): TransacaoImportada[] {
  const linhas = conteudo.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (linhas.length <= 1) return [];

  const transacoes: TransacaoImportada[] = [];

  // Detectar delimitador: ponto-e-vírgula ou vírgula
  const primeiraLinha = linhas[0];
  const separador = primeiraLinha.includes(';') ? ';' : ',';

  // Pular cabeçalho
  for (let i = 1; i < linhas.length; i++) {
    const colunas = linhas[i].split(separador).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (colunas.length < 3) continue;

    // Suposição comum: Coluna 0 = Data, Coluna 1 = Descrição/Histórico, Coluna 2 = Valor
    let dataStr = colunas[0];
    const descStr = colunas[1];
    let valorStr = colunas[2];

    // Se a data estiver em formato DD/MM/AAAA, converter para AAAA-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
      const [dia, mes, ano] = dataStr.split('/');
      dataStr = `${ano}-${mes}-${dia}`;
    }

    if (!valorStr) continue;

    // Limpar valor monetário brasileiro
    valorStr = valorStr.replace(/[^\d,.-]/g, '');
    let valorNum = 0;
    if (valorStr.includes(',')) {
      valorNum = parseFloat(valorStr.replace(/\./g, '').replace(',', '.'));
    } else {
      valorNum = parseFloat(valorStr);
    }

    if (isNaN(valorNum) || valorNum === 0) continue;

    const tipo: TipoLancamento = valorNum > 0 ? 'Receita' : 'Despesa';
    const valorAbs = Math.abs(valorNum);

    const { natureza, categoria } = identificarNaturezaECategoria(descStr, tipo);

    transacoes.push({
      id: `csv-${Date.now()}-${i}`,
      data: dataStr,
      descricao: descStr || 'Movimentação CSV',
      valor: valorAbs,
      tipo,
      natureza,
      categoria,
      pagamento: '🏦 Débito',
      selecionada: true,
    });
  }

  return transacoes;
}

/**
 * Exporta lançamentos para formato CSV estruturado com BOM UTF-8 (compatível com Excel e Planilhas)
 */
export function exportarLancamentosCSV(lancamentos: any[], nomeArquivo = 'extrato.csv'): void {
  const cabecalho = ['Data', 'Competência', 'Tipo', 'Descrição', 'Natureza', 'Categoria', 'Forma Pagamento', 'Cartão / Conta', 'Valor (R$)'];
  
  const linhas = lancamentos.map(l => [
    `"${l.data ? (typeof l.data === 'string' ? l.data.split('T')[0] : l.data) : ''}"`,
    `"${l.competencia || ''}"`,
    `"${l.tipo}"`,
    `"${(l.descricao || '').replace(/"/g, '""')}"`,
    `"${l.natureza || ''}"`,
    `"${l.categoria || ''}"`,
    `"${l.pagamento || ''}"`,
    `"${l.cartao || l.conta || ''}"`,
    (l.tipo === 'Despesa' ? -Math.abs(l.valor) : Math.abs(l.valor)).toFixed(2).replace('.', ','),
  ]);

  const csvContent = '\uFEFF' + [cabecalho.join(';'), ...linhas.map(row => row.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', nomeArquivo);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
