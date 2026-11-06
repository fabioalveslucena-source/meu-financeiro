import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda, formatarData } from '../../lib/formatters';
import type { Lancamento } from '../../types';
import { 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  AlertTriangle, 
  Filter,
  ShoppingCart
} from 'lucide-react';
import { ReciboMercadoModal } from '../mercado/ReciboMercadoModal';
import { DetalhesLancamentoModal } from '../extrato/DetalhesLancamentoModal';

export const GerenciamentoView: React.FC = () => {
  const { 
    obterLancamentosFiltrados, 
    competenciaAtiva,
    termoBusca, 
    setTermoBusca,
    filtroTipo, 
    setFiltroTipo,
    filtroNatureza, 
    setFiltroNatureza,
    naturezas,
    excluirLancamento,
    editarLancamento,
    limparLancamentosDoMes
  } = useFinanceStore();

  const [itemParaExcluir, setItemParaExcluir] = useState<Lancamento | null>(null);
  const [itemParaEditar, setItemParaEditar] = useState<Lancamento | null>(null);
  const [lancamentoDetalhes, setLancamentoDetalhes] = useState<Lancamento | null>(null);
  const [descricaoEdicao, setDescricaoEdicao] = useState('');
  const [valorEdicao, setValorEdicao] = useState('');
  const [lancamentoMercado, setLancamentoMercado] = useState<Lancamento | null>(null);

  const listaFiltrada = obterLancamentosFiltrados();

  const handleLimparMes = () => {
    if (window.confirm(`Tem certeza que deseja excluir todos os lançamentos da competência ${competenciaAtiva}? Esta ação é definitiva e não pode ser desfeita.`)) {
      limparLancamentosDoMes(competenciaAtiva);
    }
  };

  const iniciarEdicao = (item: Lancamento) => {
    setItemParaEditar(item);
    setDescricaoEdicao(item.descricao);
    setValorEdicao(String(item.valor).replace('.', ','));
  };

  const salvarEdicao = () => {
    if (!itemParaEditar) return;
    const valorNum = parseFloat(valorEdicao.replace(',', '.'));
    if (!valorNum || valorNum <= 0) {
      alert('Informe um valor válido.');
      return;
    }
    if (!descricaoEdicao.trim()) {
      alert('Informe a descrição.');
      return;
    }

    editarLancamento(itemParaEditar.id, {
      descricao: descricaoEdicao.trim(),
      valor: valorNum,
    });
    setItemParaEditar(null);
  };

  const confirmarExclusao = (todasParcelas: boolean) => {
    if (!itemParaExcluir) return;
    excluirLancamento(itemParaExcluir.id, todasParcelas);
    setItemParaExcluir(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            Gerenciador de Lançamentos
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Pesquise, filtre, edite e remova movimentações ({competenciaAtiva})
          </p>
        </div>
        {listaFiltrada.length > 0 && (
          <button
            type="button"
            onClick={handleLimparMes}
            style={{
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(244, 67, 54, 0.4)',
              background: 'rgba(244, 67, 54, 0.12)',
              color: '#EF5350',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title={`Excluir todos os lançamentos da competência ${competenciaAtiva}`}
          >
            <Trash2 size={12} />
            <span>Limpar mês {competenciaAtiva}</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros e Busca Responsiva */}
      <div className="card" style={{ padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Linha 1: Campo de Busca com largura total */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar descrição, categoria, cartão..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            style={{ paddingLeft: '2.2rem', paddingRight: termoBusca ? '2.2rem' : '0.8rem', width: '100%', height: '38px', fontSize: '0.85rem' }}
          />
          {termoBusca && (
            <button
              onClick={() => setTermoBusca('')}
              style={{
                position: 'absolute',
                right: '0.65rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
              title="Limpar busca"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Linha 2: Grade 2 Colunas para os Selects */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {/* Filtro Tipo */}
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            style={{ width: '100%', height: '36px', fontSize: '0.8rem', paddingLeft: '0.5rem', paddingRight: '1rem' }}
          >
            <option value="Todos">Todos os Tipos</option>
            <option value="Despesa">Despesa</option>
            <option value="Receita">Receita</option>
            <option value="Investimento">Investimento</option>
          </select>

          {/* Filtro Natureza */}
          <select 
            value={filtroNatureza} 
            onChange={(e) => setFiltroNatureza(e.target.value)}
            style={{ width: '100%', height: '36px', fontSize: '0.8rem', paddingLeft: '0.5rem', paddingRight: '1rem' }}
          >
            <option value="Todas">Todas Naturezas</option>
            {naturezas.map((n) => (
              <option key={n.id} value={n.label}>{n.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Lançamentos Responsiva e Compacta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {listaFiltrada.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Filter size={28} color="var(--text-tertiary)" style={{ margin: '0 auto 0.5rem auto' }} />
            <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem' }}>Nenhum lançamento corresponde aos filtros atuais.</p>
          </div>
        ) : (
          listaFiltrada.map((item) => {
            const isDespesa = item.tipo === 'Despesa';
            const isReceita = item.tipo === 'Receita';
            const corValor = isReceita ? 'var(--color-receita)' : item.tipo === 'Investimento' ? 'var(--color-investimento)' : 'var(--color-despesa)';

            return (
              <div 
                key={item.id} 
                className="card" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 11px',
                  gap: '8px',
                  backgroundColor: '#0F2744',
                  borderRadius: '13px',
                  border: '1px solid #1E3A5F',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {/* Lado Esquerdo Clicável para Detalhes (Ícone + Título + Subtítulo) */}
                <div 
                  onClick={() => setLancamentoDetalhes(item)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '9px', 
                    cursor: 'pointer', 
                    flex: 1, 
                    minWidth: 0 
                  }}
                  title="Toque para ver os detalhes completos deste lançamento"
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    backgroundColor: isReceita ? 'rgba(76, 175, 80, 0.16)' : isDespesa ? 'rgba(244, 67, 54, 0.16)' : 'rgba(33, 150, 243, 0.16)',
                    border: `1px solid ${isReceita ? 'rgba(76, 175, 80, 0.3)' : isDespesa ? 'rgba(244, 67, 54, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`,
                    flexShrink: 0
                  }}>
                    {isReceita ? '🟢' : isDespesa ? '🔴' : '🔵'}
                  </div>

                  <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {/* Linha 1: Descrição + Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                      <span style={{ 
                        fontSize: '13px', 
                        fontWeight: 700, 
                        color: '#FFFFFF',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap' 
                      }}>
                        {item.descricao}
                      </span>

                      {item.parcela && item.totalParcelas && item.totalParcelas > 1 ? (
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(138, 5, 190, 0.22)',
                          border: '1px solid rgba(192, 132, 252, 0.4)',
                          color: '#C084FC',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          📦 {item.parcela}/{item.totalParcelas}
                        </span>
                      ) : null}

                      {item.detalhesMercado && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLancamentoMercado(item);
                          }}
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(76, 175, 80, 0.22)',
                            color: '#66BB6A',
                            border: '1px solid rgba(76, 175, 80, 0.45)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            whiteSpace: 'nowrap',
                            flexShrink: 0
                          }}
                          title="Ver cupom de compras do Meu Mercado"
                        >
                          <ShoppingCart size={10} />
                          <span>Cupom</span>
                        </button>
                      )}
                    </div>

                    {/* Linha 2: Data • Categoria • Pagamento/Cartão (Enxuto em linha única sem quebras) */}
                    <div style={{ 
                      fontSize: '11px', 
                      color: '#8A99AD', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      <span>{formatarData(item.data)}</span>
                      <span>•</span>
                      <strong style={{ color: '#E2E8F0', fontWeight: 600 }}>{item.categoria}</strong>
                      <span>•</span>
                      <span style={{ color: '#64B5F6' }}>
                        {item.cartao ? item.cartao : item.pagamento}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Valor e Botões de Ação */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexShrink: 0 }}>
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: 800, 
                    color: corValor, 
                    whiteSpace: 'nowrap',
                    textAlign: 'right'
                  }}>
                    {isDespesa ? '- ' : '+ '}
                    {formatarMoeda(item.valor)}
                  </span>

                  <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        iniciarEdicao(item);
                      }}
                      style={{
                        width: '27px',
                        height: '27px',
                        borderRadius: '7px',
                        backgroundColor: '#132F4C',
                        border: '1px solid #1E3A5F',
                        color: '#64B5F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Editar lançamento"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setItemParaExcluir(item);
                      }}
                      style={{
                        width: '27px',
                        height: '27px',
                        borderRadius: '7px',
                        backgroundColor: 'rgba(244, 67, 54, 0.12)',
                        border: '1px solid rgba(244, 67, 54, 0.35)',
                        color: '#EF5350',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title="Excluir lançamento"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Exclusão Segura */}
      {itemParaExcluir && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--bg-overlay)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={24} color="var(--color-alerta)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Confirmar Exclusão</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Deseja realmente remover o lançamento <strong>"{itemParaExcluir.descricao}"</strong> no valor de <strong>{formatarMoeda(itemParaExcluir.valor)}</strong>?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {itemParaExcluir.compraId && (
                <button
                  onClick={() => confirmarExclusao(true)}
                  className="btn-danger"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Excluir TODAS as {itemParaExcluir.totalParcelas} parcelas vinculadas
                </button>
              )}
              <button
                onClick={() => confirmarExclusao(false)}
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Excluir Apenas Esta Parcela
              </button>
              <button
                onClick={() => setItemParaExcluir(null)}
                style={{
                  padding: '0.75rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {itemParaEditar && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--bg-overlay)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Editar Lançamento</h3>
              <button onClick={() => setItemParaEditar(null)} style={{ color: 'var(--text-tertiary)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  DESCRIÇÃO
                </label>
                <input
                  type="text"
                  value={descricaoEdicao}
                  onChange={(e) => setDescricaoEdicao(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  VALOR (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorEdicao}
                  onChange={(e) => setValorEdicao(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setItemParaEditar(null)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={salvarEdicao} className="btn-primary">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes Explodidos do Lançamento */}
      <DetalhesLancamentoModal
        lancamento={lancamentoDetalhes}
        aoFechar={() => setLancamentoDetalhes(null)}
        aoEditar={(l) => iniciarEdicao(l)}
        aoExcluir={(l) => setItemParaExcluir(l)}
        aoAbrirCupomMercado={(l) => {
          setLancamentoDetalhes(null);
          setLancamentoMercado(l);
        }}
      />

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
