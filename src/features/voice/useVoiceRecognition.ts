import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  interpretarComandoVoz, 
  detectarComandoConfirmacao, 
  type VozInterpretada 
} from './voiceInterpreter';

// Declaração de tipos para a Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface VoiceRecognitionOptions {
  onResultadoFinal?: (res: VozInterpretada) => void;
  onComandoConfirmar?: () => void;
}

export interface UseVoiceRecognitionReturn {
  estaOuvindo: boolean;
  transcricao: string;
  resultado: VozInterpretada | null;
  suportado: boolean;
  erro: string | null;
  iniciarGravacao: (preservarResultado?: boolean) => void;
  pararGravacao: () => void;
  limparResultado: () => void;
}

/**
 * Remove duplicações consecutivas causadas por bugs de streaming no Android WebView
 */
function removerRepeticoes(texto: string): string {
  if (!texto) return '';
  const trimmed = texto.trim();
  const partes = trimmed.split(/\s+/);
  
  // Se houver repetição exata da frase inteira (ex: "A B C A B C")
  if (partes.length >= 4 && partes.length % 2 === 0) {
    const meio = partes.length / 2;
    const p1 = partes.slice(0, meio).join(' ');
    const p2 = partes.slice(meio).join(' ');
    if (p1.toLowerCase() === p2.toLowerCase()) {
      return p1;
    }
  }

  // Filtrar palavras consecutivas duplicadas (ex: "cimento cimento")
  const filtradas: string[] = [];
  for (let i = 0; i < partes.length; i++) {
    if (i === 0 || partes[i].toLowerCase() !== partes[i - 1].toLowerCase()) {
      filtradas.push(partes[i]);
    }
  }
  return filtradas.join(' ');
}

export function useVoiceRecognition(
  opcoes?: ((res: VozInterpretada) => void) | VoiceRecognitionOptions
): UseVoiceRecognitionReturn {
  const onResultadoFinal = typeof opcoes === 'function' ? opcoes : opcoes?.onResultadoFinal;
  const onComandoConfirmar = typeof opcoes === 'object' ? opcoes.onComandoConfirmar : undefined;

  const [estaOuvindo, setEstaOuvindo] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [resultado, setResultado] = useState<VozInterpretada | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const debounceTimerRef = useRef<any>(null);
  const maxTimerRef = useRef<any>(null);
  const textoAtualRef = useRef<string>('');

  const SpeechRecognition = typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
    : null;

  const suportado = Boolean(SpeechRecognition);

  const limparTimers = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  const finalizarComTexto = useCallback((texto: string) => {
    const textoLimpo = removerRepeticoes(texto);
    if (!textoLimpo) return;

    if (onComandoConfirmar && detectarComandoConfirmacao(textoLimpo)) {
      onComandoConfirmar();
      return;
    }

    try {
      const interpretado = interpretarComandoVoz(textoLimpo);
      setResultado(interpretado);
      if (onResultadoFinal && interpretado.sucesso) {
        onResultadoFinal(interpretado);
      }
    } catch (e) {
      console.error('Erro ao interpretar comando de voz:', e);
    }
  }, [onResultadoFinal, onComandoConfirmar]);

  const abortarInstanciaAnterior = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (_) {}
      recognitionRef.current = null;
    }
  }, []);

  const pararGravacao = useCallback(() => {
    limparTimers();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setEstaOuvindo(false);

    const texto = textoAtualRef.current;
    if (texto) {
      finalizarComTexto(texto);
    }
  }, [limparTimers, finalizarComTexto]);

  const iniciarGravacao = useCallback((preservarResultado: boolean = false) => {
    if (!SpeechRecognition) {
      setErro('Seu navegador não suporta reconhecimento de voz nativo. Use o Google Chrome ou ative as permissões.');
      return;
    }

    limparTimers();
    abortarInstanciaAnterior();

    setErro(null);
    setTranscricao('');
    if (!preservarResultado) {
      setResultado(null);
    }
    textoAtualRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      
      const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setEstaOuvindo(true);
      };

      recognition.onresult = (event: any) => {
        let textoFinal = '';
        let textoInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            textoFinal += res[0].transcript + ' ';
          } else {
            textoInterim += res[0].transcript + ' ';
          }
        }

        const textoBruto = (textoFinal + textoInterim).trim();
        const textoProcessado = removerRepeticoes(textoBruto);
        textoAtualRef.current = textoProcessado;
        setTranscricao(textoProcessado);

        if (onComandoConfirmar && detectarComandoConfirmacao(textoProcessado)) {
          onComandoConfirmar();
          return;
        }

        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          if (textoAtualRef.current) {
            finalizarComTexto(textoAtualRef.current);
          }
        }, 220);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition erro:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setErro('Permissão de microfone negada. Conceda acesso nas permissões do navegador.');
        } else if (event.error === 'no-speech') {
          // Apenas silêncio temporário
        } else if (event.error === 'aborted') {
          // Abort proposital ao reiniciar
        } else {
          setErro(`Microfone: ${event.error}`);
        }
        setEstaOuvindo(false);
      };

      recognition.onend = () => {
        setEstaOuvindo(false);
        if (textoAtualRef.current) {
          finalizarComTexto(textoAtualRef.current);
        }
      };

      maxTimerRef.current = setTimeout(() => {
        pararGravacao();
      }, 15000);

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (startErr: any) {
        console.warn('SpeechRecognition.start falhou diretamente, tentando limpar e rearmar:', startErr);
        abortarInstanciaAnterior();
        setTimeout(() => {
          try {
            const novaRec = new SpeechRecognition();
            novaRec.lang = 'pt-BR';
            novaRec.continuous = !isMobile;
            novaRec.interimResults = true;
            novaRec.maxAlternatives = 1;
            novaRec.onstart = recognition.onstart;
            novaRec.onresult = recognition.onresult;
            novaRec.onerror = recognition.onerror;
            novaRec.onend = recognition.onend;
            recognitionRef.current = novaRec;
            novaRec.start();
          } catch (e2) {
            console.error('Falha ao reiniciar SpeechRecognition:', e2);
            setErro('Toque no microfone novamente para ativar.');
            setEstaOuvindo(false);
          }
        }, 100);
      }
    } catch (err: any) {
      console.error('Falha ao instanciar SpeechRecognition:', err);
      setErro('Não foi possível iniciar o microfone no momento. Toque para tentar.');
      setEstaOuvindo(false);
    }
  }, [SpeechRecognition, limparTimers, abortarInstanciaAnterior, pararGravacao, finalizarComTexto, onComandoConfirmar]);

  const limparResultado = useCallback(() => {
    limparTimers();
    abortarInstanciaAnterior();
    textoAtualRef.current = '';
    setTranscricao('');
    setResultado(null);
    setErro(null);
  }, [limparTimers, abortarInstanciaAnterior]);

  useEffect(() => {
    return () => {
      limparTimers();
      abortarInstanciaAnterior();
    };
  }, [limparTimers, abortarInstanciaAnterior]);

  return {
    estaOuvindo,
    transcricao,
    resultado,
    suportado,
    erro,
    iniciarGravacao,
    pararGravacao,
    limparResultado,
  };
}
