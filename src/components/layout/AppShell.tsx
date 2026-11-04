import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import type { SecaoAtiva } from './Sidebar';
import { InicioView } from '../inicio/InicioView';
import { FormLancamento } from '../lancamento/FormLancamento';
import { ExtratoView } from '../extrato/ExtratoView';
import { CartoesView } from '../cartoes/CartoesView';
import { AnalisesView } from '../analises/AnalisesView';
import { VoiceModal } from '../voz/VoiceModal';
import { PinLockScreen } from '../seguranca/PinLockScreen';
import { MinimalistLoginScreen } from '../seguranca/MinimalistLoginScreen';
import { SyncProgressOverlay } from '../comum/SyncProgressOverlay';
import { OnboardingModal } from '../comum/OnboardingModal';
import { ConfiguracoesBaseModal } from '../configuracoes/ConfiguracoesBaseModal';
import { useFinanceStore, isUsuarioAdmin } from '../../stores/financeStore';
import { FirestoreSyncService, MASTER_UID } from '../../services/firestoreSync';
import type { VozInterpretada } from '../../features/voice/voiceInterpreter';
import type { TipoLancamento } from '../../types';
import { observarEstadoAuth } from '../../features/auth/googleAuth';

export const AppShell: React.FC = () => {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoAtiva>('inicio');
  const [modalVozAberto, setModalVozAberto] = useState(false);
  const [dadosVozPreenchimento, setDadosVozPreenchimento] = useState<VozInterpretada | null>(null);
  const [tipoLancamentoInicial, setTipoLancamentoInicial] = useState<TipoLancamento | undefined>(undefined);
  const [modalOnboardingAberto, setModalOnboardingAberto] = useState(false);
  const [modalConfigCartaoAberto, setModalConfigCartaoAberto] = useState(false);
  const [abaModalConfig, setAbaModalConfig] = useState<'cartoes' | 'banco'>('cartoes');
  const [continuarOffline, setContinuarOffline] = useState(false);

  const { 
    toast, 
    limparToast, 
    sincronizarComNuvem, 
    usuario, 
    autenticarUsuario,
    carregarUsuariosAutorizados,
    cartoes
  } = useFinanceStore();

  // Verifica se o usuário precisa de Onboarding (quando está logado e não tem cartões)
  useEffect(() => {
    if (usuario.uid && usuario.nome !== 'Novo Usuário' && cartoes.length === 0) {
      setModalOnboardingAberto(true);
    }
  }, [usuario.uid, usuario.nome, cartoes.length]);

  // Carrega a lista de usuários autorizados (whitelist) apenas se for administrador
  useEffect(() => {
    if (isUsuarioAdmin(usuario.email, usuario.uid, usuario.nome)) {
      carregarUsuariosAutorizados();
    }
  }, [usuario.email, usuario.uid, usuario.nome, carregarUsuariosAutorizados]);

  // Escuta autenticação Google e sincroniza a partição do usuário
  useEffect(() => {
    const unsubAuth = observarEstadoAuth(async (perfilGoogle) => {
      if (perfilGoogle && perfilGoogle.uid !== usuario.uid) {
        await autenticarUsuario(perfilGoogle);
      }
    });

    return () => unsubAuth();
  }, [usuario.uid, autenticarUsuario]);

  useEffect(() => {
    const uid = usuario.uid || (usuario.nome === 'Novo Usuário' ? '' : MASTER_UID);
    if (!uid) return;

    // Sincroniza dados com a nuvem Firestore automaticamente para o usuário ativo
    sincronizarComNuvem();

    // Ativa a escuta contínua em tempo real para este UID
    FirestoreSyncService.iniciarEscutaTempoReal(uid, (lancamentosNuvem) => {
      useFinanceStore.setState((state) => {
        const idsLocais = new Set(state.lancamentos.map((l) => l.id));
        const mapLocal = new Map(state.lancamentos.map((l) => [l.id, l]));

        const mudou = lancamentosNuvem.length !== state.lancamentos.length ||
                      lancamentosNuvem.some((n) => {
                        const local = mapLocal.get(n.id);
                        if (!local) return true;
                        return local.valor !== n.valor ||
                               local.status !== n.status ||
                               local.competencia !== n.competencia ||
                               local.descricao !== n.descricao;
                      });

        if (mudou) {
          const novosMercado = lancamentosNuvem.filter(
            (n) => (n.origem === 'meu-mercado' || n.detalhesMercado) && !idsLocais.has(n.id)
          );
          if (novosMercado.length > 0 && isUsuarioAdmin(usuario.email, usuario.uid, usuario.nome)) {
            useFinanceStore.getState().mostrarToast(
              `🛒 ${novosMercado.length} compra(s) do Meu Mercado recebida(s) em tempo real!`,
              'sucesso'
            );
          }

          return { lancamentos: lancamentosNuvem, ultimoEventoTimestamp: Date.now() };
        }
        return {};
      });
    });

    return () => {
      FirestoreSyncService.pararSincronizacao();
    };
  }, [usuario.uid, sincronizarComNuvem]);

  const handleConfirmarVoz = (dados: VozInterpretada) => {
    setDadosVozPreenchimento(dados);
    setSecaoAtiva('lancar');
  };

  // Se não estiver logado com Google e não tiver optado por testar offline, exibe tela de login minimalista
  if ((!usuario.uid || usuario.nome === 'Novo Usuário') && !continuarOffline) {
    return (
      <>
        <MinimalistLoginScreen onContinuarOffline={() => setContinuarOffline(true)} />
        <SyncProgressOverlay />
      </>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transition: 'background-color 0.25s ease, color 0.25s ease'
    }}>
      {/* Overlay de Progresso de Sincronização em Tempo Real */}
      <SyncProgressOverlay />

      {/* Toast Notificação */}
      {toast && (
        <div 
          className={`toast ${
            toast.tipo === 'sucesso' ? 'toast-success' : 
            toast.tipo === 'erro' ? 'toast-error' : 'toast-info'
          }`}
          onClick={limparToast}
          style={{ cursor: 'pointer', zIndex: 9999 }}
        >
          <span>{toast.tipo === 'sucesso' ? '✅' : toast.tipo === 'erro' ? '❌' : 'ℹ️'}</span>
          <span>{toast.mensagem}</span>
        </div>
      )}

      {/* Container Centralizado com a Largura e Estilo do App */}
      <div style={{
        width: '100%',
        maxWidth: '680px',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.25s ease'
      }}>
        {/* Cabeçalho Original com Perfil do Titular e Navegação Superior */}
        <Header 
          secaoAtiva={secaoAtiva} 
          onSelecionarSecao={setSecaoAtiva} 
        />

        {/* Conteúdo da Seção Ativa */}
        <main style={{
          flex: 1,
          padding: '0 12px 85px 12px',
          width: '100%'
        }}>
          {secaoAtiva === 'inicio' && (
            <InicioView 
              onIrParaLancar={(tipo) => {
                setTipoLancamentoInicial(tipo);
                setSecaoAtiva('lancar');
              }}
              onAbrirVoz={() => setModalVozAberto(true)}
              onIrParaGerenciar={() => setSecaoAtiva('extrato')}
              onIrParaCartoes={() => setSecaoAtiva('cartoes')}
              onCadastrarCartao={() => setModalConfigCartaoAberto(true)}
            />
          )}

          {secaoAtiva === 'lancar' && (
            <FormLancamento 
              onAbrirVoz={() => setModalVozAberto(true)} 
              dadosPreenchidosVoz={dadosVozPreenchimento}
              tipoInicial={tipoLancamentoInicial}
            />
          )}

          {secaoAtiva === 'extrato' && <ExtratoView />}

          {secaoAtiva === 'livro-caixa' && <ExtratoView subAbaInicial="livro-caixa" />}

          {secaoAtiva === 'gerenciamento' && <ExtratoView subAbaInicial="gerenciar" />}

          {secaoAtiva === 'cartoes' && <CartoesView />}

          {secaoAtiva === 'analises' && <AnalisesView />}
        </main>

        {/* Barra de Navegação Congelada no Rodapé */}
        <BottomNav 
          secaoAtiva={secaoAtiva} 
          onSelecionarSecao={setSecaoAtiva} 
        />
      </div>

      {/* Modal de Onboarding para Usuário Sem Cartão */}
      <OnboardingModal
        aberto={modalOnboardingAberto}
        onFechar={() => setModalOnboardingAberto(false)}
        onCadastrarCartao={() => {
          setAbaModalConfig('banco');
          setModalConfigCartaoAberto(true);
        }}
      />

      {/* Modal de Configuração de Cartão Direto */}
      <ConfiguracoesBaseModal
        aberto={modalConfigCartaoAberto}
        onFechar={() => setModalConfigCartaoAberto(false)}
        abaInicial={abaModalConfig}
      />

      {/* Modal de Voz Flutuante */}
      <VoiceModal
        aberto={modalVozAberto}
        onFechar={() => setModalVozAberto(false)}
        onConfirmarDados={handleConfirmarVoz}
      />

      {/* Tela de Bloqueio por PIN / Biometria */}
      <PinLockScreen />
    </div>
  );
};
