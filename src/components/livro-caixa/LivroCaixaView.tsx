import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda, formatarData } from '../../lib/formatters';
import { pdf } from '@react-pdf/renderer';
import { LivroCaixaPdfDocument } from '../../features/pdf/LivroCaixaPdfDocument';
import { exportarLancamentosCSV } from '../../features/import/ofxParser';
import { 
  FileDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  PiggyBank, 
  Scale, 
  Loader2,
  List,
  Table,
  CalendarCheck,
  ShoppingCart
} from 'lucide-react';
import type { Lancamento } from '../../types';
import { ReciboMercadoModal } from '../mercado/ReciboMercadoModal';

export const LivroCaixaView: React.FC = () => {
  const { competenciaAtiva, obterResumoLivroCaixa, lancamentos, usuario } = useFinanceStore();
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [modoVisualizacao, setModoVisualizacao] = useState<'extrato' | 'tabela'>('extrato');
  const [lancamentoMercado, setLancamentoMercado] = useState<Lancamento | null>(null);

  const resumo = obterResumoLivroCaixa(competenciaAtiva);

  // Lançamentos ordenados cronologicamente para compor o Livro Caixa
  const lancamentosDoMes = lancamentos
    .filter((l) => l.competencia === competenciaAtiva && l.status === 'Lançado')
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  // Calcular saldo acumulado linha a linha
  let acumulador = resumo.saldoAnterior;
  const lancamentosComSaldo = lancamentosDoMes.map((item) => {
    if (item.tipo === 'Receita') {
      acumulador += item.valor;
    } else if (item.tipo === 'Despesa') {
      acumulador -= item.valor;
    }
    return {
      ...item,
      saldoAcumulado: acumulador,
    };
  });

  // Agrupar por semana do mês para exibir o saldo acumulado semanal (evitando a poluição diária na tela)
  interface GrupoSemana {
    idSemana: number;
    titulo: string;
    itens: typeof lancamentosComSaldo;
    saldoFinalSemana: number;
    totalReceitasSemana: number;
    totalDespesasSemana: number;
  }

  const obterSemanaInfo = (data: string | Date) => {
    const d = typeof data === 'string' ? new Date(data + 'T00:00:00') : data;
    const dia = d.getDate();
    if (dia <= 7) return { id: 1, titulo: 'Semana 1 • 01 a 07' };
    if (dia <= 14) return { id: 2, titulo: 'Semana 2 • 08 a 14' };
    if (dia <= 21) return { id: 3, titulo: 'Semana 3 • 15 a 21' };
    if (dia <= 28) return { id: 4, titulo: 'Semana 4 • 22 a 28' };
    return { id: 5, titulo: 'Semana 5 • 29 ao fechamento' };
  };

  const gruposPorSemana: GrupoSemana[] = [];
  lancamentosComSaldo.forEach((item) => {
    const info = obterSemanaInfo(item.data);
    let grupo = gruposPorSemana.find((g) => g.idSemana === info.id);
    if (!grupo) {
      grupo = {
        idSemana: info.id,
        titulo: info.titulo,
        itens: [],
        saldoFinalSemana: item.saldoAcumulado,
        totalReceitasSemana: 0,
        totalDespesasSemana: 0,
      };
      gruposPorSemana.push(grupo);
    }
    grupo.itens.push(item);
    grupo.saldoFinalSemana = item.saldoAcumulado;
    if (item.tipo === 'Receita') grupo.totalReceitasSemana += item.valor;
    if (item.tipo === 'Despesa') grupo.totalDespesasSemana += item.valor;
  });

  const handleExportarPdf = async () => {
    try {
      setGerandoPdf(true);
      const blob = await pdf(
        <LivroCaixaPdfDocument 
          resumo={resumo} 
          lancamentos={lancamentosDoMes} 
          nomeTitular={usuario.nome}
          banco={usuario.bancoPrincipal}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Extrato_Financeiro_${competenciaAtiva.replace('/', '_')}_${usuario.nome.replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao gerar PDF do Livro Caixa:', err);
      alert('Não foi possível gerar o arquivo PDF neste momento.');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Barra de Ações do Topo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>
            Livro Caixa • {competenciaAtiva}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Titular: <strong style={{ color: '#FFFFFF' }}>{usuario.nome}</strong> • {lancamentosComSaldo.length} lançamentos
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => exportarLancamentosCSV(lancamentosDoMes, `Extrato_${competenciaAtiva.replace('/', '_')}.csv`)}
            className="btn-secondary"
            style={{
              padding: '0.65rem 1rem',
              fontSize: '0.85rem',
              gap: '0.5rem',
              borderColor: '#10B981',
              color: '#34D399'
            }}
            title="Exportar para Excel / Google Planilhas (CSV)"
          >
            <Table size={16} color="#10B981" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleExportarPdf}
            disabled={gerandoPdf}
            className="btn-primary"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.9rem',
              gap: '0.5rem'
            }}
          >
            {gerandoPdf ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <FileDown size={18} />
                <span>Exportar PDF para Imprimir</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cards de Resumo Financeiro no Topo (Layout em 3 linhas: 2 + 2 + 1) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}>
        {/* Linha 1: Saldo Anterior */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: '#0F2744',
          border: '1px solid #1E3A5F',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#AAB4BE', textTransform: 'uppercase' }}>Saldo Anterior</span>
            <Scale size={15} color="#5090D3" />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
            {formatarMoeda(resumo.saldoAnterior)}
          </p>
        </div>

        {/* Linha 1: Receitas */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(76, 175, 80, 0.12)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#66BB6A', textTransform: 'uppercase' }}>Receitas (+)</span>
            <ArrowUpRight size={16} color="#4CAF50" />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#4CAF50' }}>
            + {formatarMoeda(resumo.totalReceitas)}
          </p>
        </div>

        {/* Linha 2: Despesas */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(244, 67, 54, 0.12)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#EF5350', textTransform: 'uppercase' }}>Despesas (-)</span>
            <ArrowDownRight size={16} color="#F44336" />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#F44336' }}>
            - {formatarMoeda(resumo.totalDespesas)}
          </p>
        </div>

        {/* Linha 2: Investimentos */}
        <div style={{
          padding: '12px 14px',
          borderRadius: '12px',
          backgroundColor: 'rgba(40, 126, 165, 0.14)',
          border: '1px solid rgba(40, 126, 165, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#82B1FF', textTransform: 'uppercase' }}>Investimentos</span>
            <PiggyBank size={16} color="#5090D3" />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 900, margin: 0, color: '#82B1FF' }}>
            {formatarMoeda(resumo.totalInvestimentos)}
          </p>
        </div>

        {/* Linha 3: Saldo Final (Sozinho, ocupando as duas colunas com destaque) */}
        <div style={{
          gridColumn: 'span 2',
          padding: '14px 18px',
          borderRadius: '14px',
          backgroundColor: resumo.saldoFinal >= 0 ? 'rgba(76, 175, 80, 0.18)' : 'rgba(244, 67, 54, 0.18)',
          border: `1px solid ${resumo.saldoFinal >= 0 ? 'rgba(76, 175, 80, 0.45)' : 'rgba(244, 67, 54, 0.45)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color={resumo.saldoFinal >= 0 ? '#4CAF50' : '#F44336'} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: resumo.saldoFinal >= 0 ? '#81C784' : '#E57373', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Saldo Final do Mês ({competenciaAtiva})
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
              Saldo consolidado pós entradas e saídas
            </span>
          </div>

          <p style={{
            fontSize: '20px',
            fontWeight: 900,
            margin: 0,
            color: resumo.saldoFinal >= 0 ? '#4CAF50' : '#F44336'
          }}>
            {formatarMoeda(resumo.saldoFinal)}
          </p>
        </div>
      </div>

      {/* Extrato do Livro Caixa com Fechamento Diário */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              Extrato de Lançamentos
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Saldo consolidado a cada fechamento de dia
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setModoVisualizacao('extrato')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: modoVisualizacao === 'extrato' ? '#287EA5' : 'transparent',
                color: modoVisualizacao === 'extrato' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <List size={14} />
              <span>Extrato</span>
            </button>
            <button
              onClick={() => setModoVisualizacao('tabela')}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                backgroundColor: modoVisualizacao === 'tabela' ? '#287EA5' : 'transparent',
                color: modoVisualizacao === 'tabela' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Table size={14} />
              <span>Tabela</span>
            </button>
          </div>
        </div>

        {gruposPorSemana.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhum lançamento registrado nesta competência.
          </div>
        ) : modoVisualizacao === 'extrato' ? (
          /* ==========================================================
             MODO EXTRATO BANCÁRIO COM SALDO NO FECHAMENTO SEMANAL
             ========================================================== */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {gruposPorSemana.map((grupo) => (
              <div key={grupo.idSemana} style={{ borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                {/* Cabeçalho da Semana */}
                <div style={{
                  backgroundColor: 'rgba(23, 63, 95, 0.4)',
                  borderBottom: '1px solid rgba(38, 93, 151, 0.4)',
                  padding: '9px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#F8D117'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CalendarCheck size={14} color="#F8D117" />
                    <span>{grupo.titulo}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#AAB4BE', fontWeight: 600 }}>
                    {grupo.itens.length} {grupo.itens.length === 1 ? 'lançamento' : 'lançamentos'}
                  </span>
                </div>

                {/* Lançamentos da Semana em 2 Linhas Estilo Bancário Profissional */}
                {grupo.itens.map((item, itemIdx) => {
                  const isDespesa = item.tipo === 'Despesa';
                  const isReceita = item.tipo === 'Receita';
                  const corValor = isReceita ? 'var(--color-receita)' : item.tipo === 'Investimento' ? 'var(--color-investimento)' : 'var(--color-despesa)';

                  return (
                    <div 
                      key={item.id} 
                      style={{
                        padding: '12px 16px',
                        borderBottom: itemIdx < grupo.itens.length - 1 ? '1px solid rgba(30, 58, 95, 0.4)' : 'none',
                        backgroundColor: itemIdx % 2 === 1 ? 'rgba(19, 47, 76, 0.2)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      {/* Coluna Esquerda: Exatamente 2 Linhas */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                        {/* Linha 1: Data + Nomenclatura (Descrição) + Badge de Parcelas (apenas se parcelado) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#82B1FF',
                            backgroundColor: 'rgba(40, 126, 165, 0.2)',
                            padding: '1.5px 6px',
                            borderRadius: '5px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}>
                            {formatarData(item.data).slice(0, 5)}
                          </span>

                          <strong style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#FFFFFF',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }} title={item.descricao}>
                            {item.descricao}
                          </strong>

                          {/* Apenas exibe badge quando for PARCELADO */}
                          {item.totalParcelas && item.totalParcelas > 1 ? (
                            <span style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '1.5px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(138, 5, 190, 0.25)',
                              color: '#C084FC',
                              border: '1px solid rgba(192, 132, 252, 0.4)',
                              whiteSpace: 'nowrap',
                              flexShrink: 0
                            }}>
                              📦 {item.parcela || 1}/{item.totalParcelas}
                            </span>
                          ) : null}
                        </div>

                        {/* Linha 2: Natureza • Categoria • Forma de Pagamento */}
                        <div style={{
                          fontSize: '11.5px',
                          color: '#AAB4BE',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          <span style={{ color: '#8899A6' }}>{item.natureza}</span>
                          <span>•</span>
                          <span style={{ color: '#E2E8F0', fontWeight: 600 }}>{item.categoria}</span>
                          <span>•</span>
                          <span style={{ color: '#5090D3' }}>{item.pagamento}</span>
                          {item.cartao ? <span style={{ color: '#7E9BB8' }}>({item.cartao})</span> : null}

                          {item.detalhesMercado && (
                            <button
                              type="button"
                              onClick={() => setLancamentoMercado(item)}
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(76, 175, 80, 0.22)',
                                color: '#66BB6A',
                                border: '1px solid rgba(76, 175, 80, 0.45)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                marginLeft: '2px',
                                flexShrink: 0
                              }}
                              title="Ver cupom detalhado de compras do Meu Mercado"
                            >
                              <ShoppingCart size={11} />
                              <span>Cupom</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Coluna Direita: Valor Monetário Alinhado à Direita de Forma Responsiva */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <strong style={{
                          fontSize: '15px',
                          fontWeight: 900,
                          color: corValor,
                          whiteSpace: 'nowrap'
                        }}>
                          {isDespesa ? '- ' : '+ '}
                          {formatarMoeda(item.valor)}
                        </strong>
                      </div>
                    </div>
                  );
                })}

                {/* Barra Elegante e Responsiva de Fechamento da Semana */}
                <div style={{
                  backgroundColor: 'rgba(11, 25, 41, 0.85)',
                  borderTop: '1px dashed #265D97',
                  padding: '8px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11.5px',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#8899A6', minWidth: 0 }}>
                    <CalendarCheck size={13} color="#5090D3" style={{ flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, color: '#C5D1DE', whiteSpace: 'nowrap' }}>
                      {grupo.titulo.split('•')[0].trim()}
                    </span>
                    <span style={{ color: '#607789', fontSize: '11px', whiteSpace: 'nowrap' }}>
                      ({grupo.itens.length} {grupo.itens.length === 1 ? 'mov.' : 'mov.'})
                    </span>
                  </div>

                  <div style={{
                    padding: '2.5px 8px',
                    borderRadius: '6px',
                    backgroundColor: grupo.saldoFinalSemana >= 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
                    color: grupo.saldoFinalSemana >= 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 900,
                    fontSize: '12px',
                    border: `1px solid ${grupo.saldoFinalSemana >= 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    Saldo: {formatarMoeda(grupo.saldoFinalSemana)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ==========================================================
             MODO TABELA CLÁSSICA (COMPACTA) COM FECHAMENTO SEMANAL
             ========================================================== */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  textTransform: 'uppercase',
                  textAlign: 'left'
                }}>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Data</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Descrição</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Categoria</th>
                  <th style={{ padding: '0.75rem 0.85rem' }}>Forma</th>
                  <th style={{ padding: '0.75rem 0.85rem', textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {gruposPorSemana.map((grupo) => (
                  <React.Fragment key={grupo.idSemana}>
                    {/* Linha de Cabeçalho da Semana na Tabela */}
                    <tr style={{ backgroundColor: 'rgba(23, 63, 95, 0.5)' }}>
                      <td colSpan={5} style={{ padding: '0.5rem 0.85rem', fontWeight: 800, color: '#F8D117', fontSize: '0.82rem' }}>
                        {grupo.titulo} ({grupo.itens.length} {grupo.itens.length === 1 ? 'movimento' : 'movimentos'})
                      </td>
                    </tr>

                    {grupo.itens.map((item, idx) => {
                      const isDespesa = item.tipo === 'Despesa';
                      const isReceita = item.tipo === 'Receita';
                      const corValor = isReceita ? 'var(--color-receita)' : item.tipo === 'Investimento' ? 'var(--color-investimento)' : 'var(--color-despesa)';

                      return (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: idx === grupo.itens.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                            backgroundColor: idx % 2 === 1 ? 'rgba(19, 47, 76, 0.25)' : 'transparent'
                          }}
                        >
                          <td style={{ padding: '0.75rem 0.85rem', whiteSpace: 'nowrap' }}>
                            {formatarData(item.data)}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{item.descricao}</span>
                              {item.totalParcelas && item.totalParcelas > 1 && (
                                <span style={{
                                  fontSize: '10.5px',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor: 'rgba(138, 5, 190, 0.25)',
                                  color: '#C084FC'
                                }}>
                                  📦 {item.parcela || 1}/{item.totalParcelas}
                                </span>
                              )}
                              {item.detalhesMercado && (
                                <button
                                  type="button"
                                  onClick={() => setLancamentoMercado(item)}
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                                    color: '#66BB6A',
                                    border: '1px solid rgba(76, 175, 80, 0.4)',
                                    cursor: 'pointer'
                                  }}
                                  title="Ver cupom do Meu Mercado"
                                >
                                  🛒 Recibo
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)' }}>
                            {item.categoria}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {item.pagamento}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 800, color: corValor, whiteSpace: 'nowrap' }}>
                            {isDespesa ? '- ' : '+ '}
                            {formatarMoeda(item.valor)}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Linha de Fechamento da Semana na Tabela */}
                    <tr style={{ backgroundColor: 'rgba(11, 25, 41, 0.8)', borderBottom: '2px solid var(--border-default)' }}>
                      <td colSpan={3} style={{ padding: '0.55rem 0.85rem', fontWeight: 700, color: '#AAB4BE', fontSize: '0.8rem' }}>
                        Fechamento da {grupo.titulo.split('•')[0].trim()}
                      </td>
                      <td colSpan={2} style={{ padding: '0.55rem 0.85rem', textAlign: 'right', fontWeight: 900, color: grupo.saldoFinalSemana >= 0 ? '#4CAF50' : '#F44336' }}>
                        Saldo Acumulado: {formatarMoeda(grupo.saldoFinalSemana)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ==========================================================
            RODAPÉ CONSOLIDADO: SALDO FINAL DO MÊS (TOTAL DO MÊS)
            ========================================================== */}
        {lancamentosDoMes.length > 0 && (
          <div style={{
            marginTop: '16px',
            padding: '16px 20px',
            borderRadius: '14px',
            backgroundColor: '#0F2744',
            border: '1px solid #1E3A5F',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📊 Fechamento Consolidado do Mês ({competenciaAtiva})
              </span>
              <span style={{ fontSize: '11.5px', color: '#AAB4BE' }}>
                {lancamentosDoMes.length} {lancamentosDoMes.length === 1 ? 'movimentação registrada' : 'movimentações registradas'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px' }}>
              <div style={{ padding: '9px 12px', borderRadius: '10px', backgroundColor: 'rgba(76, 175, 80, 0.12)', border: '1px solid rgba(76, 175, 80, 0.25)' }}>
                <div style={{ fontSize: '11px', color: '#66BB6A', fontWeight: 700 }}>Total Receitas</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#4CAF50' }}>+ {formatarMoeda(resumo.totalReceitas)}</div>
              </div>

              <div style={{ padding: '9px 12px', borderRadius: '10px', backgroundColor: 'rgba(244, 67, 54, 0.12)', border: '1px solid rgba(244, 67, 54, 0.25)' }}>
                <div style={{ fontSize: '11px', color: '#EF5350', fontWeight: 700 }}>Total Despesas</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#F44336' }}>- {formatarMoeda(resumo.totalDespesas)}</div>
              </div>

              <div style={{
                padding: '9px 12px',
                borderRadius: '10px',
                backgroundColor: resumo.saldoFinal >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                border: `1px solid ${resumo.saldoFinal >= 0 ? 'rgba(76, 175, 80, 0.45)' : 'rgba(244, 67, 54, 0.45)'}`
              }}>
                <div style={{ fontSize: '11px', color: resumo.saldoFinal >= 0 ? '#81C784' : '#E57373', fontWeight: 800 }}>Saldo Final do Mês</div>
                <div style={{ fontSize: '16px', fontWeight: 900, color: resumo.saldoFinal >= 0 ? '#4CAF50' : '#F44336' }}>{formatarMoeda(resumo.saldoFinal)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Compra do Meu Mercado */}
      <ReciboMercadoModal
        aberto={Boolean(lancamentoMercado)}
        onFechar={() => setLancamentoMercado(null)}
        detalhes={lancamentoMercado?.detalhesMercado}
        valorTotalLancamento={lancamentoMercado?.valor}
        formaPagamento={lancamentoMercado?.pagamento}
      />
    </div>
  );
};
