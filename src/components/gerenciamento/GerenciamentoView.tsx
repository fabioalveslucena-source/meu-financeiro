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
    editarLancamento
  } = useFinanceStore();

  const [itemParaExcluir, setItemParaExcluir] = useState<Lancamento | null>(null);
  const [itemParaEditar, setItemParaEditar] = useState<Lancamento | null>(null);
  const [lancamentoDetalhes, setLancamentoDetalhes] = useState<Lancamento | null>(null);
  const [descricaoEdicao, setDescricaoEdicao] = useState('');
  const [valorEdicao, setValorEdicao] = useState('');
  const [lancamentoMercado, setLancamentoMercado] = useState<Lancamento | null>(null);

  const listaFiltrada = obterLancamentosFiltrados();

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
          Gerenciador de Lançamentos
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Pesquise, filtre, edite e remova movimentações ({competenciaAtiva})
        </p>
      </div>

      {/* Barra de Filtros e Busca Responsiva */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Linha 1: Campo de Busca com largura total */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por descrição, categoria, cartão..."
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            style={{ paddingLeft: '2.5rem', paddingRight: termoBusca ? '2.5rem' : '1rem', width: '100%', height: '44px', fontSize: '0.9rem' }}
          />
          {termoBusca && (
            <button
              onClick={() => setTermoBusca('')}
              style={{
                position: 'absolute',
                right: '0.75rem',
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
              <X size={16} />
            </button>
          )}
        </div>

        {/* Linha 2: Grade 2 Colunas para os Selects (sem truncamento) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
          {/* Filtro Tipo */}
          <div style={{ width: '100%' }}>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              style={{ width: '100%', height: '42px', fontSize: '0.84rem', paddingLeft: '0.65rem', paddingRight: '1.4rem' }}
            >
              <option value="Todos">Todos os Tipos</option>
              <option value="Despesa">Despesa</option>
              <option value="Receita">Receita</option>
              <option value="Investimento">Investimento</option>
            </select>
          </div>

          {/* Filtro Natureza */}
          <div style={{ width: '100%' }}>
            <select 
              value={filtroNatureza} 
              onChange={(e) => setFiltroNatureza(e.target.value)}
              style={{ width: '100%', height: '42px', fontSize: '0.84rem', paddingLeft: '0.65rem', paddingRight: '1.4rem' }}
            >
              <option value="Todas">Todas as Naturezas</option>
              {naturezas.map((n) => (
                <option key={n.id} value={n.label}>{n.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Lançamentos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {listaFiltrada.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Filter size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>Nenhum lançamento corresponde aos filtros atuais.</p>
          </div>
        ) : (
          listaFiltrada.map((item) => {
            const isDespesa = item.tipo === 'Despesa';
            const isReceita = item.tipo === 'Receita';
            const corValor = isReceita ? 'var(--color-receita)' : item.tipo === 'Investimento' ? 'var(--color-investimento)' : 'var(--color-despesa)';

            return (
              <div key={item.id} className="card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <div 
                  onClick={() => setLancamentoDetalhes(item)}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flex: 1, minWidth: 0 }}
                  title="Toque para ver os detalhes completos deste lançamento"
                >
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    backgroundColor: isReceita ? 'var(--color-receita-bg)' : isDespesa ? 'var(--color-despesa-bg)' : 'var(--color-investimento-bg)',
                    flexShrink: 0
                  }}>
                    {isReceita ? '🟢' : isDespesa ? '🔴' : '🔵'}
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.descricao}
                      </h4>
                      {item.parcela && item.totalParcelas && item.totalParcelas > 1 ? (
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '2.5px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(138, 5, 190, 0.2)',
                          border: '1px solid rgba(192, 132, 252, 0.4)',
                          color: '#C084FC'
                        }}>
                          📦 Parcela {item.parcela}/{item.totalParcelas}
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          padding: '2.5px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(40, 126, 165, 0.18)',
                          border: '1px solid rgba(80, 144, 211, 0.35)',
                          color: '#5090D3'
                        }}>
                          ⚡ À vista
                        </span>
                      )}

                      {item.detalhesMercado && (
                        <button
                          type="button"
                          onClick={() => setLancamentoMercado(item)}
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '2.5px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(76, 175, 80, 0.22)',
                            color: '#66BB6A',
                            border: '1px solid rgba(76, 175, 80, 0.45)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Ver cupom detalhado de compras do Meu Mercado"
                        >
                          <ShoppingCart size={12} />
                          <span>Cupom ({item.detalhesMercado.itens.length} itens)</span>
                        </button>
                      )}
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                      <span>📅 {formatarData(item.data)}</span>
                      <span>•</span>
                      <span>{item.natureza}</span>
                      <span>•</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.categoria}</strong>
                      <span>•</span>
                      <span style={{ color: '#82B1FF', fontWeight: 600 }}>{item.pagamento}</span>
                      <span>•</span>
                      <span style={{ fontWeight: 600 }}>
                        {item.parcela && item.totalParcelas && item.totalParcelas > 1 
                          ? `(Parcela ${item.parcela}/${item.totalParcelas})` 
                          : '(À vista)'}
                      </span>
                      {item.cartao && <span>• 💳 {item.cartao}</span>}
                      {item.conta && <span>• 🏦 {item.conta}</span>}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: corValor }}>
                    {isDespesa ? '- ' : '+ '}
                    {formatarMoeda(item.valor)}
                  </span>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => iniciarEdicao(item)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--brand-secondary)'
                      }}
                      title="Editar lançamento"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => setItemParaExcluir(item)}
                      style={{
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-despesa-bg)',
                        color: 'var(--color-despesa)'
                      }}
                      title="Excluir lançamento"
                    >
                      <Trash2 size={16} />
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
