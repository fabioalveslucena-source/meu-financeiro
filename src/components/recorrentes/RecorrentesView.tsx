import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda } from '../../lib/formatters';
import type { DespesaRecorrente } from '../../types';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit3, 
  Zap, 
  X
} from 'lucide-react';

export const RecorrentesView: React.FC = () => {
  const { 
    despesasRecorrentes, 
    competenciaAtiva,
    verificarStatusRecorrenteNoMes,
    lancarRecorrenteNoMes,
    adicionarRecorrente,
    atualizarRecorrente,
    excluirRecorrente,
    naturezas,
    categorias,
    cartoes,
    contas
  } = useFinanceStore();

  const [modalAberto, setModalAberto] = useState(false);
  const [itemEdicao, setItemEdicao] = useState<DespesaRecorrente | null>(null);

  // Form State
  const [descricao, setDescricao] = useState('');
  const [valorTexto, setValorTexto] = useState('');
  const [diaVencimento, setDiaVencimento] = useState(10);
  const [natureza, setNatureza] = useState('🏠 Moradia');
  const [categoria, setCategoria] = useState('Aluguel / Condomínio');
  const [pagamento, setPagamento] = useState<any>('📝 Boleto');
  const [cartao, setCartao] = useState('');
  const [conta, setConta] = useState('');

  const totalMensal = despesasRecorrentes
    .filter(r => r.ativa)
    .reduce((acc, curr) => acc + curr.valor, 0);

  const abrirModalNovo = () => {
    setItemEdicao(null);
    setDescricao('');
    setValorTexto('');
    setDiaVencimento(10);
    setNatureza('🏠 Moradia');
    setCategoria('Aluguel / Condomínio');
    setPagamento('📝 Boleto');
    setCartao(cartoes[0]?.nome || '');
    setConta(contas[0]?.nome || '');
    setModalAberto(true);
  };

  const abrirModalEdicao = (rec: DespesaRecorrente) => {
    setItemEdicao(rec);
    setDescricao(rec.descricao);
    setValorTexto(String(rec.valor).replace('.', ','));
    setDiaVencimento(rec.diaVencimento);
    setNatureza(rec.natureza);
    setCategoria(rec.categoria);
    setPagamento(rec.pagamento);
    setCartao(rec.cartao || cartoes[0]?.nome || '');
    setConta(rec.conta || contas[0]?.nome || '');
    setModalAberto(true);
  };

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = parseFloat(valorTexto.replace(',', '.'));
    if (!descricao.trim()) {
      alert('Informe a descrição da conta recorrente.');
      return;
    }
    if (!valorNum || valorNum <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    if (itemEdicao) {
      atualizarRecorrente(itemEdicao.id, {
        descricao: descricao.trim(),
        valor: valorNum,
        diaVencimento,
        natureza,
        categoria,
        pagamento,
        cartao: pagamento === '💳 Crédito' ? cartao : undefined,
        conta: pagamento !== '💳 Crédito' ? conta : undefined,
      });
    } else {
      adicionarRecorrente({
        descricao: descricao.trim(),
        valor: valorNum,
        diaVencimento,
        natureza,
        categoria,
        pagamento,
        cartao: pagamento === '💳 Crédito' ? cartao : undefined,
        conta: pagamento !== '💳 Crédito' ? conta : undefined,
        ativa: true,
      });
    }

    setModalAberto(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Banner Resumo de Despesas Fixas */}
      <div style={{
        padding: '1.25rem',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #173A5E 0%, #0F2744 100%)',
        border: '1.5px solid #287EA5',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🔁 Gestão de Contas & Assinaturas Fixas
          </span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF' }}>
            {formatarMoeda(totalMensal)} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#AAB4BE' }}>/ mês previsto</span>
          </h3>
          <span style={{ fontSize: '11px', color: '#B0BEC5' }}>
            {despesasRecorrentes.filter(r => r.ativa).length} compromissos cadastrados • Competência ativa: {competenciaAtiva}
          </span>
        </div>

        <button
          type="button"
          onClick={abrirModalNovo}
          className="btn-primary"
          style={{ gap: '6px', padding: '0.7rem 1.2rem', fontSize: '0.85rem' }}
        >
          <Plus size={16} />
          <span>Cadastrar Conta Fixa</span>
        </button>
      </div>

      {/* Lista de Contas Recorrentes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {despesasRecorrentes.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: '#AAB4BE' }}>
            <Calendar size={36} color="#5090D3" style={{ margin: '0 auto 0.75rem auto' }} />
            <p style={{ margin: 0, fontWeight: 700 }}>Nenhuma despesa fixa cadastrada ainda.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem' }}>
              Cadastre contas como Aluguel, Luz, Internet, Mensalidades e Assinaturas para lançar todo mês com 1 clique.
            </p>
          </div>
        ) : (
          despesasRecorrentes.map((rec) => {
            const jaLancada = verificarStatusRecorrenteNoMes(rec, competenciaAtiva);

            return (
              <div 
                key={rec.id} 
                className="card" 
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem 1.25rem',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  borderColor: jaLancada ? 'rgba(76, 175, 80, 0.4)' : '#1E3A5F',
                  backgroundColor: jaLancada ? 'rgba(15, 39, 68, 0.7)' : '#0F2744'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: jaLancada ? 'rgba(76, 175, 80, 0.15)' : 'rgba(248, 209, 23, 0.15)',
                    border: `1px solid ${jaLancada ? '#4CAF50' : '#F8D117'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {jaLancada ? '✅' : '📅'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>{rec.descricao}</strong>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        backgroundColor: '#173F5F',
                        color: '#82B1FF'
                      }}>
                        Dia {rec.diaVencimento}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        backgroundColor: jaLancada ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                        color: jaLancada ? '#4CAF50' : '#FF9800',
                        border: `1px solid ${jaLancada ? '#4CAF50' : '#FF9800'}`
                      }}>
                        {jaLancada ? `✓ Lançado em ${competenciaAtiva}` : `Pendente (${competenciaAtiva})`}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.8rem', color: '#AAB4BE', display: 'flex', gap: '6px', alignItems: 'center', marginTop: '3px' }}>
                      <span>{rec.natureza}</span>
                      <span>•</span>
                      <span>{rec.categoria}</span>
                      <span>•</span>
                      <span>{rec.pagamento}</span>
                      {rec.cartao && <span>({rec.cartao})</span>}
                      {rec.conta && <span>({rec.conta})</span>}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <strong style={{ fontSize: '1.15rem', color: '#F44336', fontWeight: 900 }}>
                    - {formatarMoeda(rec.valor)}
                  </strong>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {!jaLancada && (
                      <button
                        type="button"
                        onClick={() => lancarRecorrenteNoMes(rec.id, competenciaAtiva)}
                        className="btn-primary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '8px',
                          gap: '4px'
                        }}
                        title={`Lançar nesta competência (${competenciaAtiva})`}
                      >
                        <Zap size={13} />
                        <span>Lançar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => abrirModalEdicao(rec)}
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        backgroundColor: '#132F4C',
                        color: '#5090D3',
                        border: '1px solid #1E3A5F'
                      }}
                      title="Editar conta fixa"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remover conta recorrente "${rec.descricao}"?`)) {
                          excluirRecorrente(rec.id);
                        }
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(244, 67, 54, 0.15)',
                        color: '#F44336',
                        border: '1px solid rgba(244, 67, 54, 0.3)'
                      }}
                      title="Excluir conta fixa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Criação / Edição de Despesa Recorrente */}
      {modalAberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#F8D117" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  {itemEdicao ? 'Editar Conta Recorrente' : 'Nova Despesa Fixa Recorrente'}
                </h3>
              </div>
              <button onClick={() => setModalAberto(false)} style={{ color: '#AAB4BE' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Descrição da Conta
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aluguel, Luz, Netflix, Escola..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Valor Previsto (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valorTexto}
                    onChange={(e) => setValorTexto(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Dia de Vencimento
                  </label>
                  <select
                    value={diaVencimento}
                    onChange={(e) => setDiaVencimento(Number(e.target.value))}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
                      <option key={dia} value={dia}>Dia {dia}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Natureza
                  </label>
                  <select
                    value={natureza}
                    onChange={(e) => {
                      setNatureza(e.target.value);
                      const fil = categorias.filter(c => c.natureza === e.target.value);
                      if (fil.length > 0) setCategoria(fil[0].nome);
                    }}
                  >
                    {naturezas.map((n) => (
                      <option key={n.id} value={n.label}>{n.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                  >
                    {categorias.filter(c => c.natureza === natureza).map((c) => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Forma de Pagamento
                </label>
                <select
                  value={pagamento}
                  onChange={(e) => setPagamento(e.target.value as any)}
                >
                  <option value="📝 Boleto">📝 Boleto</option>
                  <option value="📱 Pix">📱 Pix</option>
                  <option value="🏦 Débito">🏦 Débito</option>
                  <option value="💳 Crédito">💳 Crédito</option>
                  <option value="💵 Dinheiro">💵 Dinheiro</option>
                </select>
              </div>

              {pagamento === '💳 Crédito' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Cartão de Crédito
                  </label>
                  <select value={cartao} onChange={(e) => setCartao(e.target.value)}>
                    {cartoes.map((c) => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {pagamento !== '💳 Crédito' && pagamento !== '💵 Dinheiro' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Conta Bancária
                  </label>
                  <select value={conta} onChange={(e) => setConta(e.target.value)}>
                    {contas.map((c) => (
                      <option key={c.id} value={c.nome}>{c.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {itemEdicao ? 'Salvar Alterações' : 'Cadastrar Conta Fixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
