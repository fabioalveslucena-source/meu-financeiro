import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { Delete, Fingerprint, Lock } from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const { seguranca, desbloquearComPin, desbloquearComBiometria, usuario } = useFinanceStore();
  const [pinDigitado, setPinDigitado] = useState('');
  const [erroAnim, setErroAnim] = useState(false);

  // Se o bloqueio não estiver ativo ou o app não estiver bloqueado, não renderizar
  if (!seguranca.bloqueioAtivo || !seguranca.estaBloqueado) {
    return null;
  }

  const tamanhoPinEsperado = seguranca.pin ? seguranca.pin.length : 4;

  const handleDigito = (digito: string) => {
    if (pinDigitado.length < tamanhoPinEsperado) {
      const novoPin = pinDigitado + digito;
      setPinDigitado(novoPin);

      // Se completou a quantidade de dígitos, testar desbloqueio imediatamente
      if (novoPin.length === tamanhoPinEsperado) {
        setTimeout(() => {
          const sucesso = desbloquearComPin(novoPin);
          if (!sucesso) {
            setErroAnim(true);
            setTimeout(() => {
              setErroAnim(false);
              setPinDigitado('');
            }, 600);
          }
        }, 150);
      }
    }
  };

  const handleApagar = () => {
    if (pinDigitado.length > 0) {
      setPinDigitado(pinDigitado.slice(0, -1));
    }
  };

  const handleBiometria = () => {
    if (seguranca.biometriaAtiva) {
      desbloquearComBiometria();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#071321',
      backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(248, 209, 23, 0.08) 0%, transparent 60%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '1.5rem',
      userSelect: 'none'
    }}>
      {/* Brasão de Segurança */}
      <div style={{
        width: '68px',
        height: '68px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #173F5F 0%, #0F2744 100%)',
        border: '2px solid #F8D117',
        boxShadow: '0 8px 24px rgba(248, 209, 23, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <Lock size={32} color="#F8D117" />
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px 0' }}>
        Meu Financeiro PRO
      </h2>
      <p style={{ fontSize: '0.85rem', color: '#AAB4BE', margin: '0 0 1.5rem 0' }}>
        Olá, {usuario.nome} • Digite seu PIN de acesso
      </p>

      {/* Indicadores Visuais de Dígitos (Bolinhas Douradas) */}
      <div style={{
        display: 'flex',
        gap: '14px',
        marginBottom: '2rem',
        transform: erroAnim ? 'translateX(-8px)' : 'none',
        transition: 'transform 0.1s ease'
      }}>
        {Array.from({ length: tamanhoPinEsperado }).map((_, idx) => {
          const preenchido = idx < pinDigitado.length;
          return (
            <div
              key={idx}
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: preenchido ? '#F8D117' : '#132F4C',
                border: `2px solid ${preenchido ? '#F8D117' : '#1E3A5F'}`,
                boxShadow: preenchido ? '0 0 10px rgba(248, 209, 23, 0.6)' : 'none',
                transition: 'all 0.15s ease'
              }}
            />
          );
        })}
      </div>

      {/* Teclado Numérico Executivo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 72px)',
        gap: '14px',
        marginBottom: '1.5rem'
      }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigito(String(num))}
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#0F2744',
              border: '1.5px solid #1E3A5F',
              color: '#FFFFFF',
              fontSize: '24px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
              transition: 'all 0.1s ease'
            }}
          >
            {num}
          </button>
        ))}

        {/* Botão Biometria */}
        <button
          type="button"
          onClick={handleBiometria}
          disabled={!seguranca.biometriaAtiva}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: seguranca.biometriaAtiva ? 'rgba(80, 144, 211, 0.15)' : 'transparent',
            border: seguranca.biometriaAtiva ? '1.5px solid #5090D3' : 'none',
            color: seguranca.biometriaAtiva ? '#5090D3' : '#607789',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: seguranca.biometriaAtiva ? 'pointer' : 'default',
            transition: 'all 0.1s ease'
          }}
          title={seguranca.biometriaAtiva ? 'Desbloquear com Biometria' : ''}
        >
          {seguranca.biometriaAtiva && <Fingerprint size={28} />}
        </button>

        {/* Dígito Zero */}
        <button
          type="button"
          onClick={() => handleDigito('0')}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: '#0F2744',
            border: '1.5px solid #1E3A5F',
            color: '#FFFFFF',
            fontSize: '24px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.1s ease'
          }}
        >
          0
        </button>

        {/* Botão Apagar */}
        <button
          type="button"
          onClick={handleApagar}
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#AAB4BE',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.1s ease'
          }}
          title="Apagar dígito"
        >
          <Delete size={24} />
        </button>
      </div>

      <div style={{ textAlign: 'center', color: '#607789', fontSize: '12px' }}>
        <span>Proteção de Dados Criptografada • Meu Financeiro</span>
      </div>
    </div>
  );
};
