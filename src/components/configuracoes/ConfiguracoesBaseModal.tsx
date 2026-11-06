import React, { useState, useRef, useEffect } from 'react';
import { useFinanceStore, isUsuarioAdmin } from '../../stores/financeStore';
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
  RotateCw,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  CheckCircle,
  User
} from 'lucide-react';
import { fazerLoginGoogle, fazerLogoutGoogle } from '../../features/auth/googleAuth';
import { isFirebaseConfigured } from '../../services/firebase';

interface ConfiguracoesBaseModalProps {
  aberto: boolean;
  onFechar: () => void;
  abaInicial?: 'cartoes' | 'categorias' | 'banco' | 'seguranca' | 'backup' | 'nuvem' | 'usuarios' | 'conta';
  onNavegar?: (destino: string) => void;
}

const CORES_PALETA = [
  { nome: 'Amarelo Mercado Livre', hex: '#FFE600' },
  { nome: 'Azul Mercado Pago', hex: '#009EE3' },
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
  { nome: 'Mercado Livre', subtitulo: 'Mercado Pago Visa', cor: '#FFE600' },
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
  onNavegar,
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
    sincronizandoNuvem,
    autenticarUsuario,
    desconectarUsuario,
    usuariosAutorizados,
    adicionarUsuarioAutorizado,
    excluirUsuarioAutorizado,
    alternarStatusUsuario,
    alternarSupervisaoUsuario,
    ativarModoSupervisao,
    carregarUsuariosAutorizados,
    mostrarToast
  } = useFinanceStore();

  const ehAdmin = isUsuarioAdmin(usuario.email, usuario.uid, usuario.nome);

  const [abaAtiva, setAbaAtiva] = useState<'cartoes' | 'categorias' | 'banco' | 'seguranca' | 'backup' | 'nuvem' | 'usuarios' | 'conta'>(abaInicial);

  // Sincroniza a aba ativa sempre que o modal for aberto com uma aba específica
  useEffect(() => {
    if (aberto && abaInicial) {
      setAbaAtiva(abaInicial);
    }
  }, [aberto, abaInicial]);

  // Se for usuário comum e tentar acessar aba administrativa, redireciona para 'cartoes'
  useEffect(() => {
    if (!ehAdmin && (abaAtiva === 'backup' || abaAtiva === 'nuvem' || abaAtiva === 'usuarios')) {
      setAbaAtiva('cartoes');
    }
  }, [ehAdmin, abaAtiva]);

  // Estados de Gestão de Usuários (Whitelist)
  const [novoNomeUsuario, setNovoNomeUsuario] = useState('');
  const [novoEmailUsuario, setNovoEmailUsuario] = useState('');
  const [novoPermitirSupervisao, setNovoPermitirSupervisao] = useState(false);
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  useEffect(() => {
    if (ehAdmin) {
      carregarUsuariosAutorizados();
    }
  }, [ehAdmin, carregarUsuariosAutorizados]);

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

  // Estados de Conta Bancária e Agência
  const [bancoForm, setBancoForm] = useState(usuario.bancoPrincipal || 'Banco do Brasil');
  const [agenciaForm, setAgenciaForm] = useState(usuario.agencia || '');
  const [numeroContaForm, setNumeroContaForm] = useState(usuario.numeroConta || '');
  const [tipoContaForm, setTipoContaForm] = useState<'Corrente' | 'Poupança' | 'Salário' | 'Investimento'>(usuario.tipoConta || 'Corrente');

  useEffect(() => {
    if (aberto) {
      setBancoForm(usuario.bancoPrincipal || 'Banco do Brasil');
      setAgenciaForm(usuario.agencia || '');
      setNumeroContaForm(usuario.numeroConta || '');
      setTipoContaForm(usuario.tipoConta || 'Corrente');
    }
  }, [aberto, usuario]);

  const salvarContaBancaria = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setUsuario({
      bancoPrincipal: bancoForm,
      agencia: agenciaForm,
      numeroConta: numeroContaForm,
      tipoConta: tipoContaForm
    });
    mostrarToast('Conta Bancária e Agência salvas com sucesso!', 'sucesso');
    onFechar();
    onNavegar?.('inicio');
  };

  const handleSelecionarBancoRapido = (nomeBanco: string) => {
    setBancoForm(nomeBanco);
    setUsuario({
      bancoPrincipal: nomeBanco,
      agencia: agenciaForm || usuario.agencia || '',
      numeroConta: numeroContaForm || usuario.numeroConta || '',
      tipoConta: tipoContaForm || usuario.tipoConta || 'Corrente'
    });
    mostrarToast(`Banco ${nomeBanco} selecionado!`, 'sucesso');
    onFechar();
    onNavegar?.('inicio');
  };

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
              ⚙️ {ehAdmin ? 'Painel de Configurações & Base de Dados' : 'Minhas Preferências & Cartões'}
            </h3>
            <span style={{ fontSize: '11px', color: '#AAB4BE' }}>
              {ehAdmin 
                ? 'Gerencie cartões, categorias, bancos, nuvem e acessos familiares'
                : 'Personalize seus cartões de crédito, categorias e banco preferido'}
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

        {/* Abas Superiores do Modal com Rolagem Horizontal Suave */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid #1E3A5F',
          backgroundColor: '#0B1929',
          padding: '0 8px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          gap: '6px'
        }}>
          {/* Aba Cartões (Todos) */}
          <button
            type="button"
            onClick={() => setAbaAtiva('cartoes')}
            style={{
              flex: '0 0 auto',
              padding: '12px 12px',
              border: 'none',
              borderBottom: abaAtiva === 'cartoes' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'cartoes' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'cartoes' ? 800 : 600,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <CreditCard size={14} />
            <span>{ehAdmin ? 'Cartões' : 'Meus Cartões'}</span>
          </button>

          {/* Aba Categorias (Todos) */}
          <button
            type="button"
            onClick={() => setAbaAtiva('categorias')}
            style={{
              flex: '0 0 auto',
              padding: '12px 12px',
              border: 'none',
              borderBottom: abaAtiva === 'categorias' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'categorias' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'categorias' ? 800 : 600,
              fontSize: '11.5px',
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

          {/* Aba Banco (Todos) */}
          <button
            type="button"
            onClick={() => setAbaAtiva('banco')}
            style={{
              flex: '0 0 auto',
              padding: '12px 12px',
              border: 'none',
              borderBottom: abaAtiva === 'banco' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'banco' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'banco' ? 800 : 600,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Building2 size={14} />
            <span>{ehAdmin ? 'Banco' : 'Meu Banco'}</span>
          </button>

          {/* Aba Segurança (Todos) */}
          <button
            type="button"
            onClick={() => setAbaAtiva('seguranca')}
            style={{
              flex: '0 0 auto',
              padding: '12px 12px',
              border: 'none',
              borderBottom: abaAtiva === 'seguranca' ? '3px solid #F8D117' : '3px solid transparent',
              backgroundColor: 'transparent',
              color: abaAtiva === 'seguranca' ? '#F8D117' : '#AAB4BE',
              fontWeight: abaAtiva === 'seguranca' ? 800 : 600,
              fontSize: '11.5px',
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

          {/* Aba Minha Conta (Apenas Usuários Comuns) */}
          {!ehAdmin && (
            <button
              type="button"
              onClick={() => setAbaAtiva('conta')}
              style={{
                flex: '0 0 auto',
                padding: '12px 14px',
                border: 'none',
                borderBottom: abaAtiva === 'conta' ? '3px solid #F8D117' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: abaAtiva === 'conta' ? '#F8D117' : '#AAB4BE',
                fontWeight: abaAtiva === 'conta' ? 800 : 600,
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
              }}
            >
              <User size={14} />
              <span>Minha Conta</span>
            </button>
          )}

          {/* Aba Backup (Apenas Administrador) */}
          {ehAdmin && (
            <button
              type="button"
              onClick={() => setAbaAtiva('backup')}
              style={{
                flex: '0 0 auto',
                padding: '12px 12px',
                border: 'none',
                borderBottom: abaAtiva === 'backup' ? '3px solid #F8D117' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: abaAtiva === 'backup' ? '#F8D117' : '#AAB4BE',
                fontWeight: abaAtiva === 'backup' ? 800 : 600,
                fontSize: '11.5px',
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
          )}

          {/* Aba Google & Nuvem (Apenas Administrador) */}
          {ehAdmin && (
            <button
              type="button"
              onClick={() => setAbaAtiva('nuvem')}
              style={{
                flex: '0 0 auto',
                padding: '12px 12px',
                border: 'none',
                borderBottom: abaAtiva === 'nuvem' ? '3px solid #F8D117' : '3px solid transparent',
                backgroundColor: 'transparent',
                color: abaAtiva === 'nuvem' ? '#F8D117' : '#AAB4BE',
                fontWeight: abaAtiva === 'nuvem' ? 800 : 600,
                fontSize: '11.5px',
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
          )}

          {/* Aba Usuários (Apenas Administrador) */}
          {ehAdmin && (
            <button
              type="button"
              onClick={() => setAbaAtiva('usuarios')}
              style={{
                flex: '0 0 auto',
                padding: '12px 14px',
                border: 'none',
                borderBottom: abaAtiva === 'usuarios' ? '3px solid #F8D117' : '3px solid transparent',
                backgroundColor: abaAtiva === 'usuarios' ? 'rgba(248, 209, 23, 0.22)' : 'rgba(248, 209, 23, 0.1)',
                color: '#F8D117',
                fontWeight: 800,
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                borderRadius: '8px 8px 0 0'
              }}
              title="Gerenciar lista de pessoas autorizadas e acompanhamento"
            >
              <Users size={15} color="#F8D117" />
              <span>👥 Usuários (Família)</span>
            </button>
          )}
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
               ABA 3: BANCO PRINCIPAL & DADOS DA CONTA BANCÁRIA
             ======================================================== */}
          {abaAtiva === 'banco' && (
            <form onSubmit={salvarContaBancaria} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase' }}>
                    1. Escolha a Instituição Financeira / Banco
                  </label>
                  <span style={{ fontSize: '10.5px', color: '#5090D3', fontWeight: 700 }}>
                    1 toque seleciona e volta ao início
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {BANCOS_DISPONIVEIS.map((b) => {
                    const ativo = bancoForm === b.nome;
                    return (
                      <div
                        key={b.nome}
                        onClick={() => handleSelecionarBancoRapido(b.nome)}
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
                        title={`Clique para selecionar ${b.nome} e voltar ao Início`}
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
                  value={bancoForm}
                  onChange={(e) => setBancoForm(e.target.value)}
                  placeholder="Nome do banco para exibir no cabeçalho..."
                  style={{ fontSize: '13px', fontWeight: 600 }}
                  required
                />
              </div>

              {/* Seção de Agência e Número da Conta */}
              <div style={{
                backgroundColor: '#132F4C',
                border: '1.5px solid #1E3A5F',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#F8D117', textTransform: 'uppercase' }}>
                  2. Dados da Conta Bancária
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Agência Bancária
                    </label>
                    <input
                      type="text"
                      value={agenciaForm}
                      onChange={(e) => setAgenciaForm(e.target.value)}
                      placeholder="Ex.: 1234-5"
                      style={{ fontSize: '13px', fontWeight: 600, backgroundColor: '#0B1929' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Número da Conta com Dígito
                    </label>
                    <input
                      type="text"
                      value={numeroContaForm}
                      onChange={(e) => setNumeroContaForm(e.target.value)}
                      placeholder="Ex.: 00012345-6"
                      style={{ fontSize: '13px', fontWeight: 600, backgroundColor: '#0B1929' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#AAB4BE', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Tipo de Conta
                  </label>
                  <select
                    value={tipoContaForm}
                    onChange={(e) => setTipoContaForm(e.target.value as any)}
                    style={{ fontSize: '13px', fontWeight: 600, backgroundColor: '#0B1929', color: '#FFFFFF' }}
                  >
                    <option value="Corrente">Conta Corrente</option>
                    <option value="Poupança">Conta Poupança</option>
                    <option value="Salário">Conta Salário</option>
                    <option value="Investimento">Conta Investimento</option>
                  </select>
                </div>
              </div>

              {/* Botão de Salvar Conta Bancária */}
              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  background: 'linear-gradient(135deg, #2E8B57 0%, #206E41 100%)',
                  boxShadow: '0 4px 15px rgba(46, 139, 87, 0.35)',
                  border: 'none',
                  color: '#FFFFFF'
                }}
              >
                <Save size={16} />
                <span>Salvar Conta Bancária</span>
              </button>

              <div style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(40, 126, 165, 0.15)',
                border: '1px solid rgba(40, 126, 165, 0.3)',
                fontSize: '11.5px',
                color: '#B0BEC5',
                lineHeight: 1.4,
              }}>
                💡 <strong style={{ color: '#FFFFFF' }}>Dica:</strong> Os dados da sua conta e agência serão vinculados ao seu perfil e utilizados para identificar seus lançamentos em débito, transferências e Pix com precisão.
              </div>
            </form>
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
               ABA 5: BACKUP EM NUVEM & SINCRONIZAÇÃO JSON (ADMIN)
             ======================================================== */}
          {ehAdmin && abaAtiva === 'backup' && (
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
              🌐 ABA 6: NUVEM & GOOGLE MAGIC LOGON (ADMIN)
             ======================================================== */}
          {ehAdmin && abaAtiva === 'nuvem' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🌐</span> Nuvem Firebase & Google Magic Logon
                </h3>
                <span style={{ fontSize: '12px', color: '#AAB4BE' }}>
                  Sincronização em tempo real entre PC, Mac, Xiaomi Poco X5 Pro e iPhone.
                </span>
              </div>

              {/* Card de Destaque: Autorizar Familiares (Sem Pedir Senha) */}
              <div
                onClick={() => setAbaAtiva('usuarios')}
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(248, 209, 23, 0.14)',
                  border: '1.5px solid #F8D117',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(248, 209, 23, 0.15)'
                }}
              >
                <div>
                  <strong style={{ color: '#F8D117', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} />
                    <span>Quer autorizar sua Esposa ou seu Filho?</span>
                  </strong>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#E0E0E0', lineHeight: 1.4 }}>
                    Clique aqui para abrir o cadastro de pessoas autorizadas (você <strong>NÃO</strong> precisa da senha deles!).
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    backgroundColor: '#F8D117',
                    color: '#0F2744'
                  }}
                >
                  Abrir Cadastro 👥
                </button>
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

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fazerLoginGoogle();
                        if (res) {
                          await autenticarUsuario(res);
                        }
                      } catch (e) {
                        alert('Não foi possível conectar ao Google no momento.');
                      }
                    }}
                    className="btn-primary"
                    style={{ gap: '6px', fontSize: '12px', padding: '8px 14px' }}
                  >
                    <CloudLightning size={14} />
                    <span>{usuario.uid ? 'Trocar Conta Google' : 'Google Magic Logon'}</span>
                  </button>

                  {usuario.uid && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm('Deseja realmente desconectar esta conta no dispositivo?')) {
                          await fazerLogoutGoogle();
                          await desconectarUsuario();
                        }
                      }}
                      className="btn-secondary"
                      style={{ gap: '6px', fontSize: '12px', padding: '8px 14px', color: '#F44336', borderColor: 'rgba(244, 67, 54, 0.4)' }}
                    >
                      <span>Desconectar</span>
                    </button>
                  )}
                </div>

                <div style={{
                  fontSize: '11px',
                  color: '#90CAF9',
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  lineHeight: 1.4
                }}>
                  ℹ️ <strong>Atenção:</strong> O botão acima serve apenas para <strong>VOCÊ</strong> conectar a sua própria conta Google. 
                  Você <strong>NÃO</strong> precisa saber a senha de ninguém! Para autorizar sua esposa ou seu filho, acesse a aba <strong>👥 Usuários</strong> logo acima — lá você só digita o e-mail deles, sem senha.
                </div>
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

          {/* ========================================================
               ABA 7: 👥 USUÁRIOS AUTORIZADOS & WHITELIST (ADMIN)
             ======================================================== */}
          {ehAdmin && abaAtiva === 'usuarios' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} color="#F8D117" />
                  <span>Controle de Acessos & Whitelist Familiar</span>
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#AAB4BE', lineHeight: 1.4 }}>
                  Apenas as pessoas cadastradas abaixo conseguirão fazer login no aplicativo. Se alguém repassar seu link, pessoas não autorizadas serão bloqueadas.
                </p>
              </div>

              {/* Formulário: Adicionar Novo Usuário Autorizado */}
              <div style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#132F4C',
                border: '1.5px solid rgba(80, 144, 211, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <strong style={{ fontSize: '12.5px', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={15} color="#4CAF50" />
                  <span>Autorizar Nova Pessoa</span>
                </strong>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#AAB4BE', display: 'block', marginBottom: '4px' }}>
                      Nome da Pessoa:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Esposa, Filho..."
                      value={novoNomeUsuario}
                      onChange={(e) => setNovoNomeUsuario(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#0B1929',
                        border: '1px solid #1E3A5F',
                        color: '#FFFFFF',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#AAB4BE', display: 'block', marginBottom: '4px' }}>
                      E-mail Google (Gmail):
                    </label>
                    <input
                      type="email"
                      placeholder="usuario@gmail.com"
                      value={novoEmailUsuario}
                      onChange={(e) => setNovoEmailUsuario(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#0B1929',
                        border: '1px solid #1E3A5F',
                        color: '#FFFFFF',
                        fontSize: '12.5px'
                      }}
                    />
                  </div>
                </div>

                {/* Opção de Acompanhamento Silencioso */}
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  backgroundColor: 'rgba(11, 25, 41, 0.6)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(80, 144, 211, 0.25)'
                }}>
                  <input
                    type="checkbox"
                    checked={novoPermitirSupervisao}
                    onChange={(e) => setNovoPermitirSupervisao(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#8A05BE', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Eye size={13} color="#C084FC" />
                      Permitir Acompanhamento Silencioso pelo Administrador
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#AAB4BE', display: 'block' }}>
                      Você poderá visualizar os lançamentos dessa conta em modo somente leitura. A pessoa nunca saberá nem receberá aviso.
                    </span>
                  </div>
                </label>

                <button
                  type="button"
                  disabled={salvandoUsuario || !novoEmailUsuario.includes('@')}
                  onClick={async () => {
                    setSalvandoUsuario(true);
                    const res = await adicionarUsuarioAutorizado({
                      nome: novoNomeUsuario || 'Usuário',
                      email: novoEmailUsuario,
                      permitirSupervisao: novoPermitirSupervisao,
                    });
                    setSalvandoUsuario(false);
                    if (res.sucesso) {
                      setNovoNomeUsuario('');
                      setNovoEmailUsuario('');
                      setNovoPermitirSupervisao(false);
                    }
                  }}
                  className="btn-primary"
                  style={{
                    padding: '9px 14px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <CheckCircle size={15} />
                  <span>Cadastrar & Liberar Acesso</span>
                </button>
              </div>

              {/* Lista de Usuários Autorizados */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '12.5px', color: '#FFFFFF' }}>
                    Pessoas Autorizadas ({usuariosAutorizados.length}):
                  </strong>
                  <button
                    type="button"
                    onClick={() => carregarUsuariosAutorizados()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#5090D3',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RotateCw size={12} />
                    <span>Atualizar Lista</span>
                  </button>
                </div>

                {usuariosAutorizados.length === 0 ? (
                  <div style={{
                    padding: '24px 16px',
                    borderRadius: '14px',
                    backgroundColor: '#132F4C',
                    border: '1px dashed #1E3A5F',
                    textAlign: 'center',
                    color: '#AAB4BE',
                    fontSize: '12px'
                  }}>
                    Nenhum usuário cadastrado ainda. Adicione o e-mail da sua esposa ou filho acima para liberar o acesso deles.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {usuariosAutorizados.map((u) => {
                      const isAtivo = u.status === 'ativo';
                      return (
                        <div
                          key={u.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '14px',
                            backgroundColor: '#132F4C',
                            border: `1px solid ${isAtivo ? '#1E3A5F' : 'rgba(244, 67, 54, 0.4)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <strong style={{ fontSize: '13px', color: '#FFFFFF' }}>{u.nome}</strong>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  backgroundColor: isAtivo ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                                  color: isAtivo ? '#4CAF50' : '#F44336',
                                  border: `1px solid ${isAtivo ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'}`
                                }}>
                                  {isAtivo ? '🟢 Ativo' : '⏸️ Pausado'}
                                </span>
                              </div>
                              <span style={{ fontSize: '11.5px', color: '#82B1FF', display: 'block' }}>{u.email}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Deseja remover a permissão de ${u.nome} (${u.email})?`)) {
                                  excluirUsuarioAutorizado(u.id);
                                }
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#F44336',
                                cursor: 'pointer',
                                padding: '4px',
                                opacity: 0.8
                              }}
                              title="Remover autorização"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Barra de Ações Rápidas por Usuário */}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '6px',
                            paddingTop: '8px',
                            borderTop: '1px solid rgba(30, 58, 95, 0.5)'
                          }}>
                            {/* Chave de Acompanhamento Silencioso */}
                            <button
                              type="button"
                              onClick={() => alternarSupervisaoUsuario(u.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                backgroundColor: u.permitirSupervisao ? 'rgba(138, 5, 190, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                                border: `1px solid ${u.permitirSupervisao ? '#C084FC' : 'rgba(255, 255, 255, 0.2)'}`,
                                color: u.permitirSupervisao ? '#C084FC' : '#AAB4BE'
                              }}
                              title="Clique para ativar/desativar o acompanhamento silencioso"
                            >
                              {u.permitirSupervisao ? <Eye size={13} /> : <EyeOff size={13} />}
                              <span>{u.permitirSupervisao ? 'Supervisão Ativada' : 'Supervisão Desativada'}</span>
                            </button>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              {/* Botão Pausar / Ativar Acesso */}
                              <button
                                type="button"
                                onClick={() => alternarStatusUsuario(u.id)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.2)',
                                  color: isAtivo ? '#F8D117' : '#4CAF50'
                                }}
                              >
                                {isAtivo ? 'Pausar Acesso' : 'Ativar Acesso'}
                              </button>

                              {/* Se supervisão estiver liberada, botão direto para visualizar */}
                              {u.permitirSupervisao && isAtivo && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onFechar();
                                    ativarModoSupervisao(u);
                                  }}
                                  className="btn-primary"
                                  style={{
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    gap: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Eye size={13} />
                                  <span>Visualizar Gastos</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Informação de Segurança e Privacidade */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(23, 63, 95, 0.5)',
                border: '1px solid rgba(80, 144, 211, 0.3)',
                fontSize: '11px',
                color: '#AAB4BE',
                lineHeight: 1.45
              }}>
                <strong style={{ color: '#F8D117', display: 'block', marginBottom: '2px' }}>
                  🔒 Como funciona a proteção:
                </strong>
                - Quem não estiver cadastrado nesta lista não consegue entrar no aplicativo.<br />
                - Ao ativar a supervisão de alguém, você visualiza os dados em <strong>modo somente leitura</strong> para não alterar nada por engano.<br />
                - O acompanhamento é <strong>100% invisível</strong> no aparelho da pessoa supervisionada.
              </div>
            </div>
          )}

          {/* ========================================================
              👤 ABA: MINHA CONTA (USUÁRIOS COMUNS)
             ======================================================== */}
          {!ehAdmin && abaAtiva === 'conta' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="#F8D117" />
                  <span>Minha Conta</span>
                </h3>
                <span style={{ fontSize: '12px', color: '#AAB4BE' }}>
                  Suas informações de acesso pessoal e sincronização automática.
                </span>
              </div>

              {/* Card de Identificação do Usuário */}
              <div style={{
                padding: '18px',
                borderRadius: '16px',
                backgroundColor: '#132F4C',
                border: '1.5px solid #1E3A5F',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={usuario.avatarUrl}
                    alt={usuario.nome}
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #F8D117',
                      flexShrink: 0
                    }}
                  />
                  <div>
                    <strong style={{ fontSize: '15px', color: '#FFFFFF', display: 'block' }}>{usuario.nome}</strong>
                    <span style={{ fontSize: '12px', color: '#82B1FF', display: 'block', marginTop: '2px' }}>
                      {usuario.email || 'Conta Conectada'}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '6px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(76, 175, 80, 0.18)',
                      color: '#4CAF50',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      border: '1px solid rgba(76, 175, 80, 0.35)'
                    }}>
                      <CheckCircle size={11} /> Conectado com o Google
                    </span>
                  </div>
                </div>

                <div style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(23, 63, 95, 0.45)',
                  border: '1px solid rgba(80, 144, 211, 0.25)',
                  fontSize: '11.5px',
                  color: '#B0BEC5',
                  lineHeight: 1.5
                }}>
                  ✨ <strong>Privacidade e Segurança:</strong> Seus lançamentos, cartões e contas ficam salvos em nuvem de forma privada e segura. Todas as alterações são sincronizadas automaticamente em tempo real.
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Deseja realmente desconectar esta conta no dispositivo?')) {
                      await fazerLogoutGoogle();
                      await desconectarUsuario();
                      onFechar();
                    }
                  }}
                  className="btn-secondary"
                  style={{
                    padding: '10px 16px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#F44336',
                    borderColor: 'rgba(244, 67, 54, 0.4)',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Sair da Minha Conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
