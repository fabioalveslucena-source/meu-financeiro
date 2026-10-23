import { create } from 'zustand';
import type { 
  Lancamento, 
  LancamentoInput, 
  Cartao, 
  Categoria, 
  Conta, 
  LivroCaixaResumo,
  ResumoCartao,
  Natureza,
  DespesaRecorrente,
  ItemCompraMercado,
  FormaPagamento
} from '../types';
import { NATUREZAS_PADRAO } from '../types/categoria';
import { DESPESAS_RECORRENTES_PADRAO } from '../types/recorrente';
import type { TransacaoImportada } from '../features/import/ofxParser';
import { 
  LANCAMENTOS_INICIAIS, 
  CARTAO_PADRAO, 
  CATEGORIAS_PADRAO, 
  CONTAS_PADRAO 
} from '../services/mockData';
import { competenciaAtual } from '../lib/formatters';
import { FirestoreSyncService, MASTER_UID } from '../services/firestoreSync';

export interface RealtimeLog {
  id: string;
  timestamp: string;
  acao: string;
  detalhes: string;
  tipo: 'sucesso' | 'info' | 'alerta';
}

export interface UsuarioPerfil {
  nome: string;
  titulo: string;
  bancoPrincipal: string;
  avatarUrl: string;
  email?: string;
  uid?: string;
}

interface FinanceState {
  // Estado
  usuario: UsuarioPerfil;
  lancamentos: Lancamento[];
  cartoes: Cartao[];
  categorias: Categoria[];
  naturezas: Natureza[];
  contas: Conta[];
  competenciaAtiva: string;
  termoBusca: string;
  filtroTipo: string;
  filtroNatureza: string;
  toast: { mensagem: string; tipo: 'sucesso' | 'erro' | 'info' } | null;
  logsRealtime: RealtimeLog[];
  ultimoEventoTimestamp: number;

  // Ações de Navegação e Filtros
  setUsuario: (dados: Partial<UsuarioPerfil>) => void;
  setCompetenciaAtiva: (comp: string) => void;
  setTermoBusca: (termo: string) => void;
  setFiltroTipo: (tipo: string) => void;
  setFiltroNatureza: (nat: string) => void;
  mostrarToast: (mensagem: string, tipo?: 'sucesso' | 'erro' | 'info') => void;
  limparToast: () => void;
  adicionarLogRealtime: (acao: string, detalhes: string, tipo?: 'sucesso' | 'info' | 'alerta') => void;

  // Edição da Base de Dados (Cartões, Limites, Categorias, Naturezas)
  atualizarCartao: (id: string, dados: Partial<Cartao>) => void;
  adicionarCartao: (cartao: Omit<Cartao, 'id' | 'userId'>) => void;
  excluirCartao: (id: string) => void;
  adicionarCategoria: (cat: { natureza: string; nome: string; tipo?: 'Despesa' | 'Receita' | 'Investimento' | 'Todos' }) => void;
  excluirCategoria: (id: string) => void;
  adicionarNatureza: (nat: { nome: string; emoji: string }) => void;

  // Tema do Aplicativo (Modo Dark / Modo Light)
  tema: 'dark' | 'light';
  alternarTema: () => void;

  // Integração Direta Meu Mercado
  adicionarCompraMercado: (dados: {
    mercadoNome?: string;
    data: string; // YYYY-MM-DD
    competencia?: string; // MM/YYYY
    valorTotal: number;
    formaPagamento: FormaPagamento;
    cartao?: string;
    conta?: string;
    totalParcelas?: number;
    itens: ItemCompraMercado[];
  }) => { sucesso: boolean; mensagem: string };

  // CRUD Lançamentos com propagação em Tempo Real
  adicionarLancamento: (input: LancamentoInput, emitirEvento?: boolean) => { sucesso: boolean; mensagem: string };
  editarLancamento: (id: string, dados: Partial<Lancamento>, emitirEvento?: boolean) => { sucesso: boolean; mensagem: string };
  excluirLancamento: (id: string, excluirTodasParcelas?: boolean, emitirEvento?: boolean) => { sucesso: boolean; mensagem: string };

  // Ação de Demonstração em Tempo Real (Estilo Dev)
  simularMovimentoRealtime: () => void;

  // Cálculos Derivados
  obterResumoLivroCaixa: (competencia?: string) => LivroCaixaResumo;
  obterResumoCartoes: () => ResumoCartao[];
  obterLancamentosFiltrados: () => Lancamento[];

  // Despesas Fixas e Recorrentes
  despesasRecorrentes: DespesaRecorrente[];
  adicionarRecorrente: (dados: Omit<DespesaRecorrente, 'id'>) => void;
  atualizarRecorrente: (id: string, dados: Partial<DespesaRecorrente>) => void;
  excluirRecorrente: (id: string) => void;
  lancarRecorrenteNoMes: (recorrenteId: string, competencia?: string) => { sucesso: boolean; mensagem: string };
  verificarStatusRecorrenteNoMes: (recorrente: DespesaRecorrente, competencia?: string) => boolean;

  // Segurança, PIN e Biometria
  seguranca: {
    bloqueioAtivo: boolean;
    pin: string;
    biometriaAtiva: boolean;
    estaBloqueado: boolean;
  };
  configurarSeguranca: (dados: { bloqueioAtivo: boolean; pin?: string; biometriaAtiva?: boolean }) => void;
  desbloquearComPin: (pinDigitado: string) => boolean;
  desbloquearComBiometria: () => boolean;
  bloquearApp: () => void;

  // Backup e Restauração de Base
  exportarBackupCompleto: () => void;
  restaurarBackup: (conteudoJson: string) => { sucesso: boolean; mensagem: string };
  importarLancamentosEmLote: (transacoes: TransacaoImportada[]) => { sucesso: boolean; count: number };

  // Sincronização em Nuvem (Cloud Firestore)
  sincronizandoNuvem: boolean;
  sincronizarComNuvem: () => Promise<{ sucesso: boolean; mensagem: string }>;
  enviarTudoParaNuvem: () => Promise<void>;
  baixarTudoDaNuvem: () => Promise<void>;
}

const STORAGE_KEY_LANCAMENTOS = 'mf_lancamentos_v3';
const STORAGE_KEY_CARTOES = 'mf_cartoes_v4';
const STORAGE_KEY_USUARIO = 'mf_usuario_v2';
const STORAGE_KEY_CATEGORIAS = 'mf_categorias_v2';
const STORAGE_KEY_NATUREZAS = 'mf_naturezas_v2';
const STORAGE_KEY_RECORRENTES = 'mf_recorrentes_v2';
const STORAGE_KEY_SEGURANCA = 'mf_seguranca_v2';
const STORAGE_KEY_TEMA = 'mf_tema_v1';

function aplicarTemaNoDocumento(tema: 'dark' | 'light') {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', tema);
  }
}

export const USUARIO_PADRAO: UsuarioPerfil = {
  nome: 'FABIO ALVES LUCENA',
  titulo: 'Titular Master • Conta Especial',
  bancoPrincipal: 'Banco do Brasil',
  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  email: 'alveslucenafabio@gmail.com',
  uid: 'fabio-master-uid',
};

// Canal de comunicação inter-abas (Real-time Broadcast)
const realtimeChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('meu_financeiro_realtime_sync')
  : null;

function formatarHoraAgora(): string {
  const agora = new Date();
  const h = String(agora.getHours()).padStart(2, '0');
  const m = String(agora.getMinutes()).padStart(2, '0');
  const s = String(agora.getSeconds()).padStart(2, '0');
  const ms = String(agora.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

function migrarCartoes(cartoes: Cartao[]): Cartao[] {
  // Garantir a cor amarela do Banco do Brasil Visa e presença do Bradesco
  let encontrouBB = false;
  let encontrouBradesco = false;

  const lista = cartoes.map((c) => {
    if (c.nome.toLowerCase().includes('nubank') || c.nome.includes('Banco do Brasil')) {
      encontrouBB = true;
      return {
        ...c,
        nome: 'Banco do Brasil Ourocard',
        bandeira: 'Visa',
        limite: 18000,
        diaFechamento: 25,
        diaVencimento: 5,
        cor: '#F8D117',
        icone: '💳',
      };
    }
    if (c.nome.toLowerCase().includes('bradesco')) {
      encontrouBradesco = true;
      return {
        ...c,
        cor: '#CC092F',
        diaFechamento: 10,
        diaVencimento: 20,
      };
    }
    return c;
  });

  if (!encontrouBB) {
    lista.unshift({
      id: 'cartao-1',
      userId: 'default-user',
      nome: 'Banco do Brasil Ourocard',
      bandeira: 'Visa',
      limite: 18000,
      diaFechamento: 25,
      diaVencimento: 5,
      ativo: true,
      cor: '#F8D117',
      icone: '💳',
    });
  }

  if (!encontrouBradesco) {
    lista.splice(1, 0, {
      id: 'cartao-bradesco',
      userId: 'default-user',
      nome: 'Bradesco Cartões',
      bandeira: 'Visa Platinum',
      limite: 15000,
      diaFechamento: 10,
      diaVencimento: 20,
      ativo: true,
      cor: '#CC092F',
      icone: '💳',
    });
  }

  return lista;
}

function migrarLancamentos(lancamentos: Lancamento[]): Lancamento[] {
  let lista = lancamentos
    .filter((l) => l.id !== 'lanc-mercado-1') // Remove qualquer compra teste de 650 resquicial
    .map((l) => {
      if (l.cartao && l.cartao.toLowerCase().includes('nubank')) {
        return { ...l, cartao: 'Banco do Brasil Ourocard' };
      }
      return l;
    });

  return lista;
}

function migrarNaturezas(naturezas: Natureza[]): Natureza[] {
  let lista = [...naturezas];

  // 1. Normalizar emojis e labels das naturezas
  lista = lista.map(n => {
    const nomeNorm = (n.nome || '').toLowerCase();
    const labelNorm = (n.label || '').toLowerCase();
    if (nomeNorm.includes('manuten') || labelNorm.includes('manuten')) {
      return { id: 'manutencao-veicular', nome: 'Manutenção Veicular', emoji: '🔧', label: '🔧 Manutenção Veicular' };
    }
    if (nomeNorm.includes('imóve') || nomeNorm.includes('imove') || labelNorm.includes('imóve') || labelNorm.includes('imove')) {
      return { id: 'imoveis', nome: 'Imóveis', emoji: '🏢', label: '🏢 Imóveis' };
    }
    return n;
  });

  // 2. Garantir '🏢 Imóveis' e '🔧 Manutenção Veicular'
  if (!lista.some(n => n.id === 'imoveis' || n.label.includes('Imóveis'))) {
    lista.unshift({ id: 'imoveis', nome: 'Imóveis', emoji: '🏢', label: '🏢 Imóveis' });
  }
  if (!lista.some(n => n.id === 'manutencao-veicular' || n.label.includes('Manutenção Veicular'))) {
    lista.splice(1, 0, { id: 'manutencao-veicular', nome: 'Manutenção Veicular', emoji: '🔧', label: '🔧 Manutenção Veicular' });
  }

  // 3. Garantir todas as naturezas padrão caso a lista local esteja incompleta (ex: no celular antigo)
  NATUREZAS_PADRAO.forEach(padrao => {
    if (!lista.some(n => n.id === padrao.id || n.nome.toLowerCase() === padrao.nome.toLowerCase())) {
      lista.push(padrao);
    }
  });

  return lista;
}

function migrarCategorias(categorias: Categoria[]): Categoria[] {
  let lista = [...categorias];

  // 1. Normalizar nomes de naturezas em categorias existentes
  lista = lista.map(c => {
    const natNorm = (c.natureza || '').toLowerCase();
    if (natNorm.includes('manuten')) {
      return { ...c, natureza: '🔧 Manutenção Veicular' };
    }
    if (natNorm.includes('imove') || natNorm.includes('imóve')) {
      return { ...c, natureza: '🏢 Imóveis' };
    }
    return c;
  });

  // 2. Mesclar com todas as categorias padrão oficiais (incluindo todas de Manutenção Veicular e Imóveis)
  CATEGORIAS_PADRAO.forEach(padrao => {
    const jaExiste = lista.some(c => 
      c.nome.trim().toLowerCase() === padrao.nome.trim().toLowerCase() &&
      c.natureza.trim().toLowerCase() === padrao.natureza.trim().toLowerCase()
    );
    if (!jaExiste) {
      lista.push(padrao);
    }
  });

  return lista;
}

function carregarDoStorage<T>(chave: string, padrao: T): T {
  try {
    const salvo = localStorage.getItem(chave);
    if (!salvo) return padrao;
    const parsed = JSON.parse(salvo);
    const lista = Array.isArray(parsed)
      ? parsed.map((item: any) => ({
          ...item,
          data: item.data ? new Date(item.data) : new Date(),
          vencimento: item.vencimento ? new Date(item.vencimento) : undefined,
          criadoEm: item.criadoEm ? new Date(item.criadoEm) : new Date(),
          atualizadoEm: item.atualizadoEm ? new Date(item.atualizadoEm) : new Date(),
        })) as unknown as T
      : parsed;

    if (chave === STORAGE_KEY_CARTOES) {
      return migrarCartoes(lista as unknown as Cartao[]) as unknown as T;
    }
    if (chave === STORAGE_KEY_LANCAMENTOS) {
      return migrarLancamentos(lista as unknown as Lancamento[]) as unknown as T;
    }
    if (chave === STORAGE_KEY_NATUREZAS) {
      return migrarNaturezas(lista as unknown as Natureza[]) as unknown as T;
    }
    if (chave === STORAGE_KEY_CATEGORIAS) {
      return migrarCategorias(lista as unknown as Categoria[]) as unknown as T;
    }
    return lista;
  } catch {
    return padrao;
  }
}

function salvarNoStorage<T>(chave: string, valor: T): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch (err) {
    console.error('Erro ao salvar no storage local:', err);
  }
}

export const useFinanceStore = create<FinanceState>((set, get) => {
  const estadoInicial = {
    usuario: carregarDoStorage<UsuarioPerfil>(STORAGE_KEY_USUARIO, USUARIO_PADRAO),
    lancamentos: carregarDoStorage<Lancamento[]>(STORAGE_KEY_LANCAMENTOS, LANCAMENTOS_INICIAIS),
    cartoes: carregarDoStorage<Cartao[]>(STORAGE_KEY_CARTOES, CARTAO_PADRAO),
    categorias: carregarDoStorage<Categoria[]>(STORAGE_KEY_CATEGORIAS, CATEGORIAS_PADRAO),
    naturezas: carregarDoStorage<Natureza[]>(STORAGE_KEY_NATUREZAS, NATUREZAS_PADRAO),
    contas: CONTAS_PADRAO,
    despesasRecorrentes: carregarDoStorage<DespesaRecorrente[]>(STORAGE_KEY_RECORRENTES, DESPESAS_RECORRENTES_PADRAO),
    seguranca: (() => {
      const seg = carregarDoStorage<{ bloqueioAtivo: boolean; pin: string; biometriaAtiva: boolean }>(STORAGE_KEY_SEGURANCA, {
        bloqueioAtivo: false,
        pin: '',
        biometriaAtiva: false,
      });
      return {
        ...seg,
        estaBloqueado: Boolean(seg.bloqueioAtivo && seg.pin),
      };
    })(),
    tema: ((): 'dark' | 'light' => {
      const temaSalvo = typeof localStorage !== 'undefined' ? (localStorage.getItem(STORAGE_KEY_TEMA) as 'dark' | 'light') : null;
      const tema: 'dark' | 'light' = temaSalvo === 'light' ? 'light' : 'dark';
      aplicarTemaNoDocumento(tema);
      return tema;
    })(),
    competenciaAtiva: competenciaAtual(),
    termoBusca: '',
    filtroTipo: 'Todos',
    filtroNatureza: 'Todas',
    toast: null,
    logsRealtime: [
      {
        id: 'log-init',
        timestamp: formatarHoraAgora(),
        acao: '[SYS] Conexão Realtime Estabelecida',
        detalhes: 'Engine de sincronização em tempo real ativa na porta 5173.',
        tipo: 'info' as const,
      },
      {
        id: 'log-card',
        timestamp: formatarHoraAgora(),
        acao: '[CARTÕES] Banco do Brasil Ourocard Visa configurado',
        detalhes: 'Fechamento dia 25 | Vencimento dia 5 | Limite R$ 18.000,00.',
        tipo: 'sucesso' as const,
      }
    ],
    ultimoEventoTimestamp: Date.now(),
  };

  // Escutar eventos de outras abas ou fontes em tempo real
  if (realtimeChannel) {
    realtimeChannel.onmessage = (event) => {
      const { tipo, payload, acao, detalhes } = event.data || {};
      if (tipo === 'SYNC_STATE' && payload) {
        const novosLanc = carregarDoStorage<Lancamento[]>(STORAGE_KEY_LANCAMENTOS, payload.lancamentos || []);
        const novosCart = carregarDoStorage<Cartao[]>(STORAGE_KEY_CARTOES, payload.cartoes || []);
        
        set({
          lancamentos: novosLanc,
          cartoes: novosCart,
          ultimoEventoTimestamp: Date.now()
        });

        get().adicionarLogRealtime(
          acao || '[REALTIME] Sincronização Recebida',
          detalhes || 'Dados atualizados automaticamente em tempo real.',
          'sucesso'
        );
      }
    };
  }

  // Escutar alterações diretas no storage (compatibilidade multi-abas)
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY_LANCAMENTOS || e.key === STORAGE_KEY_CARTOES) {
        const lanc = carregarDoStorage<Lancamento[]>(STORAGE_KEY_LANCAMENTOS, get().lancamentos);
        const cart = carregarDoStorage<Cartao[]>(STORAGE_KEY_CARTOES, get().cartoes);
        set({ lancamentos: lanc, cartoes: cart, ultimoEventoTimestamp: Date.now() });
        get().adicionarLogRealtime(
          '[STORAGE] Storage Event Detectado',
          `Chave "${e.key}" atualizada em tempo real.`,
          'info'
        );
      }
    });
  }

  return {
    ...estadoInicial,

    setUsuario: (dados: Partial<UsuarioPerfil>) => {
      set((state) => {
        const novoUsuario = { ...state.usuario, ...dados };
        salvarNoStorage(STORAGE_KEY_USUARIO, novoUsuario);
        FirestoreSyncService.salvarPerfil(MASTER_UID, novoUsuario);
        return { usuario: novoUsuario };
      });
    },

    setCompetenciaAtiva: (competenciaAtiva) => set({ competenciaAtiva }),
    setTermoBusca: (termoBusca) => set({ termoBusca }),
    setFiltroTipo: (filtroTipo) => set({ filtroTipo }),
    setFiltroNatureza: (filtroNatureza) => set({ filtroNatureza }),

    mostrarToast: (mensagem, tipo = 'sucesso') => {
      set({ toast: { mensagem, tipo } });
      setTimeout(() => {
        set((state) => (state.toast?.mensagem === mensagem ? { toast: null } : {}));
      }, 4000);
    },

    limparToast: () => set({ toast: null }),

    alternarTema: () => {
      const novoTema = get().tema === 'dark' ? 'light' : 'dark';
      salvarNoStorage(STORAGE_KEY_TEMA, novoTema);
      aplicarTemaNoDocumento(novoTema);
      set({ tema: novoTema });
      get().mostrarToast(novoTema === 'light' ? '☀️ Modo Claro ativado' : '🌙 Modo Escuro ativado', 'info');
    },

    adicionarCompraMercado: (dados) => {
      const { lancamentos, usuario, adicionarLogRealtime, mostrarToast } = get();
      const totalParcelas = Math.max(1, dados.totalParcelas || 1);
      const dataObj = new Date(dados.data + 'T12:00:00');
      const [anoStr, mesStr] = dados.data.split('-');
      const anoNum = parseInt(anoStr) || new Date().getFullYear();
      const mesNum = parseInt(mesStr) || (new Date().getMonth() + 1);
      const diaNum = dataObj.getDate();

      const diaFechamento = (dados.cartao && dados.cartao.toLowerCase().includes('bradesco')) ? 10 : 25;
      const comprouAposFechamento = (dados.formaPagamento === '💳 Crédito') && (diaNum > diaFechamento);

      const valorCentavos = Math.round(dados.valorTotal * 100);
      const centavosBase = Math.floor(valorCentavos / totalParcelas);
      const restoCentavos = valorCentavos % totalParcelas;

      const compraId = `mercado_${Date.now()}`;
      const novosLancamentos: Lancamento[] = [];

      for (let p = 1; p <= totalParcelas; p++) {
        const deslocamentoFatura = comprouAposFechamento ? p : (p - 1);
        const dataFatura = new Date(anoNum, (mesNum - 1) + deslocamentoFatura, 1);
        const compMes = String(dataFatura.getMonth() + 1).padStart(2, '0');
        const compAno = dataFatura.getFullYear();
        const faturaCompetencia = dados.competencia && totalParcelas === 1 ? dados.competencia : `${compMes}/${compAno}`;

        const centavosParcela = p <= restoCentavos ? centavosBase + 1 : centavosBase;
        const valorFinal = Number((centavosParcela / 100).toFixed(2));

        const descBase = dados.mercadoNome ? `Compra ${dados.mercadoNome}` : 'Compra Supermercado';
        const descFinal = totalParcelas > 1 ? `${descBase} (${p}/${totalParcelas})` : descBase;

        const docId = totalParcelas > 1 ? `${compraId}_p${p}` : compraId;

        const l: Lancamento = {
          id: docId,
          userId: usuario.uid || 'fabio-master-uid',
          data: dataObj,
          competencia: faturaCompetencia,
          valor: valorFinal,
          tipo: 'Despesa',
          natureza: '🛒 Alimentação',
          categoria: 'Supermercado',
          descricao: descFinal,
          pagamento: dados.formaPagamento,
          cartao: dados.cartao,
          conta: dados.conta,
          status: 'Lançado',
          origem: 'meu-mercado',
          compraId: dados.formaPagamento === '💳 Crédito' ? compraId : undefined,
          parcela: totalParcelas > 1 ? p : undefined,
          totalParcelas: totalParcelas > 1 ? totalParcelas : undefined,
          fatura: dados.formaPagamento === '💳 Crédito' ? faturaCompetencia : undefined,
          detalhesMercado: {
            mercadoNome: dados.mercadoNome || 'Meu Mercado',
            cupomNumero: `MM-${Date.now().toString().slice(-4)}`,
            itens: dados.itens,
            totalItens: dados.itens.length,
            valorTotal: dados.valorTotal,
            parcelaAtual: p,
            totalParcelas,
            dataCompra: dados.data,
            formaPagamentoUtilizada: dados.formaPagamento,
          },
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        };

        novosLancamentos.push(l);
        FirestoreSyncService.salvarLancamento(usuario.uid || MASTER_UID, l);
      }

      const novaLista = [...novosLancamentos, ...lancamentos];
      salvarNoStorage(STORAGE_KEY_LANCAMENTOS, novaLista);
      set({ lancamentos: novaLista, ultimoEventoTimestamp: Date.now() });

      const descMsg = totalParcelas > 1 
        ? `${dados.mercadoNome || 'Supermercado'}: R$ ${dados.valorTotal.toFixed(2)} (${totalParcelas}x no ${dados.cartao || 'Crédito'})`
        : `${dados.mercadoNome || 'Supermercado'}: R$ ${dados.valorTotal.toFixed(2)}`;

      adicionarLogRealtime('[MEU MERCADO] Compra Integrada', descMsg, 'sucesso');
      mostrarToast(`🛒 ${descMsg} lançada no extrato e cartões!`, 'sucesso');
      return { sucesso: true, mensagem: 'Compra integrada com sucesso' };
    },

    adicionarLogRealtime: (acao, detalhes, tipo = 'info') => {
      const novoLog: RealtimeLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: formatarHoraAgora(),
        acao,
        detalhes,
        tipo,
      };
      set((state) => ({
        logsRealtime: [novoLog, ...state.logsRealtime.slice(0, 49)], // Mantém os últimos 50 logs
      }));
    },

    atualizarCartao: (id, dados) => {
      set((state) => {
        const novosCartoes = state.cartoes.map((c) => c.id === id ? { ...c, ...dados } : c);
        salvarNoStorage(STORAGE_KEY_CARTOES, novosCartoes);
        FirestoreSyncService.salvarCartoes(MASTER_UID, novosCartoes);
        return { cartoes: novosCartoes, ultimoEventoTimestamp: Date.now() };
      });
      get().mostrarToast('Cartão atualizado com sucesso!', 'sucesso');
    },

    adicionarCartao: (cartao) => {
      const novo: Cartao = {
        ...cartao,
        id: `cartao-${Date.now()}`,
        userId: 'default-user',
        ativo: true,
      };
      set((state) => {
        const novosCartoes = [...state.cartoes, novo];
        salvarNoStorage(STORAGE_KEY_CARTOES, novosCartoes);
        FirestoreSyncService.salvarCartoes(MASTER_UID, novosCartoes);
        return { cartoes: novosCartoes, ultimoEventoTimestamp: Date.now() };
      });
      get().mostrarToast(`Cartão "${novo.nome}" cadastrado com sucesso!`, 'sucesso');
    },

    excluirCartao: (id) => {
      set((state) => {
        const novosCartoes = state.cartoes.filter((c) => c.id !== id);
        salvarNoStorage(STORAGE_KEY_CARTOES, novosCartoes);
        FirestoreSyncService.salvarCartoes(MASTER_UID, novosCartoes);
        return { cartoes: novosCartoes, ultimoEventoTimestamp: Date.now() };
      });
      get().mostrarToast('Cartão removido.', 'info');
    },

    adicionarCategoria: (cat) => {
      const nova: Categoria = {
        id: `cat-${Date.now()}`,
        userId: 'default-user',
        natureza: cat.natureza,
        nome: cat.nome.trim(),
        tipo: cat.tipo || 'Despesa',
        ativa: true,
      };
      set((state) => {
        const novasCategorias = [...state.categorias, nova];
        salvarNoStorage(STORAGE_KEY_CATEGORIAS, novasCategorias);
        FirestoreSyncService.salvarCategorias(MASTER_UID, novasCategorias).catch(console.warn);
        return { categorias: novasCategorias, ultimoEventoTimestamp: Date.now() };
      });
      get().mostrarToast(`Categoria "${nova.nome}" cadastrada com sucesso!`, 'sucesso');
    },

    excluirCategoria: (id) => {
      set((state) => {
        const novasCategorias = state.categorias.filter((c) => c.id !== id);
        salvarNoStorage(STORAGE_KEY_CATEGORIAS, novasCategorias);
        FirestoreSyncService.salvarCategorias(MASTER_UID, novasCategorias).catch(console.warn);
        return { categorias: novasCategorias, ultimoEventoTimestamp: Date.now() };
      });
      get().mostrarToast('Categoria removida.', 'info');
    },

    adicionarNatureza: (nat) => {
      const emoji = nat.emoji?.trim() || '📁';
      const nome = nat.nome.trim();
      const nova: Natureza = {
        id: `nat-${Date.now()}`,
        nome,
        emoji,
        label: `${emoji} ${nome}`,
      };
      set((state) => {
        const novasNaturezas = [...state.naturezas, nova];
        salvarNoStorage(STORAGE_KEY_NATUREZAS, novasNaturezas);
        FirestoreSyncService.salvarNaturezas(MASTER_UID, novasNaturezas).catch(console.warn);
        return { naturezas: novasNaturezas, ultimoEventoTimestamp: Date.now() };
      });
      get().mostrarToast(`Natureza "${nova.label}" cadastrada com sucesso!`, 'sucesso');
    },

    adicionarLancamento: (input, emitirEvento = true) => {
      // Se não houver descrição, replica automaticamente o nome da categoria
      const descricaoFinal = (input.descricao?.trim() || input.categoria?.trim() || 'Lançamento');
      input = { ...input, descricao: descricaoFinal };

      const totalParcelas = input.parcelas && input.parcelas > 1 ? input.parcelas : 1;
      const compraId = totalParcelas > 1 ? `compra-${Date.now()}` : undefined;
      const novos: Lancamento[] = [];

      const [ano, mes, dia] = input.data.split('-').map(Number);
      const dataBase = new Date(ano, mes - 1, dia);

      // Localizar configuração do cartão se for crédito
      let diaFechamento = 25;
      let diaVencimento = 5;
      if (input.pagamento === '💳 Crédito' && input.cartao) {
        const cartaoConfig = get().cartoes.find((c) => c.nome === input.cartao);
        if (cartaoConfig) {
          diaFechamento = cartaoConfig.diaFechamento || 25;
          diaVencimento = cartaoConfig.diaVencimento || 5;
        }
      }

      // Distribuição precisa em centavos (evita dízima e erros de arredondamento)
      const valorCentavos = Math.round(input.valor * 100);
      const centavosBase = Math.floor(valorCentavos / totalParcelas);
      const restoCentavos = valorCentavos % totalParcelas;

      const diaCompra = dataBase.getDate();
      const comprouAposFechamento = input.pagamento === '💳 Crédito' && diaCompra > diaFechamento;

      for (let i = 1; i <= totalParcelas; i++) {
        // Se a compra foi feita após o fechamento (ex: dia 26 com fechamento dia 25),
        // a primeira parcela entra na fatura do mês seguinte!
        const deslocamentoFatura = comprouAposFechamento ? i : (i - 1);

        const dataFatura = new Date(ano, (mes - 1) + deslocamentoFatura, 1);
        const compMes = String(dataFatura.getMonth() + 1).padStart(2, '0');
        const compAno = dataFatura.getFullYear();
        const faturaCompetencia = `${compMes}/${compAno}`;

        // Data de vencimento da fatura
        const vencimento = input.pagamento === '💳 Crédito'
          ? new Date(compAno, dataFatura.getMonth(), diaVencimento)
          : undefined;

        // Data do registro da parcela (data da compra para a 1ª parcela, e mês subsequente para as próximas)
        const dataParcela = new Date(ano, (mes - 1) + (i - 1), dia);

        // Centavos exatos: distribui o resto nas primeiras parcelas
        const centavosParcela = i <= restoCentavos ? centavosBase + 1 : centavosBase;
        const valorFinal = Number((centavosParcela / 100).toFixed(2));

        novos.push({
          id: `lanc-${Date.now()}-${i}`,
          userId: 'default-user',
          data: dataParcela,
          competencia: input.pagamento === '💳 Crédito' ? faturaCompetencia : `${String(mes).padStart(2, '0')}/${ano}`,
          valor: valorFinal,
          tipo: input.tipo,
          natureza: input.natureza,
          categoria: input.categoria,
          descricao: input.descricao.trim(),
          pagamento: input.pagamento,
          cartao: input.cartao,
          conta: input.conta,
          status: 'Lançado',
          compraId,
          parcela: totalParcelas > 1 ? i : undefined,
          totalParcelas: totalParcelas > 1 ? totalParcelas : undefined,
          vencimento,
          fatura: input.pagamento === '💳 Crédito' ? faturaCompetencia : undefined,
          origem: 'app',
          criadoEm: new Date(),
          atualizadoEm: new Date(),
        });
      }

      const lancamentosAtualizados = [...novos, ...get().lancamentos];
      set({ lancamentos: lancamentosAtualizados, ultimoEventoTimestamp: Date.now() });
      salvarNoStorage(STORAGE_KEY_LANCAMENTOS, lancamentosAtualizados);
      novos.forEach((n) => FirestoreSyncService.salvarLancamento(MASTER_UID, n));

      const msg = totalParcelas > 1 
        ? `Compra parcelada em ${totalParcelas}x adicionada!`
        : `Lançamento "${input.descricao}" adicionado!`;
      
      get().mostrarToast(msg, 'sucesso');
      get().adicionarLogRealtime(
        `[INSERT] ${input.tipo.toUpperCase()}: R$ ${input.valor.toFixed(2)}`,
        `${input.descricao} (${input.pagamento}${input.cartao ? ' - ' + input.cartao : ''})`,
        'sucesso'
      );

      // Transmissão em tempo real para outras abas / instâncias
      if (emitirEvento && realtimeChannel) {
        realtimeChannel.postMessage({
          tipo: 'SYNC_STATE',
          acao: `[REALTIME INSERT] ${input.descricao}`,
          detalhes: `Novo lançamento de R$ ${input.valor.toFixed(2)} sincronizado instantaneamente.`,
          payload: { lancamentos: lancamentosAtualizados }
        });
      }

      return { sucesso: true, mensagem: msg };
    },

    editarLancamento: (id, dados, emitirEvento = true) => {
      const { lancamentos } = get();
      const index = lancamentos.findIndex((l) => l.id === id);
      if (index === -1) {
        return { sucesso: false, mensagem: 'Lançamento não encontrado.' };
      }

      const itemExistente = lancamentos[index];
      const itemAtualizado: Lancamento = {
        ...itemExistente,
        ...dados,
        atualizadoEm: new Date(),
      };

      const novaLista = [...lancamentos];
      novaLista[index] = itemAtualizado;

      set({ lancamentos: novaLista, ultimoEventoTimestamp: Date.now() });
      salvarNoStorage(STORAGE_KEY_LANCAMENTOS, novaLista);
      FirestoreSyncService.salvarLancamento(MASTER_UID, itemAtualizado);
      get().mostrarToast('Lançamento atualizado com sucesso!', 'sucesso');
      get().adicionarLogRealtime(
        `[UPDATE] ${itemAtualizado.descricao}`,
        `Alterado para R$ ${itemAtualizado.valor.toFixed(2)} em tempo real.`,
        'info'
      );

      if (emitirEvento && realtimeChannel) {
        realtimeChannel.postMessage({
          tipo: 'SYNC_STATE',
          acao: `[REALTIME UPDATE] ${itemAtualizado.descricao}`,
          detalhes: `Lançamento atualizado em tempo real.`,
          payload: { lancamentos: novaLista }
        });
      }

      return { sucesso: true, mensagem: 'Atualizado com sucesso.' };
    },

    excluirLancamento: (id, excluirTodasParcelas = false, emitirEvento = true) => {
      const { lancamentos } = get();
      const item = lancamentos.find((l) => l.id === id);
      if (!item) {
        return { sucesso: false, mensagem: 'Lançamento não encontrado.' };
      }

      let novaLista: Lancamento[];
      let detalheLog = '';
      if (excluirTodasParcelas && item.compraId) {
        novaLista = lancamentos.filter((l) => l.compraId !== item.compraId);
        lancamentos
          .filter((l) => l.compraId === item.compraId)
          .forEach((l) => FirestoreSyncService.excluirLancamento(MASTER_UID, l.id));
        detalheLog = `Todas as parcelas da compra "${item.descricao}" foram removidas.`;
        get().mostrarToast('Todas as parcelas da compra foram removidas.', 'info');
      } else {
        novaLista = lancamentos.filter((l) => l.id !== id);
        FirestoreSyncService.excluirLancamento(MASTER_UID, id);
        detalheLog = `Item "${item.descricao}" (R$ ${item.valor.toFixed(2)}) excluído.`;
        get().mostrarToast('Lançamento excluído com sucesso.', 'info');
      }

      set({ lancamentos: novaLista, ultimoEventoTimestamp: Date.now() });
      salvarNoStorage(STORAGE_KEY_LANCAMENTOS, novaLista);
      get().adicionarLogRealtime(`[DELETE] ${item.descricao}`, detalheLog, 'alerta');

      if (emitirEvento && realtimeChannel) {
        realtimeChannel.postMessage({
          tipo: 'SYNC_STATE',
          acao: `[REALTIME DELETE] ${item.descricao}`,
          detalhes: detalheLog,
          payload: { lancamentos: novaLista }
        });
      }

      return { sucesso: true, mensagem: 'Excluído com sucesso.' };
    },

    simularMovimentoRealtime: () => {
      // Dispara uma movimentação dinâmica ao vivo estilo "npm run dev"
      const itensSimulados = [
        { desc: 'Supermercado Pão de Açúcar', valor: 235.80, tipo: 'Despesa' as const, nat: '🛒 Alimentação', cat: 'Supermercado', pag: '💳 Crédito' as const, cartao: 'Banco do Brasil Ourocard' },
        { desc: 'Recebimento Consultoria Express', valor: 1450.00, tipo: 'Receita' as const, nat: '💰 Impostos', cat: 'Salário / Pró-labore', pag: '📱 Pix' as const, conta: 'Conta Corrente Itaú' },
        { desc: 'Posto Petrobras Gasolina Podium', valor: 180.00, tipo: 'Despesa' as const, nat: '🚗 Transporte', cat: 'Combustível', pag: '💳 Crédito' as const, cartao: 'Banco do Brasil Ourocard' },
        { desc: 'Aporte Tesouro IPCA+ 2035', valor: 800.00, tipo: 'Investimento' as const, nat: '📦 Outros', cat: 'Aporte Renda Fixa', pag: '📱 Pix' as const, conta: 'Nubank Reserva' },
      ];

      const escolhido = itensSimulados[Math.floor(Math.random() * itensSimulados.length)];
      const hoje = new Date();
      const dataStr = hoje.toISOString().split('T')[0];

      get().adicionarLancamento({
        data: dataStr,
        tipo: escolhido.tipo,
        valor: escolhido.valor,
        descricao: `${escolhido.desc} (Real Time)`,
        natureza: escolhido.nat,
        categoria: escolhido.cat,
        pagamento: escolhido.pag,
        cartao: escolhido.cartao,
        conta: escolhido.conta,
      });
    },

    obterResumoLivroCaixa: (competencia) => {
      const comp = competencia || get().competenciaAtiva;
      const { lancamentos } = get();

      const doMes = lancamentos.filter((l) => l.competencia === comp && l.status === 'Lançado');

      const totalReceitas = doMes
        .filter((l) => l.tipo === 'Receita')
        .reduce((acc, curr) => acc + curr.valor, 0);

      const totalDespesas = doMes
        .filter((l) => l.tipo === 'Despesa')
        .reduce((acc, curr) => acc + curr.valor, 0);

      const totalInvestimentos = doMes
        .filter((l) => l.tipo === 'Investimento')
        .reduce((acc, curr) => acc + curr.valor, 0);

      const [mesAtualNum, anoAtualNum] = comp.split('/').map(Number);
      const dataLimite = new Date(anoAtualNum, mesAtualNum - 1, 1);

      const anteriores = lancamentos.filter((l) => {
        const d = new Date(l.data);
        return d < dataLimite && l.status === 'Lançado';
      });

      const receitasAnteriores = anteriores
        .filter((l) => l.tipo === 'Receita')
        .reduce((acc, curr) => acc + curr.valor, 0);

      const despesasAnteriores = anteriores
        .filter((l) => l.tipo === 'Despesa')
        .reduce((acc, curr) => acc + curr.valor, 0);

      const saldoAnterior = receitasAnteriores - despesasAnteriores;
      const saldoFinal = saldoAnterior + totalReceitas - totalDespesas;

      return {
        competencia: comp,
        saldoAnterior,
        totalReceitas,
        totalDespesas,
        totalInvestimentos,
        saldoFinal,
      };
    },

    obterResumoCartoes: () => {
      const { cartoes, lancamentos, competenciaAtiva } = get();

      return cartoes.map((cartao) => {
        const lancamentosCartao = lancamentos.filter(
          (l) => l.pagamento === '💳 Crédito' && l.cartao === cartao.nome && l.status === 'Lançado'
        );

        const faturaMes = lancamentosCartao
          .filter((l) => l.competencia === competenciaAtiva)
          .reduce((acc, curr) => acc + curr.valor, 0);

        const totalComprometido = lancamentosCartao.reduce((acc, curr) => acc + curr.valor, 0);
        const limiteDisponivel = Math.max(0, cartao.limite - totalComprometido);
        const percentualUsado = Math.min(100, Math.round((totalComprometido / cartao.limite) * 100));

        // Identificar os parcelamentos ativos incidentes na competência ativa selecionada
        const parcelamentosMap = new Map<string, any>();

        // Agrupar todos os lançamentos parcelados deste cartão por compraId
        const comprasAgrupadas = new Map<string, Lancamento[]>();
        lancamentosCartao
          .filter((l) => l.compraId && l.parcela)
          .forEach((l) => {
            const lista = comprasAgrupadas.get(l.compraId!) || [];
            lista.push(l);
            comprasAgrupadas.set(l.compraId!, lista);
          });

        comprasAgrupadas.forEach((parcelasDaCompra, compraId) => {
          // Ordenar parcelas numericamente (1, 2, 3...)
          parcelasDaCompra.sort((a, b) => (a.parcela || 1) - (b.parcela || 1));
          
          // 1. Procurar a parcela correspondente à competência ativa selecionada no cabeçalho
          const parcelaNaCompetencia = parcelasDaCompra.find((l) => l.competencia === competenciaAtiva);
          
          if (parcelaNaCompetencia) {
            // Existe parcela incidindo na fatura deste mês específico (ex: 1/2 no mês 10, 2/2 no mês 11)
            parcelamentosMap.set(compraId, {
              descricao: parcelaNaCompetencia.descricao,
              valorTotal: (parcelaNaCompetencia.valor || 0) * (parcelaNaCompetencia.totalParcelas || 1),
              valorParcela: parcelaNaCompetencia.valor,
              parcelaAtual: parcelaNaCompetencia.parcela,
              totalParcelas: parcelaNaCompetencia.totalParcelas || 1,
              compraId,
              competencia: parcelaNaCompetencia.competencia,
            });
          } else {
            // Se a competência selecionada for antes do fim das parcelas, calcular a parcela vigente
            const primeiraParcela = parcelasDaCompra[0];
            const ultimaParcela = parcelasDaCompra[parcelasDaCompra.length - 1];

            const [mesAtivo, anoAtivo] = competenciaAtiva.split('/').map(Number);
            const valAtivo = anoAtivo * 12 + mesAtivo;

            const [mesPrim, anoPrim] = primeiraParcela.competencia.split('/').map(Number);
            const valPrim = anoPrim * 12 + mesPrim;

            const [mesUlt, anoUlt] = ultimaParcela.competencia.split('/').map(Number);
            const valUlt = anoUlt * 12 + mesUlt;

            if (valAtivo < valPrim) {
              parcelamentosMap.set(compraId, {
                descricao: primeiraParcela.descricao,
                valorTotal: (primeiraParcela.valor || 0) * (primeiraParcela.totalParcelas || 1),
                valorParcela: primeiraParcela.valor,
                parcelaAtual: 1,
                totalParcelas: primeiraParcela.totalParcelas || 1,
                compraId,
                competencia: primeiraParcela.competencia,
              });
            } else if (valAtivo <= valUlt) {
              const parcelaVigente = parcelasDaCompra.find((l) => {
                const [m, a] = l.competencia.split('/').map(Number);
                return (a * 12 + m) >= valAtivo;
              }) || primeiraParcela;

              parcelamentosMap.set(compraId, {
                descricao: parcelaVigente.descricao,
                valorTotal: (parcelaVigente.valor || 0) * (parcelaVigente.totalParcelas || 1),
                valorParcela: parcelaVigente.valor,
                parcelaAtual: parcelaVigente.parcela,
                totalParcelas: parcelaVigente.totalParcelas || 1,
                compraId,
                competencia: parcelaVigente.competencia,
              });
            }
          }
        });

        return {
          cartao,
          faturaAtual: competenciaAtiva,
          valorFatura: faturaMes,
          limiteDisponivel,
          percentualUsado,
          parcelamentos: Array.from(parcelamentosMap.values()),
        };
      });
    },

    obterLancamentosFiltrados: () => {
      const { lancamentos, competenciaAtiva, termoBusca, filtroTipo, filtroNatureza } = get();

      return lancamentos.filter((item) => {
        const matchComp = item.competencia === competenciaAtiva;
        const matchTipo = filtroTipo === 'Todos' || item.tipo === filtroTipo;
        const matchNat = filtroNatureza === 'Todas' || item.natureza === filtroNatureza;
        const matchBusca =
          !termoBusca ||
          item.descricao.toLowerCase().includes(termoBusca.toLowerCase()) ||
          item.categoria.toLowerCase().includes(termoBusca.toLowerCase()) ||
          item.natureza.toLowerCase().includes(termoBusca.toLowerCase()) ||
          (item.cartao && item.cartao.toLowerCase().includes(termoBusca.toLowerCase())) ||
          (item.conta && item.conta.toLowerCase().includes(termoBusca.toLowerCase()));

        return matchComp && matchTipo && matchNat && matchBusca;
      });
    },

    // ==========================================
    // 🔁 GESTÃO DE DESPESAS FIXAS E RECORRENTES
    // ==========================================
    adicionarRecorrente: (dados) => {
      const nova: DespesaRecorrente = {
        ...dados,
        id: `rec-${Date.now()}`,
      };
      set((state) => {
        const lista = [...state.despesasRecorrentes, nova];
        salvarNoStorage(STORAGE_KEY_RECORRENTES, lista);
        return { despesasRecorrentes: lista };
      });
      get().mostrarToast(`Despesa recorrente "${nova.descricao}" cadastrada!`, 'sucesso');
    },

    atualizarRecorrente: (id, dados) => {
      set((state) => {
        const lista = state.despesasRecorrentes.map((r) => (r.id === id ? { ...r, ...dados } : r));
        salvarNoStorage(STORAGE_KEY_RECORRENTES, lista);
        return { despesasRecorrentes: lista };
      });
      get().mostrarToast('Despesa recorrente atualizada com sucesso!', 'sucesso');
    },

    excluirRecorrente: (id) => {
      set((state) => {
        const lista = state.despesasRecorrentes.filter((r) => r.id !== id);
        salvarNoStorage(STORAGE_KEY_RECORRENTES, lista);
        return { despesasRecorrentes: lista };
      });
      get().mostrarToast('Despesa recorrente removida.', 'info');
    },

    verificarStatusRecorrenteNoMes: (recorrente, competencia) => {
      const comp = competencia || get().competenciaAtiva;
      const descBusca = recorrente.descricao.toLowerCase().trim();
      return get().lancamentos.some(
        (l) => l.competencia === comp &&
               l.status === 'Lançado' &&
               (l.descricao.toLowerCase().includes(descBusca) ||
                (l.categoria === recorrente.categoria && Math.abs(l.valor - recorrente.valor) < 0.05))
      );
    },

    lancarRecorrenteNoMes: (recorrenteId, competencia) => {
      const comp = competencia || get().competenciaAtiva;
      const rec = get().despesasRecorrentes.find((r) => r.id === recorrenteId);
      if (!rec) return { sucesso: false, mensagem: 'Despesa recorrente não encontrada.' };

      // Se já foi lançada neste mês, alertar
      if (get().verificarStatusRecorrenteNoMes(rec, comp)) {
        get().mostrarToast(`"${rec.descricao}" já consta como lançada em ${comp}!`, 'info');
        return { sucesso: false, mensagem: 'Já lançada neste mês.' };
      }

      // Montar data YYYY-MM-DD baseada na competência e dia de vencimento
      const [mesStr, anoStr] = comp.split('/');
      const diaStr = String(Math.min(28, rec.diaVencimento || 10)).padStart(2, '0');
      const dataFormatada = `${anoStr}-${mesStr.padStart(2, '0')}-${diaStr}`;

      const res = get().adicionarLancamento({
        data: dataFormatada,
        tipo: 'Despesa',
        valor: rec.valor,
        descricao: rec.descricao,
        natureza: rec.natureza,
        categoria: rec.categoria,
        pagamento: rec.pagamento,
        cartao: rec.cartao,
        conta: rec.conta,
      });

      if (res.sucesso) {
        get().mostrarToast(`✓ "${rec.descricao}" lançada na competência ${comp}!`, 'sucesso');
      }
      return res;
    },

    // ==========================================
    // 🔒 SEGURANÇA, PIN E PROTEÇÃO BIOMÉTRICA
    // ==========================================
    configurarSeguranca: (dados) => {
      set((state) => {
        const nova = {
          ...state.seguranca,
          ...dados,
          pin: dados.pin !== undefined ? dados.pin : state.seguranca.pin,
          estaBloqueado: dados.bloqueioAtivo && Boolean(dados.pin || state.seguranca.pin),
        };
        salvarNoStorage(STORAGE_KEY_SEGURANCA, {
          bloqueioAtivo: nova.bloqueioAtivo,
          pin: nova.pin,
          biometriaAtiva: nova.biometriaAtiva,
        });
        return { seguranca: nova };
      });
      get().mostrarToast(
        dados.bloqueioAtivo ? 'Proteção por PIN/Biometria ATIVADA!' : 'Bloqueio de segurança desativado.',
        'sucesso'
      );
    },

    desbloquearComPin: (pinDigitado) => {
      const { seguranca } = get();
      if (!seguranca.bloqueioAtivo) {
        set({ seguranca: { ...seguranca, estaBloqueado: false } });
        return true;
      }
      if (pinDigitado === seguranca.pin) {
        set({ seguranca: { ...seguranca, estaBloqueado: false } });
        get().mostrarToast('Acesso desbloqueado com sucesso!', 'sucesso');
        return true;
      }
      get().mostrarToast('PIN incorreto. Tente novamente.', 'erro');
      return false;
    },

    desbloquearComBiometria: () => {
      const { seguranca } = get();
      if (!seguranca.bloqueioAtivo || !seguranca.biometriaAtiva) return false;
      set({ seguranca: { ...seguranca, estaBloqueado: false } });
      get().mostrarToast('Identificação biométrica confirmada!', 'sucesso');
      return true;
    },

    bloquearApp: () => {
      const { seguranca } = get();
      if (seguranca.bloqueioAtivo && seguranca.pin) {
        set({ seguranca: { ...seguranca, estaBloqueado: true } });
      }
    },

    // ==========================================
    // 💾 BACKUP EM NUVEM E SINCRONIZAÇÃO JSON
    // ==========================================
    exportarBackupCompleto: () => {
      const estado = get();
      const backupObj = {
        app: 'Meu Financeiro PRO',
        versao: '2.0.0',
        geradoEm: new Date().toISOString(),
        usuario: estado.usuario,
        lancamentos: estado.lancamentos,
        cartoes: estado.cartoes,
        categorias: estado.categorias,
        naturezas: estado.naturezas,
        despesasRecorrentes: estado.despesasRecorrentes,
        seguranca: {
          bloqueioAtivo: estado.seguranca.bloqueioAtivo,
          pin: estado.seguranca.pin,
          biometriaAtiva: estado.seguranca.biometriaAtiva,
        },
      };

      const jsonStr = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dataHoje = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Meu_Financeiro_Backup_${dataHoje}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      get().mostrarToast('Backup exportado com sucesso! Salve o arquivo com segurança.', 'sucesso');
    },

    restaurarBackup: (conteudoJson) => {
      try {
        const dados = JSON.parse(conteudoJson);
        if (!dados.lancamentos || !dados.cartoes) {
          get().mostrarToast('Arquivo de backup inválido ou incompatível.', 'erro');
          return { sucesso: false, mensagem: 'Estrutura JSON inválida.' };
        }

        const novosLanc = dados.lancamentos || [];
        const novosCart = dados.cartoes || [];
        const novasCat = dados.categorias || [];
        const novasNat = dados.naturezas || [];
        const novasRec = dados.despesasRecorrentes || [];
        const novoUser = dados.usuario || USUARIO_PADRAO;
        const novaSeg = dados.seguranca || { bloqueioAtivo: false, pin: '', biometriaAtiva: false };

        salvarNoStorage(STORAGE_KEY_LANCAMENTOS, novosLanc);
        salvarNoStorage(STORAGE_KEY_CARTOES, novosCart);
        salvarNoStorage(STORAGE_KEY_CATEGORIAS, novasCat);
        salvarNoStorage(STORAGE_KEY_NATUREZAS, novasNat);
        salvarNoStorage(STORAGE_KEY_RECORRENTES, novasRec);
        salvarNoStorage(STORAGE_KEY_USUARIO, novoUser);
        salvarNoStorage(STORAGE_KEY_SEGURANCA, novaSeg);

        set({
          lancamentos: novosLanc,
          cartoes: novosCart,
          categorias: novasCat,
          naturezas: novasNat,
          despesasRecorrentes: novasRec,
          usuario: novoUser,
          seguranca: { ...novaSeg, estaBloqueado: false },
          ultimoEventoTimestamp: Date.now(),
        });

        get().mostrarToast(`Base de dados restaurada com sucesso! (${novosLanc.length} lançamentos)`, 'sucesso');
        return { sucesso: true, mensagem: 'Base restaurada com sucesso.' };
      } catch (err) {
        console.error('Erro ao restaurar backup:', err);
        get().mostrarToast('Erro ao ler arquivo JSON de backup.', 'erro');
        return { sucesso: false, mensagem: 'Erro ao processar JSON.' };
      }
    },

    importarLancamentosEmLote: (transacoes) => {
      const selecionadas = transacoes.filter((t) => t.selecionada);
      if (selecionadas.length === 0) {
        get().mostrarToast('Nenhuma transação selecionada para importação.', 'info');
        return { sucesso: false, count: 0 };
      }

      let count = 0;
      selecionadas.forEach((t) => {
        const res = get().adicionarLancamento(
          {
            data: t.data,
            tipo: t.tipo,
            valor: t.valor,
            descricao: t.descricao,
            natureza: t.natureza,
            categoria: t.categoria,
            pagamento: t.pagamento,
          },
          false // Não emitir evento por cada item individual para performance
        );
        if (res.sucesso) count++;
      });

      // Emitir um único log e salvar
      get().adicionarLogRealtime(
        `[IMPORTAÇÃO] ${count} Movimentações Importadas`,
        'Extrato bancário OFX/CSV conciliado e importado com sucesso.',
        'sucesso'
      );
      get().mostrarToast(`✓ ${count} movimentações importadas para o extrato!`, 'sucesso');

      return { sucesso: true, count };
    },

    // Sincronização em Nuvem (Cloud Firestore)
    sincronizandoNuvem: false,

    sincronizarComNuvem: async () => {
      set({ sincronizandoNuvem: true });
      const { lancamentos, cartoes, usuario, categorias, naturezas } = get();
      try {
        const res = await FirestoreSyncService.sincronizarTudo(MASTER_UID, {
          lancamentos,
          cartoes,
          usuario,
          categorias,
          naturezas
        });

        salvarNoStorage(STORAGE_KEY_LANCAMENTOS, res.lancamentosSincronizados);
        salvarNoStorage(STORAGE_KEY_CARTOES, res.cartoesSincronizados);
        if (res.usuarioSincronizado) {
          salvarNoStorage(STORAGE_KEY_USUARIO, res.usuarioSincronizado);
        }
        if (res.categoriasSincronizados && res.categoriasSincronizados.length > 0) {
          salvarNoStorage(STORAGE_KEY_CATEGORIAS, res.categoriasSincronizados);
        }
        if (res.naturezasSincronizados && res.naturezasSincronizados.length > 0) {
          salvarNoStorage(STORAGE_KEY_NATUREZAS, res.naturezasSincronizados);
        }

        set({
          lancamentos: res.lancamentosSincronizados,
          cartoes: res.cartoesSincronizados,
          usuario: res.usuarioSincronizado || usuario,
          categorias: res.categoriasSincronizados || categorias,
          naturezas: res.naturezasSincronizados || naturezas,
          sincronizandoNuvem: false,
          ultimoEventoTimestamp: Date.now()
        });

        const msg = res.novosImportados > 0 || res.novosEnviados > 0
          ? `Nuvem sincronizada! (${res.novosImportados} recebidos, ${res.novosEnviados} enviados)`
          : `Nuvem 100% atualizada! (${res.lancamentosSincronizados.length} lançamentos)`;

        get().mostrarToast(msg, 'sucesso');
        return { sucesso: true, mensagem: msg };
      } catch (err: any) {
        console.error('Erro na sincronização Firestore:', err);
        set({ sincronizandoNuvem: false });
        get().mostrarToast(`Erro ao conectar com a nuvem: ${err?.message || 'Falha de comunicação'}`, 'erro');
        return { sucesso: false, mensagem: err?.message || 'Erro' };
      }
    },

    enviarTudoParaNuvem: async () => {
      set({ sincronizandoNuvem: true });
      const { lancamentos, cartoes, usuario } = get();
      try {
        await FirestoreSyncService.enviarTodosLancamentos(MASTER_UID, lancamentos);
        await FirestoreSyncService.salvarCartoes(MASTER_UID, cartoes);
        await FirestoreSyncService.salvarPerfil(MASTER_UID, usuario);
        set({ sincronizandoNuvem: false });
        get().mostrarToast(`✓ ${lancamentos.length} lançamentos enviados para a nuvem!`, 'sucesso');
      } catch (err) {
        set({ sincronizandoNuvem: false });
        get().mostrarToast('Erro ao enviar dados para a nuvem.', 'erro');
      }
    },

    baixarTudoDaNuvem: async () => {
      set({ sincronizandoNuvem: true });
      try {
        const lancamentosNuvem = await FirestoreSyncService.baixarTodosLancamentos(MASTER_UID);
        const cartoesNuvem = await FirestoreSyncService.baixarCartoes(MASTER_UID);
        const perfilNuvem = await FirestoreSyncService.baixarPerfil(MASTER_UID);

        if (lancamentosNuvem.length > 0) {
          salvarNoStorage(STORAGE_KEY_LANCAMENTOS, lancamentosNuvem);
          set({ lancamentos: lancamentosNuvem });
        }
        if (cartoesNuvem.length > 0) {
          salvarNoStorage(STORAGE_KEY_CARTOES, cartoesNuvem);
          set({ cartoes: cartoesNuvem });
        }
        if (perfilNuvem) {
          salvarNoStorage(STORAGE_KEY_USUARIO, perfilNuvem);
          set({ usuario: perfilNuvem });
        }
        set({ sincronizandoNuvem: false, ultimoEventoTimestamp: Date.now() });
        get().mostrarToast(`✓ ${lancamentosNuvem.length} lançamentos baixados da nuvem!`, 'sucesso');
      } catch (err) {
        set({ sincronizandoNuvem: false });
        get().mostrarToast('Erro ao baixar dados da nuvem.', 'erro');
      }
    },
  };
});
