import type { Cartao, Lancamento } from '../types';

/**
 * Retorna a competência (MM/AAAA) do mês seguinte à informada.
 */
export function obterProximaCompetencia(competencia: string): string {
  const [mes, ano] = (competencia || '').split('/').map(Number);
  if (!mes || !ano) return competencia;
  const prox = new Date(ano, mes, 1);
  return `${String(prox.getMonth() + 1).padStart(2, '0')}/${prox.getFullYear()}`;
}

/**
 * Obtém o dia de fechamento e dia de vencimento configurados para o cartão.
 */
export function obterConfigCartao(
  cartaoNome: string | undefined,
  cartoes: Cartao[]
): { diaFechamento: number; diaVencimento: number } {
  const encontrada = cartaoNome
    ? cartoes.find(
        (c) => c.nome === cartaoNome || c.nome.toLowerCase() === cartaoNome.toLowerCase()
      )
    : undefined;

  if (encontrada) {
    return {
      diaFechamento: encontrada.diaFechamento || 25,
      diaVencimento: encontrada.diaVencimento || 5,
    };
  }

  if (cartaoNome && cartaoNome.toLowerCase().includes('bradesco')) {
    return { diaFechamento: 10, diaVencimento: 20 };
  }

  return { diaFechamento: 25, diaVencimento: 5 };
}

/**
 * Cria uma data adicionando `deslocamentoMeses` sem estourar o mês
 * (ex: 31 de julho + 2 meses vira 30 de setembro, não 1º de outubro).
 */
export function criarDataParcelaSegura(
  ano: number,
  mes: number, // 1..12
  dia: number,
  deslocamentoMeses: number
): Date {
  const ultimoDiaMes = new Date(ano, mes - 1 + deslocamentoMeses + 1, 0).getDate();
  return new Date(ano, mes - 1 + deslocamentoMeses, Math.min(dia, ultimoDiaMes));
}

/**
 * Calcula a competência oficial (MM/AAAA) e data de vencimento de uma parcela no cartão de crédito.
 *
 * Regras bancárias brasileiras:
 * 1. Se `diaCompra > diaFechamento`, a compra entra no ciclo que fecha no mês seguinte (+1 mês).
 * 2. Se `diaVencimento < diaFechamento` (ex: fecha dia 25 e vence dia 5), a fatura fechada
 *    no mês M vence no mês M+1 — logo sua competência oficial é o mês do vencimento (+1 mês).
 */
export function calcularFaturaParcela(
  anoCompra: number,
  mesCompra: number, // 1..12
  diaCompra: number,
  diaFechamento: number,
  diaVencimento: number,
  numeroParcela: number // 1..N
): { competencia: string; vencimento: Date } {
  const mesFechamentoOffset = diaCompra > diaFechamento ? 1 : 0;
  const mesVencimentoOffset = diaVencimento < diaFechamento ? 1 : 0;
  const deslocamentoMeses = mesFechamentoOffset + mesVencimentoOffset + (numeroParcela - 1);

  const dataFatura = new Date(anoCompra, mesCompra - 1 + deslocamentoMeses, 1);
  const compMes = String(dataFatura.getMonth() + 1).padStart(2, '0');
  const compAno = dataFatura.getFullYear();

  const ultimoDiaMesVenc = new Date(compAno, dataFatura.getMonth() + 1, 0).getDate();
  const diaVencSeguro = Math.min(Math.max(1, diaVencimento), ultimoDiaMesVenc);

  return {
    competencia: `${compMes}/${compAno}`,
    vencimento: new Date(compAno, dataFatura.getMonth(), diaVencSeguro),
  };
}

function extrairPartesData(
  dataVal: Date | string,
  dataStrOpcional?: string
): { ano: number; mes: number; dia: number } {
  if (dataStrOpcional && /^\d{4}-\d{2}-\d{2}$/.test(dataStrOpcional)) {
    const [a, m, d] = dataStrOpcional.split('-').map(Number);
    return { ano: a, mes: m, dia: d };
  }
  const d = dataVal instanceof Date ? dataVal : new Date(dataVal);
  return {
    ano: d.getFullYear(),
    mes: d.getMonth() + 1,
    dia: d.getDate(),
  };
}

function competenciaFormulaAntiga(
  ano: number,
  mes: number,
  dia: number,
  diaFechamento: number
): string {
  const offsetFechamento = dia > diaFechamento ? 1 : 0;
  const dataAntiga = new Date(ano, mes - 1 + offsetFechamento, 1);
  return `${String(dataAntiga.getMonth() + 1).padStart(2, '0')}/${dataAntiga.getFullYear()}`;
}

/**
 * Corrige automaticamente lançamentos de cartão de crédito existentes que foram gerados
 * pela regra antiga (que ignorava o deslocamento de mês quando `diaVencimento < diaFechamento`).
 * É idempotente: só atualiza compras cuja 1ª parcela ainda esteja exatamente na competência antiga.
 */
export function repararFaturasCartaoDesatualizadas(
  lancamentos: Lancamento[],
  cartoes: Cartao[]
): { lista: Lancamento[]; alterados: Lancamento[] } {
  const alterados: Lancamento[] = [];
  if (!lancamentos || lancamentos.length === 0) {
    return { lista: lancamentos, alterados };
  }

  const gruposCompra = new Map<string, Lancamento[]>();
  lancamentos.forEach((l) => {
    if (l.pagamento === '💳 Crédito' && l.compraId && l.fatura) {
      const listaGrupo = gruposCompra.get(l.compraId) || [];
      listaGrupo.push(l);
      gruposCompra.set(l.compraId, listaGrupo);
    }
  });

  const atualizacoesPorId = new Map<string, Lancamento>();

  // 1. Compras parceladas (agrupadas por compraId)
  gruposCompra.forEach((parcelas) => {
    parcelas.sort((a, b) => (a.parcela || 1) - (b.parcela || 1));
    const p1 = parcelas[0];
    if (!p1) return;

    const { diaFechamento, diaVencimento } = obterConfigCartao(p1.cartao, cartoes);
    if (diaVencimento >= diaFechamento) return;

    const { ano, mes, dia } = extrairPartesData(p1.data, p1.detalhesMercado?.dataCompra);
    const compAntigaP1 = competenciaFormulaAntiga(ano, mes, dia, diaFechamento);

    if (p1.competencia !== compAntigaP1) return;

    parcelas.forEach((item) => {
      const numParcela = item.parcela || 1;
      const { competencia, vencimento } = calcularFaturaParcela(
        ano,
        mes,
        dia,
        diaFechamento,
        diaVencimento,
        numParcela
      );
      const dataSegura =
        item.origem === 'meu-mercado'
          ? item.data
          : criarDataParcelaSegura(ano, mes, dia, numParcela - 1);

      const atualizado: Lancamento = {
        ...item,
        data: dataSegura,
        competencia,
        fatura: competencia,
        vencimento,
        atualizadoEm: new Date(),
      };
      atualizacoesPorId.set(item.id, atualizado);
      alterados.push(atualizado);
    });
  });

  // 2. Compras à vista no crédito (sem compraId, mas com fatura preenchida)
  lancamentos.forEach((item) => {
    if (item.pagamento !== '💳 Crédito' || item.compraId || !item.fatura) return;

    const { diaFechamento, diaVencimento } = obterConfigCartao(item.cartao, cartoes);
    if (diaVencimento >= diaFechamento) return;

    const { ano, mes, dia } = extrairPartesData(item.data, item.detalhesMercado?.dataCompra);
    const compAntiga = competenciaFormulaAntiga(ano, mes, dia, diaFechamento);

    if (item.competencia !== compAntiga) return;

    const { competencia, vencimento } = calcularFaturaParcela(
      ano,
      mes,
      dia,
      diaFechamento,
      diaVencimento,
      1
    );
    const atualizado: Lancamento = {
      ...item,
      competencia,
      fatura: competencia,
      vencimento,
      atualizadoEm: new Date(),
    };
    atualizacoesPorId.set(item.id, atualizado);
    alterados.push(atualizado);
  });

  if (atualizacoesPorId.size === 0) {
    return { lista: lancamentos, alterados };
  }

  const novaLista = lancamentos.map((l) => atualizacoesPorId.get(l.id) || l);
  return { lista: novaLista, alterados };
}
