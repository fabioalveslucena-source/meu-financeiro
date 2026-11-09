import React, { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { 
  X, 
  Camera, 
  QrCode, 
  Image as ImageIcon, 
  Sparkles, 
  Key, 
  Loader2, 
  ExternalLink,
  CheckCircle2,
  Store,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { 
  comprimirImagemParaGemini, 
  processarCupomComGemini, 
  tocarBipSucesso,
  type ResultadoCupomFiscal 
} from '../../services/geminiVisionService';
import { 
  decodificarQrCodeNfce, 
  type DadosNfceQrCode 
} from '../../services/nfceService';
import { Html5Qrcode } from 'html5-qrcode';
import { ConfigurarGeminiModal } from './ConfigurarGeminiModal';
import { ConferenciaCupomModal } from './ConferenciaCupomModal';

interface ScannerCupomModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export const ScannerCupomModal: React.FC<ScannerCupomModalProps> = ({
  aberto,
  onFechar,
}) => {
  const { usuario, mostrarToast } = useFinanceStore();

  const [modoCameraAoVivo, setModoCameraAoVivo] = useState(false);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string>('');
  const [modalChaveAberto, setModalChaveAberto] = useState(false);
  
  // Resultado da leitura por QR Code da NFC-e
  const [qrDados, setQrDados] = useState<DadosNfceQrCode | null>(null);
  const [valorManual, setValorManual] = useState<string>('');
  const [estabelecimentoManual, setEstabelecimentoManual] = useState<string>('');

  // Resultado da IA para conferência
  const [resultadoIA, setResultadoIA] = useState<ResultadoCupomFiscal | null>(null);
  const [modalConferenciaAberto, setModalConferenciaAberto] = useState(false);

  const inputFotoCameraRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Parar câmera ao fechar
  useEffect(() => {
    if (!aberto && html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().catch(() => {});
      } catch {}
      setModoCameraAoVivo(false);
      setQrDados(null);
    }
  }, [aberto]);

  if (!aberto) return null;

  // Iniciar leitor de QR Code ao vivo com câmera
  const iniciarScannerAoVivo = async () => {
    setModoCameraAoVivo(true);
    setQrDados(null);

    // Aguarda o elemento renderizar no DOM
    setTimeout(async () => {
      try {
        const elemento = document.getElementById('leitor-qr-ao-vivo');
        if (!elemento) return;

        const qrScanner = new Html5Qrcode('leitor-qr-ao-vivo');
        html5QrCodeRef.current = qrScanner;

        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 30,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Sucesso na leitura do QR Code
            tocarBipSucesso();
            qrScanner.stop().catch(() => {});
            setModoCameraAoVivo(false);

            const decodificado = decodificarQrCodeNfce(decodedText);
            setQrDados(decodificado);
            setValorManual(decodificado.valorTotal ? decodificado.valorTotal.toFixed(2) : '');
            setEstabelecimentoManual(decodificado.estabelecimentoSugerido);

            mostrarToast('✓ QR Code da NFC-e lido com sucesso!', 'sucesso');
          },
          () => {
            // Callback contínuo enquanto procura QR Code
          }
        );
      } catch (err: any) {
        console.error('Erro ao iniciar câmera para QR Code:', err);
        setModoCameraAoVivo(false);
        alert('Não foi possível acessar a câmera. Verifique se concedeu permissão ao aplicativo.');
      }
    }, 150);
  };

  const pararScannerAoVivo = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
    }
    setModoCameraAoVivo(false);
  };

  // Prosseguir para conferência e lançamento a partir do QR Code lido
  const handleAvancarLancamentoQr = () => {
    if (!qrDados) return;

    const valorNumerico = parseFloat(valorManual.replace(',', '.')) || 0;
    if (valorNumerico <= 0) {
      alert('Por favor, informe o valor total da nota para realizar o lançamento.');
      return;
    }

    const resultadoMontado: ResultadoCupomFiscal = {
      estabelecimento: estabelecimentoManual.trim() || qrDados.estabelecimentoSugerido,
      data: qrDados.dataEmissao || new Date().toISOString().slice(0, 10),
      valorTotal: valorNumerico,
      desconto: 0,
      formaPagamentoSugerida: '💳 Crédito',
      naturezaSugerida: '🛒 Alimentação',
      categoriaSugerida: 'Supermercado',
      chaveAcesso: qrDados.chaveAcesso,
      itens: [
        {
          id: `item-qr-${Date.now()}`,
          nome: `${estabelecimentoManual.trim() || 'Compra NFC-e'}${qrDados.uf ? ` (${qrDados.uf})` : ''}`,
          quantidade: 1,
          precoUnitario: valorNumerico,
          precoTotal: valorNumerico,
          categoria: 'Supermercado',
          selecionado: true
        }
      ]
    };

    setResultadoIA(resultadoMontado);
    setModalConferenciaAberto(true);
  };

  // Processar arquivo de foto selecionado (câmera ou galeria) com IA
  const handleSelecionarFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = usuario.geminiApiKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      setModalChaveAberto(true);
      mostrarToast('Configure sua chave gratuita do Gemini para ativar a IA.', 'info');
      return;
    }

    try {
      setProcessandoIA(true);
      setMensagemStatus('Otimizando imagem para leitura rápida...');
      
      const imagemBase64 = await comprimirImagemParaGemini(file);

      setMensagemStatus('Inteligência Artificial analisando o cupom...');
      const resultado = await processarCupomComGemini(imagemBase64, apiKey);

      tocarBipSucesso();
      setResultadoIA(resultado);
      setModalConferenciaAberto(true);
    } catch (err: any) {
      console.error('Erro na leitura com IA:', err);
      const msg = err.message || 'Falha ao analisar a foto da nota.';
      if (msg.includes('API key') || msg.includes('403') || msg.includes('rejeitada')) {
        alert('A chave do Google Gemini foi rejeitada pelo Google. Abra a configuração da chave para inserir sua chave oficial.');
        setModalChaveAberto(true);
      } else {
        alert(`Não foi possível ler o cupom: ${msg}\n\nDica: Procure tirar uma foto com boa iluminação e o cupom bem plano.`);
      }
    } finally {
      setProcessandoIA(false);
      setMensagemStatus('');
      if (inputFotoCameraRef.current) inputFotoCameraRef.current.value = '';
      if (inputGaleriaRef.current) inputGaleriaRef.current.value = '';
    }
  };

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 12, 22, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '16px'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          backgroundColor: '#0F2744',
          border: '1.5px solid #1E3A5F',
          borderRadius: '22px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 12px 35px rgba(0,0,0,0.65)',
          color: '#FFFFFF',
          position: 'relative'
        }}>
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: 'rgba(248, 209, 23, 0.16)',
                border: '1px solid rgba(248, 209, 23, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F8D117'
              }}>
                <Camera size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>
                  Escanear Cupom Fiscal
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '11.5px', color: '#8A99AD' }}>
                  Lançamento por IA ou Leitura Direta de QR Code
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

          {/* Atalho para Chave da IA no Topo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '12px',
            backgroundColor: '#132F4C',
            border: '1px solid #1E3A5F',
            fontSize: '11.5px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#F8D117" />
              <span style={{ color: '#CBD5E1' }}>Motor Gemini:</span>
              <strong style={{ color: usuario.geminiApiKey ? '#4CAF50' : '#F8D117' }}>
                {usuario.geminiApiKey ? 'Ativo ✓' : 'Configurar Chave'}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setModalChaveAberto(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#5090D3',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                padding: 0
              }}
            >
              <Key size={12} />
              <span>{usuario.geminiApiKey ? 'Alterar Chave' : '⚙️ Ativar Chave'}</span>
            </button>
          </div>

          {/* Estado de Processamento da IA */}
          {processandoIA ? (
            <div style={{
              padding: '30px 16px',
              borderRadius: '16px',
              backgroundColor: '#132F4C',
              border: '1.5px solid #5090D3',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '12px'
            }}>
              <Loader2 size={36} color="#5090D3" className="animate-spin" />
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                  Lendo Cupom Fiscal com IA...
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#CBD5E1' }}>
                  {mensagemStatus || 'Extraindo itens, preços, quantidades e total...'}
                </p>
              </div>
            </div>
          ) : modoCameraAoVivo ? (
            /* Leitor de Câmera ao Vivo para QR Code */
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              backgroundColor: '#000000',
              border: '2px solid #F8D117',
              position: 'relative'
            }}>
              <div id="leitor-qr-ao-vivo" style={{ width: '100%', minHeight: '280px' }} />
              
              <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '0',
                right: '0',
                display: 'flex',
                justifyContent: 'center',
                zIndex: 10
              }}>
                <button
                  type="button"
                  onClick={pararScannerAoVivo}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(244, 67, 54, 0.85)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar Câmera
                </button>
              </div>
            </div>
          ) : qrDados ? (
            /* Card Completo de Resultado e Lançamento do QR Code da NFC-e */
            <div style={{
              padding: '16px',
              borderRadius: '18px',
              backgroundColor: '#132F4C',
              border: '1.5px solid #4CAF50',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4CAF50', fontWeight: 800, fontSize: '13.5px' }}>
                  <CheckCircle2 size={18} />
                  <span>NFC-e Reconhecida com Sucesso!</span>
                </div>
                {qrDados.uf && (
                  <span style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    backgroundColor: 'rgba(76, 175, 80, 0.2)',
                    color: '#81C784',
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {qrDados.ufNome || qrDados.uf}
                  </span>
                )}
              </div>

              {/* Chave de Acesso Formatada */}
              {qrDados.chaveAcesso && (
                <div style={{
                  fontSize: '10.5px',
                  color: '#CBD5E1',
                  backgroundColor: '#0A1B30',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: '1px solid #1E3A5F'
                }}>
                  <div style={{ color: '#8A99AD', fontSize: '9.5px', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Chave de Acesso Oficial (44 Dígitos):
                  </div>
                  <div style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '11px', color: '#F8D117' }}>
                    {qrDados.chaveFormatada || qrDados.chaveAcesso}
                  </div>
                </div>
              )}

              {/* Campos para confirmação imediata */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Campo de Valor Total */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#F8D117', marginBottom: '4px' }}>
                    💰 VALOR TOTAL DA NOTA (R$):
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A99AD', fontWeight: 700 }}>
                      R$
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={valorManual}
                      onChange={(e) => setValorManual(e.target.value)}
                      placeholder="0,00"
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 12px 0 38px',
                        borderRadius: '12px',
                        backgroundColor: '#0A1B30',
                        border: '1.5px solid #F8D117',
                        color: '#FFFFFF',
                        fontSize: '18px',
                        fontWeight: 900
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '10px', color: '#8A99AD', display: 'block', marginTop: '3px' }}>
                    {qrDados.valorTotal 
                      ? '✓ Valor extraído automaticamente do QR Code da NFC-e.' 
                      : 'Digite o valor total impresso no rodapé da nota fiscal.'}
                  </span>
                </div>

                {/* Campo de Nome do Estabelecimento */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    🏪 NOME DO ESTABELECIMENTO / LOJA:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '12px', color: '#8A99AD' }}>
                      <Store size={16} />
                    </div>
                    <input
                      type="text"
                      value={estabelecimentoManual}
                      onChange={(e) => setEstabelecimentoManual(e.target.value)}
                      placeholder="Ex: Supermercado Preço Bom"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 12px 0 36px',
                        borderRadius: '12px',
                        backgroundColor: '#0A1B30',
                        border: '1.5px solid #1E3A5F',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                {/* BOTÃO PRINCIPAL: LANÇAR NO FINANCEIRO */}
                <button
                  type="button"
                  onClick={handleAvancarLancamentoQr}
                  style={{
                    padding: '13px',
                    borderRadius: '14px',
                    backgroundColor: '#4CAF50',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(76, 175, 80, 0.4)'
                  }}
                >
                  <span>✅ Continuar e Lançar no Financeiro</span>
                  <ArrowRight size={18} />
                </button>

                {/* BOTÃO SECUNDÁRIO: ABRIR SEFAZ */}
                {qrDados.url && (
                  <button
                    type="button"
                    onClick={() => window.open(qrDados.url, '_blank')}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      backgroundColor: '#1976D2',
                      border: 'none',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <ExternalLink size={14} />
                    <span>🌐 Visualizar Cupom na SEFAZ (Opcional)</span>
                  </button>
                )}

                {/* BOTÃO PARA TIRAR FOTO SE QUISER LER ITEM A ITEM */}
                <button
                  type="button"
                  onClick={() => {
                    setQrDados(null);
                    inputFotoCameraRef.current?.click();
                  }}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: '#1E3A5F',
                    border: '1px solid #265D97',
                    color: '#CBD5E1',
                    fontWeight: 700,
                    fontSize: '11.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Camera size={14} />
                  <span>📸 Preferir Ler Itens Detalhados 1 a 1 com IA</span>
                </button>

                {/* BOTÃO PARA ESCANEAR OUTRO */}
                <button
                  type="button"
                  onClick={() => setQrDados(null)}
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    color: '#8A99AD',
                    fontWeight: 700,
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Voltar às opções de leitura</span>
                </button>
              </div>
            </div>
          ) : (
            /* Opções Principais de Captura */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Opção 1: Câmera com IA */}
              <button
                type="button"
                onClick={() => inputFotoCameraRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#132F4C',
                  border: '1.5px solid #265D97',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  border: '1px solid rgba(76, 175, 80, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4CAF50',
                  flexShrink: 0
                }}>
                  <Camera size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Tirar Foto da Nota (com IA)</span>
                    <span style={{ fontSize: '10px', backgroundColor: 'rgba(248, 209, 23, 0.2)', color: '#F8D117', padding: '1px 6px', borderRadius: '4px' }}>
                      Recomendado
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#8A99AD', display: 'block', marginTop: '2px' }}>
                    Fotografe o cupom inteiro. A IA extrai produtos, preços e total em 3 segundos.
                  </span>
                </div>
              </button>

              {/* Opção 2: QR Code Câmera ao Vivo */}
              <button
                type="button"
                onClick={iniciarScannerAoVivo}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#132F4C',
                  border: '1.5px solid #1E3A5F',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 209, 23, 0.16)',
                  border: '1px solid rgba(248, 209, 23, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F8D117',
                  flexShrink: 0
                }}>
                  <QrCode size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>
                    Ler QR Code da Nota (Câmera ao Vivo)
                  </div>
                  <span style={{ fontSize: '11px', color: '#8A99AD', display: 'block', marginTop: '2px' }}>
                    Aponte para o QR Code da NFC-e com leitor rápido de 60 FPS, som e lançamento direto.
                  </span>
                </div>
              </button>

              {/* Opção 3: Galeria */}
              <button
                type="button"
                onClick={() => inputGaleriaRef.current?.click()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  borderRadius: '16px',
                  backgroundColor: '#132F4C',
                  border: '1.5px solid #1E3A5F',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(80, 144, 211, 0.16)',
                  border: '1px solid rgba(80, 144, 211, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#5090D3',
                  flexShrink: 0
                }}>
                  <ImageIcon size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>
                    Escolher Foto da Galeria
                  </div>
                  <span style={{ fontSize: '11px', color: '#8A99AD', display: 'block', marginTop: '2px' }}>
                    Caso já tenha tirado a foto da nota fiscal antes no celular.
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Inputs invisíveis de foto */}
          <input
            ref={inputFotoCameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleSelecionarFoto}
            style={{ display: 'none' }}
          />
          <input
            ref={inputGaleriaRef}
            type="file"
            accept="image/*"
            onChange={handleSelecionarFoto}
            style={{ display: 'none' }}
          />
        </div>
      </div>

      {/* Modal de Configuração da Chave da IA */}
      <ConfigurarGeminiModal
        aberto={modalChaveAberto}
        onFechar={() => setModalChaveAberto(false)}
      />

      {/* Modal de Conferência dos Itens */}
      <ConferenciaCupomModal
        resultado={resultadoIA}
        aberto={modalConferenciaAberto}
        onFechar={() => setModalConferenciaAberto(false)}
        onConcluido={() => {
          setModalConferenciaAberto(false);
          onFechar();
        }}
      />
    </>
  );
};
