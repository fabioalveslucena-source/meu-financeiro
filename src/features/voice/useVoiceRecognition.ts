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

  const SpeechRecognition = typeof window !== 'undefined' 
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) 
    : null;

  const suportado = Boolean(SpeechRecognition);

  const pararGravacao = useCallback(() => {
    if (recognitionRef.current && estaOuvindo) {
      recognitionRef.current.stop();
    }
    setEstaOuvindo(false);
  }, [estaOuvindo]);

  const iniciarGravacao = useCallback(() => {
    if (!SpeechRecognition) {
      setErro('Seu navegador não suporta reconhecimento de voz nativo.');
      return;
    }

    setErro(null);
    setTranscricao('');
    setResultado(null);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setEstaOuvindo(true);
      };

      recognition.onresult = (event: any) => {
        let textoAtual = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          textoAtual += event.results[i][0].transcript;
        }
        setTranscricao(textoAtual);

        if (event.results[0].isFinal) {
          const interpretado = interpretarComandoVoz(textoAtual);
          setResultado(interpretado);
          if (interpretado.sucesso && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try { navigator.vibrate(40); } catch (_) {}
          }
          if (onResultadoFinal) {
            onResultadoFinal(interpretado);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        if (event.error === 'not-allowed') {
          setErro('Permissão de microfone negada. Conceda acesso nas configurações do navegador.');
        } else if (event.error === 'no-speech') {
          setErro('Nenhuma fala foi detectada. Tente falar mais próximo do microfone.');
        } else {
          setErro(`Erro no microfone: ${event.error}`);
        }
        setEstaOuvindo(false);
      };

      recognition.onend = () => {
        setEstaOuvindo(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Falha ao iniciar SpeechRecognition:', err);
      setErro('Não foi possível iniciar o microfone.');
      setEstaOuvindo(false);
    }
  }, [SpeechRecognition, onResultadoFinal]);

  const limparResultado = useCallback(() => {
    setTranscricao('');
    setResultado(null);
    setErro(null);
  }, []);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

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
