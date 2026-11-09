import React, { useState, useMemo } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda } from '../../lib/formatters';
import type { ResultadoCupomFiscal, ItemCupomFiscal } from '../../services/geminiVisionService';
import type { FormaPagamento } from '../../types';
import { 
  X, 
  Trash2, 
  Plus, 
  Calendar, 
  Store, 
  CreditCard, 
  Tag, 
  ShoppingCart,
  CheckCircle2,
  DollarSign
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
    naturezas, 
    categorias, 
    adicionarLancamento, 
    mostrarToast
  } = useFinanceStore();

  if (!aberto || !resultado) return null;

  // Estados locais da conferência
  const [estabelecimento, setEstabelecimento] = useState(resultado.estabelecimento);
  const [dataCompra, setDataCompra] = useState(resultado.data);
  const [itens, setItens] = useState<ItemCupomFiscal[]>(resultado.itens);
  
  // Forma de pagamento
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(
    (resultado.formaPagamentoSugerida as FormaPagamento) || '💳 Crédito'
  );
  
  // Cartão associado (se for crédito)
  const cartaoInicial = cartoes[0]?.nome || 'Banco do Brasil Ourocard';
  const [cartaoSelecionado, setCartaoSelecionado] = useState<string>(cartaoInicial);

  // Natureza e Categoria
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<string>(
    resultado.naturezaSugerida || naturezas[0]?.label || '🛒 Alimentação'
  );
  
  const categoriasDaNatureza = useMemo(() => {
    return categorias.filter(c => c.natureza.toLowerCase().trim() === naturezaSelecionada.toLowerCase().trim());
  }, [categorias, naturezaSelecionada]);

  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>(
    resultado.categoriaSugerida || categoriasDaNatureza[0]?.nome || 'Supermercado'
  );

  // Itens selecionados e valor total recalculado dinamicamente
  const itensMarcados = itens.filter(i => i.selecionado);
  const valorTotalCalculado = useMemo(() => {
    return itensMarcados.reduce((acc, curr) => acc + (Number(curr.precoTotal) || 0), 0);
  }, [itensMarcados]);

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
      conta: !ehCredito ? 'Conta Corrente' : undefined,
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
          gap: '14px'
        }}>
          {/* Card Principal: Estabelecimento, Data e Total */}
          <div style={{
            backgroundColor: '#132F4C',
            borderRadius: '16px',
            padding: '14px',
            border: '1px solid #1E3A5F',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {/* Estabelecimento */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', marginBottom: '4px' }}>
                <Store size={12} color="#F8D117" />
                <span>Estabelecimento / Loja</span>
              </label>
              <input
                type="text"
                value={estabelecimento}
                onChange={(e) => setEstabelecimento(e.target.value)}
                placeholder="Ex: Supermercado Pão de Açúcar"
                style={{
                  width: '100%',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#0A1B30',
                  border: '1px solid #265D97',
                  color: '#FFFFFF',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              />
            </div>

            {/* Linha com Data e Valor Total */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', marginBottom: '4px' }}>
                  <Calendar size={12} color="#5090D3" />
                  <span>Data da Compra</span>
                </label>
                <input
                  type="date"
                  value={dataCompra}
                  onChange={(e) => setDataCompra(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#0A1B30',
                    border: '1px solid #265D97',
                    color: '#FFFFFF',
                    padding: '0 10px',
                    fontSize: '12.5px',
                    fontWeight: 700
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', marginBottom: '4px' }}>
                  <DollarSign size={12} color="#4CAF50" />
                  <span>Total Marcado</span>
                </label>
                <div style={{
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(76, 175, 80, 0.16)',
                  border: '1.5px solid #4CAF50',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontWeight: 900,
                  color: '#4CAF50'
                }}>
                  {formatarMoeda(valorTotalCalculado)}
                </div>
              </div>
            </div>

            {/* Linha com Forma de Pagamento e Cartão */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', marginBottom: '4px' }}>
                  <CreditCard size={12} color="#F8D117" />
                  <span>Forma de Pagamento</span>
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#0A1B30',
                    border: '1px solid #265D97',
                    color: '#FFFFFF',
                    padding: '0 10px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  <option value="💳 Crédito">💳 Cartão de Crédito</option>
                  <option value="💳 Débito">💳 Cartão de Débito</option>
                  <option value="📱 Pix">📱 Pix</option>
                  <option value="💵 Dinheiro">💵 Dinheiro</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', marginBottom: '4px' }}>
                  <Tag size={12} color="#5090D3" />
                  <span>Cartão Utilizado</span>
                </label>
                <select
                  value={cartaoSelecionado}
                  onChange={(e) => setCartaoSelecionado(e.target.value)}
                  disabled={!formaPagamento.includes('Crédito')}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: formaPagamento.includes('Crédito') ? '#0A1B30' : '#0B1929',
                    border: '1px solid #265D97',
                    color: formaPagamento.includes('Crédito') ? '#FFFFFF' : '#64748B',
                    padding: '0 10px',
                    fontSize: '12px',
                    fontWeight: 700
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
            </div>

            {/* Linha com Natureza e Categoria Financeira */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Natureza Financeira
                </label>
                <select
                  value={naturezaSelecionada}
                  onChange={(e) => {
                    setNaturezaSelecionada(e.target.value);
                    const novasCats = categorias.filter(c => c.natureza.toLowerCase().trim() === e.target.value.toLowerCase().trim());
                    if (novasCats[0]) setCategoriaSelecionada(novasCats[0].nome);
                  }}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#0A1B30',
                    border: '1px solid #265D97',
                    color: '#FFFFFF',
                    padding: '0 10px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  {naturezas.map(n => (
                    <option key={n.id} value={n.label}>{n.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Categoria Financeira
                </label>
                <select
                  value={categoriaSelecionada}
                  onChange={(e) => setCategoriaSelecionada(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: '#0A1B30',
                    border: '1px solid #265D97',
                    color: '#FFFFFF',
                    padding: '0 10px',
                    fontSize: '12px',
                    fontWeight: 700
                  }}
                >
                  {categoriasDaNatureza.map(c => (
                    <option key={c.id} value={c.nome}>{c.nome}</option>
                  ))}
                  {categoriasDaNatureza.length === 0 && (
                    <option value="Supermercado">Supermercado</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Seção da Lista de Itens do Cupom */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={toggleTodos}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#F8D117',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(248, 209, 23, 0.12)'
                  }}
                >
                  {todosMarcados ? 'Desmarcar Todos' : 'Marcar Todos'}
                </button>
                <span style={{ fontSize: '11.5px', color: '#8A99AD' }}>
                  ({itensMarcados.length} de {itens.length} itens inclusos)
                </span>
              </div>

              <button
                type="button"
                onClick={adicionarItemManual}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#132F4C',
                  border: '1px solid #1E3A5F',
                  color: '#5090D3',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '4px 8px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={12} />
                <span>Item</span>
              </button>
            </div>

            {/* Grade de Itens */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {itens.map((it) => (
                <div
                  key={it.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: '12px',
                    backgroundColor: it.selecionado ? '#132F4C' : 'rgba(19, 47, 76, 0.4)',
                    border: it.selecionado ? '1px solid #265D97' : '1px dashed #1E3A5F',
                    opacity: it.selecionado ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={it.selecionado}
                    onChange={() => toggleItem(it.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#4CAF50',
                      flexShrink: 0
                    }}
                  />

                  {/* Nome do Item */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input
                      type="text"
                      value={it.nome}
                      onChange={(e) => atualizarItem(it.id, 'nome', e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: it.selecionado ? '#FFFFFF' : '#8A99AD',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        padding: 0,
                        outline: 'none'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: '#8A99AD', marginTop: '2px' }}>
                      <span>Qtd:</span>
                      <input
                        type="number"
                        step="any"
                        value={it.quantidade}
                        onChange={(e) => atualizarItem(it.id, 'quantidade', e.target.value)}
                        style={{
                          width: '42px',
                          backgroundColor: '#0A1B30',
                          border: '1px solid #1E3A5F',
                          borderRadius: '4px',
                          color: '#5090D3',
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 3px'
                        }}
                      />
                      <span>x</span>
                      <span>{formatarMoeda(it.precoUnitario)}</span>
                    </div>
                  </div>

                  {/* Valor Total do Item */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <input
                      type="number"
                      step="0.01"
                      value={it.precoTotal}
                      onChange={(e) => atualizarItem(it.id, 'precoTotal', e.target.value)}
                      style={{
                        width: '68px',
                        backgroundColor: '#0A1B30',
                        border: '1px solid #1E3A5F',
                        borderRadius: '6px',
                        color: it.selecionado ? '#4CAF50' : '#8A99AD',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        textAlign: 'right',
                        padding: '4px 6px'
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => removerItem(it.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#EF5350',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex'
                      }}
                      title="Excluir este item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé Fixo com Botão de Confirmação */}
        <div style={{
          padding: '14px 18px',
          borderTop: '1px solid #1E3A5F',
          backgroundColor: '#0A1B30',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onFechar}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '12px',
              backgroundColor: '#132F4C',
              border: '1px solid #1E3A5F',
              color: '#CBD5E1',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleConfirmar}
            style={{
              flex: 2,
              padding: '11px',
              borderRadius: '12px',
              backgroundColor: '#4CAF50',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 3px 14px rgba(76, 175, 80, 0.4)'
            }}
          >
            <CheckCircle2 size={16} />
            <span>Confirmar e Lançar ({formatarMoeda(valorTotalCalculado)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
