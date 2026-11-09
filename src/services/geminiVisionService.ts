/**
 * Serviço de Visão Computacional com Google Gemini
 * Analisa fotos de cupons fiscais e prints de tela da SEFAZ (NFC-e / SAT / Danfe) e extrai dados estruturados.
 */

export interface ItemCupomFiscal {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
  categoria?: string;
  selecionado: boolean;
}

export interface ResultadoCupomFiscal {
  estabelecimento: string;
  data: string; // YYYY-MM-DD
  hora?: string;
  valorTotal: number;
  desconto: number;
  formaPagamentoSugerida: string;
  naturezaSugerida: string;
  categoriaSugerida: string;
  itens: ItemCupomFiscal[];
  chaveAcesso?: string;
}

/**
 * Limpa e padroniza a chave da API do Gemini
 */
export function limparChaveGemini(key: string): string {
  if (!key) return '';
  return key.trim().replace(/^['"\s;:]+|['"\s;:]+$/g, '');
}

/**
 * Consulta a API do Google para descobrir quais modelos ultra-rápidos estão liberados
 */
export async function obterModeloGeminiValido(apiKey: string): Promise<string> {
  const chaveLimpa = limparChaveGemini(apiKey);
  if (!chaveLimpa) {
    throw new Error('Chave da API do Google Gemini não informada.');
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${chaveLimpa}`);
    if (res.ok) {
      const data = await res.json();
      const modelosDisponiveis: string[] = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        .map((m: any) => m.name.replace(/^models\//, ''));

      // Modelos ultra-rápidos em primeiro lugar (resposta em ~1 segundo)
      const preferencias = [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-flash-lite-latest',
        'gemini-flash-latest',
        'gemini-3.1-flash-lite'
      ];

      for (const pref of preferencias) {
        if (modelosDisponiveis.includes(pref)) {
          return pref;
        }
      }

      const algumFlash = modelosDisponiveis.find(m => m.includes('flash') && !m.includes('3.8'));
      if (algumFlash) return algumFlash;
    } else {
      const errData = await res.json().catch(() => null);
      const msg = errData?.error?.message || res.statusText;
      if (res.status === 400 || res.status === 403) {
        throw new Error(`Chave rejeitada pelo Google (${res.status}): ${msg}`);
      }
    }
  } catch (err: any) {
    if (err.message?.includes('rejeitada') || err.message?.includes('API key') || err.message?.includes('403') || err.message?.includes('400')) {
      throw err;
    }
  }

  // Fallback padrão de alta velocidade
  return 'gemini-3.5-flash-lite';
}

/**
 * Redimensiona e comprime uma imagem para envio rápido à API do Gemini
 */
export async function comprimirImagemParaGemini(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string).split(',')[1]);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extrai objeto JSON mesmo se houver texto adicional ou blocos markdown
 */
function extrairJsonDeTexto(texto: string): any {
  if (!texto) throw new Error('A inteligência artificial retornou resposta vazia.');

  // 1. Tenta achar bloco ```json ... ```
  const matchBloco = texto.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (matchBloco) {
    try {
      return JSON.parse(matchBloco[1].trim());
    } catch {}
  }

  // 2. Tenta achar substring do primeiro '{' até o último '}'
  const inicio = texto.indexOf('{');
  const fim = texto.lastIndexOf('}');
  if (inicio !== -1 && fim !== -1 && fim > inicio) {
    const substring = texto.substring(inicio, fim + 1);
    try {
      return JSON.parse(substring);
    } catch {}
  }

  // 3. Fallback parse direto
  return JSON.parse(texto.trim());
}

/**
 * Processa a imagem do cupom fiscal com Google Gemini Vision
 */
export async function processarCupomComGemini(
  imagemBase64: string,
  apiKey: string
): Promise<ResultadoCupomFiscal> {
  const chaveLimpa = limparChaveGemini(apiKey);
  if (!chaveLimpa) {
    throw new Error('Chave da API do Google Gemini não configurada. Configure sua chave para continuar.');
  }

  const prompt = `
Você é um auditor fiscal especialista em OCR tributário brasileiro.
Analise com extrema precisão esta imagem de cupom fiscal (NFC-e, SAT, ECF ou Danfe).
Extraia os dados em um formato JSON estritamente válido.

Estrutura JSON obrigatória:
{
  "estabelecimento": "Nome da loja ou supermercado",
  "data": "YYYY-MM-DD",
  "hora": "HH:mm",
  "valorTotal": 0.00,
  "desconto": 0.00,
  "formaPagamentoSugerida": "💳 Crédito",
  "naturezaSugerida": "🛒 Alimentação",
  "categoriaSugerida": "Supermercado",
  "chaveAcesso": "",
  "itens": [
    {
      "nome": "Nome limpo do produto",
      "quantidade": 1.0,
      "precoUnitario": 10.00,
      "precoTotal": 10.00,
      "categoria": "Supermercado"
    }
  ]
}

Regras:
1. Inclua CADA UM dos itens listados no cupom sem omitir nenhum produto.
2. Quantidade, precoUnitario e precoTotal devem ser números float.
3. Não inclua texto explicativo fora do JSON.
`;

  // Modelos ultra-rápidos para resposta em ~1 segundo
  let modeloDescoberto = 'gemini-3.5-flash-lite';
  try {
    modeloDescoberto = await obterModeloGeminiValido(chaveLimpa);
  } catch (err: any) {
    if (err.message?.includes('rejeitada') || err.message?.includes('API key') || err.message?.includes('403') || err.message?.includes('400')) {
      throw new Error(`Chave do Gemini rejeitada pelo Google: ${err.message}`);
    }
  }

  const rotasDeTentativa = [
    `https://generativelanguage.googleapis.com/v1beta/models/${modeloDescoberto}:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${chaveLimpa}`
  ];

  const rotasUnicas = Array.from(new Set(rotasDeTentativa));
  let ultimoErro: any = null;

  for (const url of rotasUnicas) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos de timeout máximo

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imagemBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const erroJson = await response.json().catch(() => null);
        const msg = erroJson?.error?.message || response.statusText;
        if (response.status === 400 || response.status === 403) {
          throw new Error(`Erro na API Gemini (${response.status}): ${msg}`);
        }
        ultimoErro = new Error(msg);
        continue;
      }

      const json = await response.json();
      const parts = json?.candidates?.[0]?.content?.parts || [];
      const partComTexto = parts.find((p: any) => p.text) || parts[0];
      const textoResposta = partComTexto?.text;

      if (!textoResposta) {
        throw new Error('A inteligência artificial não retornou dados para este cupom.');
      }

      const dadosExtraidos = extrairJsonDeTexto(textoResposta);

      // Normalizar itens com IDs únicos e checkbox marcado
      const itensNormalizados: ItemCupomFiscal[] = (dadosExtraidos.itens || []).map(
        (it: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          nome: it.nome || `Item ${idx + 1}`,
          quantidade: Number(it.quantidade) || 1,
          precoUnitario: Number(it.precoUnitario) || Number(it.precoTotal) || 0,
          precoTotal: Number(it.precoTotal) || Number(it.precoUnitario) || 0,
          categoria: it.categoria || 'Supermercado',
          selecionado: true
        })
      );

      // Calcular valor total somado se não fornecido
      const totalItens = itensNormalizados.reduce((acc, curr) => acc + curr.precoTotal, 0);
      const valorTotalFinal = Number(dadosExtraidos.valorTotal) || totalItens;

      return {
        estabelecimento: dadosExtraidos.estabelecimento || 'Compra Fiscal',
        data: dadosExtraidos.data || new Date().toISOString().slice(0, 10),
        hora: dadosExtraidos.hora,
        valorTotal: valorTotalFinal,
        desconto: Number(dadosExtraidos.desconto) || 0,
        formaPagamentoSugerida: dadosExtraidos.formaPagamentoSugerida || '💳 Crédito',
        naturezaSugerida: dadosExtraidos.naturezaSugerida || '🛒 Alimentação',
        categoriaSugerida: dadosExtraidos.categoriaSugerida || 'Supermercado',
        chaveAcesso: dadosExtraidos.chaveAcesso,
        itens: itensNormalizados
      };
    } catch (err: any) {
      ultimoErro = err;
      if (err.message?.includes('API key') || err.message?.includes('rejeitada') || err.message?.includes('403') || err.message?.includes('400')) {
        throw err;
      }
    }
  }

  throw ultimoErro || new Error('Não foi possível processar a imagem do cupom.');
}

/**
 * Toca um bip sonoro de sucesso sintetizado pelo navegador
 */
export function tocarBipSucesso() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);

    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
  } catch {
    // Silencioso se bloqueado
  }
}
