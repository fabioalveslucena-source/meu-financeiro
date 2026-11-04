import React from 'react';
import { CreditCard, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface OnboardingModalProps {
  aberto: boolean;
  onFechar: () => void;
  onCadastrarCartao: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  aberto,
  onFechar,
  onCadastrarCartao
}) => {
  if (!aberto) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(11, 25, 41, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99998,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: '#0F2744',
        border: '1.5px solid #287EA5',
        borderRadius: '24px',
        padding: '28px 24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        position: 'relative',
        animation: 'fadeIn 0.25s ease'
      }}>
        {/* Botão de Fechar no Topo Direito */}
        <button
          type="button"
          onClick={onFechar}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="Fechar"
        >
          <X size={18} />
        </button>

        {/* Ícone de Destaque */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #287EA5 0%, #5090D3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 8px 20px rgba(40, 126, 165, 0.45)',
          marginBottom: '18px'
        }}>
          <CreditCard size={28} />
        </div>

        <h3 style={{
          fontSize: '18px',
          fontWeight: 900,
          color: '#FFFFFF',
          margin: '0 0 8px 0',
          lineHeight: 1.3
        }}>
          Bem-vindo! Configure sua Conta e Cartão
        </h3>

        <p style={{
          fontSize: '13px',
          color: '#AAB4BE',
          lineHeight: 1.5,
          margin: '0 0 20px 0'
        }}>
          Para que o sistema calcule seus limites, consolide suas despesas e agrupe faturas com exatidão nas datas corretas, você precisa cadastrar seus dados iniciais:
        </p>

        {/* Lista de Requisitos Necessários */}
        <div style={{
          backgroundColor: '#132F4C',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginBottom: '22px',
          border: '1px solid #1E3A5F'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <CheckCircle2 size={18} color="#4CAF50" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                Conta Bancária Principal
              </strong>
              <span style={{ fontSize: '11.5px', color: '#AAB4BE' }}>
                Defina o banco que você utiliza para movimentações do dia a dia.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <CheckCircle2 size={18} color="#F8D117" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '13px', color: '#FFFFFF', display: 'block' }}>
                Cartão de Crédito e Limite
              </strong>
              <span style={{ fontSize: '11.5px', color: '#AAB4BE' }}>
                Cadastre o dia de <strong>fechamento da fatura</strong>, o <strong>vencimento</strong> e o <strong>limite total</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={() => {
              onFechar();
              onCadastrarCartao();
            }}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: '14px',
              fontWeight: 800,
              fontSize: '13.5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(248, 209, 23, 0.35)'
            }}
          >
            <span>Cadastrar Conta e Cartão Agora</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onFechar}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#AAB4BE',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Lembrar mais tarde
          </button>
        </div>
      </div>
    </div>
  );
};
