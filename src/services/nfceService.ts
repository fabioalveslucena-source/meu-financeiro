/**
 * Serviço de decodificação e processamento de QR Code de NFC-e (Brasil)
 * Padrão ENCAT / SEFAZ nacional
 */

export const UFS_IBGE: Record<string, { sigla: string; nome: string }> = {
  '11': { sigla: 'RO', nome: 'Rondônia' },
  '12': { sigla: 'AC', nome: 'Acre' },
  '13': { sigla: 'AM', nome: 'Amazonas' },
  '14': { sigla: 'RR', nome: 'Roraima' },
  '15': { sigla: 'PA', nome: 'Pará' },
  '16': { sigla: 'AP', nome: 'Amapá' },
  '17': { sigla: 'TO', nome: 'Tocantins' },
  '21': { sigla: 'MA', nome: 'Maranhão' },
  '22': { sigla: 'PI', nome: 'Piauí' },
  '23': { sigla: 'CE', nome: 'Ceará' },
  '24': { sigla: 'RN', nome: 'Rio Grande do Norte' },
  '25': { sigla: 'PB', nome: 'Paraíba' },
  '26': { sigla: 'PE', nome: 'Pernambuco' },
  '27': { sigla: 'AL', nome: 'Alagoas' },
  '28': { sigla: 'SE', nome: 'Sergipe' },
  '29': { sigla: 'BA', nome: 'Bahia' },
  '31': { sigla: 'MG', nome: 'Minas Gerais' },
  '32': { sigla: 'ES', nome: 'Espírito Santo' },
  '33': { sigla: 'RJ', nome: 'Rio de Janeiro' },
  '35': { sigla: 'SP', nome: 'São Paulo' },
  '41': { sigla: 'PR', nome: 'Paraná' },
  '42': { sigla: 'SC', nome: 'Santa Catarina' },
  '43': { sigla: 'RS', nome: 'Rio Grande do Sul' },
  '50': { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  '51': { sigla: 'MT', nome: 'Mato Grosso' },
  '52': { sigla: 'GO', nome: 'Goiás' },
  '53': { sigla: 'DF', nome: 'Distrito Federal' }
};

export interface DadosNfceQrCode {
  url: string;
  chaveAcesso?: string;
  chaveFormatada?: string;
  uf?: string;
  ufNome?: string;
  dataEmissao?: string;
  valorTotal?: number;
  cnpj?: string;
  estabelecimentoSugerido: string;
}

/**
 * Decodifica o texto ou URL lida do QR Code da NFC-e
 */
export function decodificarQrCodeNfce(rawText: string): DadosNfceQrCode {
  const url = rawText.trim();
  let chaveAcesso: string | undefined;
  let valorTotal: number | undefined;
  let dataEmissao: string | undefined;
  let uf: string | undefined;
  let ufNome: string | undefined;
  let cnpj: string | undefined;

  // 1. Procurar chave de acesso de 44 dígitos
  const matchChave = url.match(/(?:chNFe=|p=)?([0-9]{44})/i) || url.match(/\b([0-9]{44})\b/);
  if (matchChave) {
    chaveAcesso = matchChave[1];
    
    // Decodificar dados da chave de 44 dígitos
    const cUf = chaveAcesso.slice(0, 2);
    if (UFS_IBGE[cUf]) {
      uf = UFS_IBGE[cUf].sigla;
      ufNome = UFS_IBGE[cUf].nome;
    }

    const ano = '20' + chaveAcesso.slice(2, 4);
    const mes = chaveAcesso.slice(4, 6);
    cnpj = chaveAcesso.slice(6, 20);

    // Se temos ano e mês válidos, constrói data estimada (ou hoje)
    const hoje = new Date();
    const anoAtual = hoje.getFullYear().toString();
    const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
    if (ano === anoAtual && mes === mesAtual) {
      dataEmissao = hoje.toISOString().slice(0, 10);
    } else {
      dataEmissao = `${ano}-${mes}-01`;
    }
  }

  // 2. Extrair valor da URL se presente
  // Padrão A: parâmetro vNF=124.50 ou vNF%3D124.50
  const matchVnf = url.match(/[?&]vNF=([0-9]+(?:\.[0-9]{2})?)/i) || 
                   url.match(/vNF%3D([0-9]+(?:\.[0-9]{2})?)/i);
  if (matchVnf) {
    valorTotal = parseFloat(matchVnf[1]);
  }

  // Padrão B: parâmetro p=CHAVE|2|tpAmb|dia|vNF|digVal... (Contingência Offline ENCAT)
  const matchP = url.match(/[?&]p=([^&]+)/i);
  if (matchP && !valorTotal) {
    const decodedP = decodeURIComponent(matchP[1]);
    const partes = decodedP.split('|');
    // Em contingência: partes[0] = chave, partes[1] = versao, partes[2] = tpAmb, partes[3] = dia, partes[4] = vNF
    if (partes.length >= 5) {
      const possivelValor = parseFloat(partes[4]);
      if (!isNaN(possivelValor) && possivelValor > 0 && partes[4].includes('.')) {
        valorTotal = possivelValor;
      }
      // Se partes[3] for o dia do mês (1 a 31)
      const diaNum = parseInt(partes[3], 10);
      if (diaNum >= 1 && diaNum <= 31 && chaveAcesso) {
        const ano = '20' + chaveAcesso.slice(2, 4);
        const mes = chaveAcesso.slice(4, 6);
        dataEmissao = `${ano}-${mes}-${String(diaNum).padStart(2, '0')}`;
      }
    }
  }

  // Chave formatada em blocos de 4 para melhor legibilidade
  const chaveFormatada = chaveAcesso
    ? chaveAcesso.replace(/(\d{4})/g, '$1 ').trim()
    : undefined;

  const estabelecimentoSugerido = ufNome 
    ? `Compra Fiscal (NFC-e ${uf})`
    : 'Compra Fiscal (NFC-e)';

  // Se o código lido for apenas a chave de 44 dígitos (sem http), gera link oficial de consulta
  let urlFinal = url;
  if (!/^https?:\/\//i.test(urlFinal)) {
    if (chaveAcesso) {
      if (uf === 'GO') {
        urlFinal = `https://nfe.sefaz.go.gov.br/nfeweb/sites/nfce/danfeNFCe?p=${chaveAcesso}|2|1`;
      } else {
        urlFinal = `https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx?tipoConsulta=resumo&tipoConteudo=7PhJ+gAVw2g=&nfe=${chaveAcesso}`;
      }
    } else {
      urlFinal = '';
    }
  }

  return {
    url: urlFinal,
    chaveAcesso,
    chaveFormatada,
    uf,
    ufNome,
    dataEmissao: dataEmissao || new Date().toISOString().slice(0, 10),
    valorTotal,
    cnpj,
    estabelecimentoSugerido
  };
}
