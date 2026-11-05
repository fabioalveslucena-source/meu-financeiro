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

  // Verifica se o usuário precisa de Onboarding (apenas uma vez na vida, nunca mais reabre se já cadastrou ou dispensou)
  useEffect(() => {
    const uid = usuario.uid || 'anonimo';
    const chaveConcluido = `mf_onboarding_concluido_${uid}`;
    const jaConcluiu = localStorage.getItem(chaveConcluido) === 'true';

    // Se já concluiu anteriormente ou já possui cartões cadastrados, nunca mais exibe
    if (jaConcluiu || cartoes.length > 0) {
      setModalOnboardingAberto(false);
      return;
    }

    if (usuario.uid && usuario.nome !== 'Novo Usuário') {
      setModalOnboardingAberto(true);
    }
  }, [usuario.uid, usuario.nome, cartoes.length]);

  const fecharOnboardingDefinitivo = () => {
    const uid = usuario.uid || 'anonimo';
    localStorage.setItem(`mf_onboarding_concluido_${uid}`, 'true');
    setModalOnboardingAberto(false);
  };

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

      {/* Pop-up de Notificação e Finalização Centralizado */}
      {toast && (
        <div 
          onClick={limparToast}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 13, 24, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '380px',
              width: '100%',
              backgroundColor: '#0F2744',
              border: `1.5px solid ${toast.tipo === 'sucesso' ? '#4CAF50' : toast.tipo === 'erro' ? '#F44336' : '#287EA5'}`,
              borderRadius: '20px',
              padding: '22px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(40, 126, 165, 0.25)',
              cursor: 'default'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: toast.tipo === 'sucesso' ? 'rgba(76, 175, 80, 0.18)' : toast.tipo === 'erro' ? 'rgba(244, 67, 54, 0.18)' : 'rgba(40, 126, 165, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {toast.tipo === 'sucesso' ? '✅' : toast.tipo === 'erro' ? '❌' : 'ℹ️'}
            </div>

            <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF', lineHeight: 1.45 }}>
              {toast.mensagem}
            </div>

            <button
              type="button"
              onClick={limparToast}
              style={{
                marginTop: '4px',
                padding: '8px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: toast.tipo === 'sucesso' ? '#2E8B57' : '#1E3A5F',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              OK
            </button>
          </div>
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
              onLimparDadosVoz={() => setDadosVozPreenchimento(null)}
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
        onFechar={fecharOnboardingDefinitivo}
        onCadastrarCartao={() => {
          fecharOnboardingDefinitivo();
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
