import React, { useState } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { 
  X, 
  Key, 
  ExternalLink, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { limparChaveGemini, obterModeloGeminiValido } from '../../services/geminiVisionService';

interface ConfigurarGeminiModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSalvoComSucesso?: () => void;
}

export const ConfigurarGeminiModal: React.FC<ConfigurarGeminiModalProps> = ({
  aberto,
  onFechar,
  onSalvoComSucesso
}) => {
  const { usuario, setUsuario, mostrarToast } = useFinanceStore();
  const [chaveInput, setChaveInput] = useState(usuario.geminiApiKey || '');
  const [validando, setValidando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  if (!aberto) return null;

  const handleSalvar = async () => {
    setMensagemErro(null);
    const limpa = limparChaveGemini(chaveInput);
    
    if (!limpa) {
      setMensagemErro('Por favor, cole sua chave da API do Google Gemini.');
      return;
    }

    try {
      setValidando(true);
      // Valida a chave em tempo real com a API oficial do Google
      const modelo = await obterModeloGeminiValido(limpa);

      setUsuario({ geminiApiKey: limpa });
      mostrarToast(`✓ Chave conectada ao Google Gemini (${modelo})!`, 'sucesso');
      onSalvoComSucesso?.();
      onFechar();
    } catch (err: any) {
      console.error('Erro de validação da chave Gemini:', err);
      const msg = err.message || 'Chave não reconhecida pelo Google.';
      setMensagemErro(`Atenção: ${msg}\n\nCertifique-se de copiar a chave completa gerada no Google AI Studio (geralmente começa com "AIzaSy...").`);
    } finally {
      setValidando(false);
    }
  };

  const abrirGoogleAiStudio = () => {
    window.open('https://aistudio.google.com/app/apikey', '_blank');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 12, 22, 0.82)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: '16px'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#0F2744',
        border: '1.5px solid #1E3A5F',
        borderRadius: '22px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 12px 35px rgba(0,0,0,0.6)',
        color: '#FFFFFF'
      }}>
        {/* Cabeçalho */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              backgroundColor: 'rgba(80, 144, 211, 0.16)',
              border: '1px solid rgba(80, 144, 211, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5090D3'
            }}>
              <Key size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                Chave da IA (Google Gemini)
              </h3>
              <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#8A99AD' }}>
                Gratuita oficial do Google para leitura de cupons
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onFechar}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8A99AD',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Card Passo a Passo */}
        <div style={{
          backgroundColor: '#132F4C',
          borderRadius: '14px',
          padding: '14px',
          border: '1px solid #1E3A5F',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#F8D117', fontSize: '12px', fontWeight: 800 }}>
            <Sparkles size={14} />
            <span>Como gerar sua chave em 1 minuto:</span>
          </div>

          <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '11.5px', color: '#CBD5E1', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.4 }}>
            <li>Toque no botão azul abaixo para abrir o <strong>Google AI Studio</strong>.</li>
            <li>Faça login com sua conta Google (se já estiver logado, abrirá direto).</li>
            <li>Clique no botão azul <strong>"Create API key"</strong> (Criar Chave).</li>
            <li>Copie o código gerado (começa com <code>AQ...</code> ou <code>AIzaSy...</code>) e cole aqui.</li>
          </ol>

          <button
            type="button"
            onClick={abrirGoogleAiStudio}
            style={{
              marginTop: '4px',
              padding: '10px 14px',
              borderRadius: '12px',
              backgroundColor: '#1976D2',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 3px 10px rgba(25, 118, 210, 0.4)',
              transition: 'all 0.15s ease'
            }}
          >
            <ExternalLink size={14} />
            <span>🌐 Abrir Google AI Studio (Gerar Chave)</span>
          </button>
        </div>

        {/* Input da Chave */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#AAB4BE', marginBottom: '6px' }}>
            COLE SUA CHAVE AQUI:
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={chaveInput}
              onChange={(e) => {
                setChaveInput(e.target.value);
                if (mensagemErro) setMensagemErro(null);
              }}
              placeholder="Cole sua chave (ex: AQ.Ab8...)"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: '12px',
                backgroundColor: '#0A1B30',
                border: mensagemErro ? '1.5px solid #F44336' : '1.5px solid #265D97',
                color: '#FFFFFF',
                fontSize: '13px',
                fontFamily: 'monospace'
              }}
            />
          </div>
        </div>

        {/* Mensagem de Erro se houver */}
        {mensagemErro && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '10px',
            backgroundColor: 'rgba(244, 67, 54, 0.15)',
            border: '1px solid rgba(244, 67, 54, 0.4)',
            fontSize: '11px',
            color: '#FF8A80',
            whiteSpace: 'pre-line'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{mensagemErro}</span>
          </div>
        )}

        {/* Aviso de Segurança */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '10px',
          backgroundColor: 'rgba(76, 175, 80, 0.12)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          fontSize: '11px',
          color: '#81C784'
        }}>
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <span>Sua chave fica gravada no seu perfil de forma privada e segura. O uso é 100% gratuito pelo Google.</span>
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onFechar}
            disabled={validando}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '12px',
              backgroundColor: '#132F4C',
              border: '1px solid #1E3A5F',
              color: '#CBD5E1',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: validando ? 'not-allowed' : 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            disabled={validando}
            style={{
              flex: 1.5,
              padding: '11px',
              borderRadius: '12px',
              backgroundColor: validando ? '#2E7D32' : '#4CAF50',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '12.5px',
              cursor: validando ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 3px 12px rgba(76, 175, 80, 0.35)'
            }}
          >
            {validando ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Validando no Google...</span>
              </>
            ) : (
              <>
                <CheckCircle size={15} />
                <span>Salvar Chave</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
