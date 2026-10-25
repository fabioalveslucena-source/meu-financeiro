import React, { useState, useEffect, useCallback } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { TIPOS_LANCAMENTO } from '../../lib/constants';
import { formatarDataInput, formatarMoeda, parseMoedaBR } from '../../lib/formatters';
import type { FormaPagamento, TipoLancamento } from '../../types';
import { Mic, Plus, X, Check } from 'lucide-react';
import { useVoiceRecognition } from '../../features/voice/useVoiceRecognition';
import { detectarComandoEfetuar } from '../../features/voice/voiceInterpreter';

interface FormLancamentoProps {
  onAbrirVoz: () => void;
  dadosPreenchidosVoz?: any;
  onNavegarCartoes?: () => void;
}

export const FormLancamento: React.FC<FormLancamentoProps> = ({ 
  onAbrirVoz,
  dadosPreenchidosVoz,
}) => {
  const { 
    categorias, 
    naturezas,
    cartoes, 
    contas, 
    adicionarLancamento,
    adicionarCategoria,
    adicionarNatureza,
  } = useFinanceStore();

  const [data, setData] = useState(formatarDataInput());
  const [tipo, setTipo] = useState<TipoLancamento>('Despesa');
  const [valorTexto, setValorTexto] = useState('');
  const [pagamento, setPagamento] = useState<FormaPagamento>('🏦 Débito');
  const [natureza, setNatureza] = useState('🛒 Alimentação');
  const [categoria, setCategoria] = useState('Supermercado');
  const [descricao, setDescricao] = useState('');
  const [cartao, setCartao] = useState('');
  const [conta, setConta] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [erros, setErros] = useState<string[]>([]);

  // Modal discreto para criar Nova Categoria ou Natureza
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [modoCriar, setModoCriar] = useState<'categoria' | 'natureza'>('categoria');
  const [novoNome, setNovoNome] = useState('');
  const [novoEmoji, setNovoEmoji] = useState('📦');
  const [novaNatPai, setNovaNatPai] = useState('');

  // Normalizador resiliente para casar strings com/sem emojis ou acentos
  const normalizarTexto = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w]/gi, '')
      .toLowerCase();

  // Categorias filtradas pela natureza selecionada de forma ultra-resiliente
  const categoriasFiltradas = categorias.filter((c) => {
    const matchTipo = c.tipo === tipo || c.tipo === 'Todos';
    if (!matchTipo) return false;
    if (c.natureza === natureza) return true;
    const n1 = normalizarTexto(c.natureza);
    const n2 = normalizarTexto(natureza);
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  });

  // Se a categoria selecionada não pertence à natureza ou ficou vazia, ajusta para a primeira válida
  useEffect(() => {
    if (categoriasFiltradas.length > 0) {
      const existe = categoriasFiltradas.some(c => c.nome.toLowerCase() === categoria.toLowerCase());
      if (!existe) {
        setCategoria(categoriasFiltradas[0].nome);
      }
    }
  }, [natureza, tipo, categoriasFiltradas]);

  // Inicializar defaults - Prioriza Banco do Brasil como solicitado pelo usuário
  useEffect(() => {
    if (cartoes.length > 0 && (!cartao || cartao.toLowerCase().includes('nubank'))) {
      const bb = cartoes.find(c => c.nome.includes('Banco do Brasil'));
      setCartao(bb ? bb.nome : cartoes[0].nome);
    }
    if (contas.length > 0 && (!conta || conta.includes('Itaú'))) {
      const bbConta = contas.find(c => c.nome.includes('Banco do Brasil'));
      setConta(bbConta ? bbConta.nome : contas[0].nome);
    }
  }, [cartoes, contas]);

  // Preenchimento vindo do comando de voz
  useEffect(() => {
    if (dadosPreenchidosVoz) {
      if (dadosPreenchidosVoz.tipo) setTipo(dadosPreenchidosVoz.tipo);
      if (dadosPreenchidosVoz.valor !== undefined && dadosPreenchidosVoz.valor !== null) {
        setValorTexto(dadosPreenchidosVoz.valor.toFixed(2).replace('.', ','));
      }
      if (dadosPreenchidosVoz.pagamento) setPagamento(dadosPreenchidosVoz.pagamento);
      if (dadosPreenchidosVoz.natureza) setNatureza(dadosPreenchidosVoz.natureza);
      if (dadosPreenchidosVoz.categoria) setCategoria(dadosPreenchidosVoz.categoria);
      if (dadosPreenchidosVoz.descricao) setDescricao(dadosPreenchidosVoz.descricao);
      if (dadosPreenchidosVoz.parcelas) setParcelas(dadosPreenchidosVoz.parcelas);

      // Se for crédito e cartão não estiver selecionado, prioriza Banco do Brasil
      if (dadosPreenchidosVoz.pagamento === '💳 Crédito' && cartoes.length > 0) {
        const bb = cartoes.find(c => c.nome.includes('Banco do Brasil'));
        setCartao(bb ? bb.nome : cartoes[0].nome);
      }
    }
  }, [dadosPreenchidosVoz]);

  const [modoVozEfetuar, setModoVozEfetuar] = useState(false);
  const [revisaoLiberada, setRevisaoLiberada] = useState(false);
  const [comandoEfetuarDetectado, setComandoEfetuarDetectado] = useState(false);

  const submeterLancamento = useCallback(() => {
    setErros([]);

    const valorNumerico = parseMoedaBR(valorTexto);

    const validacaoErros: string[] = [];
    if (!valorNumerico || valorNumerico <= 0) {
      validacaoErros.push('Informe um valor financeiro válido.');
    }

    const descricaoFinal = (descricao.trim() || categoria).trim();
    if (!descricaoFinal) {
      validacaoErros.push('Selecione uma categoria ou informe uma descrição.');
    }

    if (pagamento === '💳 Crédito' && !cartao) {
      validacaoErros.push('Selecione o cartão de crédito.');
    }
    if (pagamento !== '💳 Crédito' && pagamento !== '💵 Dinheiro' && !conta) {
      validacaoErros.push('Selecione a conta bancária.');
    }

    if (validacaoErros.length > 0) {
      setErros(validacaoErros);
      return false;
    }

    const resultado = adicionarLancamento({
      data,
      tipo,
      valor: valorNumerico,
      pagamento,
      natureza,
      categoria,
      descricao: descricaoFinal,
      cartao: pagamento === '💳 Crédito' ? cartao : undefined,
      conta: pagamento !== '💳 Crédito' ? conta : undefined,
      parcelas: pagamento === '💳 Crédito' ? parcelas : undefined,
    });

    if (resultado.sucesso) {
      setValorTexto('');
      setDescricao('');
      setParcelas(1);
      setModoVozEfetuar(false);
      setRevisaoLiberada(false);
      setComandoEfetuarDetectado(false);
      pararEscutaEfetuar();
      return true;
    }
    return false;
  }, [valorTexto, descricao, categoria, pagamento, cartao, conta, data, tipo, natureza, parcelas, adicionarLancamento]);

  const {
    estaOuvindo: ouvindoEfetuar,
    transcricao: transcricaoEfetuar,
    iniciarGravacao: iniciarEscutaEfetuar,
    pararGravacao: pararEscutaEfetuar,
  } = useVoiceRecognition();

  // Quando chegam dados preenchidos por voz, dá 3.5 segundos de revisão calma antes de abrir o microfone
  useEffect(() => {
    if (dadosPreenchidosVoz) {
      setModoVozEfetuar(true);
      setRevisaoLiberada(false);
      setComandoEfetuarDetectado(false);

      const timer = setTimeout(() => {
        setRevisaoLiberada(true);
        iniciarEscutaEfetuar();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [dadosPreenchidosVoz, iniciarEscutaEfetuar]);

  // Se o microfone de efetivação parar por silêncio no Android, reativa apenas se ainda estiver no modo de voz
  useEffect(() => {
    if (modoVozEfetuar && revisaoLiberada && !ouvindoEfetuar && !comandoEfetuarDetectado) {
      const timer = setTimeout(() => {
        if (modoVozEfetuar && revisaoLiberada) iniciarEscutaEfetuar();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [modoVozEfetuar, revisaoLiberada, ouvindoEfetuar, comandoEfetuarDetectado, iniciarEscutaEfetuar]);

  // Captura comando de efetivar quando a revisão já foi liberada
  useEffect(() => {
    if (modoVozEfetuar && revisaoLiberada && transcricaoEfetuar && !comandoEfetuarDetectado) {
      if (detectarComandoEfetuar(transcricaoEfetuar)) {
        setComandoEfetuarDetectado(true);
        pararEscutaEfetuar();
        setTimeout(() => {
          submeterLancamento();
        }, 500);
      }
    }
  }, [modoVozEfetuar, revisaoLiberada, transcricaoEfetuar, comandoEfetuarDetectado, pararEscutaEfetuar, submeterLancamento]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    submeterLancamento();
  };

  const pagamentosOriginais: FormaPagamento[] = [
    '📱 Pix',
    '🏦 Débito',
    '💳 Crédito',
    '💵 Dinheiro',
    '📝 Boleto'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* =====================================================
           ⚡ FORMULÁRIO DE LANÇAMENTO (NO TOPO DA TELA)
         ===================================================== */}
      <div style={{
        backgroundColor: '#0F2744',
        border: '1px solid #1E3A5F',
        borderRadius: '20px',
        padding: '20px 18px',
        boxShadow: '0 6px 20px rgba(11, 25, 41, 0.4)'
      }}>
        {/* Cabeçalho do formulário centralizado com botão de voz integrado */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          marginBottom: '16px',
          borderBottom: '1px solid #1E3A5F',
          paddingBottom: '14px',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>⚡</span>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                Novo Lançamento
              </h2>
            </div>
            <span style={{ fontSize: '12px', color: '#AAB4BE' }}>Preencha os dados ou fale por voz</span>
          </div>

          <button
            type="button"
            onClick={onAbrirVoz}
            style={{
              padding: '9px 18px',
              borderRadius: '14px',
              border: '1px solid #287EA5',
              background: 'linear-gradient(135deg, #173F5F 0%, #287EA5 100%)',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 3px 12px rgba(40, 126, 165, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            <Mic size={16} />
            <span>Falar Lançamento 🎙️</span>
          </button>
        </div>

        {/* Banner de Revisão Tranquila e Comando de Voz para Efetuar */}
        {modoVozEfetuar && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: revisaoLiberada ? 'rgba(76, 175, 80, 0.16)' : 'rgba(40, 126, 165, 0.16)',
            border: `1.5px solid ${revisaoLiberada ? '#4CAF50' : '#287EA5'}`,
            borderRadius: '14px',
            padding: '11px 16px',
            marginBottom: '16px',
            gap: '12px',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
              <span style={{ fontSize: '22px' }}>{revisaoLiberada ? (comandoEfetuarDetectado ? '✓' : '🎙️') : '👀'}</span>
              <div>
                <strong style={{ fontSize: '13px', color: revisaoLiberada ? '#81C784' : '#82B1FF', display: 'block' }}>
                  {comandoEfetuarDetectado ? (
                    'Comando "Efetuar" reconhecido! Gravando lançamento...'
                  ) : revisaoLiberada ? (
                    'Microfone pronto para gravar:'
                  ) : (
                    'Revise os dados preenchidos com calma:'
                  )}
                </strong>
                <span style={{ fontSize: '11.5px', color: '#E2E8F0' }}>
                  {comandoEfetuarDetectado ? (
                    'Salvando movimentação financeira...'
                  ) : revisaoLiberada ? (
                    <>Diga <strong>"Efetuar"</strong> ou <strong>"Gravar"</strong> (ou toque no botão verde abaixo)</>
                  ) : (
                    'O microfone será armado em instantes para sua segurança.'
                  )}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {!revisaoLiberada && (
                <button
                  type="button"
                  onClick={() => {
                    setRevisaoLiberada(true);
                    iniciarEscutaEfetuar();
                  }}
                  style={{
                    background: 'rgba(80, 144, 211, 0.25)',
                    border: '1px solid #5090D3',
                    borderRadius: '8px',
                    padding: '5px 10px',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Falar Agora
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  pararEscutaEfetuar();
                  setModoVozEfetuar(false);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  borderRadius: '8px',
                  padding: '5px 9px',
                  color: '#FFFFFF',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Pausar Voz
              </button>
            </div>
          </div>
        )}

        {erros.length > 0 && (
          <div style={{
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            border: '1px solid #F44336',
            borderRadius: '12px',
            padding: '10px 12px',
            marginBottom: '14px'
          }}>
            {erros.map((err, i) => (
              <p key={i} style={{ color: '#F44336', fontSize: '12px', margin: '2px 0', fontWeight: 600 }}>
                • {err}
              </p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Seletor de Tipo (Despesa, Receita, Investimento) */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#607789', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Tipo de Movimento
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {TIPOS_LANCAMENTO.map((t) => {
                const ativo = tipo === t;
                let corBorda = '#1E3A5F';
                let corBg = '#132F4C';
                let corTexto = '#AAB4BE';

                if (ativo) {
                  if (t === 'Despesa') {
                    corBorda = '#F44336';
                    corBg = 'rgba(244, 67, 54, 0.15)';
                    corTexto = '#F44336';
                  } else if (t === 'Receita') {
                    corBorda = '#4CAF50';
                    corBg = 'rgba(76, 175, 80, 0.15)';
                    corTexto = '#4CAF50';
                  } else {
                    corBorda = '#2196F3';
                    corBg = 'rgba(33, 150, 243, 0.15)';
                    corTexto = '#2196F3';
                  }
                }

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    style={{
                      padding: '12px 6px',
                      borderRadius: '14px',
                      border: `2px solid ${corBorda}`,
                      backgroundColor: corBg,
                      color: corTexto,
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{t === 'Despesa' ? '🔴' : t === 'Receita' ? '🟢' : '🔵'}</span>
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campo de Valor em Destaque Original */}
          <div style={{
            backgroundColor: '#132F4C',
            border: '2px solid #1E3A5F',
            borderRadius: '16px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#5090D3', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              VALOR DO LANÇAMENTO
            </label>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#5090D3' }}>R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={valorTexto}
                onChange={(e) => setValorTexto(e.target.value)}
                placeholder="0,00"
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  textAlign: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  width: '200px',
                  outline: 'none',
                  padding: 0
                }}
              />
            </div>
          </div>

          {/* Forma de Pagamento (Grid Clássica de 5 Opções) */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#607789', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Forma de Pagamento
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '6px' }}>
              {pagamentosOriginais.map((p) => {
                const ativo = pagamento === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPagamento(p)}
                    style={{
                      padding: '10px 4px',
                      borderRadius: '12px',
                      border: `1.5px solid ${ativo ? '#287EA5' : '#1E3A5F'}`,
                      backgroundColor: ativo ? 'rgba(40, 126, 165, 0.25)' : '#132F4C',
                      color: ativo ? '#FFFFFF' : '#AAB4BE',
                      fontSize: '11px',
                      fontWeight: ativo ? 800 : 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seletor Cartão de Crédito ou Parcelas */}
          {pagamento === '💳 Crédito' && (
            <div style={{
              backgroundColor: '#132F4C',
              border: '1px solid #1E3A5F',
              borderRadius: '14px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  💳 Cartão de Crédito
                </label>
                <select 
                  value={cartao} 
                  onChange={(e) => setCartao(e.target.value)}
                  style={{ backgroundColor: '#0B1929', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}
                >
                  {cartoes.filter(c => c.ativo).map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome} ({c.bandeira}) • Fech. {c.diaFechamento} / Venc. {c.diaVencimento}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Número de Parcelas
                </label>
                <select 
                  value={parcelas} 
                  onChange={(e) => setParcelas(Number(e.target.value))}
                  style={{ backgroundColor: '#0B1929', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}
                >
                  <option value={1}>À vista (1x)</option>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                    <option key={n} value={n}>
                      {n}x de {valorTexto ? formatarMoeda(parseMoedaBR(valorTexto) / n) : `Parcela ${n}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Seletor de Conta Bancária */}
          {pagamento !== '💳 Crédito' && pagamento !== '💵 Dinheiro' && (
            <div>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#607789', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Conta Bancária Utilizada
              </label>
              <select 
                value={conta} 
                onChange={(e) => setConta(e.target.value)}
                style={{ backgroundColor: '#0B1929', color: '#FFFFFF', fontSize: '13px', fontWeight: 600 }}
              >
                {contas.filter(c => c.ativa).map((c) => (
                  <option key={c.id} value={c.nome}>
                    {c.nome} - {c.banco}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Natureza e Categoria com Botões Discretos de Criação */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#AAB4BE', textTransform: 'uppercase' }}>
                    Natureza
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setModoCriar('natureza');
                      setNovoNome('');
                      setNovoEmoji('📦');
                      setModalCriarAberto(true);
                    }}
                    style={{
                      background: 'rgba(40, 126, 165, 0.15)',
                      border: '1px solid rgba(80, 144, 211, 0.35)',
                      borderRadius: '6px',
                      color: '#5090D3',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px 6px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Criar nova natureza de gastos"
                  >
                    <Plus size={10} />
                    <span>+ Nova</span>
                  </button>
                </div>
                <select 
                  value={natureza} 
                  onChange={(e) => {
                    const novaNat = e.target.value;
                    if (novaNat === '__NOVA_NATUREZA__') {
                      setModoCriar('natureza');
                      setNovoNome('');
                      setNovoEmoji('📦');
                      setModalCriarAberto(true);
                      return;
                    }
                    setNatureza(novaNat);
                    const n2 = normalizarTexto(novaNat);
                    const fil = categorias.filter(c => {
                      const matchTipo = c.tipo === tipo || c.tipo === 'Todos';
                      if (!matchTipo) return false;
                      if (c.natureza === novaNat) return true;
                      const n1 = normalizarTexto(c.natureza);
                      return n1 === n2 || n1.includes(n2) || n2.includes(n1);
                    });
                    if (fil.length > 0) {
                      setCategoria(fil[0].nome);
                    }
                  }}
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  {naturezas.map((nat) => (
                    <option key={nat.id} value={nat.label}>
                      {nat.label}
                    </option>
                  ))}
                  <option value="__NOVA_NATUREZA__">➕ Criar nova natureza...</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#AAB4BE', textTransform: 'uppercase' }}>
                    Categoria
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setModoCriar('categoria');
                      setNovaNatPai(natureza);
                      setNovoNome('');
                      setModalCriarAberto(true);
                    }}
                    style={{
                      background: 'rgba(40, 126, 165, 0.15)',
                      border: '1px solid rgba(80, 144, 211, 0.35)',
                      borderRadius: '6px',
                      color: '#5090D3',
                      fontSize: '10px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      padding: '2px 6px',
                      transition: 'all 0.15s ease'
                    }}
                    title="Criar nova categoria nesta natureza"
                  >
                    <Plus size={10} />
                    <span>+ Nova</span>
                  </button>
                </div>
                <select 
                  value={categoria} 
                  onChange={(e) => {
                    const novaCat = e.target.value;
                    if (novaCat === '__NOVA_CATEGORIA__') {
                      setModoCriar('categoria');
                      setNovaNatPai(natureza);
                      setNovoNome('');
                      setModalCriarAberto(true);
                      return;
                    }
                    setCategoria(novaCat);
                  }}
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  {categoriasFiltradas.map((cat) => (
                    <option key={cat.id} value={cat.nome}>
                      {cat.nome}
                    </option>
                  ))}
                  <option value="__NOVA_CATEGORIA__">➕ Criar nova categoria...</option>
                </select>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase' }}>
                Descrição
              </label>
              <span style={{ fontSize: '10.5px', color: '#5090D3', fontWeight: 600 }}>
                Opcional (se vazio, usa "{categoria}")
              </span>
            </div>
            <input
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={`Ex.: ${categoria} (ou deixe em branco para repetir)`}
              style={{ fontSize: '13px', fontWeight: 600 }}
            />
          </div>

          {/* Data */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: 800, color: '#607789', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Data do Lançamento
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              style={{ fontSize: '13px', fontWeight: 600 }}
            />
          </div>

          {/* Botão de Lançar Principal Verde Original */}
          {/* Botão de Lançar Principal Verde Original (sem ícone redundante) */}
          <button
            type="submit"
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '16px',
              padding: '16px',
              background: 'linear-gradient(135deg, #2E8B57 0%, #237447 100%)',
              color: '#FFFFFF',
              fontSize: '17px',
              fontWeight: 800,
              boxShadow: '0 6px 18px rgba(46, 139, 87, 0.35)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '6px',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>EFETUAR LANÇAMENTO</span>
          </button>
        </form>

        {/* Modal Discreto de Criação Rápida de Categoria / Natureza */}
        {modalCriarAberto && (
          <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 13, 24, 0.75)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '16px'
          }}>
            <div className="card glass" style={{
              maxWidth: '420px',
              width: '100%',
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid #1E3A5F',
              backgroundColor: '#0B1C2E',
              position: 'relative'
            }}>
              <button
                type="button"
                onClick={() => setModalCriarAberto(false)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  background: 'none',
                  border: 'none',
                  color: '#AAB4BE',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>

              <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', fontWeight: 800, color: '#F8D117' }}>
                Criar Nova {modoCriar === 'categoria' ? 'Categoria' : 'Natureza'}
              </h4>

              {/* Seletor Categoria / Natureza */}
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', backgroundColor: '#061320', padding: '3px', borderRadius: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModoCriar('categoria')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: modoCriar === 'categoria' ? '#173F5F' : 'transparent',
                    color: modoCriar === 'categoria' ? '#F8D117' : '#AAB4BE'
                  }}
                >
                  + Nova Categoria
                </button>
                <button
                  type="button"
                  onClick={() => setModoCriar('natureza')}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: modoCriar === 'natureza' ? '#173F5F' : 'transparent',
                    color: modoCriar === 'natureza' ? '#F8D117' : '#AAB4BE'
                  }}
                >
                  + Nova Natureza
                </button>
              </div>

              {modoCriar === 'categoria' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAB4BE', display: 'block', marginBottom: '4px' }}>
                      Natureza Associada
                    </label>
                    <select
                      value={novaNatPai || natureza}
                      onChange={(e) => setNovaNatPai(e.target.value)}
                      style={{ width: '100%', fontSize: '13px' }}
                    >
                      {naturezas.map((nat) => (
                        <option key={nat.id} value={nat.label}>{nat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAB4BE', display: 'block', marginBottom: '4px' }}>
                      Nome da Nova Categoria
                    </label>
                    <input
                      type="text"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                      placeholder="Ex: Ferramentas e Peças"
                      style={{ width: '100%', fontSize: '13px' }}
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAB4BE', display: 'block', marginBottom: '4px' }}>
                        Emoji
                      </label>
                      <input
                        type="text"
                        value={novoEmoji}
                        onChange={(e) => setNovoEmoji(e.target.value)}
                        style={{ width: '100%', fontSize: '15px', textAlign: 'center' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#AAB4BE', display: 'block', marginBottom: '4px' }}>
                        Nome da Natureza
                      </label>
                      <input
                        type="text"
                        value={novoNome}
                        onChange={(e) => setNovoNome(e.target.value)}
                        placeholder="Ex: Oficina / Construção"
                        style={{ width: '100%', fontSize: '13px' }}
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setModalCriarAberto(false)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!novoNome.trim()) return;
                    if (modoCriar === 'categoria') {
                      const natEscolhida = novaNatPai || natureza;
                      adicionarCategoria({
                        natureza: natEscolhida,
                        nome: novoNome.trim(),
                        tipo: 'Todos',
                      });
                      setNatureza(natEscolhida);
                      setCategoria(novoNome.trim());
                    } else {
                      const emojiEscolhido = novoEmoji.trim() || '📦';
                      const labelNat = `${emojiEscolhido} ${novoNome.trim()}`;
                      adicionarNatureza({
                        nome: novoNome.trim(),
                        emoji: emojiEscolhido,
                      });
                      setNatureza(labelNat);
                    }
                    setModalCriarAberto(false);
                  }}
                  disabled={!novoNome.trim()}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px', gap: '4px' }}
                >
                  <Check size={14} />
                  <span>Salvar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
