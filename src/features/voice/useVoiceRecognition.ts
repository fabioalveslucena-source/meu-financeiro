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

export function useVoiceRecognition(onResultadoFinal?: (res: VozInterpretada) => void): UseVoiceRecognitionReturn {
  const [estaOuvindo, setEstaOuvindo] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [resultado, setResultado] = useState<VozInterpretada | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const silencioTimerRef = useRef<any>(null);
  const textoAtualRef = useRef<string>('');

  const SpeechRecognition = typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
    : null;

  const suportado = Boolean(SpeechRecognition);

  const limparTimerSilencio = useCallback(() => {
    if (silencioTimerRef.current) {
      clearTimeout(silencioTimerRef.current);
      silencioTimerRef.current = null;
    }
  }, []);

  const pararGravacao = useCallback(() => {
    limparTimerSilencio();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    setEstaOuvindo(false);

    // Finalizar com o texto acumulado até o momento
    const textoFinal = textoAtualRef.current.trim();
    if (textoFinal) {
      const interpretado = interpretarComandoVoz(textoFinal);
      setResultado(interpretado);
      if (onResultadoFinal && interpretado.sucesso) {
        onResultadoFinal(interpretado);
      }
    }
  }, [limparTimerSilencio, onResultadoFinal]);

  const iniciarGravacao = useCallback(() => {
    if (!SpeechRecognition) {
      setErro('Seu navegador não suporta reconhecimento de voz nativo.');
      return;
    }

    limparTimerSilencio();
    setErro(null);
    setTranscricao('');
    setResultado(null);
    textoAtualRef.current = '';

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = true; // Permite pausas naturais entre palavras
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setEstaOuvindo(true);
      };

      recognition.onresult = (event: any) => {
        let textoCompleto = '';
        for (let i = 0; i < event.results.length; i++) {
          textoCompleto += event.results[i][0].transcript + ' ';
        }
        textoCompleto = textoCompleto.trim();
        textoAtualRef.current = textoCompleto;
        setTranscricao(textoCompleto);

        // Interpretar em tempo real para o usuário visualizar o entendimento instantâneo
        const interpretado = interpretarComandoVoz(textoCompleto);
        if (interpretado.sucesso || textoCompleto.length > 5) {
          setResultado(interpretado);
        }

        // Renovar timer de pausa: aguarda 1.8 segundos de silêncio antes de finalizar automaticamente
        limparTimerSilencio();
        silencioTimerRef.current = setTimeout(() => {
          pararGravacao();
        }, 1800);
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed') {
          setErro('Permissão de microfone negada. Conceda acesso nas configurações do navegador.');
        } else if (event.error === 'no-speech') {
          // No-speech é ignorado suavemente se houver texto já falado
          if (!textoAtualRef.current) {
            setErro('Nenhuma fala detectada. Clique no microfone e tente falar novamente.');
          }
        } else {
          setErro(`Erro no microfone: ${event.error}`);
        }
        setEstaOuvindo(false);
      };

      recognition.onend = () => {
        setEstaOuvindo(false);
        // Garantir que a transcrição final é processada
        const finalTexto = textoAtualRef.current.trim();
        if (finalTexto) {
          const interpretado = interpretarComandoVoz(finalTexto);
          setResultado(interpretado);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Falha ao iniciar SpeechRecognition:', err);
      setErro('Não foi possível iniciar o microfone.');
      setEstaOuvindo(false);
    }
  }, [SpeechRecognition, limparTimerSilencio, pararGravacao]);

  const limparResultado = useCallback(() => {
    limparTimerSilencio();
    textoAtualRef.current = '';
    setTranscricao('');
    setResultado(null);
    setErro(null);
  }, [limparTimerSilencio]);

  useEffect(() => {
    return () => {
      limparTimerSilencio();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [limparTimerSilencio]);

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
