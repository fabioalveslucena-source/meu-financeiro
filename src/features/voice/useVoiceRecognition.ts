import { useState, useEffect, useRef, useCallback } from 'react';
import { interpretarComandoVoz, type VozInterpretada } from './voiceInterpreter';

// Declaração de tipos para a Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseVoiceRecognitionReturn {
  estaOuvindo: boolean;
  transcricao: string;
  resultado: VozInterpretada | null;
  suportado: boolean;
  erro: string | null;
  iniciarGravacao: () => void;
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

export function useVoiceRecognition(onResultadoFinal?: (res: VozInterpretada) => void): UseVoiceRecognitionReturn {
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

    try {
      const interpretado = interpretarComandoVoz(textoLimpo);
      setResultado(interpretado);
      if (onResultadoFinal && interpretado.sucesso) {
        onResultadoFinal(interpretado);
      }
    } catch (e) {
      console.error('Erro ao interpretar comando de voz:', e);
    }
  }, [onResultadoFinal]);

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

  const iniciarGravacao = useCallback(() => {
    if (!SpeechRecognition) {
      setErro('Seu navegador não suporta reconhecimento de voz nativo.');
      return;
    }

    limparTimers();
    setErro(null);
    setTranscricao('');
    setResultado(null);
    textoAtualRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      
      // No Android WebView e mobile, continuous=false é crucial para evitar loop infinito de buffers
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

        // Debounce da interpretação para não travar a thread UI no celular
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
        if (event.error === 'not-allowed') {
          setErro('Permissão de microfone negada. Conceda acesso nas permissões do app.');
        } else if (event.error === 'no-speech') {
          if (!textoAtualRef.current) {
            setErro('Nenhuma fala detectada. Toque no microfone e fale perto do celular.');
          }
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

      // Watchdog de segurança: máximo 12 segundos gravando para não prender o usuário
      maxTimerRef.current = setTimeout(() => {
        pararGravacao();
      }, 12000);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Falha ao iniciar SpeechRecognition:', err);
      setErro('Não foi possível iniciar o microfone no momento.');
      setEstaOuvindo(false);
    }
  }, [SpeechRecognition, limparTimers, pararGravacao, finalizarComTexto]);

  const limparResultado = useCallback(() => {
    limparTimers();
    textoAtualRef.current = '';
    setTranscricao('');
    setResultado(null);
    setErro(null);
  }, [limparTimers]);

  useEffect(() => {
    return () => {
      limparTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, [limparTimers]);

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
