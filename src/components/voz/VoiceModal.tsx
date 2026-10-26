import React, { useEffect, useCallback, useRef } from 'react';
import { useVoiceRecognition } from '../../features/voice/useVoiceRecognition';
import { formatarMoeda } from '../../lib/formatters';
import type { VozInterpretada } from '../../features/voice/voiceInterpreter';
import { Mic, MicOff, X, Check, AlertCircle, Sparkles, RefreshCw, Square } from 'lucide-react';

interface VoiceModalProps {
  aberto: boolean;
  onFechar: () => void;
  onConfirmarDados: (dados: VozInterpretada) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({
  aberto,
  onFechar,
  onConfirmarDados,
}) => {
  const resultadoRef = useRef<VozInterpretada | null>(null);

  const handleConfirmar = useCallback((resParaConfirmar?: VozInterpretada) => {
    const dados = resParaConfirmar || resultadoRef.current;
    if (dados && dados.sucesso) {
      onConfirmarDados(dados);
      onFechar();
    }
  }, [onConfirmarDados, onFechar]);

  const {
    estaOuvindo,
    transcricao,
    resultado,
    suportado,
    erro,
    iniciarGravacao,
    pararGravacao,
    limparResultado,
  } = useVoiceRecognition({
    onComandoConfirmar: () => {
      handleConfirmar();
    }
  });

  useEffect(() => {
    resultadoRef.current = resultado;
  }, [resultado]);

  // Ao abrir o modal, inicia a gravação com estado limpo
  useEffect(() => {
    if (aberto && suportado) {
      limparResultado();
      iniciarGravacao(false);
    } else {
      pararGravacao();
    }
  }, [aberto, suportado]);

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
      zIndex: 9999,
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div className="card" style={{
        maxWidth: '480px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        backgroundColor: '#0F2744',
        border: '1.5px solid #287EA5',
        borderRadius: '24px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Botão de Fechar no Topo Direito */}
        <button
          type="button"
          onClick={onFechar}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
          title="Fechar"
        >
          <X size={20} />
        </button>

        {/* Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Sparkles size={20} color="#F8D117" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: '#FFFFFF' }}>
            Comando de Voz Inteligente
          </h3>
        </div>

        {/* Botão Central de Microfone */}
        <div style={{ position: 'relative', margin: '8px 0 16px 0' }}>
          {estaOuvindo && (
            <div style={{
              position: 'absolute',
              inset: '-14px',
              borderRadius: '50%',
              border: '2px solid #F8D117',
              animation: 'voicePulse 1.5s infinite',
              pointerEvents: 'none'
            }} />
          )}

          <button
            type="button"
            onClick={estaOuvindo ? pararGravacao : () => iniciarGravacao()}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              backgroundColor: estaOuvindo ? '#F44336' : '#287EA5',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: estaOuvindo ? '0 0 24px rgba(244, 67, 54, 0.6)' : '0 0 20px rgba(40, 126, 165, 0.5)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            title={estaOuvindo ? 'Clique para pausar / processar' : 'Clique para falar'}
          >
            {estaOuvindo ? <Mic size={38} /> : <MicOff size={38} />}
          </button>
        </div>

        <p style={{
          fontSize: '0.95rem',
          fontWeight: 800,
          color: estaOuvindo ? '#F8D117' : '#AAB4BE',
          margin: '0 0 12px 0'
        }}>
          {estaOuvindo ? '🎙️ Ouvindo... Pode falar!' : 'Microfone pausado (toque para falar)'}
        </p>

        {/* Botão de Concluir Fala durante a gravação */}
        {estaOuvindo && (
          <button
            type="button"
            onClick={pararGravacao}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              backgroundColor: 'rgba(244, 67, 54, 0.2)',
              border: '1.5px solid #F44336',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: 'pointer',
              marginBottom: '16px'
            }}
          >
            <Square size={13} fill="#F44336" />
            <span>Concluir Fala e Processar</span>
          </button>
        )}

        {/* Exemplos de Frase quando ainda não falou */}
        {!transcricao && !resultado && !estaOuvindo && (
          <div style={{
            backgroundColor: '#132F4C',
            border: '1px solid #1E3A5F',
            padding: '12px 14px',
            borderRadius: '14px',
            fontSize: '0.85rem',
            color: '#B0BEC5',
            textAlign: 'left',
            width: '100%',
            marginBottom: '16px'
          }}>
            <p style={{ fontWeight: 800, margin: '0 0 6px 0', color: '#F8D117' }}>Exemplos de frases:</p>
            <p style={{ margin: '4px 0' }}>• <em>"Milho 5 reais no débito"</em></p>
            <p style={{ margin: '4px 0' }}>• <em>"Farofa 8 reais no pix"</em></p>
            <p style={{ margin: '4px 0' }}>• <em>"3 sacos de arroz, 15 reais cada, em 3 vezes no cartão"</em></p>
          </div>
        )}

        {/* Transcrição Capturada */}
        {transcricao && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(40, 126, 165, 0.2)',
            border: '1px solid #287EA5',
            borderRadius: '14px',
            width: '100%',
            marginBottom: '16px',
            fontStyle: 'italic',
            fontSize: '0.95rem',
            color: '#FFFFFF',
            textAlign: 'left',
            wordBreak: 'break-word',
            maxHeight: '90px',
            overflowY: 'auto'
          }}>
            "{transcricao}"
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#F44336',
            fontSize: '0.85rem',
            marginBottom: '14px',
            textAlign: 'left',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            padding: '8px 12px',
            borderRadius: '10px',
            width: '100%'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{erro}</span>
          </div>
        )}

        {/* Prévia do Resultado Interpretado */}
        {resultado && resultado.sucesso && (
          <div style={{
            backgroundColor: '#132F4C',
            border: '1.5px solid #4CAF50',
            borderRadius: '16px',
            padding: '14px',
            width: '100%',
            textAlign: 'left',
            marginBottom: '16px'
          }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 900, color: '#4CAF50', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
              ✓ Identificado com Sucesso:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
              <div><strong style={{ color: '#AAB4BE' }}>Tipo:</strong> <span style={{ color: resultado.tipo === 'Receita' ? '#4CAF50' : '#F44336', fontWeight: 800 }}>{resultado.tipo}</span></div>
              <div><strong style={{ color: '#AAB4BE' }}>Valor:</strong> <span style={{ color: '#FFFFFF', fontWeight: 900 }}>{formatarMoeda(resultado.valor || 0)}</span></div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ color: '#AAB4BE' }}>Natureza:</strong> <span style={{ color: '#5090D3', fontWeight: 800 }}>{resultado.natureza}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ color: '#AAB4BE' }}>Categoria:</strong> <span style={{ color: '#81C784', fontWeight: 800 }}>{resultado.categoria}</span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ color: '#AAB4BE' }}>Pagamento:</strong> <span style={{ color: '#F8D117', fontWeight: 800 }}>{resultado.pagamento}</span>
              </div>
              {resultado.descricao ? (
                <div style={{ gridColumn: 'span 2', color: '#E2E8F0', fontWeight: 700 }}>
                  <strong style={{ color: '#AAB4BE' }}>Descrição:</strong> {resultado.descricao}
                </div>
              ) : null}
              {resultado.parcelas && resultado.parcelas > 1 ? (
                <div style={{ gridColumn: 'span 2', backgroundColor: 'rgba(248, 209, 23, 0.15)', padding: '6px 10px', borderRadius: '8px', color: '#F8D117', fontWeight: 800 }}>
                  💳 Cartão Parcelado: {resultado.parcelas}x de {formatarMoeda((resultado.valor || 0) / resultado.parcelas)}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          {resultado && resultado.sucesso ? (
            <button
              type="button"
              onClick={() => {
                onConfirmarDados(resultado);
                onFechar();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)'
              }}
            >
              <Check size={20} />
              <span>Confirmar e Preencher Formulário</span>
            </button>
          ) : null}

          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            {!estaOuvindo && (
              <button
                type="button"
                onClick={() => {
                  limparResultado();
                  iniciarGravacao(false);
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#1E3A5F',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  border: '1px solid #287EA5',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={15} />
                <span>Falar Novamente</span>
              </button>
            )}

            <button
              type="button"
              onClick={onFechar}
              style={{
                flex: estaOuvindo ? 1 : 0.8,
                padding: '10px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#AAB4BE',
                fontWeight: 700,
                fontSize: '13px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
