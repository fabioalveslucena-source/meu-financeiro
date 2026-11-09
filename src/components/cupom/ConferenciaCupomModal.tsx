import React, { useState, useMemo, useEffect } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda } from '../../lib/formatters';
import type { ResultadoCupomFiscal, ItemCupomFiscal } from '../../services/geminiVisionService';
import type { FormaPagamento } from '../../types';
import { SeletorCategoriaPesquisa } from '../common/SeletorCategoriaPesquisa';
import { 
  X, 
  Trash2, 
  Plus, 
  Calendar, 
  Store, 
  CreditCard, 
  ShoppingCart,
  CheckCircle2
} from 'lucide-react';

interface ConferenciaCupomModalProps {
  resultado: ResultadoCupomFiscal | null;
  aberto: boolean;
  onFechar: () => void;
  onConcluido: () => void;
}

export const ConferenciaCupomModal: React.FC<ConferenciaCupomModalProps> = ({
  resultado,
  aberto,
  onFechar,
  onConcluido
}) => {
  const { 
    cartoes, 
    contas,
    naturezas, 
    categorias, 
    adicionarLancamento, 
    mostrarToast
  } = useFinanceStore();

  // Estados locais da conferência - SEMPRE chamados no topo incondicionalmente
  const [estabelecimento, setEstabelecimento] = useState(resultado?.estabelecimento || '');
  const [dataCompra, setDataCompra] = useState(resultado?.data || new Date().toISOString().slice(0, 10));
  const [itens, setItens] = useState<ItemCupomFiscal[]>(resultado?.itens || []);
  
  // Forma de pagamento
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(
    (resultado?.formaPagamentoSugerida as FormaPagamento) || '💳 Crédito'
  );
  
  // Cartão associado (se for crédito)
  const cartaoInicial = cartoes[0]?.nome || 'Banco do Brasil Ourocard';
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string>(cartaoInicial);

  // Conta associada (se for débito/pix)
  const contaInicial = contas[0]?.nome || 'Conta Corrente';
  const [contaSelecionada, setContaSelecionada] = useState<string>(contaInicial);

  // Natureza e Categoria
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<string>(
    resultado?.naturezaSugerida || naturezas[0]?.label || '🛒 Alimentação'
  );
  
  const categoriasDaNatureza = useMemo(() => {
    return categorias.filter(c => c.natureza.toLowerCase().trim() === naturezaSelecionada.toLowerCase().trim());
  }, [categorias, naturezaSelecionada]);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(
    resultado?.categoriaSugerida || categoriasDaNatureza[0]?.nome || 'Supermercado'
  );

  // Sincronizar estados caso um novo resultado chegue
  useEffect(() => {
    if (resultado) {
      setEstabelecimento(resultado.estabelecimento || 'Compra Fiscal');
      setDataCompra(resultado.data || new Date().toISOString().slice(0, 10));
      setItens(resultado.itens || []);
      if (resultado.formaPagamentoSugerida) {
        setFormaPagamento(resultado.formaPagamentoSugerida as FormaPagamento);
      }
      if (resultado.naturezaSugerida) {
        setNaturezaSelecionada(resultado.naturezaSugerida);
      }
      if (resultado.categoriaSugerida) {
        setCategoriaSelecionada(resultado.categoriaSugerida);
      }
    }
  }, [resultado]);

  // Itens selecionados e valor total recalculado dinamicamente
  const itensMarcados = itens.filter(i => i.selecionado);
  const valorTotalCalculado = useMemo(() => {
    return itensMarcados.reduce((acc, curr) => acc + (Number(curr.precoTotal) || 0), 0);
  }, [itensMarcados]);

  // Regra de Hooks: early return SOMENTE após todas as declarações de Hooks!
  if (!aberto || !resultado) return null;

  // Alternar checkbox de item
  const toggleItem = (id: string) => {
    setItens(prev => prev.map(it => it.id === id ? { ...it, selecionado: !it.selecionado } : it));
  };

  // Alternar todos os itens
  const todosMarcados = itens.length > 0 && itens.every(i => i.selecionado);
  const toggleTodos = () => {
    setItens(prev => prev.map(it => ({ ...it, selecionado: !todosMarcados })));
  };

  // Remover item da lista
  const removerItem = (id: string) => {
    setItens(prev => prev.filter(it => it.id !== id));
  };

  // Atualizar campo de item
  const atualizarItem = (id: string, campo: keyof ItemCupomFiscal, valor: any) => {
    setItens(prev => prev.map(it => {
      if (it.id !== id) return it;
      const atualizado = { ...it, [campo]: valor };
      if (campo === 'quantidade' || campo === 'precoUnitario') {
        const q = Number(campo === 'quantidade' ? valor : it.quantidade) || 1;
        const u = Number(campo === 'precoUnitario' ? valor : it.precoUnitario) || 0;
        atualizado.precoTotal = parseFloat((q * u).toFixed(2));
      }
      return atualizado;
    }));
  };

  // Adicionar item manual
  const adicionarItemManual = () => {
    const novo: ItemCupomFiscal = {
      id: `item-${Date.now()}`,
      nome: 'Novo Produto',
      quantidade: 1,
      precoUnitario: 0,
      precoTotal: 0,
      categoria: 'Geral',
      selecionado: true
    };
    setItens(prev => [...prev, novo]);
  };

  // Confirmar e lançar despesa no Meu Financeiro
  const handleConfirmar = () => {
    if (itensMarcados.length === 0) {
      alert('Selecione ao menos 1 produto para lançar.');
      return;
    }

    if (valorTotalCalculado <= 0) {
      alert('O valor total dos itens selecionados deve ser maior que zero.');
      return;
    }

    const ehCredito = formaPagamento === '💳 Crédito';

    adicionarLancamento({
      tipo: 'Despesa',
      descricao: estabelecimento.trim() || 'Compra com Cupom Fiscal',
      valor: parseFloat(valorTotalCalculado.toFixed(2)),
      data: dataCompra,
      natureza: naturezaSelecionada,
      categoria: categoriaSelecionada,
      pagamento: formaPagamento,
      cartao: ehCredito ? cartaoSelecionado : undefined,
      conta: !ehCredito ? contaSelecionada : undefined,
      origem: 'meu-mercado',
      detalhesMercado: {
        mercadoNome: estabelecimento.trim() || 'Supermercado',
        dataCompra: dataCompra,
        totalItens: itensMarcados.length,
        valorTotal: parseFloat(valorTotalCalculado.toFixed(2)),
        itens: itensMarcados.map(it => ({
          nome: it.nome,
          quantidade: it.quantidade,
          precoUnitario: it.precoUnitario,
          precoTotal: it.precoTotal,
          categoriaItem: it.categoria
        }))
      }
    });

    mostrarToast(`✓ Compra de ${formatarMoeda(valorTotalCalculado)} lançada com sucesso no extrato!`, 'sucesso');
    onConcluido();
    onFechar();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 12, 22, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 105,
      padding: '12px'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        maxHeight: '92vh',
        backgroundColor: '#0F2744',
        border: '1.5px solid #1E3A5F',
        borderRadius: '22px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 35px rgba(0,0,0,0.65)',
        color: '#FFFFFF',
        overflow: 'hidden'
      }}>
        {/* Topo / Cabeçalho Fixo */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid #1E3A5F',
          backgroundColor: '#0A1B30',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(248, 209, 23, 0.16)',
              border: '1px solid rgba(248, 209, 23, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F8D117'
            }}>
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>
                Conferência do Cupom Fiscal
              </h3>
              <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#8A99AD' }}>
                Revise os itens e aprove antes de lançar no seu financeiro
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onFechar}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A99AD',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo com Rolagem Suave */}
        <div style={{
          padding: '16px 18px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Seção 1: Dados Gerais da Compra */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            backgroundColor: '#132F4C',
            padding: '14px',
            borderRadius: '14px',
            border: '1px solid #1E3A5F'
          }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#8A99AD', marginBottom: '6px' }}>
                <Store size={13} color="#F8D117" />
                ESTABELECIMENTO:
              </label>
              <input 
                type="text" 
                value={estabelecimento}
                onChange={(e) => setEstabelecimento(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#0A1B30',
                  border: '1px solid #265D97',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#8A99AD', marginBottom: '6px' }}>
                <Calendar size={13} color="#5090D3" />
                DATA DA COMPRA:
              </label>
              <input 
                type="date" 
                value={dataCompra}
                onChange={(e) => setDataCompra(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#0A1B30',
                  border: '1px solid #265D97',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Seção 2: Classificação Financeira */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            backgroundColor: '#132F4C',
            padding: '14px',
            borderRadius: '14px',
            border: '1px solid #1E3A5F'
          }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#8A99AD', marginBottom: '6px' }}>
                <CreditCard size={13} color="#4CAF50" />
                FORMA DE PAGAMENTO:
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  backgroundColor: '#0A1B30',
                  border: '1px solid #265D97',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  boxSizing: 'border-box'
                }}
              >
                <option value="💳 Crédito">💳 Cartão de Crédito</option>
                <option value="💳 Débito">💳 Cartão de Débito</option>
                <option value="📱 Pix">📱 Pix</option>
                <option value="💵 Dinheiro">💵 Dinheiro</option>
              </select>
            </div>

            {formaPagamento === '💳 Crédito' ? (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8A99AD', marginBottom: '6px' }}>
                  CARTÃO DE CRÉDITO:
                </label>
                <select
                  value={cartaoSelecionado}
                  onChange={(e) => setCartaoSelecionado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#0A1B30',
                    border: '1px solid #265D97',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                >
                  {cartoes.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                  {cartoes.length === 0 && (
                    <option value="Cartão Padrão">Cartão Padrão</option>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8A99AD', marginBottom: '6px' }}>
                  CONTA DE SAÍDA:
                </label>
                <select
                  value={contaSelecionada}
                  onChange={(e) => setContaSelecionada(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    backgroundColor: '#0A1B30',
                    border: '1px solid #265D97',
                    color: '#FFFFFF',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                >
                  {contas.map(ct => (
                    <option key={ct.id} value={ct.nome}>{ct.nome}</option>
                  ))}
                  {contas.length === 0 && (
                    <option value="Conta Corrente">Conta Corrente</option>
                  )}
                </select>
              </div>
            )}

            <div>
              <SeletorCategoriaPesquisa
                valor={categoriaSelecionada}
                onSelecionar={(cat, nat) => {
                  setCategoriaSelecionada(cat);
                  if (nat) setNaturezaSelecionada(nat);
                }}
                label="CATEGORIA:"
                placeholder="Pesquisar categoria..."
              />
            </div>
          </div>

          {/* Seção 3: Lista de Produtos */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#FFFFFF' }}>
                  Itens do Cupom ({itensMarcados.length}/{itens.length} selecionados)
                </span>
                <button
                  type="button"
                  onClick={toggleTodos}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#5090D3',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {todosMarcados ? 'Desmarcar todos' : 'Marcar todos'}
                </button>
              </div>

              <button
                type="button"
                onClick={adicionarItemManual}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(80, 144, 211, 0.16)',
                  border: '1px solid rgba(80, 144, 211, 0.35)',
                  color: '#5090D3',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Plus size={13} />
                <span>Adicionar Item</span>
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '340px',
              overflowY: 'auto'
            }}>
              {itens.map((it) => (
                <div 
                  key={it.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: it.selecionado ? '#132F4C' : '#0B1E33',
                    border: it.selecionado ? '1px solid #265D97' : '1px solid #162C46',
                    opacity: it.selecionado ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={it.selecionado}
                    onChange={() => toggleItem(it.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#4CAF50'
                    }}
                  />

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <input
                      type="text"
                      value={it.nome}
                      onChange={(e) => atualizarItem(it.id, 'nome', e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: '12.5px',
                        fontWeight: 700
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#8A99AD' }}>
                      <span>Qtd:</span>
                      <input
                        type="number"
                        step="0.01"
                        value={it.quantidade}
                        onChange={(e) => atualizarItem(it.id, 'quantidade', e.target.value)}
                        style={{
                          width: '50px',
                          background: '#0A1B30',
                          border: '1px solid #1E3A5F',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          padding: '2px 4px',
                          textAlign: 'center'
                        }}
                      />
                      <span>x R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={it.precoUnitario}
                        onChange={(e) => atualizarItem(it.id, 'precoUnitario', e.target.value)}
                        style={{
                          width: '65px',
                          background: '#0A1B30',
                          border: '1px solid #1E3A5F',
                          borderRadius: '6px',
                          color: '#FFFFFF',
                          fontSize: '11px',
                          padding: '2px 4px',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '70px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#4CAF50' }}>
                      {formatarMoeda(it.precoTotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removerItem(it.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#F44336',
                      opacity: 0.7,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex'
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé Fixo com Total e Botão de Ação */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid #1E3A5F',
          backgroundColor: '#0A1B30',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontSize: '10.5px', color: '#8A99AD', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              TOTAL SELECIONADO:
            </div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: '#F8D117' }}>
              {formatarMoeda(valorTotalCalculado)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onFechar}
              style={{
                padding: '10px 16px',
                borderRadius: '12px',
                backgroundColor: '#132F4C',
                border: '1px solid #1E3A5F',
                color: '#CBD5E1',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirmar}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                backgroundColor: '#4CAF50',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Confirmar e Lançar Despesa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
