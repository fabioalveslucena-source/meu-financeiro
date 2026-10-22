import React, { useState, useRef } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda, parseMoedaBR } from '../../lib/formatters';
import type { Cartao } from '../../types';
import { 
  X, 
  CreditCard, 
  Layers, 
  Building2, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Save,
  Lock,
  Database,
  DownloadCloud,
  UploadCloud,
  Shield,
  Fingerprint,
  Globe,
  CloudLightning,
  RotateCw
} from 'lucide-react';
import { fazerLoginGoogle } from '../../features/auth/googleAuth';
import { isFirebaseConfigured } from '../../services/firebase';

interface ConfiguracoesBaseModalProps {
  aberto: boolean;
  onFechar: () => void;
  abaInicial?: 'cartoes' | 'categorias' | 'banco' | 'seguranca' | 'backup' | 'nuvem';
}

const CORES_PALETA = [
  { nome: 'Amarelo Banco do Brasil', hex: '#F8D117' },
  { nome: 'Vermelho Bradesco', hex: '#CC092F' },
  { nome: 'Roxo Nubank', hex: '#8A05BE' },
  { nome: 'Laranja Itaú', hex: '#EC7000' },
  { nome: 'Laranja Inter', hex: '#FF7A00' },
  { nome: 'Azul Caixa', hex: '#0066B3' },
  { nome: 'Vermelho Santander', hex: '#CC0000' },
  { nome: 'Azul Royal', hex: '#287EA5' },
  { nome: 'Verde Esmeralda', hex: '#10B981' },
  { nome: 'Grafite Escuro', hex: '#1E293B' },
];

const BANCOS_DISPONIVEIS = [
  { nome: 'Banco do Brasil', subtitulo: 'Ourocard Visa', cor: '#F8D117' },
  { nome: 'Bradesco', subtitulo: 'Cartões & Prime', cor: '#CC092F' },
  { nome: 'Nubank', subtitulo: 'Conta & Cartão', cor: '#8A05BE' },
  { nome: 'Itaú Unibanco', subtitulo: 'Personalité', cor: '#EC7000' },
  { nome: 'Caixa Econômica', subtitulo: 'Conta & Cartões', cor: '#0066B3' },
  { nome: 'Santander', subtitulo: 'Select', cor: '#CC0000' },
  { nome: 'Banco Inter', subtitulo: 'Super App', cor: '#FF7A00' },
  { nome: 'XP Investimentos', subtitulo: 'Visa Infinite', cor: '#F8D117' },
];

export const ConfiguracoesBaseModal: React.FC<ConfiguracoesBaseModalProps> = ({
  aberto,
  onFechar,
  abaInicial = 'cartoes',
}) => {
  const { 
    cartoes, 
    atualizarCartao, 
    adicionarCartao, 
    excluirCartao,
    naturezas,
    adicionarNatureza,
    categorias,
    adicionarCategoria,
    excluirCategoria,
    usuario,
    setUsuario,
    seguranca,
    configurarSeguranca,
    exportarBackupCompleto,
    restaurarBackup,
    lancamentos,
    sincronizarComNuvem,
    enviarTudoParaNuvem,
    baixarTudoDaNuvem,
    sincronizandoNuvem
  } = useFinanceStore();

  const [abaAtiva, setAbaAtiva] = useState<'cartoes' | 'categorias' | 'banco' | 'seguranca' | 'backup' | 'nuvem'>(abaInicial);

  // Estados de Segurança
  const [pinForm, setPinForm] = useState(seguranca.pin || '');
  const [bloqueioAtivoForm, setBloqueioAtivoForm] = useState(seguranca.bloqueioAtivo);
  const [biometriaForm, setBiometriaForm] = useState(seguranca.biometriaAtiva);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Estados de Edição de Cartão
  const [cartaoEmEdicao, setCartaoEmEdicao] = useState<Cartao | null>(null);
  const [criandoCartao, setCriandoCartao] = useState(false);
  const [cartaoForm, setCartaoForm] = useState({
    nome: '',
    bandeira: 'Visa',
    limite: '',
    diaFechamento: 25,
    diaVencimento: 5,
    cor: '#F8D117',
  });

  // Estados de Categorias & Naturezas
  const [naturezaSelecionada, setNaturezaSelecionada] = useState<string>(
    naturezas[0]?.label || '🛒 Alimentação'
  );
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');
  const [criandoNatureza, setCriandoNatureza] = useState(false);
  const [novaNaturezaNome, setNovaNaturezaNome] = useState('');
  const [novaNaturezaEmoji, setNovaNaturezaEmoji] = useState('📁');

  if (!aberto) return null;

  // Iniciar criação de cartão
  const iniciarNovoCartao = () => {
    setCartaoEmEdicao(null);
    setCriandoCartao(true);
    setCartaoForm({
      nome: '',
      bandeira: 'Visa',
      limite: '10000',
      diaFechamento: 25,
      diaVencimento: 5,
      cor: '#F8D117',
    });
  };

  // Iniciar edição de cartão
  const iniciarEdicaoCartao = (c: Cartao) => {
    setCriandoCartao(false);
    setCartaoEmEdicao(c);
    setCartaoForm({
      nome: c.nome,
      bandeira: c.bandeira,
      limite: String(c.limite).replace('.', ','),
      diaFechamento: c.diaFechamento,
      diaVencimento: c.diaVencimento,
      cor: c.cor || '#F8D117',
    });
  };

  const salvarCartao = (e: React.FormEvent) => {
    e.preventDefault();
    const limiteNum = parseMoedaBR(cartaoForm.limite);
    if (!cartaoForm.nome.trim()) {
      alert('Informe o nome do cartão.');
      return;
    }
    if (!limiteNum || limiteNum <= 0) {
      alert('Informe um limite válido maior que zero.');
      return;
    }

    if (cartaoEmEdicao) {
      atualizarCartao(cartaoEmEdicao.id, {
        nome: cartaoForm.nome.trim(),
        bandeira: cartaoForm.bandeira.trim(),
        limite: limiteNum,
        diaFechamento: Number(cartaoForm.diaFechamento),
        diaVencimento: Number(cartaoForm.diaVencimento),
        cor: cartaoForm.cor,
      });
      setCartaoEmEdicao(null);
    } else if (criandoCartao) {
      adicionarCartao({
        nome: cartaoForm.nome.trim(),
        bandeira: cartaoForm.bandeira.trim(),
        limite: limiteNum,
        diaFechamento: Number(cartaoForm.diaFechamento),
        diaVencimento: Number(cartaoForm.diaVencimento),
        cor: cartaoForm.cor,
        ativo: true,
      });
      setCriandoCartao(false);
    }
  };

  const handleSalvarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaCategoriaNome.trim()) return;
    adicionarCategoria({
      natureza: naturezaSelecionada,
      nome: novaCategoriaNome.trim(),
      tipo: 'Despesa',
    });
    setNovaCategoriaNome('');
  };

  const handleSalvarNatureza = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaNaturezaNome.trim()) return;
    adicionarNatureza({
      nome: novaNaturezaNome.trim(),
      emoji: novaNaturezaEmoji.trim() || '📁',
    });
    setNovaNaturezaNome('');
    setCriandoNatureza(false);
  };

  const normalizarTexto = (s: string) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w]/gi, '')
      .toLowerCase();

  const categoriasDaNatureza = categorias.filter((c) => {
    if (c.natureza === naturezaSelecionada) return true;
    const n1 = normalizarTexto(c.natureza);
    const n2 = normalizarTexto(naturezaSelecionada);
    return n1 === n2 || n1.includes(n2) || n2.includes(n1);
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        backgroundColor: '#0F2744',
        border: '1px solid #1E3A5F',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Cabeçalho do Modal */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid #1E3A5F',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#132F4C',
          borderRadius: '24px 24px 0 0',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>
              ⚙️ Personalizar & Base de Dados
            </h3>
            <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
              Altere limites de cartões, bancos cadastrados, naturezas e categorias
            </span>
          </div>

          <button
            onClick={onFechar}
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#AAB4BE',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Abas Superiores do Modal */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          borderBottom: '1px solid #1E3A5F',
          backgroundColor: '#0B1929',
          overflowX: 'auto',
        }}>
          <button
            type="button"
            onClick={() => setAbaAtiva('cartoes')}
            style={{
              padding: '12px 4px',
              border: 'none',
              borderBottom: abaAtiva === 'cartoes' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'cartoes' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'cartoes' ? 800 : 600,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <CreditCard size={14} />
            <span>Cartões</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('categorias')}
            style={{
              padding: '12px 4px',
              border: 'none',
              borderBottom: abaAtiva === 'categorias' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'categorias' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'categorias' ? 800 : 600,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Layers size={14} />
            <span>Categorias</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('banco')}
            style={{
              padding: '12px 4px',
              border: 'none',
              borderBottom: abaAtiva === 'banco' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'banco' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'banco' ? 800 : 600,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Building2 size={14} />
            <span>Banco</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('seguranca')}
            style={{
              padding: '12px 4px',
              border: 'none',
              borderBottom: abaAtiva === 'seguranca' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'seguranca' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'seguranca' ? 800 : 600,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Lock size={14} />
            <span>Segurança</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('backup')}
            style={{
              padding: '12px 4px',
              border: 'none',
              borderBottom: abaAtiva === 'backup' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'backup' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'backup' ? 800 : 600,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Database size={14} />
            <span>Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setAbaAtiva('nuvem')}
            style={{
              padding: '12px 4px',
              border: 'none',
              borderBottom: abaAtiva === 'nuvem' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'nuvem' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'nuvem' ? 800 : 600,
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Globe size={14} />
            <span>Google & Nuvem</span>
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* ========================================================
               ABA 1: CARTÕES & LIMITES
             ======================================================== */}
          {abaAtiva === 'cartoes' && (
            <div>
              {!cartaoEmEdicao && !criandoCartao ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase' }}>
                      Cartões Cadastrados ({cartoes.length})
                    </span>
                    <button
                      type="button"
                      onClick={iniciarNovoCartao}
                      className="btn-primary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '12px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #2E8B57 0%, #206E41 100%)',
                      }}
                    >
                      <Plus size={14} />
                      <span>Novo Cartão</span>
                    </button>
                  </div>

                  {cartoes.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: '#132F4C',
                        border: `1.5px solid ${c.cor || '#1E3A5F'}`,
                        borderRadius: '14px',
                        padding: '14px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: c.cor || '#F8D117',
                            display: 'inline-block',
                          }} />
                          <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>{c.nome}</strong>
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#AAB4BE',
                          }}>
                            {c.bandeira}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#B0BEC5', marginTop: '4px' }}>
                          Limite: <strong style={{ color: '#F8D117' }}>{formatarMoeda(c.limite)}</strong> • Fechamento: Dia {c.diaFechamento} • Vencimento: Dia {c.diaVencimento}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => iniciarEdicaoCartao(c)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#1E3A5F',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Edit3 size={13} />
                          <span>Editar</span>
                        </button>
                        {cartoes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Deseja remover o cartão "${c.nome}"?`)) {
                                excluirCartao(c.id);
                              }
                            }}
                            style={{
                              padding: '6px 8px',
                              borderRadius: '8px',
                              backgroundColor: 'rgba(244, 67, 54, 0.15)',
                              border: '1px solid rgba(244, 67, 54, 0.3)',
                              color: '#F44336',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Formulário de Criação/Edição de Cartão */
                <form onSubmit={salvarCartao} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '14px', color: '#F8D117' }}>
                      {cartaoEmEdicao ? `Editar: ${cartaoEmEdicao.nome}` : 'Cadastrar Novo Cartão'}
                    </strong>
                    <button
                      type="button"
                      onClick={() => { setCartaoEmEdicao(null); setCriandoCartao(false); }}
                      style={{ background: 'none', border: 'none', color: '#AAB4BE', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Cancelar
                    </button>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Nome do Cartão
                    </label>
                    <input
                      type="text"
                      value={cartaoForm.nome}
                      onChange={(e) => setCartaoForm({ ...cartaoForm, nome: e.target.value })}
                      placeholder="Ex.: Nubank da Esposa, Banco do Brasil Ourocard..."
                      style={{ fontSize: '13px', fontWeight: 600 }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Bandeira
                      </label>
                      <input
                        type="text"
                        value={cartaoForm.bandeira}
                        onChange={(e) => setCartaoForm({ ...cartaoForm, bandeira: e.target.value })}
                        placeholder="Ex.: Visa, Mastercard, Elo..."
                        style={{ fontSize: '13px', fontWeight: 600 }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Limite Total (R$)
                      </label>
                      <input
                        type="text"
                        value={cartaoForm.limite}
                        onChange={(e) => setCartaoForm({ ...cartaoForm, limite: e.target.value })}
                        placeholder="Ex.: 15000,00"
                        style={{ fontSize: '13px', fontWeight: 600 }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Dia Fechamento Fatura
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={cartaoForm.diaFechamento}
                        onChange={(e) => setCartaoForm({ ...cartaoForm, diaFechamento: Number(e.target.value) })}
                        style={{ fontSize: '13px', fontWeight: 600 }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                        Dia Vencimento Fatura
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={cartaoForm.diaVencimento}
                        onChange={(e) => setCartaoForm({ ...cartaoForm, diaVencimento: Number(e.target.value) })}
                        style={{ fontSize: '13px', fontWeight: 600 }}
                        required
                      />
                    </div>
                  </div>

                  {/* Cor do Cartão */}
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Cor do Cartão
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {CORES_PALETA.map((cor) => (
                        <div
                          key={cor.hex}
                          onClick={() => setCartaoForm({ ...cartaoForm, cor: cor.hex })}
                          title={cor.nome}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            backgroundColor: cor.hex,
                            cursor: 'pointer',
                            border: cartaoForm.cor === cor.hex ? '3px solid #FFFFFF' : '2px solid transparent',
                            transform: cartaoForm.cor === cor.hex ? 'scale(1.15)' : 'scale(1)',
                            transition: 'transform 0.15s ease',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{
                      marginTop: '8px',
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #F8D117 0%, #E5B20D 100%)',
                      color: '#0B1929',
                      fontWeight: 800,
                    }}
                  >
                    <Save size={16} />
                    <span>Salvar Cartão</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================
               ABA 2: CATEGORIAS & NATUREZAS
             ======================================================== */}
          {abaAtiva === 'categorias' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase' }}>
                    Selecione a Natureza
                  </label>
                  <button
                    type="button"
                    onClick={() => setCriandoNatureza(!criandoNatureza)}
                    style={{ background: 'none', border: 'none', color: '#5090D3', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {criandoNatureza ? 'Fechar' : '+ Nova Natureza'}
                  </button>
                </div>

                {criandoNatureza && (
                  <form onSubmit={handleSalvarNatureza} style={{
                    backgroundColor: '#132F4C',
                    padding: '12px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    border: '1px solid #1E3A5F',
                    display: 'flex',
                    gap: '8px',
                  }}>
                    <input
                      type="text"
                      value={novaNaturezaEmoji}
                      onChange={(e) => setNovaNaturezaEmoji(e.target.value)}
                      placeholder="Emoji (ex: 🏋️)"
                      style={{ width: '80px', fontSize: '14px', textAlign: 'center' }}
                      required
                    />
                    <input
                      type="text"
                      value={novaNaturezaNome}
                      onChange={(e) => setNovaNaturezaNome(e.target.value)}
                      placeholder="Nome da nova natureza (ex: Esportes)"
                      style={{ flex: 1, fontSize: '13px' }}
                      required
                    />
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Criar
                    </button>
                  </form>
                )}

                <select
                  value={naturezaSelecionada}
                  onChange={(e) => setNaturezaSelecionada(e.target.value)}
                  style={{ fontSize: '13px', fontWeight: 600 }}
                >
                  {naturezas.map((n) => (
                    <option key={n.id} value={n.label}>{n.label}</option>
                  ))}
                </select>
              </div>

              {/* Categorias ativas sob essa natureza */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                  Categorias em {naturezaSelecionada} ({categoriasDaNatureza.length})
                </span>

                <div style={{
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  paddingRight: '4px',
                }}>
                  {categoriasDaNatureza.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: '#132F4C',
                        border: '1px solid #1E3A5F',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: 600 }}>{c.nome}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Deseja excluir a categoria "${c.nome}"?`)) {
                            excluirCategoria(c.id);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#F44336',
                          cursor: 'pointer',
                          padding: '2px 4px',
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulário para adicionar categoria */}
              <form onSubmit={handleSalvarCategoria} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                  placeholder={`Nova categoria em ${naturezaSelecionada}...`}
                  style={{ flex: 1, fontSize: '13px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #2E8B57 0%, #206E41 100%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Plus size={15} />
                  <span>Adicionar</span>
                </button>
              </form>
            </div>
          )}

          {/* ========================================================
               ABA 3: BANCO PRINCIPAL & PERFIL
             ======================================================== */}
          {abaAtiva === 'banco' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Instituição Financeira em Destaque no Cabeçalho
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {BANCOS_DISPONIVEIS.map((b) => {
                    const ativo = usuario.bancoPrincipal === b.nome;
                    return (
                      <div
                        key={b.nome}
                        onClick={() => setUsuario({ bancoPrincipal: b.nome })}
                        style={{
                          backgroundColor: ativo ? 'rgba(248, 209, 23, 0.15)' : '#132F4C',
                          border: `1.5px solid ${ativo ? b.cor : '#1E3A5F'}`,
                          borderRadius: '12px',
                          padding: '10px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: '12.5px', color: ativo ? b.cor : '#FFFFFF', display: 'block' }}>
                            {b.nome}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#8A99AD' }}>{b.subtitulo}</span>
                        </div>
                        {ativo && <Check size={16} color={b.cor} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Ou digite um Banco Personalizado
                </label>
                <input
                  type="text"
                  value={usuario.bancoPrincipal}
                  onChange={(e) => setUsuario({ bancoPrincipal: e.target.value })}
                  placeholder="Nome do banco para exibir no cabeçalho..."
                  style={{ fontSize: '13px', fontWeight: 600 }}
                />
              </div>

              <div style={{
                marginTop: '10px',
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(40, 126, 165, 0.15)',
                border: '1px solid rgba(40, 126, 165, 0.3)',
                fontSize: '11.5px',
                color: '#B0BEC5',
                lineHeight: 1.4,
              }}>
                💡 <strong style={{ color: '#FFFFFF' }}>Dica de Compartilhamento:</strong> Quando você passar o aplicativo para a sua esposa, basta selecionar o banco dela aqui e cadastrar os cartões dela na aba <strong>Cartões & Limites</strong>. O sistema se adaptará automaticamente às cores e faturas dela!
              </div>
            </div>
          )}

          {/* ========================================================
               ABA 4: SEGURANÇA, PIN & BIOMETRIA
             ======================================================== */}
          {abaAtiva === 'seguranca' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: 'rgba(248, 209, 23, 0.08)',
                border: '1px solid rgba(248, 209, 23, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Shield size={28} color="#F8D117" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    Proteção de Privacidade & Acesso
                  </h4>
                  <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                    Exija autenticação para abrir o aplicativo e visualizar seus dados financeiros no celular.
                  </span>
                </div>
              </div>

              {/* Ativar Bloqueio */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#132F4C',
                border: '1px solid #1E3A5F'
              }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                    Exigir PIN ao Abrir o Aplicativo
                  </strong>
                  <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                    Bloqueia o app automaticamente ao sair ou minimizar a tela
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={bloqueioAtivoForm}
                  onChange={(e) => setBloqueioAtivoForm(e.target.checked)}
                  style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#F8D117' }}
                />
              </div>

              {/* Definir PIN */}
              {bloqueioAtivoForm && (
                <div style={{
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: '#132F4C',
                  border: '1px solid #1E3A5F',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase' }}>
                    Definir PIN de 4 Dígitos
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Ex: 1234"
                    value={pinForm}
                    onChange={(e) => setPinForm(e.target.value.replace(/\D/g, ''))}
                    style={{ fontSize: '20px', letterSpacing: '8px', textAlign: 'center', fontWeight: 900 }}
                  />
                  <span style={{ fontSize: '10.5px', color: '#AAB4BE' }}>
                    Lembre-se deste código para desbloquear o sistema no celular.
                  </span>
                </div>
              )}

              {/* Habilitar Biometria */}
              {bloqueioAtivoForm && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: '#132F4C',
                  border: '1px solid #1E3A5F'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Fingerprint size={22} color="#5090D3" />
                    <div>
                      <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                        Desbloqueio com Biometria
                      </strong>
                      <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                        Permite usar Touch ID, Face ID ou impressão digital do celular
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={biometriaForm}
                    onChange={(e) => setBiometriaForm(e.target.checked)}
                    style={{ width: '22px', height: '22px', cursor: 'pointer', accentColor: '#5090D3' }}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (bloqueioAtivoForm && pinForm.length < 4) {
                    alert('Por favor, informe um PIN com pelo menos 4 dígitos numéricos.');
                    return;
                  }
                  configurarSeguranca({
                    bloqueioAtivo: bloqueioAtivoForm,
                    pin: pinForm,
                    biometriaAtiva: biometriaForm
                  });
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <Save size={16} />
                <span>Salvar Configuração de Segurança</span>
              </button>
            </div>
          )}

          {/* ========================================================
               ABA 5: BACKUP EM NUVEM & SINCRONIZAÇÃO JSON
             ======================================================== */}
          {abaAtiva === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '14px',
                borderRadius: '16px',
                backgroundColor: 'rgba(80, 144, 211, 0.08)',
                border: '1px solid rgba(80, 144, 211, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Database size={28} color="#5090D3" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                    Cópia de Segurança & Portabilidade
                  </h4>
                  <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                    Exporte sua base completa para transferir entre dispositivos ou restaurar a qualquer momento.
                  </span>
                </div>
              </div>

              {/* Bloco 1: Exportar */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#132F4C',
                border: '1px solid #1E3A5F',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                    Exportar Backup Completo (.JSON)
                  </strong>
                  <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                    Gera um arquivo com todos os lançamentos, cartões, categorias e configurações atuais.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={exportarBackupCompleto}
                  className="btn-primary"
                  style={{ gap: '8px', justifyContent: 'center', padding: '10px' }}
                >
                  <DownloadCloud size={16} />
                  <span>Baixar Arquivo de Backup (.json)</span>
                </button>
              </div>

              {/* Bloco 2: Restaurar */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#132F4C',
                border: '1px solid #1E3A5F',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                    Restaurar Base de Dados de um Arquivo
                  </strong>
                  <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
                    Selecione o arquivo .json baixado anteriormente para carregar tudo no celular da sua esposa ou restaurar seus dados.
                  </span>
                </div>

                <input
                  ref={backupFileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (confirm(`Atenção: Restaurar o arquivo "${file.name}" substituirá os dados atuais. Deseja continuar?`)) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const conteudo = ev.target?.result as string;
                        restaurarBackup(conteudo);
                      };
                      reader.readAsText(file);
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => backupFileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ gap: '8px', justifyContent: 'center', padding: '10px' }}
                >
                  <UploadCloud size={16} />
                  <span>Selecionar Arquivo .JSON para Restaurar</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              🌐 ABA 6: NUVEM & GOOGLE MAGIC LOGON
             ======================================================== */}
          {abaAtiva === 'nuvem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🌐</span> Nuvem Firebase & Google Magic Logon
                </h3>
                <span style={{ fontSize: '12px', color: '#AAB4BE' }}>
                  Sincronização em tempo real entre PC, Mac, Xiaomi Poco X5 Pro e iPhone.
                </span>
              </div>

              {/* Card de Perfil Conectado */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: 'rgba(40, 126, 165, 0.15)',
                border: '1.5px solid #287EA5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={usuario.avatarUrl}
                    alt={usuario.nome}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #F8D117',
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '14px', color: '#FFFFFF' }}>{usuario.nome}</strong>
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 800,
                        backgroundColor: '#4CAF50',
                        color: '#0B1929',
                        padding: '1px 6px',
                        borderRadius: '10px'
                      }}>
                        GOOGLE PRO
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#82B1FF', display: 'block' }}>
                      {usuario.email || 'alveslucenafabio@gmail.com'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#AAB4BE' }}>
                      UID: {usuario.uid || 'fabio-master-uid'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fazerLoginGoogle();
                      if (res) {
                        setUsuario({
                          nome: res.nome,
                          email: res.email,
                          avatarUrl: res.fotoUrl,
                          uid: res.uid
                        });
                        alert(`Bem-vindo, ${res.nome}! Sessão Google Magic Logon sincronizada.`);
                      }
                    } catch (e) {
                      alert('Não foi possível conectar ao Google no momento.');
                    }
                  }}
                  className="btn-primary"
                  style={{ gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                >
                  <CloudLightning size={14} />
                  <span>Google Magic Logon</span>
                </button>
              </div>

              {/* Status da Conexão Firebase e Base de Dados */}
              <div style={{
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: '#132F4C',
                border: '1px solid #1E3A5F',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#AAB4BE' }}>Status da Nuvem Firestore:</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isFirebaseConfigured ? '#4CAF50' : '#F8D117',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span>{isFirebaseConfigured ? '🟢 Conectado em Produção' : '🟡 Modo Local'}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#AAB4BE' }}>Lançamentos neste Aparelho:</span>
                  <strong style={{ fontSize: '12px', color: '#F8D117' }}>
                    {lancamentos.length} movimentações
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: '#AAB4BE' }}>Multi-Dispositivos Conectados:</span>
                  <span style={{ fontSize: '11px', color: '#FFFFFF', fontWeight: 700 }}>
                    PC Windows • Celular Android • Tablet
                  </span>
                </div>
              </div>

              {/* Botões de Ação de Sincronização em Nuvem */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  disabled={sincronizandoNuvem}
                  onClick={() => sincronizarComNuvem()}
                  className="btn-primary"
                  style={{
                    padding: '12px',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 900,
                    fontSize: '13.5px',
                    backgroundColor: '#287EA5',
                    boxShadow: '0 4px 14px rgba(40, 126, 165, 0.4)'
                  }}
                >
                  <RotateCw size={16} className={sincronizandoNuvem ? 'animate-spin' : ''} />
                  <span>{sincronizandoNuvem ? 'Sincronizando com a Nuvem...' : '🔄 Sincronizar Tudo Agora (PC ↔ Celular)'}</span>
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    disabled={sincronizandoNuvem}
                    onClick={() => enviarTudoParaNuvem()}
                    className="btn-secondary"
                    style={{
                      padding: '10px 8px',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}
                    title="Envia todos os lançamentos deste aparelho para a nuvem"
                  >
                    <UploadCloud size={14} color="#4CAF50" />
                    <span>Enviar para Nuvem</span>
                  </button>

                  <button
                    type="button"
                    disabled={sincronizandoNuvem}
                    onClick={() => baixarTudoDaNuvem()}
                    className="btn-secondary"
                    style={{
                      padding: '10px 8px',
                      justifyContent: 'center',
                      gap: '6px',
                      fontSize: '11.5px',
                      fontWeight: 700
                    }}
                    title="Baixa todos os lançamentos salvos na nuvem para este aparelho"
                  >
                    <DownloadCloud size={14} color="#5090D3" />
                    <span>Baixar da Nuvem</span>
                  </button>
                </div>
              </div>

              {/* Orientações para sincronização */}
              <div style={{
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: 'rgba(23, 63, 95, 0.4)',
                border: '1px solid rgba(80, 144, 211, 0.3)',
                fontSize: '11.5px',
                color: '#B0BEC5',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#F8D117', display: 'block', marginBottom: '4px' }}>
                  ☁️ Como funciona a sincronização entre PC e Celular:
                </strong>
                Ao abrir o aplicativo em qualquer aparelho, ele conecta automaticamente ao Google Cloud Firestore. Se você realizou lançamentos no computador (como os meses de novembro/dezembro), basta clicar em <strong>"🔄 Sincronizar Tudo Agora"</strong> ou <strong>"Enviar para Nuvem"</strong> no computador uma vez para que o celular receba todos os dados instantaneamente!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
