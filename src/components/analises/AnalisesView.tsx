import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda } from '../../lib/formatters';
import { ChevronDown, ChevronUp, Layers, PieChart as PieIcon, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const CORES_NATUREZA: Record<string, string> = {
  '🏠 Moradia': '#287EA5',
  '🏢 Imóveis': '#1976D2',
  '🛒 Alimentação': '#10B981',
  '🚗 Transporte': '#F59E0B',
  '📚 Educação': '#8B5CF6',
  '🏥 Saúde': '#EF4444',
  '🎨 Lazer': '#EC4899',
  '👤 Pessoal': '#3B82F6',
  '👨‍👩‍👧 Família': '#6366F1',
  '🐾 Pets': '#14B8A6',
  '🛠️ Serviços': '#06B6D4',
  '💰 Impostos': '#F97316',
  '📦 Outros': '#84CC16',
};

export const AnalisesView: React.FC = () => {
  const { lancamentos, competenciaAtiva, obterResumoLivroCaixa } = useFinanceStore();
  const resumo = obterResumoLivroCaixa(competenciaAtiva);

  // Aba selecionada: 'lista' (detalhamento por natureza) ou 'pizza' (gráfico de pizza/donut)
  const [abaVisualizacao, setAbaVisualizacao] = useState<'lista' | 'pizza'>('lista');

  // Estado para armazenar quais naturezas estão expandidas no accordion
  const [naturezasExpandidas, setNaturezasExpandidas] = useState<Record<string, boolean>>({
    '🏠 Moradia': true, // Moradia começa expandida por padrão para conveniência
  });

  const alternarNatureza = (nome: string) => {
    setNaturezasExpandidas(prev => ({
      ...prev,
      [nome]: !prev[nome]
    }));
  };

  const expandirTodas = () => {
    const novo: Record<string, boolean> = {};
    dadosNaturezas.forEach(item => {
      novo[item.natureza] = true;
    });
    setNaturezasExpandidas(novo);
  };

  const recolherTodas = () => {
    setNaturezasExpandidas({});
  };

  // Filtrar despesas da competência ativa
  const despesasMes = lancamentos.filter(
    (l) => l.competencia === competenciaAtiva && l.tipo === 'Despesa' && l.status === 'Lançado'
  );

  // Agrupar por natureza e subcategorias
  interface SubcategoriaInfo {
    nome: string;
    total: number;
    quantidade: number;
    percentualNatureza: number;
  }

  interface NaturezaAnalise {
    natureza: string;
    total: number;
    percentualTotal: number;
    cor: string;
    categorias: SubcategoriaInfo[];
  }

  const mapaNaturezas: Record<string, { total: number; categorias: Record<string, { total: number; count: number }> }> = {};

  despesasMes.forEach((d) => {
    if (!mapaNaturezas[d.natureza]) {
      mapaNaturezas[d.natureza] = { total: 0, categorias: {} };
    }
    mapaNaturezas[d.natureza].total += d.valor;

    if (!mapaNaturezas[d.natureza].categorias[d.categoria]) {
      mapaNaturezas[d.natureza].categorias[d.categoria] = { total: 0, count: 0 };
    }
    mapaNaturezas[d.natureza].categorias[d.categoria].total += d.valor;
    mapaNaturezas[d.natureza].categorias[d.categoria].count += 1;
  });

  const totalGeral = resumo.totalDespesas || 1;

  const dadosNaturezas: NaturezaAnalise[] = Object.entries(mapaNaturezas)
    .map(([nat, dados]) => {
      const categoriasArray: SubcategoriaInfo[] = Object.entries(dados.categorias)
        .map(([catNome, catDados]) => ({
          nome: catNome,
          total: catDados.total,
          quantidade: catDados.count,
          percentualNatureza: dados.total > 0 ? (catDados.total / dados.total) * 100 : 0
        }))
        .sort((a, b) => b.total - a.total);

      return {
        natureza: nat,
        total: dados.total,
        percentualTotal: (dados.total / totalGeral) * 100,
        cor: CORES_NATUREZA[nat] || '#287EA5',
        categorias: categoriasArray
      };
    })
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Cabeçalho da Aba */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={22} color="#5090D3" />
            Detalhamento por Natureza de Gastos
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Clique em cada natureza para ver suas categorias, percentuais e barras de progresso • {competenciaAtiva}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={expandirTodas}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}
          >
            Expandir Todas
          </button>
          <button
            type="button"
            onClick={recolherTodas}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}
          >
            Recolher Todas
          </button>
        </div>
      </div>

      {/* =====================================================
           📈 RESUMO DO MÊS: RECEITAS, DESPESAS E SALDO
         ===================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Receitas */}
        <div className="card" style={{
          padding: '16px',
          background: 'rgba(76, 175, 80, 0.08)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          boxShadow: '0 4px 12px rgba(23, 63, 95, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#4CAF50', textTransform: 'uppercase' }}>
              Receitas do Mês
            </span>
            <ArrowUpRight size={16} color="#4CAF50" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#4CAF50' }}>
            {formatarMoeda(resumo.totalReceitas)}
          </div>
          <span style={{ fontSize: '10px', color: '#AAB4BE' }}>Entradas confirmadas</span>
        </div>

        {/* Despesas */}
        <div className="card" style={{
          padding: '16px',
          background: 'rgba(244, 67, 54, 0.08)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          boxShadow: '0 4px 12px rgba(23, 63, 95, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#F44336', textTransform: 'uppercase' }}>
              Despesas do Mês
            </span>
            <ArrowDownRight size={16} color="#F44336" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#F44336' }}>
            {formatarMoeda(resumo.totalDespesas)}
          </div>
          <span style={{ fontSize: '10px', color: '#AAB4BE' }}>Total de saídas</span>
        </div>

        {/* Saldo Líquido do Mês */}
        <div className="card" style={{
          padding: '16px',
          background: 'rgba(40, 126, 165, 0.18)',
          border: '1px solid #287EA5',
          boxShadow: '0 4px 12px rgba(23, 63, 95, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#287EA5', textTransform: 'uppercase' }}>
              Saldo do Mês
            </span>
            <TrendingUp size={16} color="#287EA5" />
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 900,
            color: resumo.saldoFinal >= 0 ? '#E7EBF0' : '#F44336'
          }}>
            {formatarMoeda(resumo.saldoFinal)}
          </div>
          <span style={{ fontSize: '10px', color: '#AAB4BE' }}>Balanço do período</span>
        </div>
      </div>

      {/* Card de Resumo de Despesas no Mês */}
      <div style={{
        backgroundColor: '#0F2744',
        border: '1px solid #1E3A5F',
        borderRadius: '16px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Total de Despesas do Mês ({competenciaAtiva})
          </span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#F44336', marginTop: '2px' }}>
            {formatarMoeda(resumo.totalDespesas)}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: '#607789', display: 'block' }}>Naturezas com Gastos</span>
            <strong style={{ fontSize: '16px', color: '#E7EBF0' }}>{dadosNaturezas.length}</strong>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#607789', display: 'block' }}>Total de Lançamentos</span>
            <strong style={{ fontSize: '16px', color: '#E7EBF0' }}>{despesasMes.length}</strong>
          </div>
        </div>
      </div>

      {/* Seletor de Tipo de Gráfico / Visualização (apenas um visível por vez) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0F2744',
        padding: '4px',
        borderRadius: '14px',
        border: '1px solid #1E3A5F',
        gap: '4px'
      }}>
        <button
          type="button"
          onClick={() => setAbaVisualizacao('lista')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: abaVisualizacao === 'lista' ? '#173F5F' : 'transparent',
            color: abaVisualizacao === 'lista' ? '#F8D117' : '#AAB4BE',
            fontWeight: abaVisualizacao === 'lista' ? 800 : 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers size={16} />
          <span>Detalhamento por Natureza</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaVisualizacao('pizza')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: abaVisualizacao === 'pizza' ? '#173F5F' : 'transparent',
            color: abaVisualizacao === 'pizza' ? '#F8D117' : '#AAB4BE',
            fontWeight: abaVisualizacao === 'pizza' ? 800 : 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <PieIcon size={16} />
          <span>Gráfico de Pizza</span>
        </button>
      </div>

      {/* Visualização de Dados (Apenas uma ativa por vez) */}
      {dadosNaturezas.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <PieIcon size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>Nenhuma despesa encontrada</h4>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Cadastre um novo lançamento para visualizar a distribuição dos seus gastos.</p>
        </div>
      ) : abaVisualizacao === 'pizza' ? (
        /* =====================================================
             🥧 GRÁFICO DE PIZZA (DONUT) COM RECHARTS
           ===================================================== */
        <div style={{
          backgroundColor: '#0F2744',
          border: '1px solid #1E3A5F',
          borderRadius: '16px',
          padding: '20px 16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ width: '100%', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Divisão Proporcional das Despesas • {competenciaAtiva}
            </span>
          </div>

          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosNaturezas}
                  dataKey="total"
                  nameKey="natureza"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                >
                  {dadosNaturezas.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} stroke="#0B1C2E" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatarMoeda(Number(val)), 'Total Gasto']}
                  contentStyle={{ backgroundColor: '#0B1C2E', borderColor: '#1E3A5F', borderRadius: '10px', color: '#FFFFFF', fontSize: '12px', fontWeight: 700 }}
                  itemStyle={{ color: '#F8D117' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda com percentuais e valores por natureza */}
          <div style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '8px'
          }}>
            {dadosNaturezas.map((entry) => (
              <div
                key={entry.natureza}
                style={{
                  backgroundColor: '#132F4C',
                  border: '1px solid #1E3A5F',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div style={{ width: '12px', height: '12px', borderRadius: '4px', backgroundColor: entry.cor, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {entry.natureza}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#5090D3', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{formatarMoeda(entry.total)}</span>
                    <span style={{ color: '#F8D117' }}>{entry.percentualTotal.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* =====================================================
             📊 DETALHAMENTO EM LISTA ACCORDION (ORIGINAL)
           ===================================================== */
        <div style={{
          backgroundColor: '#0F2744',
          border: '1px solid #1E3A5F',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
        }}>
          {/* Cabeçalho do Bloco Único */}
          <div style={{
            padding: '14px 18px',
            backgroundColor: '#132F4C',
            borderBottom: '1px solid #1E3A5F',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Distribuição por Natureza de Gastos
            </span>
            <span style={{ fontSize: '11px', color: '#5090D3', fontWeight: 700 }}>
              {dadosNaturezas.length} {dadosNaturezas.length === 1 ? 'Natureza' : 'Naturezas'} ativas
            </span>
          </div>

          {/* Linhas das Naturezas com separador integrado e contorno destacado ao expandir */}
          {dadosNaturezas.map((item, index) => {
            const expandido = Boolean(naturezasExpandidas[item.natureza]);
            const isUltimo = index === dadosNaturezas.length - 1;

            return (
              <div 
                key={item.natureza}
                style={{
                  border: expandido ? `2px solid ${item.cor}` : 'none',
                  borderBottom: expandido ? `2px solid ${item.cor}` : (isUltimo ? 'none' : '1px solid #1E3A5F'),
                  borderRadius: expandido ? '14px' : '0px',
                  margin: expandido ? '6px 8px' : '0px',
                  overflow: 'hidden',
                  boxShadow: expandido ? `0 4px 18px rgba(0, 0, 0, 0.35), 0 0 12px ${item.cor}33` : 'none',
                  transition: 'all 0.25s ease',
                  backgroundColor: expandido ? 'rgba(23, 63, 95, 0.28)' : 'transparent'
                }}
              >
                {/* Cabeçalho Clicável da Natureza */}
                <div
                  onClick={() => alternarNatureza(item.natureza)}
                  style={{
                    padding: '14px 18px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    backgroundColor: expandido ? 'rgba(23, 63, 95, 0.35)' : 'transparent',
                    userSelect: 'none',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '20px' }}>
                        {item.natureza.split(' ')[0]}
                      </span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#FFFFFF' }}>
                          {item.natureza}
                        </h3>
                        <span style={{ fontSize: '11px', color: '#8A99AD' }}>
                          {item.categorias.length} {item.categorias.length === 1 ? 'categoria' : 'categorias'} movimentadas
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#F44336' }}>
                          {formatarMoeda(item.total)}
                        </span>
                        <span style={{ fontSize: '11px', color: '#5090D3', fontWeight: 700, display: 'block' }}>
                          {item.percentualTotal.toFixed(1)}% do total
                        </span>
                      </div>

                      <div style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        backgroundColor: '#132F4C',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#AAB4BE'
                      }}>
                        {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Progresso da Natureza (0 a 100%) */}
                  <div>
                    <div style={{
                      height: '7px',
                      backgroundColor: '#132F4C',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(item.percentualTotal, 100)}%`,
                        height: '100%',
                        backgroundColor: item.cor,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Subcategorias Detalhadas (Expandidas dentro do Bloco - Tom visivelmente mais claro para destacar) */}
                {expandido && (
                  <div style={{
                    padding: '16px 20px 20px 22px',
                    borderTop: '1px solid #287EA5',
                    borderBottom: '1px solid #287EA5',
                    backgroundColor: '#173F5F', // Tom visivelmente mais claro que #0F2744
                    borderLeft: `5px solid ${item.cor}`, // Linha vertical de destaque da natureza
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '2px'
                    }}>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        color: '#E7EBF0',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px'
                      }}>
                        Subcategorias de {item.natureza}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        backgroundColor: '#0F2744',
                        padding: '3px 10px',
                        borderRadius: '6px',
                        border: '1px solid #287EA5'
                      }}>
                        {item.categorias.length} {item.categorias.length === 1 ? 'item' : 'itens'}
                      </span>
                    </div>

                    {item.categorias.map((cat, idx) => (
                      <div 
                        key={idx}
                        style={{
                          backgroundColor: '#205B7D', // Cartão da subcategoria bem mais claro e destacado
                          border: '1px solid #3A9BD5',
                          borderRadius: '12px',
                          padding: '13px 16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#FFFFFF', fontWeight: 800 }}>
                              {cat.nome}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: '#D0DCE5', display: 'block', marginTop: '2px' }}>
                              {cat.quantidade} {cat.quantidade === 1 ? 'lançamento' : 'lançamentos'}
                            </span>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF' }}>
                              {formatarMoeda(cat.total)}
                            </span>
                            <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#F8D117', display: 'block', marginTop: '2px' }}>
                              {cat.percentualNatureza.toFixed(1)}% do setor
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso Subcategoria (0 a 100% dentro da natureza) */}
                        <div style={{
                          height: '7px',
                          backgroundColor: '#0F2744',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: '999px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(cat.percentualNatureza, 100)}%`,
                            height: '100%',
                            background: `linear-gradient(90deg, ${item.cor} 0%, #F8D117 100%)`,
                            borderRadius: '999px',
                            transition: 'width 0.35s ease'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
