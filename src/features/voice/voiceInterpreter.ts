import type { FormaPagamento, TipoLancamento } from '../../types';

export interface VozInterpretada {
  sucesso: boolean;
  tipo?: TipoLancamento;
  valor?: number;
  pagamento?: FormaPagamento;
  natureza?: string;
  categoria?: string;
  descricao?: string;
  parcelas?: number;
  textoOriginal: string;
}

const TABELA_NUMEROS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, três: 3, quatro: 4, cinco: 5,
  seis: 6, meia: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12,
  treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50,
  sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100,
  duzentos: 200, duzentas: 200, trezentos: 300, quatrocentos: 400, quinhentos: 500,
  seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900, mil: 1000
};

export function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function converterTextoParaNumero(texto: string): number | null {
  const palavras = texto.split(' ');
  let total = 0;
  let atual = 0;
  let encontrou = false;

  for (const palavra of palavras) {
    if (TABELA_NUMEROS[palavra] !== undefined) {
      encontrou = true;
      const num = TABELA_NUMEROS[palavra];
      if (num === 1000) {
        total += (atual === 0 ? 1 : atual) * 1000;
        atual = 0;
      } else if (num >= 100) {
        atual += num;
      } else {
        atual += num;
      }
    }
  }

  total += atual;
  return encontrou ? total : null;
}

export function extrairValorVoz(texto: string): number | null {
  // 1. Tentar dígitos diretos "R$ 150,50" ou "150 reais"
  const regexDigito = /(?:r\$|reais?)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:reais|pila|conto)?/i;
  const matchDigito = texto.match(regexDigito);
  if (matchDigito && matchDigito[1]) {
    const num = parseFloat(matchDigito[1].replace(',', '.'));
    if (!isNaN(num) && num > 0) return num;
  }

  // 2. Tentar número por extenso
  const norm = normalizarTexto(texto);
  const extenso = converterTextoParaNumero(norm);
  if (extenso && extenso > 0) return extenso;

  return null;
}

export function identificarTipoVoz(texto: string): TipoLancamento {
  const norm = normalizarTexto(texto);
  if (/\b(recebi|ganhei|salario|entrada|rendimento|venda|faturamento)\b/.test(norm)) {
    return 'Receita';
  }
  if (/\b(investi|investimento|apliquei|aporte|poupanca|cdb|acoes|reserva)\b/.test(norm)) {
    return 'Investimento';
  }
  return 'Despesa';
}

export function identificarPagamentoVoz(texto: string, parcelasIdentificadas?: number): FormaPagamento {
  const norm = normalizarTexto(texto);

  // 1. Qualquer menção de parcelamento ("em X vezes", "2x", etc) ou parcelas > 1 é SEMPRE Cartão de Crédito
  if ((parcelasIdentificadas && parcelasIdentificadas > 1) || 
      /\b(vezes|parcelado|parcelada|parcelamento|parcelas|parcela|\d+x)\b/.test(norm)) {
    return '💳 Crédito';
  }

  // 2. Débito explícito ("no débito", "cartão de débito")
  if (/\b(debito|cartao de debito)\b/.test(norm)) {
    return '🏦 Débito';
  }

  // 3. Crédito explícito ou menção de "no cartão", "cartão"
  if (/\b(credito|cartao de credito|cartao)\b/.test(norm)) {
    return '💳 Crédito';
  }

  // 4. Pix
  if (/\b(pix|chave)\b/.test(norm)) {
    return '📱 Pix';
  }

  // 5. Dinheiro / Espécie
  if (/\b(dinheiro|especie|cedula|em maos)\b/.test(norm)) {
    return '💵 Dinheiro';
  }

  // 6. Boleto
  if (/\b(boleto|carne)\b/.test(norm)) {
    return '📝 Boleto';
  }

  return '📱 Pix';
}

export function identificarNaturezaECategoria(texto: string, tipo: TipoLancamento): { natureza: string; categoria: string } {
  const norm = normalizarTexto(texto);

  const mapeamentoTermos: Array<{ regex: RegExp; naturezaLabel: string; categoriaNome: string }> = [
    // Educação específica
    { regex: /\b(maria eduarda|escola maria eduarda)\b/, naturezaLabel: '📚 Educação', categoriaNome: 'Escola da Maria Eduarda' },
    { regex: /\b(cecilia|escola cecilia)\b/, naturezaLabel: '📚 Educação', categoriaNome: 'Escola da Cecília' },
    { regex: /\b(isaac|escola isaac)\b/, naturezaLabel: '📚 Educação', categoriaNome: 'Escola do Isaac' },
    { regex: /\b(cursinho|pre vestibular|vestibular)\b/, naturezaLabel: '📚 Educação', categoriaNome: 'Cursinho pré-vestibular' },
    { regex: /\b(faculdade|universidade|mensalidade escolar|matricula)\b/, naturezaLabel: '📚 Educação', categoriaNome: 'Mensalidade Escolar / Faculdade' },
    { regex: /\b(curso|treinamento|workshop|aula)\b/, naturezaLabel: '📚 Educação', categoriaNome: 'Cursos e Treinamentos' },
    { regex: /\b(livro|didatico|papelaria|material escolar)\b/, naturezaLabel: '📚 Educação', categoriaNome: 'Livros e Material Didático' },
    
    // Alimentação
    { regex: /\b(mercado|supermercado|compras|feira|acougue|padaria)\b/, naturezaLabel: '🛒 Alimentação', categoriaNome: 'Supermercado' },
    { regex: /\b(almoço|almoco|jantar|restaurante|lanche|delivery|ifood|pizza|hamburguer)\b/, naturezaLabel: '🛒 Alimentação', categoriaNome: 'Restaurante / Delivery' },
    
    // Transporte
    { regex: /\b(combustivel|gasolina|etanol|alcool|posto|abasteci)\b/, naturezaLabel: '🚗 Transporte', categoriaNome: 'Combustível' },
    { regex: /\b(uber|taxi|corrida|99)\b/, naturezaLabel: '🚗 Transporte', categoriaNome: 'Uber / Táxi / 99' },
    { regex: /\b(ipva|seguro veiculo|mecanico|pneu|revisao)\b/, naturezaLabel: '🚗 Transporte', categoriaNome: 'Manutenção e Mecânica' },
    
    // Moradia
    { regex: /\b(aluguel|condominio|iptu)\b/, naturezaLabel: '🏠 Moradia', categoriaNome: 'Aluguel / Condomínio' },
    { regex: /\b(luz|energia|enel|cemig)\b/, naturezaLabel: '🏠 Moradia', categoriaNome: 'Energia Elétrica' },
    { regex: /\b(internet|wifi|fibra|claro|vivo|tv)\b/, naturezaLabel: '🏠 Moradia', categoriaNome: 'Internet / TV a Cabo' },
    { regex: /\b(agua|gas|encanado)\b/, naturezaLabel: '🏠 Moradia', categoriaNome: 'Água e Gás' },
    
    // Saúde
    { regex: /\b(farmacia|remedio|medicamento|drogaria)\b/, naturezaLabel: '🏥 Saúde', categoriaNome: 'Farmácia e Medicamentos' },
    { regex: /\b(medico|consulta|exame|dentista|hospital|plano de saude)\b/, naturezaLabel: '🏥 Saúde', categoriaNome: 'Consultas Médicas' },
    
    // Lazer
    { regex: /\b(cinema|viagem|passeio|hotel|show|festa)\b/, naturezaLabel: '🎨 Lazer', categoriaNome: 'Viagens e Passeios' },
    { regex: /\b(netflix|spotify|streaming|amazon|prime|disney)\b/, naturezaLabel: '🎨 Lazer', categoriaNome: 'Streaming (Netflix, Spotify, etc)' },
    
    // Pessoal & Família
    { regex: /\b(academia|treino|musculacao|crossfit|personal)\b/, naturezaLabel: '👤 Pessoal', categoriaNome: 'Academia / Musculação / Esporte' },
    { regex: /\b(barba|cabelo|barbearia|salao|estetica)\b/, naturezaLabel: '👤 Pessoal', categoriaNome: 'Barbearia / Cabeleireiro / Estética' },
    { regex: /\b(mesada|filhos|criancas)\b/, naturezaLabel: '👨‍👩‍👧 Família', categoriaNome: 'Mesada e Extras dos Filhos' },
    
    // Pets
    { regex: /\b(racao|veterinario|pet|cachorro|gato)\b/, naturezaLabel: '🐾 Pets', categoriaNome: 'Ração e Petiscos' },
  ];

  if (tipo === 'Receita') {
    return { natureza: '💰 Impostos', categoria: 'Salário / Pró-labore' };
  }

  if (tipo === 'Investimento') {
    return { natureza: '📦 Outros', categoria: 'Aporte Renda Fixa (Tesouro, CDB)' };
  }

  for (const item of mapeamentoTermos) {
    if (item.regex.test(norm)) {
      return { natureza: item.naturezaLabel, categoria: item.categoriaNome };
    }
  }

  return { natureza: '🛒 Alimentação', categoria: 'Supermercado' };
}

const PALAVRAS_PARCELAS: Record<string, number> = {
  uma: 1, um: 1,
  duas: 2, dois: 2,
  tres: 3, três: 3,
  quatro: 4,
  cinco: 5,
  seis: 6, meia: 6,
  sete: 7,
  oito: 8,
  nove: 9,
  dez: 10,
  onze: 11,
  doze: 12,
  treze: 13, quatorze: 14, catorze: 14, quinze: 15,
  dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19,
  vinte: 20,
};

export function identificarParcelasVoz(texto: string): number | undefined {
  const norm = normalizarTexto(texto);

  // 1. Tentar dígitos numéricos diretos: "em 2 vezes", "2x", "em 3 parcelas"
  const matchDigito = norm.match(/(?:em|de|para)?\s*(\d{1,2})\s*(?:vezes|x|parcelas|prestacoes)\b/i);
  if (matchDigito && matchDigito[1]) {
    const qtd = parseInt(matchDigito[1], 10);
    if (qtd > 1 && qtd <= 48) return qtd;
  }

  // 2. Tentar palavras por extenso: "em duas vezes", "duas vezes", "três vezes", "em três parcelas"
  const matchPalavra = norm.match(/(?:em|de|para)?\s*([a-zçãéíóú]+)\s*(?:vezes|x|parcelas|prestacoes)\b/i);
  if (matchPalavra && matchPalavra[1]) {
    const palavra = matchPalavra[1].toLowerCase().trim();
    if (PALAVRAS_PARCELAS[palavra] !== undefined) {
      const qtd = PALAVRAS_PARCELAS[palavra];
      if (qtd > 1 && qtd <= 48) return qtd;
    }
  }

  // 3. Padrão "parcelado em X"
  const matchParcelado = norm.match(/parcelad[oa]\s+(?:em\s+)?(\d{1,2}|[a-zçãéíóú]+)/i);
  if (matchParcelado && matchParcelado[1]) {
    const termo = matchParcelado[1].toLowerCase().trim();
    const num = parseInt(termo, 10);
    if (!isNaN(num) && num > 1 && num <= 48) return num;
    if (PALAVRAS_PARCELAS[termo] !== undefined && PALAVRAS_PARCELAS[termo] > 1) {
      return PALAVRAS_PARCELAS[termo];
    }
  }

  return undefined;
}

export function interpretarComandoVoz(frase: string): VozInterpretada {
  if (!frase || frase.trim().length === 0) {
    return { sucesso: false, textoOriginal: '' };
  }

  const tipo = identificarTipoVoz(frase);
  const valor = extrairValorVoz(frase);
  const parcelas = identificarParcelasVoz(frase);
  const pagamento = identificarPagamentoVoz(frase, parcelas);
  const { natureza, categoria } = identificarNaturezaECategoria(frase, tipo);

  // Sanitização profunda da descrição: remove moedas, números, formas de pagamento, parcelas e verbos
  let s = frase
    .replace(/(?<!\d)[,.;:!?](?!\d)/gu, ' ')
    .replace(/r\$/gi, ' ');

  // Moedas (BRL, R$, reais, etc)
  s = s.replace(/(?<!\p{L})(?:brl|usd|eur|reais?|real|pila|conto|centavos?)(?!\p{L})/giu, ' ');
  // Números
  s = s.replace(/(?<!\p{L})\d+(?:[.,]\d{1,2})?(?!\p{L})/gu, ' ');
  // Parcelas ("10x", "em 2 vezes", "3 parcelas")
  s = s.replace(/(?<!\p{L})\d{1,2}\s*x(?!\p{L})/giu, ' ');
  s = s.replace(/(?:em|de|para)?\s*(?:\d{1,2}|uma|um|duas|dois|tres|três|quatro|cinco|seis|sete|oito|nove|dez|doze)?\s*(?:vezes|parcelas|prestações|prestacoes)(?!\p{L})/giu, ' ');
  s = s.replace(/(?<!\p{L})parcelad[oa](?:\s+em)?(?!\p{L})/giu, ' ');
  // Formas de pagamento e conectivos ("é débito", "foi no débito", "no crédito", "via pix")
  s = s.replace(/(?<!\p{L})(?:é|e|foi|será|sera|no|na|em|via|pelo|pela|com|de)?\s*(?:débito|debito|crédito|credito|cartão|cartao|pix|dinheiro|espécie|especie|boleto)(?!\p{L})/giu, ' ');
  s = s.replace(/(?<!\p{L})(?:débito|debito|crédito|credito|cartão|cartao|pix|dinheiro|espécie|especie|boleto)(?!\p{L})/giu, ' ');
  // Verbos de ação financeira
  s = s.replace(/(?<!\p{L})(?:gastei|paguei|gasto|gastos|comprei|compra|recebi|ganhei|investi|aporte|lancei|lançar|coloquei)(?!\p{L})/giu, ' ');
  // Preposições e artigos soltos
  s = s.replace(/(?<!\p{L})(?:é|e|no|na|nos|nas|em|de|do|da|dos|das|com|via|pelo|pela|pelos|pelas|um|uma|uns|umas|o|a|os|as|pra|para|por)(?!\p{L})/giu, ' ');
  // Pontuações
  s = s.replace(/[^\p{L}\p{N}\s-]/gu, ' ');
  s = s.replace(/\s+/g, ' ').trim();

  let descricao = s;

  // Se ficou vazio, com menos de 2 caracteres ou apenas "mercado/supermercado", usar diretamente a categoria identificada
  const limpaNorm = normalizarTexto(descricao);
  const catNorm = normalizarTexto(categoria);

  if (!descricao || descricao.length < 2 || limpaNorm === 'supermercado' || limpaNorm === 'mercado' || limpaNorm === catNorm) {
    descricao = categoria;
  } else {
    // Capitalizar primeira letra preservando nomes compostos
    descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);
  }

  return {
    sucesso: Boolean(valor && valor > 0),
    tipo,
    valor: valor || undefined,
    pagamento,
    natureza,
    categoria,
    descricao,
    parcelas,
    textoOriginal: frase,
  };
}
