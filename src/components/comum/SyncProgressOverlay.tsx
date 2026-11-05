import React, { useState, useEffect } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

interface SyncProgressOverlayProps {
  forcarExibicao?: boolean;
  onConcluido?: () => void;
}

export const SyncProgressOverlay: React.FC<SyncProgressOverlayProps> = ({ 
  forcarExibicao = false,
  onConcluido 
}) => {
  const { sincronizandoNuvem, usuario } = useFinanceStore();
  const [visivel, setVisivel] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [statusTexto, setStatusTexto] = useState('Iniciando sincronização...');

  const deveExibir = sincronizandoNuvem || forcarExibicao;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (deveExibir) {
      setVisivel(true);
      setProgresso(5);
      setStatusTexto(`Conectando com segurança: ${usuario.nome || 'Usuário'}...`);

      const startTime = Date.now();
      const duracaoTotal = 1800; // 1.8s de animação suave

      interval = setInterval(() => {
        const decorrido = Date.now() - startTime;
        const percentual = Math.min(Math.round((decorrido / duracaoTotal) * 100), 98);
        setProgresso(percentual);

        if (percentual < 30) {
          setStatusTexto(`Conectando com segurança: ${usuario.nome || 'Usuário'}...`);
        } else if (percentual < 60) {
          setStatusTexto('Sincronizando contas e cartões de crédito...');
        } else if (percentual < 85) {
          setStatusTexto('Processando lançamentos e faturas do mês...');
        } else {
          setStatusTexto('Consolidando saldos e preparando interface...');
        }
      }, 50);
    } else if (visivel) {
      // Quando termina a sincronização real, exibe o selo 100% e fecha suavemente
      setProgresso(100);
      setStatusTexto('100% Atualizado • Base Sincronizada ✨');
      const timer = setTimeout(() => {
        setVisivel(false);
        setProgresso(0);
        onConcluido?.();
      }, 700);
      return () => clearTimeout(timer);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deveExibir, usuario.nome, onConcluido, visivel]);

  if (!visivel) return null;

  const raio = 38;
  const circunferencia = 2 * Math.PI * raio;
  const strokeDashoffset = circunferencia - (progresso / 100) * circunferencia;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(11, 25, 41, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '380px',
        width: '100%',
        backgroundColor: '#0F2744',
        border: '1.5px solid rgba(80, 144, 211, 0.45)',
        borderRadius: '24px',
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 16px 45px rgba(0, 0, 0, 0.65), 0 0 25px rgba(40, 126, 165, 0.25)',
        animation: 'fadeIn 0.25s ease'
      }}>
        {/* Círculo com Barra de Progresso SVG Circular */}
        <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '18px' }}>
          <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
            {/* Círculo de fundo */}
            <circle
              cx="50"
              cy="50"
              r={raio}
              stroke="rgba(80, 144, 211, 0.18)"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Círculo animado com progresso */}
            <circle
              cx="50"
              cy="50"
              r={raio}
              stroke={progresso === 100 ? '#4CAF50' : '#F8D117'}
              strokeWidth="7"
              strokeDasharray={circunferencia}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.15s ease, stroke 0.3s ease' }}
            />
          </svg>

          {/* Ícone ou porcentagem no centro do círculo */}
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {progresso === 100 ? (
              <CheckCircle2 size={36} color="#4CAF50" />
            ) : (
              <span style={{
                fontSize: '20px',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '-0.5px'
              }}>
                {progresso}%
              </span>
            )}
          </div>
        </div>

        {/* Título de Sincronização */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={18} color="#5090D3" />
          <h4 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 800,
            color: '#FFFFFF'
          }}>
            {progresso === 100 ? 'Sincronizado!' : 'Processando Dados'}
          </h4>
        </div>

        {/* Mensagem descritiva de status */}
        <p style={{
          margin: '0 0 16px 0',
          fontSize: '12.5px',
          color: '#AAB4BE',
          lineHeight: 1.4,
          minHeight: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {statusTexto}
        </p>

        {/* Barra de Progresso Linear Complementar */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '999px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div style={{
            width: `${progresso}%`,
            height: '100%',
            background: progresso === 100 
              ? 'linear-gradient(90deg, #4CAF50 0%, #81C784 100%)' 
              : 'linear-gradient(90deg, #287EA5 0%, #F8D117 100%)',
            borderRadius: '999px',
            transition: 'width 0.15s ease'
          }} />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: '12px',
          fontSize: '11px',
          color: '#607789'
        }}>
          <RefreshCw size={12} className={progresso < 100 ? 'anim-spin' : ''} />
          <span>Sincronização em nuvem criptografada</span>
        </div>
      </div>
    </div>
  );
};
