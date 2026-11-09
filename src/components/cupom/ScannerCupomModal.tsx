import React, { useState, useRef, useEffect } from 'react';
import { useFinanceStore } from '../../stores/financeStore';
import { formatarMoeda } from '../../lib/formatters';
import type { FormaPagamento } from '../../types';
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
  CreditCard,
  Calendar,
  RotateCcw,
  ListFilter,
  ClipboardPaste,
  Eye
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
import { extrairItensDeTextoFiscal } from '../../services/nfceTextParser';
import { Html5Qrcode } from 'html5-qrcode';
import { ConfigurarGeminiModal } from './ConfigurarGeminiModal';
import { ConferenciaCupomModal } from './ConferenciaCupomModal';
import { SeletorCategoriaPesquisa } from '../common/SeletorCategoriaPesquisa';

interface ScannerCupomModalProps {
  aberto: boolean;
  onFechar: () => void;
}

export const ScannerCupomModal: React.FC<ScannerCupomModalProps> = ({
  aberto,
  onFechar,
}) => {
  const { 
    usuario, 
    cartoes,
    contas,
    adicionarLancamento,
    mostrarToast 
  } = useFinanceStore();

  const [modoCameraAoVivo, setModoCameraAoVivo] = useState(false);
  const [processandoIA, setProcessandoIA] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string>('');
  const [modalChaveAberto, setModalChaveAberto] = useState(false);
  
  // Visualizador SEFAZ na tela do celular
  const [modalSefazAberto, setModalSefazAberto] = useState(false);

  // Modal para colar texto da SEFAZ
  const [modalColarTextoAberto, setModalColarTextoAberto] = useState(false);
  const [textoColado, setTextoColado] = useState('');

  // Resultado da leitura por QR Code da NFC-e
  const [qrDados, setQrDados] = useState<DadosNfceQrCode | null>(null);
  const [valorManual, setValorManual] = useState<string>('');
  const [estabelecimentoManual, setEstabelecimentoManual] = useState<string>('');
  const [dataManual, setDataManual] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formaPagamentoManual, setFormaPagamentoManual] = useState<FormaPagamento>('💳 Crédito');
  const [cartaoManual, setCartaoManual] = useState<string>(cartoes[0]?.nome || 'Banco do Brasil Ourocard');
  const [contaManual, setContaManual] = useState<string>(contas[0]?.nome || 'Conta Corrente');
  const [categoriaManual, setCategoriaManual] = useState<string>('Supermercado');

  // Resultado com itens detalhados para a tela de conferência
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
      setModalSefazAberto(false);
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
            setDataManual(decodificado.dataEmissao || new Date().toISOString().slice(0, 10));

            mostrarToast('✓ QR Code da NFC-e lido com sucesso!', 'sucesso');
          },
          () => {}
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

  // Processar texto colado da página da SEFAZ
  const handleProcessarTextoColado = () => {
    if (!textoColado.trim()) {
      alert('Cole o texto ou a tabela de produtos da SEFAZ para extrair os itens.');
      return;
    }

    const resultado = extrairItensDeTextoFiscal(textoColado);
    if (resultado.itens.length === 0) {
      alert('Não encontramos itens reconhecíveis no texto colado. Certifique-se de copiar as linhas da tabela de produtos da SEFAZ.');
      return;
    }

    tocarBipSucesso();
    setResultadoIA(resultado);
    setModalColarTextoAberto(false);
    setTextoColado('');
    setModalConferenciaAberto(true);
  };

  // Lançamento DIRETO no Financeiro
  const handleLancarDiretoQr = () => {
    if (!qrDados) return;

    const valorNumerico = parseFloat(valorManual.replace(',', '.')) || 0;
    if (valorNumerico <= 0) {
      alert('Por favor, informe o valor total da nota antes de lançar.');
      return;
    }

    const ehCredito = formaPagamentoManual === '💳 Crédito';
    const nomeFinalLoja = estabelecimentoManual.trim() || qrDados.estabelecimentoSugerido;

    adicionarLancamento({
      tipo: 'Despesa',
      descricao: nomeFinalLoja,
      valor: parseFloat(valorNumerico.toFixed(2)),
      data: dataManual,
      natureza: '🛒 Alimentação',
      categoria: categoriaManual || 'Supermercado',
      pagamento: formaPagamentoManual,
      cartao: ehCredito ? cartaoManual : undefined,
      conta: !ehCredito ? contaManual : undefined,
      origem: 'meu-mercado',
      detalhesMercado: {
        mercadoNome: nomeFinalLoja,
        dataCompra: dataManual,
        totalItens: 1,
        valorTotal: parseFloat(valorNumerico.toFixed(2)),
        itens: [
          {
            nome: `${nomeFinalLoja} (${qrDados.uf || 'NFC-e'})`,
            quantidade: 1,
            precoUnitario: parseFloat(valorNumerico.toFixed(2)),
            precoTotal: parseFloat(valorNumerico.toFixed(2)),
            categoriaItem: categoriaManual
          }
        ]
      }
    });

    mostrarToast(`✓ Despesa de ${formatarMoeda(valorNumerico)} lançada com sucesso no extrato!`, 'sucesso');
    setQrDados(null);
    onFechar();
  };

  // Abrir tela de conferência detalhada
  const handleAbrirConferenciaDetalhada = () => {
    if (!qrDados) return;

    const valorNumerico = parseFloat(valorManual.replace(',', '.')) || 0;
    if (valorNumerico <= 0) {
      alert('Por favor, informe o valor total da nota.');
      return;
    }

    const resultadoMontado: ResultadoCupomFiscal = {
      estabelecimento: estabelecimentoManual.trim() || qrDados.estabelecimentoSugerido,
      data: dataManual || qrDados.dataEmissao || new Date().toISOString().slice(0, 10),
      valorTotal: valorNumerico,
      desconto: 0,
      formaPagamentoSugerida: formaPagamentoManual,
      naturezaSugerida: '🛒 Alimentação',
      categoriaSugerida: categoriaManual,
      chaveAcesso: qrDados.chaveAcesso,
      itens: [
        {
          id: `item-qr-${Date.now()}`,
          nome: `${estabelecimentoManual.trim() || 'Compra NFC-e'}${qrDados.uf ? ` (${qrDados.uf})` : ''}`,
          quantidade: 1,
          precoUnitario: valorNumerico,
          precoTotal: valorNumerico,
          categoria: categoriaManual,
          selecionado: true
        }
      ]
    };

    setResultadoIA(resultadoMontado);
    setModalConferenciaAberto(true);
  };

  // Processar imagem (foto tirada ou print de tela da SEFAZ) com IA Gemini
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
      setMensagemStatus('Otimizando imagem para leitura nítida de produtos...');
      
      const imagemBase64 = await comprimirImagemParaGemini(file);

      setMensagemStatus('Inteligência Artificial extraindo cada produto, preço e quantidade...');
      const resultado = await processarCupomComGemini(imagemBase64, apiKey);

      tocarBipSucesso();
      setResultadoIA(resultado);
      setModalConferenciaAberto(true);
    } catch (err: any) {
      console.error('Erro na leitura com IA:', err);
      const msg = err.message || 'Falha ao analisar a foto da nota.';
      
      if (msg.includes('API key') || msg.includes('403') || msg.includes('400') || msg.includes('rejeitada')) {
        alert('Chave do Google Gemini rejeitada ou inválida.\n\nToque em "⚙️ Alterar Chave" para inserir sua chave oficial do Google AI Studio.');
        setModalChaveAberto(true);
      } else {
        alert(`Erro na leitura do cupom com IA:\n${msg}`);
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
          maxWidth: '490px',
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
                  Extração Item a Item por IA, Print ou QR Code
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
            /* Card Completo de Resultado do QR Code da NFC-e */
            <div style={{
              padding: '16px',
              borderRadius: '18px',
              backgroundColor: '#132F4C',
              border: '1.5px solid #4CAF50',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Identificação de Sucesso */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4CAF50', fontWeight: 800, fontSize: '13.5px' }}>
                  <CheckCircle2 size={18} />
                  <span>NFC-e Reconhecida com Sucesso!</span>
                </div>
                {qrDados.uf && (
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    backgroundColor: 'rgba(76, 175, 80, 0.25)',
                    color: '#81C784',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    border: '1px solid rgba(76, 175, 80, 0.4)'
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

              {/* BOTÃO PRINCIPAL SOLICITADO: VISUALIZAR NA TELA DO CELULAR */}
              {qrDados.url && (
                <button
                  type="button"
                  onClick={() => setModalSefazAberto(true)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#1976D2',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 3px 12px rgba(25, 118, 210, 0.4)'
                  }}
                >
                  <Eye size={17} />
                  <span>👁️ Abrir Nota da SEFAZ na Tela do Celular</span>
                </button>
              )}

              {/* Opções de Leitura Item por Item */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}>
                {/* Opção A: Tirar print/foto e ler com IA */}
                <button
                  type="button"
                  onClick={() => inputGaleriaRef.current?.click()}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#0A1B30',
                    border: '1.5px solid #265D97',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center'
                  }}
                >
                  <ImageIcon size={18} color="#5090D3" />
                  <span>Ler Print da SEFAZ com IA</span>
                </button>

                {/* Opção B: Colar texto copiado da SEFAZ */}
                <button
                  type="button"
                  onClick={() => setModalColarTextoAberto(true)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#0A1B30',
                    border: '1.5px solid #F8D117',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    textAlign: 'center'
                  }}
                >
                  <ClipboardPaste size={18} color="#F8D117" />
                  <span>Colar Texto da SEFAZ</span>
                </button>
              </div>

              {/* Formulário de Lançamento Direto com Categoria Pesquisável */}
              <div style={{
                backgroundColor: '#0A1B30',
                padding: '14px',
                borderRadius: '14px',
                border: '1px solid #1E3A5F',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#F8D117', borderBottom: '1px solid #1E3A5F', paddingBottom: '6px' }}>
                  Lançamento Rápido no Financeiro:
                </div>

                {/* Campo de Valor Total */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#F8D117', marginBottom: '4px' }}>
                    VALOR TOTAL DA NOTA (R$):
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#132F4C',
                    border: '1.5px solid #F8D117',
                    borderRadius: '10px',
                    height: '46px',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{
                      padding: '0 12px',
                      backgroundColor: 'rgba(248, 209, 23, 0.15)',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      color: '#F8D117',
                      fontWeight: 900,
                      fontSize: '15px'
                    }}>
                      R$
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      value={valorManual}
                      onChange={(e) => setValorManual(e.target.value)}
                      placeholder="0.00"
                      style={{
                        flex: 1,
                        height: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: '18px',
                        fontWeight: 900,
                        padding: '0 12px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Campo de Estabelecimento */}
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#CBD5E1', marginBottom: '4px' }}>
                    ESTABELECIMENTO:
                  </label>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#132F4C',
                    border: '1px solid #265D97',
                    borderRadius: '10px',
                    height: '42px',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}>
                    <div style={{ padding: '0 10px', color: '#8A99AD' }}>
                      <Store size={16} />
                    </div>
                    <input
                      type="text"
                      value={estabelecimentoManual}
                      onChange={(e) => setEstabelecimentoManual(e.target.value)}
                      placeholder="Ex: Supermercado"
                      style={{
                        flex: 1,
                        height: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 700,
                        padding: '0 8px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Categoria com Campo de Pesquisa Inteligente */}
                <div>
                  <SeletorCategoriaPesquisa
                    valor={categoriaManual}
                    onSelecionar={(cat) => setCategoriaManual(cat)}
                    placeholder="Pesquisar categoria (ex: Supermercado, Carne...)"
                  />
                </div>

                {/* Data e Pagamento */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: '#8A99AD', marginBottom: '4px' }}>
                      <Calendar size={12} color="#5090D3" />
                      DATA:
                    </label>
                    <input
                      type="date"
                      value={dataManual}
                      onChange={(e) => setDataManual(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: '#132F4C',
                        border: '1px solid #265D97',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '0 8px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: '#8A99AD', marginBottom: '4px' }}>
                      <CreditCard size={12} color="#4CAF50" />
                      PAGAMENTO:
                    </label>
                    <select
                      value={formaPagamentoManual}
                      onChange={(e) => setFormaPagamentoManual(e.target.value as FormaPagamento)}
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: '#132F4C',
                        border: '1px solid #265D97',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '0 6px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="💳 Crédito">💳 Crédito</option>
                      <option value="💳 Débito">💳 Débito</option>
                      <option value="📱 Pix">📱 Pix</option>
                      <option value="💵 Dinheiro">💵 Dinheiro</option>
                    </select>
                  </div>
                </div>

                {formaPagamentoManual === '💳 Crédito' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#8A99AD', marginBottom: '4px' }}>
                      CARTÃO DE CRÉDITO:
                    </label>
                    <select
                      value={cartaoManual}
                      onChange={(e) => setCartaoManual(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: '#132F4C',
                        border: '1px solid #265D97',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '0 8px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {cartoes.map(c => (
                        <option key={c.id} value={c.nome}>{c.nome}</option>
                      ))}
                      {cartoes.length === 0 && (
                        <option value="Cartão Padrão">Cartão Padrão</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 700, color: '#8A99AD', marginBottom: '4px' }}>
                      CONTA DE SAÍDA:
                    </label>
                    <select
                      value={contaManual}
                      onChange={(e) => setContaManual(e.target.value)}
                      style={{
                        width: '100%',
                        height: '38px',
                        backgroundColor: '#132F4C',
                        border: '1px solid #265D97',
                        borderRadius: '8px',
                        color: '#FFFFFF',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '0 8px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {contas.map(ct => (
                        <option key={ct.id} value={ct.nome}>{ct.nome}</option>
                      ))}
                      {contas.length === 0 && (
                        <option value="Conta Corrente">Conta Corrente</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleLancarDiretoQr}
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
                    boxShadow: '0 4px 14px rgba(76, 175, 80, 0.45)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Confirmar e Lançar Despesa</span>
                </button>

                <button
                  type="button"
                  onClick={handleAbrirConferenciaDetalhada}
                  style={{
                    padding: '10px',
                    borderRadius: '12px',
                    backgroundColor: '#132F4C',
                    border: '1px solid #265D97',
                    color: '#CBD5E1',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <ListFilter size={15} color="#5090D3" />
                  <span>Conferência Detalhada de Produtos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQrDados(null)}
                  style={{
                    padding: '6px',
                    background: 'none',
                    border: 'none',
                    color: '#8A99AD',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <RotateCcw size={12} />
                  <span>Ler outro cupom</span>
                </button>
              </div>
            </div>
          ) : (
            /* Opções Principais de Captura */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Opção 1: Câmera com IA (Foto da Nota ou Print) */}
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
                      Item a Item
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#8A99AD', display: 'block', marginTop: '2px' }}>
                    Fotografe o cupom inteiro. A IA extrai produtos, preços e total item por item.
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
                  textAlign: 'left'
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
                    Aponte para o QR Code da NFC-e e veja a nota oficial da SEFAZ na tela.
                  </span>
                </div>
              </button>

              {/* Opção 3: Print de Tela ou Foto da Galeria */}
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
                  textAlign: 'left'
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
                    Escolher Foto ou Print da SEFAZ (Galeria)
                  </div>
                  <span style={{ fontSize: '11px', color: '#8A99AD', display: 'block', marginTop: '2px' }}>
                    Envie o print de tela do site da SEFAZ ou foto salva no celular.
                  </span>
                </div>
              </button>

              {/* Opção 4: Colar Texto Copiado da SEFAZ */}
              <button
                type="button"
                onClick={() => setModalColarTextoAberto(true)}
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
                  textAlign: 'left'
                }}
              >
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(248, 209, 23, 0.12)',
                  border: '1px solid rgba(248, 209, 23, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F8D117',
                  flexShrink: 0
                }}>
                  <ClipboardPaste size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#FFFFFF' }}>
                    Colar Texto Copiado da SEFAZ
                  </div>
                  <span style={{ fontSize: '11px', color: '#8A99AD', display: 'block', marginTop: '2px' }}>
                    Copie a tabela da SEFAZ e cole aqui para extrair todos os itens em 1 segundo.
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Inputs invisíveis de foto e print */}
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

      {/* MODAL SOLICITADO: VISUALIZADOR DA NOTA DA SEFAZ NA TELA DO CELULAR */}
      {modalSefazAberto && qrDados?.url && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.92)',
          zIndex: 120,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Barra superior de controle */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#0F2744',
            borderBottom: '1.5px solid #1E3A5F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={18} color="#F8D117" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: '#FFFFFF' }}>
                  Nota Fiscal SEFAZ ({qrDados.ufNome || qrDados.uf || 'Brasil'})
                </div>
                <div style={{ fontSize: '10.5px', color: '#8A99AD' }}>
                  Visualize na tela, copie o texto ou envie um print
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalSefazAberto(false)}
              style={{
                background: '#132F4C',
                border: '1px solid #1E3A5F',
                borderRadius: '8px',
                color: '#CBD5E1',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              ✕ Fechar Visualizador
            </button>
          </div>

          {/* Barra de Ações Rápidas da SEFAZ */}
          <div style={{
            padding: '8px 12px',
            backgroundColor: '#0A1B30',
            borderBottom: '1px solid #1E3A5F',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto'
          }}>
            <button
              type="button"
              onClick={() => {
                setModalSefazAberto(false);
                inputGaleriaRef.current?.click();
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#1976D2',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <ImageIcon size={14} />
              <span>📸 Ler Print da SEFAZ com IA</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalSefazAberto(false);
                setModalColarTextoAberto(true);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#F8D117',
                border: 'none',
                color: '#0A1B30',
                fontSize: '11.5px',
                fontWeight: 900,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <ClipboardPaste size={14} />
              <span>📋 Colar Texto Copiado da SEFAZ</span>
            </button>

            <button
              type="button"
              onClick={() => window.open(qrDados.url, '_blank')}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#132F4C',
                border: '1px solid #1E3A5F',
                color: '#CBD5E1',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap'
              }}
            >
              <ExternalLink size={14} />
              <span>Abrir no Chrome</span>
            </button>
          </div>

          {/* Iframe que exibe a SEFAZ diretamente na tela do celular */}
          <div style={{ flex: 1, position: 'relative', backgroundColor: '#FFFFFF' }}>
            <iframe
              src={qrDados.url}
              title="Portal da SEFAZ"
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* MODAL PARA COLAR TEXTO DA SEFAZ */}
      {modalColarTextoAberto && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(5, 12, 22, 0.88)',
          zIndex: 125,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            maxWidth: '500px',
            width: '100%',
            backgroundColor: '#0F2744',
            border: '1.5px solid #1E3A5F',
            borderRadius: '20px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 12px 35px rgba(0,0,0,0.7)',
            color: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardPaste size={18} color="#F8D117" />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  Colar Texto da SEFAZ
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalColarTextoAberto(false)}
                style={{ background: 'none', border: 'none', color: '#8A99AD', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '11.5px', color: '#CBD5E1', lineHeight: 1.4 }}>
              Na página da SEFAZ, selecione o texto com os produtos da nota fiscal, copie e cole na caixa abaixo:
            </p>

            <textarea
              value={textoColado}
              onChange={(e) => setTextoColado(e.target.value)}
              placeholder="Cole aqui o texto copiado da SEFAZ..."
              rows={8}
              style={{
                width: '100%',
                backgroundColor: '#0A1B30',
                border: '1.5px solid #265D97',
                borderRadius: '12px',
                color: '#FFFFFF',
                fontSize: '12px',
                padding: '10px',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setModalColarTextoAberto(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#132F4C',
                  border: '1px solid #1E3A5F',
                  color: '#CBD5E1',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessarTextoColado}
                style={{
                  flex: 1.5,
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#4CAF50',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '12.5px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={16} />
                <span>Extrair Todos os Produtos</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
          setQrDados(null);
          onFechar();
        }}
      />
    </>
  );
};
