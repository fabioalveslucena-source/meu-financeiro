import React, { useState } from 'react';
import type { Cartao } from '../../types';
import { formatarMoeda } from '../../lib/formatters';
import logoBB from '../../assets/logo-bb.png';
import logoBradesco from '../../assets/logo-bradesco.png';

interface ParcelamentoResumo {
  descricao: string;
  parcelaAtual: number;
  totalParcelas: number;
  valorParcela: number;
}

interface CartaoVisualProps {
  cartao: Cartao;
  titularNome?: string;
  valorFatura?: number;
  limiteDisponivel?: number;
  percentualUsado?: number;
  parcelamentos?: ParcelamentoResumo[];
  mostrarFatura?: boolean;
  mostrarDetalhesCorpo?: boolean;
  estiloCompacto?: boolean;
  onClick?: () => void;
}

export const CartaoVisual: React.FC<CartaoVisualProps> = ({
  cartao,
  titularNome = 'TITULAR DO CARTÃO',
  valorFatura,
  limiteDisponivel,
  percentualUsado = 0,
  parcelamentos = [],
  mostrarFatura = true,
  mostrarDetalhesCorpo = false,
  estiloCompacto = false,
  onClick
}) => {
  const [mostrarParcelasInterno, setMostrarParcelasInterno] = useState(false);

  const nomeLower = (cartao.nome || '').toLowerCase();
  const corLower = (cartao.cor || '').toLowerCase();

  // Detecção dos 5 bancos do usuário
  const isBB = nomeLower.includes('brasil') || nomeLower.includes('ourocard') || corLower === '#f8d117' || corLower === '#ffd700';
  const isCaixa = nomeLower.includes('caixa') || corLower === '#0066b3' || corLower === '#004797';
  const isBradesco = nomeLower.includes('bradesco') || corLower === '#cc092f';
  const isItau = nomeLower.includes('itau') || nomeLower.includes('itaú') || nomeLower.includes('personnalite') || corLower === '#ec7000' || corLower === '#040b1a';
  const isNubank = nomeLower.includes('nubank') || nomeLower.includes('nu') || corLower === '#8a05be' || corLower === '#820ad1';

  // SVG do Chip EMV Metálico (Prata ou Ouro)
  const ChipSvg = ({ dourado = false }: { dourado?: boolean }) => (
    <svg width="40" height="30" viewBox="0 0 42 32" fill="none" style={{ borderRadius: '6px', overflow: 'hidden' }}>
      <rect width="42" height="32" rx="5" fill={dourado ? 'url(#chipGold)' : 'url(#chipSilver)'} stroke={dourado ? '#B8860B' : '#A0AEC0'} strokeWidth="1" />
      <path d="M0 16H16M26 16H42M16 6V26M26 6V26M16 11H26M16 21H26" stroke={dourado ? '#8B6508' : '#718096'} strokeWidth="1" />
      <circle cx="21" cy="16" r="3.5" stroke={dourado ? '#8B6508' : '#718096'} strokeWidth="1" fill={dourado ? '#D4AF37' : '#CBD5E0'} />
      <defs>
        <linearGradient id="chipGold" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F5D77F" />
          <stop offset="0.5" stopColor="#E5B20D" />
          <stop offset="1" stopColor="#D4AF37" />
        </linearGradient>
        <linearGradient id="chipSilver" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E2E8F0" />
          <stop offset="0.5" stopColor="#CBD5E0" />
          <stop offset="1" stopColor="#A0AEC0" />
        </linearGradient>
      </defs>
    </svg>
  );

  // SVG do Símbolo de Pagamento por Aproximação Contactless
  const ContactlessSvg = ({ cor = '#FFFFFF' }: { cor?: string }) => (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <path d="M4 17C6.5 14.5 6.5 7.5 4 5" stroke={cor} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <path d="M8 19C11.5 15.5 11.5 6.5 8 3" stroke={cor} strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      <path d="M12 21C16.5 16.5 16.5 5.5 12 1" stroke={cor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );

  // Logo Oficial Banco do Brasil (Enviado pelo usuário)
  const LogoBB = () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <img 
        src={logoBB} 
        alt="Banco do Brasil" 
        style={{ 
          width: '38px', 
          height: '38px', 
          objectFit: 'contain',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
        }} 
      />
    </div>
  );

  // Logo Caixa Econômica Federal (CAIXA com X Laranja)
  const LogoCaixa = () => (
    <div style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: '22px', letterSpacing: '0.5px' }}>
      <span style={{ color: '#FFFFFF' }}>CAI</span>
      <span style={{ 
        color: '#F37021', 
        position: 'relative', 
        display: 'inline-block',
        transform: 'skewX(-10deg)',
        fontWeight: 950
      }}>X</span>
      <span style={{ color: '#FFFFFF' }}>A</span>
    </div>
  );

  // Logo Oficial Bradesco (Enviado pelo usuário)
  const LogoBradescoPrime = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img 
        src={logoBradesco} 
        alt="Bradesco Prime" 
        style={{ 
          width: '32px', 
          height: '32px', 
          objectFit: 'contain',
          borderRadius: '6px'
        }} 
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: '14px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '0.5px' }}>bradesco</span>
        <span style={{ fontSize: '10px', fontWeight: 400, color: 'rgba(255,255,255,0.7)', letterSpacing: '2px', textTransform: 'lowercase' }}>prime</span>
      </div>
    </div>
  );

  // Logo Itaú Personnalité (Badge Dourado e Marinho)
  const LogoItauPersonnalite = () => (
    <div style={{
      width: '74px',
      borderRadius: '6px',
      overflow: 'hidden',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.45)',
      border: '1px solid #D4AF37'
    }}>
      <div style={{
        backgroundColor: '#B89758',
        background: 'linear-gradient(135deg, #D4AF37 0%, #AA802E 100%)',
        padding: '3px 0',
        textAlign: 'center',
        color: '#040B1A',
        fontWeight: 900,
        fontSize: '11px',
        letterSpacing: '0.5px'
      }}>
        Itaú
      </div>
      <div style={{
        backgroundColor: '#040B1A',
        padding: '3px 0',
        textAlign: 'center',
        color: '#D4AF37',
        fontWeight: 800,
        fontSize: '7px',
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        PERSONNALITÉ
      </div>
    </div>
  );

  // Logo Nubank (nu)
  const LogoNu = () => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <svg width="40" height="26" viewBox="0 0 44 28" fill="none">
        <path d="M6 24V6C6 4.5 7.5 3 9 4.5L20 22C21.5 24 23 23 23 21V4" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 10V22C28 23.5 29.5 25 31 25H36C38 25 39 23.5 39 22V10" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );

  // Logo Mastercard (2 círculos interligados)
  const LogoMastercard = () => (
    <svg width="38" height="24" viewBox="0 0 38 24">
      <circle cx="13" cy="12" r="10.5" fill="#EB001B" />
      <circle cx="25" cy="12" r="10.5" fill="#F79E1B" fillOpacity="0.88" />
    </svg>
  );

  // Logo VISA Metálico
  const LogoVisa = ({ infinite = false, dark = false }: { infinite?: boolean; dark?: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1 }}>
      <span style={{
        fontSize: '22px',
        fontWeight: 950,
        fontStyle: 'italic',
        letterSpacing: '-0.5px',
        color: dark ? '#003DA5' : '#FFFFFF',
        textShadow: dark ? 'none' : '0 1px 3px rgba(0,0,0,0.5)',
        fontFamily: 'sans-serif'
      }}>
        VISA
      </span>
      {infinite && (
        <span style={{
          fontSize: '8px',
          fontWeight: 400,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: dark ? '#0B2545' : 'rgba(255,255,255,0.85)',
          marginTop: '-1px'
        }}>
          Infinite
        </span>
      )}
    </div>
  );

  // Bloco Compartilhado de Limite e Parcelamento dentro do Cartão
  const renderSecaoInternaCorpo = (isDarkText: boolean) => {
    if (!mostrarDetalhesCorpo) return null;

    const corTexto = isDarkText ? '#0B2545' : '#FFFFFF';
    const corSub = isDarkText ? '#173F5F' : 'rgba(255, 255, 255, 0.85)';
    const corBorda = isDarkText ? 'rgba(0, 61, 165, 0.18)' : 'rgba(255, 255, 255, 0.18)';
    const corBarraFundo = isDarkText ? 'rgba(0, 61, 165, 0.12)' : 'rgba(255, 255, 255, 0.15)';
    const corBarraAtiva = percentualUsado > 80 ? '#F44336' : (isDarkText ? '#003DA5' : '#5090D3');

    return (
      <div style={{
        marginTop: '14px',
        paddingTop: '10px',
        borderTop: `1px solid ${corBorda}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        zIndex: 2
      }}>
        {/* Limite Utilizado e Limite Disponível */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: corSub,
          fontWeight: 700
        }}>
          <span>Limite Utilizado: <strong style={{ color: corTexto }}>{percentualUsado}%</strong></span>
          <span>Disponível: <strong style={{ color: isDarkText ? '#003DA5' : '#4CAF50' }}>{formatarMoeda(limiteDisponivel || 0)}</strong></span>
        </div>

        {/* Barra de Progresso do Limite Integrada */}
        <div style={{
          width: '100%',
          height: '6px',
          backgroundColor: corBarraFundo,
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(percentualUsado, 100)}%`,
            height: '100%',
            backgroundColor: corBarraAtiva,
            borderRadius: '999px',
            transition: 'width 0.3s ease'
          }} />
        </div>

        {/* Acordeão de Compras Parceladas Dentro do Próprio Cartão */}
        {parcelamentos && parcelamentos.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMostrarParcelasInterno(!mostrarParcelasInterno);
              }}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: isDarkText ? 'rgba(0, 61, 165, 0.08)' : 'rgba(255, 255, 255, 0.12)',
                border: `1px solid ${corBorda}`,
                color: corTexto,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 800,
                transition: 'all 0.15s ease'
              }}
            >
              <span>📦 Compras Parceladas ({parcelamentos.length})</span>
              <span>{mostrarParcelasInterno ? '▲ Fechar' : '▼ Ver parcelas'}</span>
            </button>

            {mostrarParcelasInterno && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
                marginTop: '6px',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {parcelamentos.map((p, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 8px',
                    borderRadius: '6px',
                    backgroundColor: isDarkText ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.3)',
                    fontSize: '10.5px',
                    color: corTexto
                  }}>
                    <span style={{ fontWeight: 600 }}>{p.descricao}</span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ opacity: 0.85 }}>{p.parcelaAtual}/{p.totalParcelas}</span>
                      <strong>{formatarMoeda(p.valorParcela)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ========================================================
  // RENDERIZAÇÃO ESPECÍFICA DO BANCO DO BRASIL (Ourocard Fácil)
  // ========================================================
  if (isBB) {
    return (
      <div 
        onClick={onClick}
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: estiloCompacto ? '210px' : '230px',
          background: 'radial-gradient(circle at 85% 15%, #FFF066 0%, #F8D117 40%, #E5B20D 100%)',
          borderRadius: '22px',
          padding: estiloCompacto ? '14px 18px' : '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#0B2545',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35), 0 2px 8px rgba(248, 209, 23, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px solid rgba(255, 255, 255, 0.5)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Marca d'água geométrica sutil BB */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(11, 37, 69, 0.04) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          pointerEvents: 'none'
        }} />

        {/* Topo: Logo Oficial BB (Esquerda) e ourocard Fácil (Direita) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
          <LogoBB />
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '20px', fontWeight: 900, color: '#003DA5', display: 'block', lineHeight: 1.1 }}>
              ourocard
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#3A5A80', letterSpacing: '0.5px' }}>
              Fácil
            </span>
          </div>
        </div>

        {/* Meio: Chip Metálico Prata + Contactless Azul + Datas de Fechamento e Vencimento */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ChipSvg dourado={false} />
            <ContactlessSvg cor="#003DA5" />
          </div>

          {/* Fechamento e Vencimento no Cartão */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(0, 61, 165, 0.09)',
            border: '1px solid rgba(0, 61, 165, 0.2)',
            padding: '4px 10px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#173F5F', textTransform: 'uppercase' }}>
              Fechamento: Dia <strong>{cartao.diaFechamento}</strong>
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#003DA5', textTransform: 'uppercase' }}>
              Vencimento: Dia <strong>{cartao.diaVencimento}</strong>
            </span>
          </div>
        </div>

        {/* Base: Fatura, Titular e Logo VISA */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
          <div>
            {mostrarFatura && valorFatura !== undefined && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#3A5A80', display: 'block' }}>
                  Fatura Atual
                </span>
                <span style={{ fontSize: estiloCompacto ? '16px' : '22px', fontWeight: 900, color: '#0B2545' }}>
                  {formatarMoeda(valorFatura)}
                </span>
              </div>
            )}
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#003DA5',
              display: 'block'
            }}>
              {titularNome}
            </span>
          </div>
          <LogoVisa dark={true} />
        </div>

        {/* Seção Interna: Limites e Parcelamentos dentro do próprio cartão */}
        {renderSecaoInternaCorpo(true)}
      </div>
    );
  }

  // ========================================================
  // RENDERIZAÇÃO DA CAIXA ECONÔMICA FEDERAL
  // ========================================================
  if (isCaixa) {
    return (
      <div 
        onClick={onClick}
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: estiloCompacto ? '210px' : '230px',
          background: 'linear-gradient(135deg, #004797 0%, #002D62 60%, #001A3D 100%)',
          borderRadius: '22px',
          padding: estiloCompacto ? '14px 18px' : '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4), 0 2px 10px rgba(0, 71, 151, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px solid rgba(255, 255, 255, 0.2)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-20px',
          width: '260px',
          height: '260px',
          borderRadius: '50%',
          border: '28px solid rgba(0, 160, 228, 0.18)',
          pointerEvents: 'none'
        }} />

        {/* Topo: Logo CAIXA à Direita */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#A0C4E8' }}>
              Cartão Caixa
            </span>
          </div>
          <LogoCaixa />
        </div>

        {/* Meio: Chip Ouro + Fechamento e Vencimento */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, margin: '8px 0' }}>
          <ChipSvg dourado={true} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '4px 10px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#A0C4E8', textTransform: 'uppercase' }}>
              Fech. Dia <strong>{cartao.diaFechamento}</strong>
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase' }}>
              Venc. Dia <strong>{cartao.diaVencimento}</strong>
            </span>
          </div>
        </div>

        {/* Base: Fatura e Titular */}
        <div style={{ zIndex: 1 }}>
          {mostrarFatura && valorFatura !== undefined && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#A0C4E8', textTransform: 'uppercase', display: 'block' }}>
                Fatura Aberta
              </span>
              <span style={{ fontSize: estiloCompacto ? '16px' : '22px', fontWeight: 900, color: '#FFFFFF' }}>
                {formatarMoeda(valorFatura)}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#FFFFFF',
                display: 'block'
              }}>
                {titularNome}
              </span>
              <div style={{ display: 'flex', gap: '8px', marginTop: '2px', fontSize: '9.5px', color: '#90BCE8' }}>
                <span>agência <strong style={{ color: '#F37021' }}>1234</strong></span>
                <span>conta <strong>00012345-6</strong></span>
              </div>
            </div>
            <LogoVisa />
          </div>
        </div>

        {/* Seção Interna: Limites e Parcelamentos */}
        {renderSecaoInternaCorpo(false)}
      </div>
    );
  }

  // ========================================================
  // RENDERIZAÇÃO DO BRADESCO PRIME (Black Minimalist Facets)
  // ========================================================
  if (isBradesco) {
    return (
      <div 
        onClick={onClick}
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: estiloCompacto ? '210px' : '230px',
          background: 'linear-gradient(145deg, #18191B 0%, #0D0E10 50%, #050506 100%)',
          borderRadius: '22px',
          padding: estiloCompacto ? '14px 18px' : '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          boxShadow: '0 12px 35px rgba(0,0,0,0.7), inset 0 1px 1px rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px solid rgba(255, 255, 255, 0.18)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '100%',
          background: 'linear-gradient(125deg, transparent 40%, rgba(255, 255, 255, 0.04) 50%, transparent 60%)',
          pointerEvents: 'none'
        }} />

        {/* Topo: Logo Oficial Bradesco (Esquerda) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <LogoBradescoPrime />
        </div>

        {/* Meio: Chip Prata + Contactless + Fechamento e Vencimento */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ChipSvg dourado={false} />
            <ContactlessSvg cor="rgba(255, 255, 255, 0.7)" />
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '4px 10px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase' }}>
              Fech. Dia <strong>{cartao.diaFechamento}</strong>
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase' }}>
              Venc. Dia <strong>{cartao.diaVencimento}</strong>
            </span>
          </div>
        </div>

        {/* Base: Fatura, Titular e VISA Infinite */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
          <div>
            {mostrarFatura && valorFatura !== undefined && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#A0AEC0', textTransform: 'uppercase', display: 'block' }}>
                  Fatura Atual
                </span>
                <span style={{ fontSize: estiloCompacto ? '16px' : '22px', fontWeight: 900, color: '#FFFFFF' }}>
                  {formatarMoeda(valorFatura)}
                </span>
              </div>
            )}
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#E2E8F0',
              display: 'block'
            }}>
              {titularNome}
            </span>
          </div>
          <LogoVisa infinite={true} />
        </div>

        {/* Seção Interna: Limites e Parcelamentos */}
        {renderSecaoInternaCorpo(false)}
      </div>
    );
  }

  // ========================================================
  // RENDERIZAÇÃO DO ITAÚ PERSONNALITÉ (Deep Navy Guilloche)
  // ========================================================
  if (isItau) {
    return (
      <div 
        onClick={onClick}
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: estiloCompacto ? '210px' : '230px',
          background: 'radial-gradient(circle at 50% 30%, #0B1933 0%, #050E1D 60%, #020710 100%)',
          borderRadius: '22px',
          padding: estiloCompacto ? '14px 18px' : '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          boxShadow: '0 12px 35px rgba(0,0,0,0.65), 0 2px 10px rgba(11, 25, 51, 0.5)',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px solid rgba(212, 175, 55, 0.35)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Topo: Badge Itaú Personnalité e Contactless */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
          <div style={{ width: '24px' }} />
          <LogoItauPersonnalite />
          <ContactlessSvg cor="#FFFFFF" />
        </div>

        {/* Meio: Chip + Fechamento e Vencimento */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, margin: '8px 0' }}>
          <ChipSvg dourado={false} />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(212, 175, 55, 0.1)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            padding: '4px 10px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase' }}>
              Fech. Dia <strong>{cartao.diaFechamento}</strong>
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase' }}>
              Venc. Dia <strong>{cartao.diaVencimento}</strong>
            </span>
          </div>
        </div>

        {/* Base: Fatura e Titular */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
          <div>
            {mostrarFatura && valorFatura !== undefined && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', display: 'block' }}>
                  Fatura Atual
                </span>
                <span style={{ fontSize: estiloCompacto ? '16px' : '22px', fontWeight: 900, color: '#FFFFFF' }}>
                  {formatarMoeda(valorFatura)}
                </span>
              </div>
            )}
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: '#CBD5E1',
              display: 'block'
            }}>
              {titularNome}
            </span>
          </div>
          <LogoVisa infinite={true} />
        </div>

        {/* Seção Interna: Limites e Parcelamentos */}
        {renderSecaoInternaCorpo(false)}
      </div>
    );
  }

  // ========================================================
  // RENDERIZAÇÃO DO NUBANK (Roxo Nubank Minimalista)
  // ========================================================
  if (isNubank) {
    return (
      <div 
        onClick={onClick}
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: estiloCompacto ? '210px' : '230px',
          background: 'linear-gradient(135deg, #8A05BE 0%, #820AD1 40%, #6805A6 100%)',
          borderRadius: '22px',
          padding: estiloCompacto ? '14px 18px' : '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          boxShadow: '0 10px 30px rgba(130, 10, 209, 0.4), 0 2px 8px rgba(0,0,0,0.3)',
          position: 'relative',
          overflow: 'hidden',
          border: '1.5px solid rgba(255, 255, 255, 0.22)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}
      >
        {/* Topo: Mastercard (Esquerda) e Chip (Direita) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <LogoMastercard />
          <ChipSvg dourado={false} />
        </div>

        {/* Meio: Datas de Fechamento e Vencimento */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', zIndex: 1, margin: '6px 0' }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '4px 10px',
            borderRadius: '10px'
          }}>
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
              Fech. Dia <strong>{cartao.diaFechamento}</strong>
            </span>
            <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FFFFFF', textTransform: 'uppercase' }}>
              Venc. Dia <strong>{cartao.diaVencimento}</strong>
            </span>
          </div>
        </div>

        {/* Base: Fatura e Titular */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
          <div>
            {mostrarFatura && valorFatura !== undefined && (
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', display: 'block' }}>
                  Fatura Aberta
                </span>
                <span style={{ fontSize: estiloCompacto ? '16px' : '22px', fontWeight: 900, color: '#FFFFFF' }}>
                  {formatarMoeda(valorFatura)}
                </span>
              </div>
            )}
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              color: '#FFFFFF'
            }}>
              {titularNome}
            </span>
          </div>
          <LogoNu />
        </div>

        {/* Seção Interna: Limites e Parcelamentos */}
        {renderSecaoInternaCorpo(false)}
      </div>
    );
  }

  // ========================================================
  // RENDERIZAÇÃO INSTITUCIONAL PADRÃO (Para outros bancos)
  // ========================================================
  const corBase = cartao.cor || '#287EA5';
  return (
    <div 
      onClick={onClick}
      style={{
        width: '100%',
        maxWidth: '430px',
        minHeight: estiloCompacto ? '210px' : '230px',
        background: `linear-gradient(135deg, ${corBase} 0%, #0F2744 100%)`,
        borderRadius: '22px',
        padding: estiloCompacto ? '14px 18px' : '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#FFFFFF',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        position: 'relative',
        overflow: 'hidden',
        border: '1.5px solid rgba(255, 255, 255, 0.2)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div>
          <span style={{
            fontSize: '9.5px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            backgroundColor: 'rgba(255,255,255,0.18)',
            padding: '2px 8px',
            borderRadius: '6px'
          }}>
            {cartao.bandeira || 'Crédito'}
          </span>
          <h4 style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: 800 }}>
            {cartao.nome}
          </h4>
        </div>
        <ContactlessSvg cor="#FFFFFF" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1, margin: '6px 0' }}>
        <ChipSvg dourado={false} />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          padding: '4px 10px',
          borderRadius: '10px'
        }}>
          <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
            Fech. Dia <strong>{cartao.diaFechamento}</strong>
          </span>
          <span style={{ fontSize: '9.5px', fontWeight: 900, color: '#FFFFFF' }}>
            Venc. Dia <strong>{cartao.diaVencimento}</strong>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
        <div>
          {mostrarFatura && valorFatura !== undefined && (
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', display: 'block' }}>
                Fatura
              </span>
              <span style={{ fontSize: estiloCompacto ? '16px' : '22px', fontWeight: 900 }}>
                {formatarMoeda(valorFatura)}
              </span>
            </div>
          )}
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
            {titularNome}
          </span>
        </div>
        <LogoVisa />
      </div>

      {renderSecaoInternaCorpo(false)}
    </div>
  );
};
