import type { ResultadoCupomFiscal, ItemCupomFiscal } from './geminiVisionService';

/**
 * Parser inteligente para texto copiado diretamente de páginas da SEFAZ / NFC-e / Danfe
 */
export function extrairItensDeTextoFiscal(textoBruto: string): ResultadoCupomFiscal {
  const linhas = textoBruto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  let estabelecimento = 'Compra Fiscal (SEFAZ)';
  let data = new Date().toISOString().slice(0, 10);
  let valorTotal = 0;
  let chaveAcesso = '';
  const itens: ItemCupomFiscal[] = [];

  // Tenta achar chave de 44 dígitos
  const matchChave = textoBruto.match(/\b([0-9]{44})\b/);
  if (matchChave) {
    chaveAcesso = matchChave[1];
  }

  // Tenta achar data DD/MM/AAAA ou AAAA-MM-DD
  const matchData = textoBruto.match(/\b([0-3]?[0-9])\/([0-1]?[0-9])\/(20[2-3][0-9])\b/);
  if (matchData) {
    const dia = matchData[1].padStart(2, '0');
    const mes = matchData[2].padStart(2, '0');
    const ano = matchData[3];
    data = `${ano}-${mes}-${dia}`;
  }

  // Tenta achar estabelecimento (geralmente nas 5 primeiras linhas)
  for (let i = 0; i < Math.min(6, linhas.length); i++) {
    const l = linhas[i];
    if (
      !l.includes('NFC-e') &&
      !l.includes('DANFE') &&
      !l.includes('Documento') &&
      !l.includes('Chave') &&
      !l.includes('CNPJ') &&
      l.length > 3 &&
      l.length < 50
    ) {
      estabelecimento = l;
      break;
    }
  }

  // Padrão 1: Linha de tabela SEFAZ comum
  // Ex: "001 ARROZ BRANCO 5KG 1,00 UN 28,90 28,90"
  // Ex: "ARROZ BRANCO 5KG Qtd: 1 Vl.Unit: 28,90 Total: 28,90"
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    // Ignora linhas de cabeçalho e totais
    if (
      linha.toUpperCase().includes('TOTAL') || 
      linha.toUpperCase().includes('VALOR A PAGAR') ||
      linha.toUpperCase().includes('FORMA DE PAGAMENTO') ||
      linha.toUpperCase().includes('SUBTOTAL') ||
      linha.toUpperCase().includes('DESCONTO')
    ) {
      // Se tiver valor total, captura
      const matchTotal = linha.match(/(?:R\$|\:|\s)\s*([0-9]{1,4}[.,][0-9]{2})\b/);
      if (matchTotal && !valorTotal) {
        valorTotal = parseFloat(matchTotal[1].replace('.', '').replace(',', '.'));
      }
      continue;
    }

    // Procura padrão com valores monetários na linha
    // Ex: "LEITE CONDENSADO 395G ... 1 ... 7,50 ... 7,50"
    const valoresMonetarios = linha.match(/\b[0-9]{1,4}[.,][0-9]{2}\b/g);
    if (valoresMonetarios && valoresMonetarios.length >= 1) {
      // O último valor geralmente é o total do item
      const vlTotalStr = valoresMonetarios[valoresMonetarios.length - 1];
      const precoTotalItem = parseFloat(vlTotalStr.replace('.', '').replace(',', '.'));

      let precoUnitario = precoTotalItem;
      let quantidade = 1;

      if (valoresMonetarios.length >= 2) {
        const vlUnitStr = valoresMonetarios[valoresMonetarios.length - 2];
        precoUnitario = parseFloat(vlUnitStr.replace('.', '').replace(',', '.'));
      }

      // Procura quantidade
      const matchQtd = linha.match(/(?:Qtd\.?|Qtde\.?|QTD)\s*[:.]?\s*([0-9]+(?:[.,][0-9]+)?)/i) ||
                       linha.match(/\b([0-9]+(?:[.,][0-9]{1,3})?)\s*(?:UN|KG|PC|LT|CX|FD)\b/i);
      if (matchQtd) {
        quantidade = parseFloat(matchQtd[1].replace(',', '.')) || 1;
      } else if (precoUnitario > 0 && precoTotalItem > 0) {
        quantidade = parseFloat((precoTotalItem / precoUnitario).toFixed(2)) || 1;
      }

      // Limpa nome do produto removendo códigos, unidades e valores do final
      let nomeProduto = linha
        .replace(/^(?:[0-9]{1,4}\b|[0-9]{7,14}\b)\s*/g, '') // remove código no início
        .replace(/(?:Qtd\.?|Qtde\.?|QTD|UN|KG|PC|LT|CX|FD).*$/i, '') // remove da quantidade em diante
        .replace(/\b[0-9]{1,4}[.,][0-9]{2}\b/g, '') // remove números com virgula
        .replace(/[0-9]{8,}/g, '') // remove códigos de barra
        .trim();

      if (!nomeProduto || nomeProduto.length < 2) {
        // Tenta pegar a linha anterior se for multilinhas
        if (i > 0 && linhas[i - 1].length > 2 && !linhas[i - 1].match(/[0-9]{1,4}[.,][0-9]{2}/)) {
          nomeProduto = linhas[i - 1];
        } else {
          nomeProduto = `Item ${itens.length + 1}`;
        }
      }

      // Evita itens espúrios (como cabeçalhos de tabela)
      if (precoTotalItem > 0 && !nomeProduto.toUpperCase().includes('VL. TOTAL')) {
        itens.push({
          id: `item-sefaz-${Date.now()}-${itens.length}`,
          nome: nomeProduto.replace(/\s+/g, ' ').trim(),
          quantidade: quantidade > 0 ? quantidade : 1,
          precoUnitario: precoUnitario > 0 ? precoUnitario : precoTotalItem,
          precoTotal: precoTotalItem,
          categoria: 'Supermercado',
          selecionado: true
        });
      }
    }
  }

  // Se não capturou o total, soma os itens
  const somaItens = itens.reduce((acc, curr) => acc + curr.precoTotal, 0);
  if (valorTotal <= 0) {
    valorTotal = somaItens;
  }

  return {
    estabelecimento,
    data,
    valorTotal: parseFloat(valorTotal.toFixed(2)),
    desconto: 0,
    formaPagamentoSugerida: '💳 Crédito',
    naturezaSugerida: '🛒 Alimentação',
    categoriaSugerida: 'Supermercado',
    chaveAcesso,
    itens
  };
}
