import React, { useState } from 'react';
import { fazerLoginGoogle } from '../../features/auth/googleAuth';
import { useFinanceStore } from '../../stores/financeStore';
import { ShieldCheck, ArrowRight } from 'lucide-react';

interface MinimalistLoginScreenProps {
  onContinuarOffline?: () => void;
}

export const MinimalistLoginScreen: React.FC<MinimalistLoginScreenProps> = ({
  onContinuarOffline
}) => {
  const { autenticarUsuario } = useFinanceStore();
  const [carregando, setCarregando] = useState(false);
  const [erroLogin, setErroLogin] = useState<string | null>(null);

  const handleLogin = async () => {
    setCarregando(true);
    setErroLogin(null);
    try {
      const res = await fazerLoginGoogle();
      if (res) {
        await autenticarUsuario(res);
      }
    } catch (e: any) {
      console.error('Erro no login Google:', e);
      setErroLogin('Não foi possível autenticar com o Google. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0B1929',
      backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(40, 126, 165, 0.22) 0%, transparent 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      color: '#FFFFFF',
      fontFamily: 'var(--font-family, sans-serif)'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Logotipo Minimalista */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '24px',
          background: 'linear-gradient(135deg, #173F5F 0%, #287EA5 100%)',
          border: '2px solid rgba(80, 144, 211, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(40, 126, 165, 0.3)',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '32px' }}>💎</span>
        </div>

        {/* Título Principal Minimalista */}
        <h1 style={{
          fontSize: '24px',
          fontWeight: 900,
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px',
          color: '#FFFFFF'
        }}>
          Meu Financeiro <span style={{ color: '#F8D117' }}>PRO</span>
        </h1>

        <p style={{
          fontSize: '13.5px',
          color: '#AAB4BE',
          margin: '0 0 32px 0',
          lineHeight: 1.5,
          maxWidth: '320px'
        }}>
          Controle simplificado de cartões, faturas, receitas e despesas com inteligência e privacidade.
        </p>

        {erroLogin && (
          <div style={{
            backgroundColor: 'rgba(244, 67, 54, 0.15)',
            border: '1px solid #F44336',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12px',
            color: '#F44336',
            marginBottom: '20px',
            width: '100%'
          }}>
            {erroLogin}
          </div>
        )}

        {/* Botão Oficial do Google Estilizado e Minimalista */}
        <button
          type="button"
          onClick={handleLogin}
          disabled={carregando}
          style={{
            width: '100%',
            height: '52px',
            borderRadius: '16px',
            backgroundColor: '#FFFFFF',
            color: '#1F2937',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontWeight: 800,
            fontSize: '14.5px',
            cursor: carregando ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            opacity: carregando ? 0.8 : 1
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          {carregando ? (
            <span>Conectando...</span>
          ) : (
            <>
              {/* Ícone Oficial SVG Google Multicor */}
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.13z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </>
          )}
        </button>

        {/* Botão para Acesso Local se preferir continuar */}
        {onContinuarOffline && (
          <button
            type="button"
            onClick={onContinuarOffline}
            style={{
              marginTop: '16px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#8A99AD',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '8px'
            }}
          >
            <span>Acessar demonstração offline</span>
            <ArrowRight size={13} />
          </button>
        )}

        {/* Informação de Segurança e Privacidade */}
        <div style={{
          marginTop: '36px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#607789',
          fontSize: '11px'
        }}>
          <ShieldCheck size={14} color="#5090D3" />
          <span>Acesso seguro com criptografia e isolamento individual</span>
        </div>
      </div>
    </div>
  );
};
