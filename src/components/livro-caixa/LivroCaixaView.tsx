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
  CalendarCheck
} from 'lucide-react';

export const LivroCaixaView: React.FC = () => {
  const { competenciaAtiva, obterResumoLivroCaixa, lancamentos, usuario } = useFinanceStore();
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [modoVisualizacao, setModoVisualizacao] = useState<'extrato' | 'tabela'>('extrato');

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

  // Agrupar por dia para exibir o saldo no fechamento de cada dia (evitando poluição numérica)
  interface GrupoDia {
    dataStr: string;
    itens: typeof lancamentosComSaldo;
    saldoFinalDia: number;
    totalReceitasDia: number;
    totalDespesasDia: number;
  }

  const gruposPorDia: GrupoDia[] = [];
  lancamentosComSaldo.forEach((item) => {
    const dataStr = formatarData(item.data);
    let grupo = gruposPorDia.find((g) => g.dataStr === dataStr);
    if (!grupo) {
      grupo = {
        dataStr,
        itens: [],
        saldoFinalDia: item.saldoAcumulado,
        totalReceitasDia: 0,
        totalDespesasDia: 0,
      };
      gruposPorDia.push(grupo);
    }
    grupo.itens.push(item);
    grupo.saldoFinalDia = item.saldoAcumulado;
    if (item.tipo === 'Receita') grupo.totalReceitasDia += item.valor;
    if (item.tipo === 'Despesa') grupo.totalDespesasDia += item.valor;
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
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
            Livro Caixa • {competenciaAtiva}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
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

      {/* Cards de Resumo Financeiro (KPIs) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        {/* Saldo Anterior */}
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>SALDO ANTERIOR</span>
            <Scale size={16} color="var(--brand-secondary)" />
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            {formatarMoeda(resumo.saldoAnterior)}
          </p>
        </div>

        {/* Receitas */}
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-receita)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-receita)' }}>RECEITAS (+)</span>
            <ArrowUpRight size={18} color="var(--color-receita)" />
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-receita)' }}>
            {formatarMoeda(resumo.totalReceitas)}
          </p>
        </div>

        {/* Despesas */}
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-despesa)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-despesa)' }}>DESPESAS (-)</span>
            <ArrowDownRight size={18} color="var(--color-despesa)" />
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-despesa)' }}>
            {formatarMoeda(resumo.totalDespesas)}
          </p>
        </div>

        {/* Investimentos */}
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--color-investimento)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-investimento)' }}>INVESTIMENTOS</span>
            <PiggyBank size={18} color="var(--color-investimento)" />
          </div>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-investimento)' }}>
            {formatarMoeda(resumo.totalInvestimentos)}
          </p>
        </div>

        {/* Saldo Final */}
        <div className="card" style={{
          padding: '1rem',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, rgba(40, 126, 165, 0.2) 100%)',
          border: '1px solid var(--brand-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-secondary)' }}>SALDO FINAL</span>
            <TrendingUp size={18} color="var(--brand-secondary)" />
          </div>
          <p style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            margin: 0,
            color: resumo.saldoFinal >= 0 ? 'var(--text-primary)' : 'var(--color-despesa)'
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
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
              Extrato de Lançamentos
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Saldo consolidado a cada fechamento de dia
            </span>
          </div>

          <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setModoVisualizacao('extrato')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: modoVisualizacao === 'extrato' ? '#287EA5' : 'transparent',
                color: modoVisualizacao === 'extrato' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <List size={13} />
              <span>Extrato</span>
            </button>
            <button
              onClick={() => setModoVisualizacao('tabela')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: modoVisualizacao === 'tabela' ? '#287EA5' : 'transparent',
                color: modoVisualizacao === 'tabela' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Table size={13} />
              <span>Tabela</span>
            </button>
          </div>
        </div>

        {gruposPorDia.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhum lançamento registrado nesta competência.
          </div>
        ) : modoVisualizacao === 'extrato' ? (
          /* ==========================================================
             MODO EXTRATO BANCÁRIO COM SALDO NO FECHAMENTO DO DIA
             ========================================================== */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {gruposPorDia.map((grupo) => (
              <div key={grupo.dataStr} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {/* Lançamentos do Dia (sem saldo em cada linha para evitar poluição) */}
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
                        backgroundColor: itemIdx % 2 === 1 ? 'rgba(19, 47, 76, 0.25)' : 'transparent',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                      }}
                    >
                      {/* Linha 1: Data, Descrição, Badges e Valor */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#AAB4BE' }}>
                            📅 {grupo.dataStr}
                          </span>
                          <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>
                            {item.descricao}
                          </strong>
                          {item.parcela && item.totalParcelas && item.totalParcelas > 1 ? (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(138, 5, 190, 0.25)',
                              color: '#C084FC',
                              border: '1px solid rgba(192, 132, 252, 0.4)'
                            }}>
                              📦 {item.parcela}/{item.totalParcelas}
                            </span>
                          ) : (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(40, 126, 165, 0.2)',
                              color: '#5090D3',
                              border: '1px solid rgba(80, 144, 211, 0.35)'
                            }}>
                              ⚡ À vista
                            </span>
                          )}
                        </div>

                        <strong style={{ fontSize: '15px', fontWeight: 900, color: corValor }}>
                          {isDespesa ? '- ' : '+ '}
                          {formatarMoeda(item.valor)}
                        </strong>
                      </div>

                      {/* Linha 2: Natureza, Categoria e Forma de Pagamento */}
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {item.natureza} • <strong style={{ color: 'var(--text-primary)' }}>{item.categoria}</strong> • <span style={{ color: '#82B1FF' }}>{item.pagamento}</span> {item.cartao ? `(${item.cartao})` : ''}
                      </div>
                    </div>
                  );
                })}

                {/* Barra Elegante de Fechamento do Dia com Saldo Consolidado */}
                <div style={{
                  backgroundColor: 'rgba(11, 25, 41, 0.7)',
                  borderTop: '1px dashed #265D97',
                  padding: '9px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px',
                  fontWeight: 700
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#AAB4BE' }}>
                    <CalendarCheck size={14} color="#5090D3" />
                    <span>Fechamento do Dia • {grupo.dataStr} ({grupo.itens.length} {grupo.itens.length === 1 ? 'movimento' : 'movimentos'})</span>
                  </div>

                  <div style={{
                    padding: '3px 10px',
                    borderRadius: '6px',
                    backgroundColor: grupo.saldoFinalDia >= 0 ? 'rgba(76, 175, 80, 0.15)' : 'rgba(244, 67, 54, 0.15)',
                    color: grupo.saldoFinalDia >= 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 900,
                    fontSize: '12px',
                    border: `1px solid ${grupo.saldoFinalDia >= 0 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`
                  }}>
                    Saldo Acumulado: {formatarMoeda(grupo.saldoFinalDia)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ==========================================================
             MODO TABELA CLÁSSICA (COMPACTA) COM FECHAMENTO DIÁRIO
             ========================================================== */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.825rem' }}>
              <thead>
                <tr style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.75rem',
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
                {gruposPorDia.map((grupo) => (
                  <React.Fragment key={grupo.dataStr}>
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
                            {grupo.dataStr}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {item.descricao}
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

                    {/* Linha de Fechamento do Dia na Tabela */}
                    <tr style={{ backgroundColor: 'rgba(11, 25, 41, 0.8)', borderBottom: '2px solid var(--border-default)' }}>
                      <td colSpan={3} style={{ padding: '0.5rem 0.85rem', fontWeight: 700, color: '#AAB4BE', fontSize: '0.75rem' }}>
                        Fechamento do Dia {grupo.dataStr}
                      </td>
                      <td colSpan={2} style={{ padding: '0.5rem 0.85rem', textAlign: 'right', fontWeight: 900, color: grupo.saldoFinalDia >= 0 ? '#4CAF50' : '#F44336' }}>
                        Saldo: {formatarMoeda(grupo.saldoFinalDia)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
