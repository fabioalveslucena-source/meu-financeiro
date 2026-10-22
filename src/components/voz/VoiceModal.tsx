import React, { useEffect } from 'react';
import { useVoiceRecognition } from '../../features/voice/useVoiceRecognition';
import { formatarMoeda } from '../../lib/formatters';
import type { VozInterpretada } from '../../features/voice/voiceInterpreter';
import { Mic, MicOff, X, Check, AlertCircle, Sparkles } from 'lucide-react';

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
  const {
    estaOuvindo,
    transcricao,
    resultado,
    suportado,
    erro,
    iniciarGravacao,
    pararGravacao,
    limparResultado,
  } = useVoiceRecognition();

  useEffect(() => {
    if (aberto && suportado) {
      limparResultado();
      iniciarGravacao();
    } else {
      pararGravacao();
    }
  }, [aberto, suportado]);

  if (!aberto) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'var(--bg-overlay)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '1rem'
    }}>
      <div className="card glass" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Fechar */}
        <button
          onClick={onFechar}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: 'var(--text-tertiary)'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Sparkles size={18} color="var(--brand-secondary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
            Comando de Voz Inteligente
          </h3>
        </div>

        {/* Microfone com Animação de Onda */}
        <div style={{ position: 'relative', margin: '1rem 0 2rem 0' }}>
          {estaOuvindo && (
            <div style={{
              position: 'absolute',
              inset: '-15px',
              borderRadius: '50%',
              border: '2px solid var(--brand-secondary)',
              animation: 'voicePulse 1.5s infinite',
              pointerEvents: 'none'
            }} />
          )}

          <button
            onClick={estaOuvindo ? pararGravacao : iniciarGravacao}
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: estaOuvindo ? 'var(--color-despesa)' : 'var(--brand-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              transition: 'all var(--transition-normal)'
            }}
          >
            {estaOuvindo ? <Mic size={36} /> : <MicOff size={36} />}
          </button>
        </div>

        <p style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: estaOuvindo ? 'var(--brand-secondary)' : 'var(--text-secondary)',
          margin: '0 0 1rem 0'
        }}>
          {estaOuvindo ? '🎙️ Ouvindo... Pode falar agora!' : 'Clique no microfone para falar'}
        </p>

        {/* Exemplo de Comandos */}
        {!transcricao && !resultado && (
          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            textAlign: 'left',
            width: '100%',
            marginBottom: '1rem'
          }}>
            <p style={{ fontWeight: 700, margin: '0 0 0.4rem 0', color: 'var(--text-primary)' }}>Exemplos de frases:</p>
            <p style={{ margin: '2px 0' }}>• <em>"Gastei 85 reais no supermercado no débito"</em></p>
            <p style={{ margin: '2px 0' }}>• <em>"Recebi 4500 de salário no pix"</em></p>
            <p style={{ margin: '2px 0' }}>• <em>"Paguei 300 reais de combustível em duas vezes no crédito"</em></p>
          </div>
        )}

        {/* Transcrição em Tempo Real */}
        {transcricao && (
          <div style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'rgba(40, 126, 165, 0.15)',
            border: '1px solid var(--brand-secondary)',
            borderRadius: 'var(--radius-lg)',
            width: '100%',
            marginBottom: '1.25rem',
            fontStyle: 'italic',
            fontSize: '0.95rem'
          }}>
            "{transcricao}"
          </div>
        )}

        {/* Erro */}
        {erro && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-despesa)',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        {/* Prévia do Reconhecimento */}
        {resultado && resultado.sucesso && (
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem',
            width: '100%',
            textAlign: 'left',
            marginBottom: '1.5rem'
          }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-secondary)', textTransform: 'uppercase', margin: '0 0 0.5rem 0' }}>
              Identificado com Sucesso:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div><strong>Tipo:</strong> {resultado.tipo}</div>
              <div><strong>Valor:</strong> {formatarMoeda(resultado.valor || 0)}</div>
              <div><strong>Natureza:</strong> {resultado.natureza}</div>
              <div><strong>Pagamento:</strong> {resultado.pagamento}</div>
              {resultado.categoria ? (
                <div style={{ gridColumn: 'span 2' }}><strong>Categoria:</strong> {resultado.categoria}</div>
              ) : null}
              {resultado.descricao ? (
                <div style={{ gridColumn: 'span 2', color: '#81C784', fontWeight: 600 }}>
                  <strong>Descrição:</strong> {resultado.descricao}
                </div>
              ) : null}
              {resultado.parcelas && resultado.parcelas > 1 ? (
                <div style={{ gridColumn: 'span 2', color: '#F8D117', fontWeight: 700 }}>
                  <strong>💳 Parcelamento no Cartão:</strong> {resultado.parcelas}x de {formatarMoeda((resultado.valor || 0) / resultado.parcelas)}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Botão de Ação */}
        {resultado && resultado.sucesso && (
          <button
            onClick={() => {
              onConfirmarDados(resultado);
              onFechar();
            }}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
          >
            <Check size={18} />
            <span>Preencher Formulário</span>
          </button>
        )}
      </div>
    </div>
  );
};
