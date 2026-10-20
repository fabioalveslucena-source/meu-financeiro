import React, { useState } from 'react';
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
import { useFinanceStore } from '../../stores/financeStore';
import type { VozInterpretada } from '../../features/voice/voiceInterpreter';

export const AppShell: React.FC = () => {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoAtiva>('inicio');
  const [modalVozAberto, setModalVozAberto] = useState(false);
  const [dadosVozPreenchimento, setDadosVozPreenchimento] = useState<VozInterpretada | null>(null);

  const { toast, limparToast } = useFinanceStore();

  const handleConfirmarVoz = (dados: VozInterpretada) => {
    setDadosVozPreenchimento(dados);
    setSecaoAtiva('lancar');
  };

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
              onIrParaLancar={() => setSecaoAtiva('lancar')}
              onAbrirVoz={() => setModalVozAberto(true)}
              onIrParaGerenciar={() => setSecaoAtiva('extrato')}
              onIrParaCartoes={() => setSecaoAtiva('cartoes')}
            />
          )}

          {secaoAtiva === 'lancar' && (
            <FormLancamento 
              onAbrirVoz={() => setModalVozAberto(true)} 
              dadosPreenchidosVoz={dadosVozPreenchimento}
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
