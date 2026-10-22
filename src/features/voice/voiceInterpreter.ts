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

export interface InfoMultiplicadorVoz {
  qtd: number;
  unitario: number;
  total: number;
  unidadeNome?: string;
  itemNome: string;
}

export function converterPalavraParaNumero(p: string): number | null {
  if (!p) return null;
  const limpo = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (TABELA_NUMEROS[limpo] !== undefined) return TABELA_NUMEROS[limpo];
  const num = parseFloat(limpo.replace(',', '.'));
  return isNaN(num) ? null : num;
}

function extrairPrecoFinal(str: string): { val: number; antes?: string } | null {
  if (!str) return null;
  const s = str.trim().replace(/[,;]+$/, '');

  // 1. Composto falado ou escrito: "5 e 80", "6 e 70", "5 reais e 80 centavos", "5,80 BRL", "6,70"
  const matchComposto = s.match(/(?:r\$|brl)?\s*(\d+)\s*(?:reais|real|brl)?\s*(?:e|com|vírgula|virgula|,|\.)\s*(\d{1,2})\s*(?:centavos|reais|real|brl)?$/i);
  if (matchComposto) {
    const int = parseInt(matchComposto[1], 10);
    const centStr = matchComposto[2].length === 1 ? matchComposto[2] + '0' : matchComposto[2];
    const cent = parseInt(centStr, 10);
    const val = int + (cent / 100);
    const antes = s.slice(0, matchComposto.index).trim();
    return { val, antes };
  }

  // 2. Centavos direto: "50 centavos", "80 centavos"
  const matchCent = s.match(/(\d+)\s*centavos?$/i);
  if (matchCent) {
    const val = parseInt(matchCent[1], 10) / 100;
    const antes = s.slice(0, matchCent.index).trim();
    return { val, antes };
  }

  // 3. Simples com moeda ou número decimal/inteiro: "90 BRL", "90 reais", "90,00", "90"
  const matchMoeda = s.match(/(?:r\$|brl)?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|brl|pila|conto)?$/i);
  if (matchMoeda) {
    const val = parseFloat(matchMoeda[1].replace(',', '.'));
    const antes = s.slice(0, matchMoeda.index).trim();
    return { val, antes };
  }

  return null;
}

export function detectarMultiplicadorVoz(texto: string): InfoMultiplicadorVoz | null {
  if (!texto) return null;

  // Encontrar o padrão "X ... cada" aceitando sufixos após cada (ex: "3 sacos de cimento, 90 BRL cada, 3 vezes no cartão")
  const matchCada = texto.match(/^(.*?)[,;\s]+(?:a|por|de)?\s*([0-9a-zA-Z\s.,$]+?)\s*(?:cada(?:\s+um|\s+uma)?|a\s+unidade|por\s+unidade)\b(?:\s*[,;]?\s*(.*))?$/i);
  if (!matchCada) return null;

  const precoInfo = extrairPrecoFinal(matchCada[2]);
  if (!precoInfo || precoInfo.val <= 0) return null;

  const unitario = precoInfo.val;
  let resto = (matchCada[1] + ' ' + (precoInfo.antes || '')).trim().replace(/[,;]+$/, '').trim();

  // Extrair quantidade do início
  let qtd = 1;
  const matchQtd = resto.match(/^(\d+|um|uma|dois|duas|tres|três|quatro|cinco|seis|meia|sete|oito|nove|dez|doze|vinte)\s+/i);
  if (matchQtd) {
    const qStr = matchQtd[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    qtd = TABELA_NUMEROS[qStr] !== undefined ? TABELA_NUMEROS[qStr] : parseInt(qStr, 10);
    resto = resto.slice(matchQtd[0].length).trim();
  }

  // Extrair unidade de medida opcional (sacos, latas, garrafas, caixas, etc)
  let unidade: string | undefined = undefined;
  const matchUnidade = resto.match(/^(sacos?|unidades?|peças?|pecas?|caixas?|latas?|metros?|kilos?|quilos?|kg|itens?|pacotes?|rolos?|barras?|tubos?|fardos?|garrafas?)\s+(?:de\s+)?/i);
  if (matchUnidade) {
    unidade = matchUnidade[1];
    resto = resto.slice(matchUnidade[0].length).trim();
  }

  resto = resto.replace(/^(?:de|da|do)\s+/i, '').replace(/[,;]+$/, '').trim();

  if (resto && !['vezes', 'parcelas', 'dias', 'meses', 'horas'].includes(resto.toLowerCase())) {
    return {
      qtd,
      unitario,
      total: Math.round(qtd * unitario * 100) / 100,
      unidadeNome: unidade,
      itemNome: resto
    };
  }

  return null;
}

export function extrairValorVoz(texto: string): number | null {
  if (!texto) return null;

  // 1. Detectar multiplicação de quantidade por valor unitário
  const mult = detectarMultiplicadorVoz(texto);
  if (mult && mult.total > 0) {
    return mult.total;
  }

  // 2. Unificar vírgula com espaço: "12, 80" -> "12,80"
  let s = texto.replace(/(\d+)\s*,\s*(\d{1,2})/g, '$1,$2');

  // 3. Composto falado: "12 e 80", "12 com 80", "12 vírgula 80", "12 reais e 80 centavos", "12 reais e 80"
  const matchComposto = s.match(/(?:r\$|brl|reais?)?\s*(\d+)\s*(?:reais|real|brl)?\s*(?:e|com|vírgula|virgula)\s*(\d{1,2})\s*(?:centavos|reais|real|brl|pila|conto)?/i);
  if (matchComposto) {
    const inteiro = parseInt(matchComposto[1], 10);
    let centavosStr = matchComposto[2];
    if (centavosStr.length === 1) centavosStr += '0';
    const centavos = parseInt(centavosStr, 10);
    const total = inteiro + (centavos / 100);
    if (!isNaN(total) && total > 0) return total;
  }

  // 4. Número explicitamente acompanhado da palavra "reais", "brl" ou "r$"
  const matchReais = s.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real|brl|r\$|pila|conto)\b/i);
  if (matchReais && matchReais[1]) {
    const num = parseFloat(matchReais[1].replace(',', '.'));
    if (!isNaN(num) && num > 0) return num;
  }

  // 5. Dígito direto com decimais (ex: "12,80", "12.80", "12,8", "12.8")
  const matchDecimal = s.match(/(?:r\$|reais?)?\s*(\d+[.,]\d{1,2})\s*(?:reais|real|pila|conto)?/i);
  if (matchDecimal && matchDecimal[1]) {
    const num = parseFloat(matchDecimal[1].replace(',', '.'));
    if (!isNaN(num) && num > 0) return num;
  }

  // 6. Dígito inteiro (ex: "12 reais", "12 conto", "12")
  const matchInteiro = s.match(/(?:r\$|reais?)?\s*(\d+)\s*(?:reais|real|pila|conto)?/i);
  if (matchInteiro && matchInteiro[1]) {
    const num = parseInt(matchInteiro[1], 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // 7. Tentar número por extenso
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

  // 4. Pix (exige 'pix' ou 'chave pix' para não colidir com 'chave de fenda', 'chave inglesa', etc)
  if (/\b(pix|chave\s*pix|chave\s*aleatoria|chave\s*cpf|chave\s*telefone)\b/.test(norm)) {
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

  // Padrão do sistema quando a forma não for especificada: Débito
  return '🏦 Débito';
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
    
    // Alimentação & Bebidas (Supermercado, Alimentos e Bebidas em Geral)
    { 
      regex: /\b(cerveja|cervejas|chope|chopp|refrigerante|suco|bebida|bebidas|vinho|vodka|whisky|agua mineral|energetico)\b/, 
      naturezaLabel: '🛒 Alimentação', 
      categoriaNome: 'Supermercado' 
    },
    { 
      regex: /\b(extrato de tomate|tomate|tomates|molho|arroz|feijao|macarrao|leite|cafe|acucar|oleo|azeite|farinha|manteiga|queijo|presunto|frango|carne|peixe|verdura|legume|fruta|iogurte|bolacha|biscoito|sabonete|detergente|amaciante|desinfetante|papel higienico)\b/, 
      naturezaLabel: '🛒 Alimentação', 
      categoriaNome: 'Supermercado' 
    },
    { regex: /\b(mercado|supermercado|compras|feira|acougue|padaria)\b/, naturezaLabel: '🛒 Alimentação', categoriaNome: 'Supermercado' },
    { regex: /\b(almoço|almoco|jantar|restaurante|lanche|delivery|ifood|pizza|hamburguer)\b/, naturezaLabel: '🛒 Alimentação', categoriaNome: 'Restaurante / Delivery' },
    
    // Manutenção Veicular (Oficina, Mecânica, Peças de Carro e Moto)
    { 
      regex: /\b(manutencao veicular|veicular|oficina|mecanica|mecanico|revisao|troca de oleo|oleo do motor|pneu|pneus|alinhamento|balanceamento|funilaria|autopecas|auto pecas|bateria do carro|freio|pastilha|suspensao)\b/, 
      naturezaLabel: '🔧 Manutenção Veicular', 
      categoriaNome: 'Oficina e Mecânica' 
    },
    { regex: /\b(combustivel|gasolina|etanol|alcool|posto|abasteci)\b/, naturezaLabel: '🚗 Transporte', categoriaNome: 'Combustível' },
    { regex: /\b(uber|taxi|corrida|99)\b/, naturezaLabel: '🚗 Transporte', categoriaNome: 'Uber / Táxi / 99' },
    { regex: /\b(ipva|seguro veiculo)\b/, naturezaLabel: '🚗 Transporte', categoriaNome: 'Seguro Veicular' },
    
    // Imóveis (Materiais de Construção, Ferramentas, Elétrica, Hidráulica, Aluguel e Reformas)
    { 
      regex: /\b(cimento|argamassa|rejunte|tijolo|bloco|lixa|tinta|pincel|rolo de pintura|verniz|thinner|silicone|veda rosca|parafuso|prego|bucha|dobradica|fechadura|torneira|cano|tubo|conexao|sifao|registro|valvula|pvc)\b/, 
      naturezaLabel: '🏢 Imóveis', 
      categoriaNome: 'Ferramentas e Materiais' 
    },
    { 
      regex: /\b(chave de fenda|chave philips|chave fenda|chave inglesa|chave estrela|chave combinada|chave allen|alicate|martelo|furadeira|parafusadeira|serrote|serra|trena|broca|marreta|esmerilhadeira|lixadeira|nivel|estilete|multimetro)\b/, 
      naturezaLabel: '🏢 Imóveis', 
      categoriaNome: 'Ferramentas e Materiais' 
    },
    { 
      regex: /\b(disjuntor|interruptor|tomada|fiação|fiacao|fio eletrico|fio|cabo eletrico|fita isolante|conduite|lampada|lampadas|reator|extensao|plugue|bocal|soquete|fusivel)\b/, 
      naturezaLabel: '🏢 Imóveis', 
      categoriaNome: 'Ferramentas e Materiais' 
    },
    { 
      regex: /\b(enxada|enxadao|pa|rastelo|ancinho|foice|mangueira|podador|pulverizador|regador|tesoura de poda|adubo|fertilizante|terra vegetal)\b/, 
      naturezaLabel: '🏢 Imóveis', 
      categoriaNome: 'Ferramentas e Materiais' 
    },
    { 
      regex: /\b(luvas latex|luva latex|luva de latex|luvas de latex|luva nitrilica|luva de raspa|luva|luvas|oculos de protecao|mascara|bota de seguranca|bota de borracha|capacete|protetor auricular|epi)\b/, 
      naturezaLabel: '🏢 Imóveis', 
      categoriaNome: 'Ferramentas e Materiais' 
    },
    { 
      regex: /\b(imoveis|imovel|aluguel|condominio|iptu|imobiliaria|taxa condominial|reforma|pedreiro|pintor)\b/, 
      naturezaLabel: '🏢 Imóveis', 
      categoriaNome: 'Aluguel / Condomínio' 
    },

    // Moradia (Contas de Consumo Residencial)
    { regex: /\b(luz|energia|enel|cemig)\b/, naturezaLabel: '🏠 Moradia', categoriaNome: 'Energia Elétrica' },
    { regex: /\b(internet|wifi|fibra|claro|vivo|tv)\b/, naturezaLabel: '🏠 Moradia', categoriaNome: 'Internet / TV a Cabo' },
    { regex: /\b(agua|gas|encanado)\b/, naturezaLabel: '🏠 Moradia', categoriaNome: 'Água e Gás' },
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

  // Fallback seguro: se não reconheceu termos específicos, atribui a Outros/Imprevistos
  // NUNCA mais força Alimentação/Supermercado para não distorcer o extrato!
  return { natureza: '📦 Outros', categoria: 'Imprevistos e Diversos' };
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

  const mult = detectarMultiplicadorVoz(frase);
  const tipo = identificarTipoVoz(frase);
  const valor = mult ? mult.total : extrairValorVoz(frase);
  const parcelas = identificarParcelasVoz(frase);
  const pagamento = identificarPagamentoVoz(frase, parcelas);
  const { natureza, categoria } = identificarNaturezaECategoria(frase, tipo);

  let descricao = '';

  if (mult) {
    // Quando detecta quantidade x unitário ("3 sacos de cimento, 90 reais cada")
    const itemLimpo = mult.itemNome
      .replace(/^(?:de|da|do)\s+/i, '')
      .replace(/\s+(?:de|da|do)$/i, '')
      .trim();
    const itemCap = itemLimpo.charAt(0).toUpperCase() + itemLimpo.slice(1);
    const unitarioFormatado = mult.unitario.toFixed(2).replace('.', ',');

    if (mult.unidadeNome) {
      descricao = `${mult.qtd} ${mult.unidadeNome} de ${itemCap} (R$ ${unitarioFormatado} cada)`;
    } else {
      descricao = `${mult.qtd}x ${itemCap} (R$ ${unitarioFormatado} cada)`;
    }
  } else {
    // Sanitização inteligente da descrição: remove moedas, números, formas de pagamento, parcelas e verbos financeiros
    let s = frase
      .replace(/(?<!\d)[,.;:!?](?!\d)/gu, ' ')
      .replace(/r\$/gi, ' ');

    // 1. Formas de pagamento completas ("no débito", "via pix", "em 2x")
    s = s.replace(/(?:é|e|foi|será|sera|no|na|em|via|pelo|pela|com|de)?\s*(?:débito|debito|crédito|credito|cartão|cartao|pix|dinheiro|espécie|especie|boleto)\b/giu, ' ');

    // 2. Parcelas
    s = s.replace(/(?:em|de|para)?\s*\d{1,2}\s*x\b/giu, ' ');
    s = s.replace(/(?:em|de|para)?\s*(?:\d{1,2}|uma|um|duas|dois|tres|três|quatro|cinco|seis|sete|oito|nove|dez|doze)?\s*(?:vezes|parcelas|prestações|prestacoes)\b/giu, ' ');
    s = s.replace(/\bparcelad[oa](?:\s+em)?\b/giu, ' ');

    // 3. Remover valores compostos falados (ex: "12 e 80", "12 com 80", "12 reais e 80 centavos")
    s = s.replace(/\b\d+\s*(?:reais|real)?\s*(?:e|com|vírgula|virgula)\s*\d{1,2}\s*(?:centavos|reais|pila|conto)?\b/giu, ' ');

    // 4. Remover valores normais e moedas
    s = s.replace(/\b\d+(?:[.,]\s*\d{1,2})?\s*(?:reais?|real|pila|conto|centavos?)?\b/giu, ' ');
    s = s.replace(/\b(?:brl|usd|eur|reais?|real|pila|conto|centavos?)\b/giu, ' ');

    // 5. Remover verbos financeiros comuns e palavras residuais como "cada"
    s = s.replace(/\b(?:gastei|paguei|gasto|gastos|comprei|compra|recebi|ganhei|investi|aporte|lancei|lançar|coloquei|cada)\b/giu, ' ');

    // 6. Remover pontuações residuais
    s = s.replace(/[^\p{L}\p{N}\s-]/gu, ' ');
    s = s.replace(/\s+/g, ' ').trim();

    // 7. Remover conectivos soltos apenas no início ou fim para preservar expressões compostas como "Chave de fenda"
    s = s.replace(/^(?:de|da|do|em|no|na|com|para|pra|por)\s+/i, '');
    s = s.replace(/\s+(?:de|da|do|em|no|na|com|para|pra|por)$/i, '');

    descricao = s;

    // Se ficou vazio, com menos de 2 caracteres ou apenas "mercado/supermercado", usar diretamente a categoria identificada
    const limpaNorm = normalizarTexto(descricao);
    const catNorm = normalizarTexto(categoria);

    if (!descricao || descricao.length < 2 || limpaNorm === 'supermercado' || limpaNorm === 'mercado' || limpaNorm === catNorm) {
      descricao = categoria;
    } else {
      // Capitalizar primeira letra preservando nomes compostos
      descricao = descricao.charAt(0).toUpperCase() + descricao.slice(1);
    }
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
