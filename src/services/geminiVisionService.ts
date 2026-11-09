/**
 * Serviço de Visão Computacional com Google Gemini
 * Analisa fotos de cupons fiscais (NFC-e / SAT / Danfe) e extrai dados estruturados.
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
 * Consulta a API do Google para descobrir quais modelos estão disponíveis para a chave do usuário
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

      // Ordem de preferência de modelos multimodais de alta velocidade e precisão
      const preferencias = [
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro'
      ];

      for (const pref of preferencias) {
        if (modelosDisponiveis.includes(pref)) {
          return pref;
        }
      }

      const algumFlash = modelosDisponiveis.find(m => m.includes('flash'));
      if (algumFlash) return algumFlash;

      const algumGemini = modelosDisponiveis.find(m => m.includes('gemini'));
      if (algumGemini) return algumGemini;
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

  // Fallback padrão seguro
  return 'gemini-2.0-flash';
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
        const maxDim = 1600; // Resolução suficiente para leitura de texto térmico
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
        // Formato JPEG comprimido
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
 * Processa a imagem do cupom fiscal com Google Gemini Vision
 */
export async function processarCupomComGemini(
  imagemBase64: string,
  apiKey: string
): Promise<ResultadoCupomFiscal> {
  const chaveLimpa = limparChaveGemini(apiKey);
  if (!chaveLimpa) {
    throw new Error('Chave da API do Google Gemini não configurada. Configure sua chave gratuita para continuar.');
  }

  const prompt = `
Você é um especialista em OCR e auditoria fiscal brasileira.
Analise com extrema precisão esta imagem de cupom fiscal (NFC-e, SAT, ECF ou Danfe Simplificado).
Extraia os dados em um formato JSON estritamente válido, sem texto antes ou depois.

Regras de Extração:
1. "estabelecimento": Razão social ou nome fantasia da loja/supermercado/farmácia/posto/restaurante. Limpo, com a primeira letra maiúscula de cada palavra.
2. "data": Data da compra no formato YYYY-MM-DD. Se não conseguir ler com clareza, use a data de hoje.
3. "hora": Hora da compra no formato HH:mm (se disponível).
4. "valorTotal": Valor total final pago pelo cliente (número float, ex: 124.50).
5. "desconto": Valor do desconto se houver (número float, ou 0).
6. "formaPagamentoSugerida": Qual forma foi usada (ex: "💳 Crédito", "💳 Débito", "📱 Pix", "💵 Dinheiro").
7. "naturezaSugerida": Natureza financeira correspondente: "🛒 Alimentação" (se supermercado/mercearia/padaria), "💊 Saúde" (se farmácia), "⛽ Transporte" (se posto de combustível), "🍽️ Refeição" (se restaurante), ou "📦 Geral".
8. "categoriaSugerida": Nome da categoria financeira (ex: "Supermercado", "Farmácia", "Combustível", "Padaria").
9. "chaveAcesso": Chave de acesso de 44 dígitos se visível (apenas números).
10. "itens": Lista com TODOS os produtos listados. Para cada item:
   - "nome": Nome limpo e claro do produto, expandindo abreviações fiscais confusas (ex: "LEIT COND MOCOCA TP 395G" vira "Leite Condensado Mococa 395g").
   - "quantidade": Quantidade numérica (float, ex: 1 ou 1.250).
   - "precoUnitario": Valor unitário do item (float).
   - "precoTotal": Valor total do item (float).
   - "categoria": Categoria amigável do item (ex: "Mercearia", "Hortifruti", "Carnes", "Laticínios", "Bebidas", "Limpeza", "Higiene", "Medicamentos").

Responda APENAS o JSON puro com esta estrutura:
{
  "estabelecimento": "Supermercado Exemplo",
  "data": "2026-11-08",
  "hora": "15:30",
  "valorTotal": 54.90,
  "desconto": 0,
  "formaPagamentoSugerida": "💳 Crédito",
  "naturezaSugerida": "🛒 Alimentação",
  "categoriaSugerida": "Supermercado",
  "chaveAcesso": "",
  "itens": [
    {
      "nome": "Arroz Branco Tipo 1 5kg",
      "quantidade": 1,
      "precoUnitario": 28.90,
      "precoTotal": 28.90,
      "categoria": "Mercearia"
    }
  ]
}
`;

  // Descobre dinamicamente o modelo suportado pela conta do usuário
  let modeloDescoberto = 'gemini-2.0-flash';
  try {
    modeloDescoberto = await obterModeloGeminiValido(chaveLimpa);
  } catch (err: any) {
    if (err.message?.includes('rejeitada') || err.message?.includes('API key') || err.message?.includes('403') || err.message?.includes('400')) {
      throw new Error(`Chave do Gemini inválida ou não autorizada. Verifique sua chave no Google AI Studio. Detalhes: ${err.message}`);
    }
  }

  // Lista de tentativas (modelo descoberto em primeiro lugar, seguido por endpoints v1beta e v1 estável)
  const rotasDeTentativa = [
    `https://generativelanguage.googleapis.com/v1beta/models/${modeloDescoberto}:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1/models/${modeloDescoberto}:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${chaveLimpa}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${chaveLimpa}`
  ];

  // Remove URLs duplicadas
  const rotasUnicas = Array.from(new Set(rotasDeTentativa));

  let ultimoErro: any = null;

  for (const url of rotasUnicas) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: imagemBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 0.95
          }
        })
      });

      if (!response.ok) {
        const erroJson = await response.json().catch(() => null);
        const msg = erroJson?.error?.message || response.statusText;
        if (response.status === 400 || response.status === 403) {
          throw new Error(`Erro na API Gemini (${response.status}): ${msg}`);
        }
        ultimoErro = new Error(msg);
        continue; // Tenta a próxima rota
      }

      const json = await response.json();
      const textoResposta = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textoResposta) {
        throw new Error('A inteligência artificial não retornou dados para este cupom.');
      }

      // Limpar marcadores de markdown caso o modelo retorne ```json ... ```
      const jsonLimpo = textoResposta
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const dadosExtraidos = JSON.parse(jsonLimpo);

      // Normalizar itens com IDs únicos e checkbox marcado
      const itensNormalizados: ItemCupomFiscal[] = (dadosExtraidos.itens || []).map(
        (it: any, idx: number) => ({
          id: `item-${Date.now()}-${idx}`,
          nome: it.nome || `Item ${idx + 1}`,
          quantidade: Number(it.quantidade) || 1,
          precoUnitario: Number(it.precoUnitario) || Number(it.precoTotal) || 0,
          precoTotal: Number(it.precoTotal) || Number(it.precoUnitario) || 0,
          categoria: it.categoria || 'Geral',
          selecionado: true
        })
      );

      // Calcular valor total somado se não fornecido
      const totalItens = itensNormalizados.reduce((acc, curr) => acc + curr.precoTotal, 0);
      const valorTotalFinal = Number(dadosExtraidos.valorTotal) || totalItens;

      return {
        estabelecimento: dadosExtraidos.estabelecimento || 'Compra com Cupom Fiscal',
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
      // Se for erro definitivo de chave inválida, não adianta tentar outros endpoints
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
    osc.frequency.setValueAtTime(880, ctx.currentTime); // Nota Lá (A5)
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
