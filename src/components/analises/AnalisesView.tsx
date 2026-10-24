import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda, formatarData } from '../../lib/formatters';
import { 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp,
  Receipt
} from 'lucide-react';

const CORES_NATUREZA: Record<string, string> = {
  '🏢 Imóveis': '#1976D2',
  '🔧 Manutenção Veicular': '#F59E0B',
  '🏠 Moradia': '#287EA5',
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

// Componente para desenhar cada Barra 3D com efeito isométrico e iluminação realista (100% Responsivo no Celular)
interface Barra3DProps {
  natureza: string;
  total: number;
  percentual: number;
  cor: string;
  alturaPx: number;
  selecionada: boolean;
  onSelecionar: () => void;
  totalColunas?: number;
}

const Barra3D: React.FC<Barra3DProps> = ({
  natureza,
  total,
  percentual,
  cor,
  alturaPx,
  selecionada,
  onSelecionar,
  totalColunas = 6,
}) => {
  // Ajuste de altura mínima visível
  const h = Math.max(16, alturaPx);
  
  // Proporções dinâmicas calculadas para caber exatamente em 100% da largura da tela do celular sem rolagem
  const largura = totalColunas <= 4 ? 36 : (totalColunas <= 6 ? 26 : (totalColunas <= 8 ? 19 : 14));
  const profundidade = totalColunas <= 4 ? 12 : (totalColunas <= 6 ? 9 : (totalColunas <= 8 ? 7 : 5));

  const emoji = natureza.split(' ')[0] || '🏷️';
  const labelCurto = natureza.replace(/^[^\w\s]+\s*/, '').trim();

  const textoValor = total >= 1000 
    ? `${(total / 1000).toFixed(1)}k`
    : Math.round(total).toString();

  return (
    <div
      onClick={onSelecionar}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'transform 0.2s ease',
        transform: selecionada ? 'translateY(-6px)' : 'none',
        flex: 1,
        minWidth: 0,
        maxWidth: totalColunas <= 4 ? '70px' : (totalColunas <= 6 ? '54px' : '42px')
      }}
      title={`Clique para ver detalhes de ${natureza}: ${formatarMoeda(total)} (${percentual.toFixed(1)}%)`}
    >
      {/* Informações Superiores: Valor e Porcentagem no Topo da Barra */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '6px',
        backgroundColor: selecionada ? 'rgba(248, 209, 23, 0.25)' : 'rgba(11, 25, 41, 0.75)',
        border: `1px solid ${selecionada ? '#F8D117' : 'rgba(255, 255, 255, 0.15)'}`,
        padding: totalColunas > 6 ? '2px 2px' : '3px 4px',
        borderRadius: '6px',
        boxShadow: selecionada ? '0 0 10px rgba(248, 209, 23, 0.4)' : 'none',
        transition: 'all 0.2s ease',
        width: '100%',
        maxWidth: '56px',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        <span style={{
          fontSize: totalColunas > 7 ? '8px' : (totalColunas > 5 ? '9px' : '10px'),
          fontWeight: 900,
          color: selecionada ? '#F8D117' : '#FFFFFF',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%'
        }}>
          {totalColunas > 7 ? `${percentual.toFixed(0)}%` : textoValor}
        </span>
        {totalColunas <= 7 && (
          <span style={{
            fontSize: '8px',
            fontWeight: 800,
            color: selecionada ? '#FFFFFF' : '#AAB4BE'
          }}>
            {percentual.toFixed(0)}%
          </span>
        )}
      </div>

      {/* SVG da Barra em Estilo 3D Isométrico com Faces Chanfradas e Sombra */}
      <div style={{ height: '170px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: '100%' }}>
        <svg
          width={largura + profundidade + 4}
          height={h + profundidade + 10}
          viewBox={`0 0 ${largura + profundidade + 4} ${h + profundidade + 10}`}
          style={{ overflow: 'visible', filter: selecionada ? `drop-shadow(0 0 8px ${cor})` : 'none' }}
        >
          <defs>
            {/* Gradiente Frontal */}
            <linearGradient id={`gradFront-${cor.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={cor} stopOpacity="1" />
              <stop offset="100%" stopColor="#0B1C2E" stopOpacity="0.85" />
            </linearGradient>

            {/* Gradiente Lateral (Face 3D de Profundidade com Sombra) */}
            <linearGradient id={`gradSide-${cor.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
            </linearGradient>

            {/* Sombra de Chão */}
            <radialGradient id={`gradFloor-${cor.replace('#', '')}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Sombra da base no chão */}
          <ellipse
            cx={largura / 2 + 4}
            cy={h + profundidade + 4}
            rx={largura / 2 + 4}
            ry={profundidade / 2}
            fill={`url(#gradFloor-${cor.replace('#', '')})`}
          />

          {/* Face Frontal da Barra 3D */}
          <rect
            x={4}
            y={profundidade + 4}
            width={largura}
            height={h}
            fill={`url(#gradFront-${cor.replace('#', '')})`}
            stroke={selecionada ? '#F8D117' : cor}
            strokeWidth={selecionada ? 2 : 1}
          />

          {/* Linhas de reflexo e brilho 3D no canto esquerdo da face frontal */}
          <line
            x1={6}
            y1={profundidade + 5}
            x2={6}
            y2={profundidade + h + 3}
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth={1.5}
          />

          {/* Face Lateral Direita 3D (Extrusão Isométrica) */}
          <polygon
            points={`
              ${largura + 4},${profundidade + 4}
              ${largura + profundidade + 4},4
              ${largura + profundidade + 4},${h + 4}
              ${largura + 4},${h + profundidade + 4}
            `}
            fill={cor}
          />
          <polygon
            points={`
              ${largura + 4},${profundidade + 4}
              ${largura + profundidade + 4},4
              ${largura + profundidade + 4},${h + 4}
              ${largura + 4},${h + profundidade + 4}
            `}
            fill={`url(#gradSide-${cor.replace('#', '')})`}
            stroke={selecionada ? '#F8D117' : 'rgba(0, 0, 0, 0.4)'}
            strokeWidth={selecionada ? 1.5 : 0.8}
          />

          {/* Topo 3D da Barra (Tampa Superior Isométrica Iluminada) */}
          <polygon
            points={`
              4,${profundidade + 4}
              ${profundidade + 4},4
              ${largura + profundidade + 4},4
              ${largura + 4},${profundidade + 4}
            `}
            fill={cor}
          />
          <polygon
            points={`
              4,${profundidade + 4}
              ${profundidade + 4},4
              ${largura + profundidade + 4},4
              ${largura + 4},${profundidade + 4}
            `}
            fill="rgba(255, 255, 255, 0.45)"
            stroke={selecionada ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            strokeWidth={selecionada ? 2 : 1}
          />
        </svg>
      </div>

      {/* Ícone e Rótulo da Natureza na Base */}
      <div style={{
        marginTop: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%'
      }}>
        <span style={{ fontSize: totalColunas > 7 ? '13px' : (totalColunas > 5 ? '15px' : '18px') }}>{emoji}</span>
        <span style={{
          fontSize: totalColunas > 7 ? '8px' : (totalColunas > 5 ? '9px' : '10px'),
          fontWeight: 800,
          color: selecionada ? '#F8D117' : '#FFFFFF',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          marginTop: '2px'
        }}>
          {labelCurto}
        </span>
      </div>
    </div>
  );
};

// Componente para desenhar cada Barra 3D Horizontal (Visão Panorâmica 100% Tela Cheia sem rolagem lateral)
interface BarraHorizontal3DProps {
  natureza: string;
  total: number;
  percentual: number;
  cor: string;
  proporcao: number;
  selecionada: boolean;
  onSelecionar: () => void;
  subcategorias?: { nome: string; total: number; quantidade: number; percentualNatureza: number }[];
}

const BarraHorizontal3D: React.FC<BarraHorizontal3DProps> = ({
  natureza,
  total,
  percentual,
  cor,
  proporcao,
  selecionada,
  onSelecionar,
  subcategorias,
}) => {
  const emoji = natureza.split(' ')[0] || '🏷️';
  const labelLimpo = natureza.replace(/^[^\w\s]+\s*/, '').trim();
  const larguraPct = Math.max(8, Math.min(100, Math.round(proporcao * 100)));

  return (
    <div
      onClick={onSelecionar}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '7px',
        padding: '12px 14px',
        borderRadius: '16px',
        backgroundColor: selecionada ? 'rgba(23, 63, 95, 0.85)' : 'rgba(19, 47, 76, 0.55)',
        border: `1.5px solid ${selecionada ? '#F8D117' : 'rgba(30, 58, 95, 0.8)'}`,
        boxShadow: selecionada ? `0 0 16px ${cor}40, 0 4px 14px rgba(0,0,0,0.3)` : '0 2px 8px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none',
        width: '100%'
      }}
      title={`Toque para auditar ${natureza}: ${formatarMoeda(total)} (${percentual.toFixed(1)}%)`}
    >
      {/* Topo da Barra: Rótulo com Emoji à Esquerda e Valores em Destaque à Direita */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>{emoji}</span>
          <strong style={{ 
            fontSize: '13.5px', 
            fontWeight: 800, 
            color: selecionada ? '#F8D117' : '#FFFFFF',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {labelLimpo}
          </strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            fontSize: '10.5px',
            fontWeight: 900,
            padding: '2px 7px',
            borderRadius: '6px',
            backgroundColor: selecionada ? 'rgba(248, 209, 23, 0.25)' : 'rgba(255, 255, 255, 0.08)',
            color: selecionada ? '#F8D117' : '#AAB4BE'
          }}>
            {percentual.toFixed(1)}%
          </span>

          <strong style={{
            fontSize: '14.5px',
            fontWeight: 900,
            color: '#FFFFFF'
          }}>
            {formatarMoeda(total)}
          </strong>
        </div>
      </div>

      {/* Barra em Estilo 3D Isométrico com Profundidade, Chanfro e Iluminação Superior */}
      <div style={{ position: 'relative', width: '100%', height: '22px', marginTop: '2px' }}>
        {/* Trilho de Fundo em 3D sutil */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(11, 25, 41, 0.7)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }} />

        {/* Barra 3D Tridimensional Colorida com Profundidade e Volume */}
        <div style={{
          position: 'relative',
          width: `${larguraPct}%`,
          height: '100%',
          borderRadius: '8px',
          background: `linear-gradient(180deg, ${cor} 0%, ${cor}CC 55%, #0B1C2E 100%)`,
          boxShadow: `0 4px 14px ${cor}50, inset 0 2px 3px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.6)`,
          border: `1px solid ${selecionada ? '#F8D117' : cor}`,
          transition: 'width 0.4s ease'
        }}>
          {/* Brilho Superior 3D Refletido */}
          <div style={{
            position: 'absolute',
            top: '1px',
            left: '4px',
            right: '4px',
            height: '3px',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 100%)'
          }} />
        </div>
      </div>

      {/* Resumo instantâneo das subcategorias quando a barra estiver selecionada */}
      {selecionada && subcategorias && subcategorias.length > 0 && (
        <div style={{
          marginTop: '6px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Subcategorias de {labelLimpo}:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
            {subcategorias.slice(0, 4).map((sub, i) => (
              <div key={i} style={{
                backgroundColor: 'rgba(11, 25, 41, 0.6)',
                padding: '5px 8px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ color: '#D0DCE5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sub.nome}
                </span>
                <strong style={{ color: '#FFFFFF', marginLeft: '6px', flexShrink: 0 }}>
                  {formatarMoeda(sub.total)}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const AnalisesView: React.FC = () => {
  const { lancamentos, competenciaAtiva, obterResumoLivroCaixa } = useFinanceStore();
  const resumo = obterResumoLivroCaixa(competenciaAtiva);

  // Formato do gráfico 3D: 'panoramico' (100% largura de tela sem scroll horizontal) ou 'colunas' (colunas verticais)
  const [formatoGrafico3D, setFormatoGrafico3D] = useState<'panoramico' | 'colunas'>('colunas');

  // Aba selecionada: 'grafico3d' (gráfico de barras 3D com detalhamento) ou 'lista' (accordion de todas as naturezas)
  const [abaVisualizacao, setAbaVisualizacao] = useState<'grafico3d' | 'lista'>('grafico3d');

  // Estado para armazenar quais naturezas estão expandidas no accordion
  const [naturezasExpandidas, setNaturezasExpandidas] = useState<Record<string, boolean>>({
    '🏠 Moradia': true,
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

  // Natureza selecionada para abrir detalhamento ao clicar na barra 3D
  const [naturezaSelecionada3D, setNaturezaSelecionada3D] = useState<string>(
    dadosNaturezas[0]?.natureza || ''
  );

  // Se a natureza ativa não existir na lista filtrada, ajusta para a primeira
  const itemAtivo3D = dadosNaturezas.find(n => n.natureza === naturezaSelecionada3D) || dadosNaturezas[0];

  // Maior valor para cálculo proporcional de altura das barras (máximo 150px)
  const maiorValor = dadosNaturezas.length > 0 ? Math.max(...dadosNaturezas.map(d => d.total)) : 1;

  // Lançamentos específicos da natureza selecionada
  const lancamentosDaNatureza = itemAtivo3D 
    ? despesasMes.filter(l => l.natureza === itemAtivo3D.natureza)
    : [];

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
          <h2 style={{ fontSize: '1.35rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF' }}>
            <Layers size={22} color="#5090D3" />
            Análise Financeira & Naturezas
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#AAB4BE', margin: '4px 0 0 0' }}>
            Consumo setorial, gráficos tridimensionais e auditoria • {competenciaAtiva}
          </p>
        </div>

        {abaVisualizacao === 'lista' && (
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
        )}
      </div>

      {/* =====================================================
           📈 BLOCO RESPONSIVO DE 4 CARDS (GRID 2x2)
           Linha 1: Receitas do Mês + Despesas do Mês
           Linha 2: Saldo do Mês + Total de Despesas do Mês
         ===================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px'
      }}>
        {/* Linha 1 - Card 1: Receitas do Mês */}
        <div style={{
          padding: '14px 12px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.16) 0%, rgba(20, 80, 35, 0.28) 100%)',
          border: '1.5px solid #4CAF50',
          boxShadow: '0 4px 14px rgba(76, 175, 80, 0.2)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#4CAF50', textTransform: 'uppercase' }}>
              Receitas do Mês
            </span>
            <ArrowUpRight size={15} color="#4CAF50" />
          </div>
          <div style={{ 
            marginTop: '4px', 
            fontSize: 'clamp(14px, 4vw, 19px)', 
            fontWeight: 900, 
            color: '#4CAF50',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formatarMoeda(resumo.totalReceitas)}
          </div>
          <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Entradas confirmadas
          </span>
        </div>

        {/* Linha 1 - Card 2: Despesas do Mês */}
        <div style={{
          padding: '14px 12px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.16) 0%, rgba(100, 20, 20, 0.28) 100%)',
          border: '1.5px solid #F44336',
          boxShadow: '0 4px 14px rgba(244, 67, 54, 0.2)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#F44336', textTransform: 'uppercase' }}>
              Despesas do Mês
            </span>
            <ArrowDownRight size={15} color="#F44336" />
          </div>
          <div style={{ 
            marginTop: '4px', 
            fontSize: 'clamp(14px, 4vw, 19px)', 
            fontWeight: 900, 
            color: '#F44336',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formatarMoeda(resumo.totalDespesas)}
          </div>
          <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Total de saídas
          </span>
        </div>

        {/* Linha 2 - Card 3: Saldo do Mês */}
        <div style={{
          padding: '14px 12px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(40, 126, 165, 0.18) 0%, rgba(15, 50, 100, 0.3) 100%)',
          border: '1.5px solid #287EA5',
          boxShadow: '0 4px 14px rgba(40, 126, 165, 0.25)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#5090D3', textTransform: 'uppercase' }}>
              Saldo do Mês
            </span>
            <TrendingUp size={15} color="#5090D3" />
          </div>
          <div style={{
            marginTop: '4px',
            fontSize: 'clamp(14px, 4vw, 19px)',
            fontWeight: 900,
            color: resumo.saldoFinal >= 0 ? '#F8D117' : '#F44336',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formatarMoeda(resumo.saldoFinal)}
          </div>
          <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Balanço do período
          </span>
        </div>

        {/* Linha 2 - Card 4: Total de Despesas do Mês */}
        <div style={{
          padding: '14px 12px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0F2744 0%, #132F4C 100%)',
          border: '1.5px solid #1E3A5F',
          boxShadow: '0 4px 14px rgba(11, 25, 41, 0.4)',
          minWidth: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase' }}>
              Total Despesas
            </span>
            <Receipt size={15} color="#F8D117" />
          </div>
          <div style={{ 
            marginTop: '4px', 
            fontSize: 'clamp(14px, 4vw, 19px)', 
            fontWeight: 900, 
            color: '#F44336',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {formatarMoeda(resumo.totalDespesas)}
          </div>
          <span style={{ fontSize: '9.5px', color: '#B0BEC5', display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {dadosNaturezas.length} naturezas • {despesasMes.length} lançamentos
          </span>
        </div>
      </div>

      {/* Seletor de Tipo de Gráfico / Visualização */}
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
          onClick={() => setAbaVisualizacao('grafico3d')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '10px 12px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: abaVisualizacao === 'grafico3d' ? '#173F5F' : 'transparent',
            color: abaVisualizacao === 'grafico3d' ? '#F8D117' : '#AAB4BE',
            fontWeight: abaVisualizacao === 'grafico3d' ? 800 : 600,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <BarChart3 size={16} />
          <span>Gráfico de Barras 3D</span>
        </button>

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
          <span>Detalhamento em Lista</span>
        </button>
      </div>

      {/* Visualização de Dados */}
      {dadosNaturezas.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: '#AAB4BE' }}>
          <BarChart3 size={38} color="#287EA5" style={{ margin: '0 auto 0.75rem auto' }} />
          <h4 style={{ margin: '0 0 6px 0', color: '#FFFFFF' }}>Nenhuma despesa encontrada</h4>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Cadastre um novo lançamento para visualizar a distribuição dos seus gastos.</p>
        </div>
      ) : abaVisualizacao === 'grafico3d' ? (
        /* =====================================================
             📊 GRÁFICO DE BARRAS ESTILO 3D INTERATIVO
             Valores e categorias na parte superior das barras
             Ao clicar na barra, abre o detalhamento com os respectivos valores
           ===================================================== */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Card do Gráfico de Barras 3D */}
          <div style={{
            backgroundColor: '#0F2744',
            border: '1.5px solid #1E3A5F',
            borderRadius: '20px',
            padding: '20px 16px',
            boxShadow: '0 6px 24px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #1E3A5F',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ flex: '1 1 220px', minWidth: '200px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#E2E8F0', letterSpacing: '0.4px' }}>
                    Consumo por Natureza
                  </span>
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    color: '#60A5FA',
                    backgroundColor: 'rgba(96, 165, 250, 0.12)',
                    border: '1px solid rgba(96, 165, 250, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '8px',
                    whiteSpace: 'nowrap'
                  }}>
                    3D Tridimensional
                  </span>
                </div>
                <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: '#94A3B8', fontWeight: 600, lineHeight: 1.4 }}>
                  Toque em uma barra para editar as categorias e valores
                </p>
              </div>

              {/* Seletor de Modo de Visualização do Gráfico 3D (Panorâmico sem rolagem vs Colunas) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#132F4C',
                padding: '3px',
                borderRadius: '12px',
                border: '1px solid #1E3A5F',
                gap: '3px'
              }}>
                <button
                  type="button"
                  onClick={() => setFormatoGrafico3D('panoramico')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    backgroundColor: formatoGrafico3D === 'panoramico' ? '#287EA5' : 'transparent',
                    color: formatoGrafico3D === 'panoramico' ? '#FFFFFF' : '#AAB4BE',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Visualizar todas as categorias na tela cheia sem precisar arrastar para o lado"
                >
                  <span>📱 Tela Cheia</span>
                  <span style={{ fontSize: '9px', opacity: 0.85 }}>(Sem Rolar)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormatoGrafico3D('colunas')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '9px',
                    border: 'none',
                    backgroundColor: formatoGrafico3D === 'colunas' ? '#287EA5' : 'transparent',
                    color: formatoGrafico3D === 'colunas' ? '#FFFFFF' : '#AAB4BE',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  title="Visualizar em formato de colunas verticais tridimensionais"
                >
                  <BarChart3 size={12} />
                  <span>Colunas 3D</span>
                </button>
              </div>
            </div>

            {/* MODO 1: PANORÂMICO 100% TELA CHEIA (SEM ROLAGEM LATERAL) */}
            {formatoGrafico3D === 'panoramico' ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                width: '100%',
                padding: '4px 0'
              }}>
                {dadosNaturezas.map((item) => {
                  const proporcao = maiorValor > 0 ? item.total / maiorValor : 0;
                  const selecionada = itemAtivo3D?.natureza === item.natureza;

                  return (
                    <BarraHorizontal3D
                      key={item.natureza}
                      natureza={item.natureza}
                      total={item.total}
                      percentual={item.percentualTotal}
                      cor={item.cor}
                      proporcao={proporcao}
                      selecionada={selecionada}
                      onSelecionar={() => setNaturezaSelecionada3D(item.natureza)}
                      subcategorias={item.categorias}
                    />
                  );
                })}
              </div>
            ) : (
              /* MODO 2: BARRAS VERTICAIS 3D (EM COLUNAS) - 100% RESPONSIVO NO CELULAR SEM ROLAGEM LATERAL */
              <div style={{
                overflowX: 'hidden',
                width: '100%',
                padding: '10px 2px 14px 2px',
                display: 'flex',
                gap: dadosNaturezas.length > 7 ? '2px' : (dadosNaturezas.length > 5 ? '4px' : '8px'),
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                minHeight: '270px'
              }}>
                {dadosNaturezas.map((item) => {
                  const alturaCalculada = Math.round((item.total / maiorValor) * 145);
                  const selecionada = itemAtivo3D?.natureza === item.natureza;

                  return (
                    <Barra3D
                      key={item.natureza}
                      natureza={item.natureza}
                      total={item.total}
                      percentual={item.percentualTotal}
                      cor={item.cor}
                      alturaPx={alturaCalculada}
                      selecionada={selecionada}
                      totalColunas={dadosNaturezas.length}
                      onSelecionar={() => setNaturezaSelecionada3D(item.natureza)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* =====================================================
               🔍 DETALHAMENTO DA NATUREZA SELECIONADA NA BARRA 3D
             ===================================================== */}
          {itemAtivo3D && (
            <div style={{
              backgroundColor: '#173F5F',
              border: `2px solid ${itemAtivo3D.cor}`,
              borderRadius: '20px',
              padding: '18px 20px',
              boxShadow: `0 8px 30px rgba(0, 0, 0, 0.5), 0 0 16px ${itemAtivo3D.cor}40`,
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }} className="animate-fade-in">
              {/* Cabeçalho do Detalhamento Aberto */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                paddingBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '26px' }}>{itemAtivo3D.natureza.split(' ')[0]}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF' }}>
                      {itemAtivo3D.natureza}
                    </h3>
                    <span style={{ fontSize: '11.5px', color: '#D0DCE5' }}>
                      {itemAtivo3D.categorias.length} {itemAtivo3D.categorias.length === 1 ? 'subcategoria' : 'subcategorias'} • {lancamentosDaNatureza.length} lançamentos
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F8D117' }}>
                    {formatarMoeda(itemAtivo3D.total)}
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(0, 0, 0, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {itemAtivo3D.percentualTotal.toFixed(1)}% de todas as despesas
                  </span>
                </div>
              </div>

              {/* Lista das Subcategorias Detalhadas com Barras de Progresso e Valores */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                  Subcategorias com Respectivos Valores
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {itemAtivo3D.categorias.map((cat, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#205B7D',
                        border: '1px solid #3A9BD5',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '13.5px', color: '#FFFFFF', fontWeight: 800 }}>
                            {cat.nome}
                          </strong>
                          <span style={{ fontSize: '11px', color: '#D0DCE5', display: 'block' }}>
                            {cat.quantidade} {cat.quantidade === 1 ? 'lançamento' : 'lançamentos'}
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF' }}>
                            {formatarMoeda(cat.total)}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#F8D117', display: 'block' }}>
                            {cat.percentualNatureza.toFixed(1)}% do setor
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Subcategoria */}
                      <div style={{
                        height: '7px',
                        backgroundColor: '#0F2744',
                        borderRadius: '999px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(cat.percentualNatureza, 100)}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${itemAtivo3D.cor} 0%, #F8D117 100%)`,
                          borderRadius: '999px',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lançamentos Detalhados Individuais no Período */}
              {lancamentosDaNatureza.length > 0 && (
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: '8px' }}>
                    Últimas Compras nesta Natureza ({competenciaAtiva})
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                    {lancamentosDaNatureza.slice(0, 6).map((l) => (
                      <div key={l.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#0F2744',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <span style={{ color: '#5090D3', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                            {formatarData(l.data).slice(0, 5)}
                          </span>
                          <span style={{ color: '#FFFFFF', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {l.descricao}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <span style={{ fontSize: '10.5px', color: '#F8D117', fontWeight: 600 }}>
                            {l.pagamento}
                          </span>
                          <strong style={{ color: '#F44336', fontWeight: 800 }}>
                            {formatarMoeda(l.valor)}
                          </strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =====================================================
             📑 DETALHAMENTO EM LISTA ACCORDION
           ===================================================== */
        <div style={{
          backgroundColor: '#0F2744',
          border: '2px solid #F8D117',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), 0 0 16px rgba(248, 209, 23, 0.22)'
        }}>
          {/* Cabeçalho do Bloco Único Destacado */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(90deg, #132F4C 0%, #16385C 100%)',
            borderBottom: '1px solid rgba(248, 209, 23, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.4px' }}>
                  Gastos por Categoria
                </span>
                <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#94A3B8' }}>
                  Detalhamento consolidado por natureza
                </p>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              color: '#F8D117',
              backgroundColor: 'rgba(248, 209, 23, 0.12)',
              border: '1px solid rgba(248, 209, 23, 0.35)',
              padding: '3px 9px',
              borderRadius: '12px',
              fontWeight: 800
            }}>
              {dadosNaturezas.length} {dadosNaturezas.length === 1 ? 'Natureza' : 'Naturezas'}
            </span>
          </div>

          {/* Linhas das Naturezas em Bloco Único Sem Linhas de Divisão */}
          {dadosNaturezas.map((item) => {
            const expandido = Boolean(naturezasExpandidas[item.natureza]);

            return (
              <div 
                key={item.natureza}
                style={{
                  border: 'none',
                  borderBottom: 'none',
                  borderRadius: expandido ? '12px' : '0px',
                  margin: expandido ? '4px 6px' : '0px',
                  overflow: 'hidden',
                  boxShadow: expandido ? `0 4px 18px rgba(0, 0, 0, 0.35), 0 0 12px ${item.cor}33` : 'none',
                  transition: 'all 0.25s ease',
                  backgroundColor: expandido ? 'rgba(23, 63, 95, 0.35)' : 'transparent'
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

                  {/* Barra de Progresso da Natureza */}
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

                {/* Subcategorias Detalhadas */}
                {expandido && (
                  <div style={{
                    padding: '16px 20px 20px 22px',
                    borderTop: '1px solid #287EA5',
                    borderBottom: '1px solid #287EA5',
                    backgroundColor: '#173F5F',
                    borderLeft: `5px solid ${item.cor}`,
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
                          backgroundColor: '#205B7D',
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

                        {/* Barra de Progresso Subcategoria */}
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
