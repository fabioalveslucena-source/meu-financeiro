import type { Cartao, Categoria, Conta, Lancamento } from '../types';

export const CARTAO_PADRAO: Cartao[] = [
  {
    id: 'cartao-1',
    userId: 'default-user',
    nome: 'Banco do Brasil Ourocard',
    bandeira: 'Visa',
    limite: 18000,
    diaFechamento: 25,
    diaVencimento: 5,
    ativo: true,
    cor: '#F8D117',
    icone: '💳'
  },
  {
    id: 'cartao-bradesco',
    userId: 'default-user',
    nome: 'Bradesco Cartões',
    bandeira: 'Visa Platinum',
    limite: 15000,
    diaFechamento: 10,
    diaVencimento: 20,
    ativo: true,
    cor: '#CC092F',
    icone: '💳'
  },
  {
    id: 'cartao-2',
    userId: 'default-user',
    nome: 'Itaú Personalité',
    bandeira: 'Visa Infinite',
    limite: 25000,
    diaFechamento: 20,
    diaVencimento: 28,
    ativo: true,
    cor: '#EC7000',
    icone: '💳'
  },
  {
    id: 'cartao-3',
    userId: 'default-user',
    nome: 'XP Visa Infinite',
    bandeira: 'Visa',
    limite: 10000,
    diaFechamento: 15,
    diaVencimento: 22,
    ativo: true,
    cor: '#0F2744',
    icone: '💳'
  }
];

export const CONTAS_PADRAO: Conta[] = [
  {
    id: 'conta-bb',
    userId: 'default-user',
    nome: 'Conta Corrente Banco do Brasil',
    banco: 'Banco do Brasil',
    tipo: 'Corrente',
    ativa: true,
    cor: '#F8D117',
    icone: '🏦'
  },
  {
    id: 'conta-bradesco',
    userId: 'default-user',
    nome: 'Conta Corrente Bradesco',
    banco: 'Bradesco',
    tipo: 'Corrente',
    ativa: true,
    cor: '#CC092F',
    icone: '🏦'
  },
  {
    id: 'conta-itau',
    userId: 'default-user',
    nome: 'Conta Corrente Itaú',
    banco: 'Itaú Unibanco',
    tipo: 'Corrente',
    ativa: true,
    cor: '#EC7000',
    icone: '🏦'
  },
  {
    id: 'conta-nubank',
    userId: 'default-user',
    nome: 'Nubank Reserva',
    banco: 'Nubank',
    tipo: 'Poupança',
    ativa: true,
    cor: '#8A05BE',
    icone: '📱'
  },
  {
    id: 'conta-carteira',
    userId: 'default-user',
    nome: 'Carteira Física',
    banco: 'Espécie',
    tipo: 'Carteira',
    ativa: true,
    cor: '#287EA5',
    icone: '💵'
  }
];

export const CATEGORIAS_PADRAO: Categoria[] = [
  // 🏠 Moradia
  { id: 'cat-m1', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Aluguel / Condomínio', tipo: 'Despesa', ativa: true },
  { id: 'cat-m2', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Energia Elétrica', tipo: 'Despesa', ativa: true },
  { id: 'cat-m3', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Internet / TV a Cabo', tipo: 'Despesa', ativa: true },
  { id: 'cat-m4', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Água e Gás', tipo: 'Despesa', ativa: true },
  { id: 'cat-m5', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Manutenção e Reformas', tipo: 'Despesa', ativa: true },
  { id: 'cat-m9', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Ferramentas e Materiais', tipo: 'Despesa', ativa: true },
  { id: 'cat-m10', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Imóveis e Aluguéis', tipo: 'Despesa', ativa: true },
  { id: 'cat-m6', userId: 'default-user', natureza: '🏠 Moradia', nome: 'IPTU e Taxas', tipo: 'Despesa', ativa: true },
  { id: 'cat-m7', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Móveis e Decoração', tipo: 'Despesa', ativa: true },
  { id: 'cat-m8', userId: 'default-user', natureza: '🏠 Moradia', nome: 'Serviços de Limpeza / Diarista', tipo: 'Despesa', ativa: true },

  // 🏢 Imóveis
  { id: 'cat-im1', userId: 'default-user', natureza: '🏢 Imóveis', nome: 'Aluguel / Condomínio', tipo: 'Despesa', ativa: true },
  { id: 'cat-im2', userId: 'default-user', natureza: '🏢 Imóveis', nome: 'IPTU e Taxas', tipo: 'Despesa', ativa: true },
  { id: 'cat-im3', userId: 'default-user', natureza: '🏢 Imóveis', nome: 'Manutenção e Reformas', tipo: 'Despesa', ativa: true },

  // 🛒 Alimentação
  { id: 'cat-a1', userId: 'default-user', natureza: '🛒 Alimentação', nome: 'Supermercado', tipo: 'Despesa', ativa: true },
  { id: 'cat-a2', userId: 'default-user', natureza: '🛒 Alimentação', nome: 'Açougue e Peixaria', tipo: 'Despesa', ativa: true },
  { id: 'cat-a3', userId: 'default-user', natureza: '🛒 Alimentação', nome: 'Hortifruti e Feira', tipo: 'Despesa', ativa: true },
  { id: 'cat-a4', userId: 'default-user', natureza: '🛒 Alimentação', nome: 'Restaurante / Delivery', tipo: 'Despesa', ativa: true },
  { id: 'cat-a5', userId: 'default-user', natureza: '🛒 Alimentação', nome: 'Padaria e Cafeteria', tipo: 'Despesa', ativa: true },
  { id: 'cat-a6', userId: 'default-user', natureza: '🛒 Alimentação', nome: 'Lanches e iFood', tipo: 'Despesa', ativa: true },

  // 🚗 Transporte
  { id: 'cat-t1', userId: 'default-user', natureza: '🚗 Transporte', nome: 'Combustível', tipo: 'Despesa', ativa: true },
  { id: 'cat-t2', userId: 'default-user', natureza: '🚗 Transporte', nome: 'Uber / Táxi / 99', tipo: 'Despesa', ativa: true },
  { id: 'cat-t3', userId: 'default-user', natureza: '🚗 Transporte', nome: 'Seguro Veicular', tipo: 'Despesa', ativa: true },
  { id: 'cat-t4', userId: 'default-user', natureza: '🚗 Transporte', nome: 'IPVA e Licenciamento', tipo: 'Despesa', ativa: true },
  { id: 'cat-t5', userId: 'default-user', natureza: '🚗 Transporte', nome: 'Manutenção Veicular', tipo: 'Despesa', ativa: true },
  { id: 'cat-t5b', userId: 'default-user', natureza: '🚗 Transporte', nome: 'Manutenção e Mecânica', tipo: 'Despesa', ativa: true },
  { id: 'cat-t6', userId: 'default-user', natureza: '🚗 Transporte', nome: 'Estacionamento e Pedágio', tipo: 'Despesa', ativa: true },
  { id: 'cat-t7', userId: 'default-user', natureza: '🚗 Transporte', nome: 'Lavagem Automotiva', tipo: 'Despesa', ativa: true },

  // 📚 Educação (Inclui os solicitados pelo usuário)
  { id: 'cat-e1', userId: 'default-user', natureza: '📚 Educação', nome: 'Escola da Maria Eduarda', tipo: 'Despesa', ativa: true },
  { id: 'cat-e2', userId: 'default-user', natureza: '📚 Educação', nome: 'Escola da Cecília', tipo: 'Despesa', ativa: true },
  { id: 'cat-e3', userId: 'default-user', natureza: '📚 Educação', nome: 'Escola do Isaac', tipo: 'Despesa', ativa: true },
  { id: 'cat-e4', userId: 'default-user', natureza: '📚 Educação', nome: 'Cursinho pré-vestibular', tipo: 'Despesa', ativa: true },
  { id: 'cat-e5', userId: 'default-user', natureza: '📚 Educação', nome: 'Mensalidade Escolar / Faculdade', tipo: 'Despesa', ativa: true },
  { id: 'cat-e6', userId: 'default-user', natureza: '📚 Educação', nome: 'Cursos e Treinamentos', tipo: 'Despesa', ativa: true },
  { id: 'cat-e7', userId: 'default-user', natureza: '📚 Educação', nome: 'Livros e Material Didático', tipo: 'Despesa', ativa: true },
  { id: 'cat-e8', userId: 'default-user', natureza: '📚 Educação', nome: 'Transporte Escolar / Van', tipo: 'Despesa', ativa: true },
  { id: 'cat-e9', userId: 'default-user', natureza: '📚 Educação', nome: 'Idiomas e Intercâmbio', tipo: 'Despesa', ativa: true },

  // 🏥 Saúde
  { id: 'cat-s1', userId: 'default-user', natureza: '🏥 Saúde', nome: 'Plano de Saúde', tipo: 'Despesa', ativa: true },
  { id: 'cat-s2', userId: 'default-user', natureza: '🏥 Saúde', nome: 'Farmácia e Medicamentos', tipo: 'Despesa', ativa: true },
  { id: 'cat-s3', userId: 'default-user', natureza: '🏥 Saúde', nome: 'Consultas Médicas', tipo: 'Despesa', ativa: true },
  { id: 'cat-s4', userId: 'default-user', natureza: '🏥 Saúde', nome: 'Dentista e Ortodontia', tipo: 'Despesa', ativa: true },
  { id: 'cat-s5', userId: 'default-user', natureza: '🏥 Saúde', nome: 'Exames Laboratoriais', tipo: 'Despesa', ativa: true },
  { id: 'cat-s6', userId: 'default-user', natureza: '🏥 Saúde', nome: 'Terapia e Psicologia', tipo: 'Despesa', ativa: true },

  // 🎨 Lazer
  { id: 'cat-l1', userId: 'default-user', natureza: '🎨 Lazer', nome: 'Viagens e Passeios', tipo: 'Despesa', ativa: true },
  { id: 'cat-l2', userId: 'default-user', natureza: '🎨 Lazer', nome: 'Streaming (Netflix, Spotify, etc)', tipo: 'Despesa', ativa: true },
  { id: 'cat-l3', userId: 'default-user', natureza: '🎨 Lazer', nome: 'Cinema, Teatro e Eventos', tipo: 'Despesa', ativa: true },
  { id: 'cat-l4', userId: 'default-user', natureza: '🎨 Lazer', nome: 'Clubes e Associações', tipo: 'Despesa', ativa: true },
  { id: 'cat-l5', userId: 'default-user', natureza: '🎨 Lazer', nome: 'Jogos e Assinaturas Digitais', tipo: 'Despesa', ativa: true },

  // 👤 Pessoal
  { id: 'cat-p1', userId: 'default-user', natureza: '👤 Pessoal', nome: 'Academia / Musculação / Esporte', tipo: 'Despesa', ativa: true },
  { id: 'cat-p2', userId: 'default-user', natureza: '👤 Pessoal', nome: 'Barbearia / Cabeleireiro / Estética', tipo: 'Despesa', ativa: true },
  { id: 'cat-p3', userId: 'default-user', natureza: '👤 Pessoal', nome: 'Vestuário e Calçados', tipo: 'Despesa', ativa: true },
  { id: 'cat-p4', userId: 'default-user', natureza: '👤 Pessoal', nome: 'Cosméticos e Perfumaria', tipo: 'Despesa', ativa: true },
  { id: 'cat-p5', userId: 'default-user', natureza: '👤 Pessoal', nome: 'Acessórios e Relógios', tipo: 'Despesa', ativa: true },

  // 👨‍👩‍👧 Família
  { id: 'cat-f1', userId: 'default-user', natureza: '👨‍👩‍👧 Família', nome: 'Mesada e Extras dos Filhos', tipo: 'Despesa', ativa: true },
  { id: 'cat-f2', userId: 'default-user', natureza: '👨‍👩‍👧 Família', nome: 'Atividades Extracurriculares', tipo: 'Despesa', ativa: true },
  { id: 'cat-f3', userId: 'default-user', natureza: '👨‍👩‍👧 Família', nome: 'Presentes e Datas Especiais', tipo: 'Despesa', ativa: true },
  { id: 'cat-f4', userId: 'default-user', natureza: '👨‍👩‍👧 Família', nome: 'Roupas Infantis', tipo: 'Despesa', ativa: true },

  // 🐾 Pets
  { id: 'cat-pt1', userId: 'default-user', natureza: '🐾 Pets', nome: 'Ração e Petiscos', tipo: 'Despesa', ativa: true },
  { id: 'cat-pt2', userId: 'default-user', natureza: '🐾 Pets', nome: 'Veterinário e Vacinas', tipo: 'Despesa', ativa: true },
  { id: 'cat-pt3', userId: 'default-user', natureza: '🐾 Pets', nome: 'Banho e Tosa', tipo: 'Despesa', ativa: true },

  // 🛠️ Serviços
  { id: 'cat-sv1', userId: 'default-user', natureza: '🛠️ Serviços', nome: 'Telefonia Móvel / Celular', tipo: 'Despesa', ativa: true },
  { id: 'cat-sv2', userId: 'default-user', natureza: '🛠️ Serviços', nome: 'Softwares e Armazenamento Nuvem', tipo: 'Despesa', ativa: true },
  { id: 'cat-sv3', userId: 'default-user', natureza: '🛠️ Serviços', nome: 'Cartório, Correios e Documentos', tipo: 'Despesa', ativa: true },
  { id: 'cat-sv4', userId: 'default-user', natureza: '🛠️ Serviços', nome: 'Tarifas Bancárias', tipo: 'Despesa', ativa: true },

  // 💰 Impostos & Receitas
  { id: 'cat-imp1', userId: 'default-user', natureza: '💰 Impostos', nome: 'Imposto de Renda (IRPF)', tipo: 'Despesa', ativa: true },
  { id: 'cat-imp2', userId: 'default-user', natureza: '💰 Impostos', nome: 'INSS e Previdência', tipo: 'Despesa', ativa: true },
  { id: 'cat-rec1', userId: 'default-user', natureza: '💰 Impostos', nome: 'Salário / Pró-labore', tipo: 'Receita', ativa: true },
  { id: 'cat-rec2', userId: 'default-user', natureza: '💰 Impostos', nome: 'Rendimentos e Dividendos', tipo: 'Receita', ativa: true },
  { id: 'cat-rec3', userId: 'default-user', natureza: '💰 Impostos', nome: 'Vendas, Honorários e Freelas', tipo: 'Receita', ativa: true },
  { id: 'cat-rec4', userId: 'default-user', natureza: '💰 Impostos', nome: '13º Salário e Férias', tipo: 'Receita', ativa: true },
  { id: 'cat-rec5', userId: 'default-user', natureza: '💰 Impostos', nome: 'Restituição de IR', tipo: 'Receita', ativa: true },

  // 📦 Outros & Investimentos
  { id: 'cat-inv1', userId: 'default-user', natureza: '📦 Outros', nome: 'Aporte Renda Fixa (Tesouro, CDB)', tipo: 'Investimento', ativa: true },
  { id: 'cat-inv2', userId: 'default-user', natureza: '📦 Outros', nome: 'Aporte Ações e FIIs', tipo: 'Investimento', ativa: true },
  { id: 'cat-inv3', userId: 'default-user', natureza: '📦 Outros', nome: 'Reserva de Emergência', tipo: 'Investimento', ativa: true },
  { id: 'cat-inv4', userId: 'default-user', natureza: '📦 Outros', nome: 'Previdência Privada', tipo: 'Investimento', ativa: true },
  { id: 'cat-out1', userId: 'default-user', natureza: '📦 Outros', nome: 'Doações e Ajuda Familiar', tipo: 'Despesa', ativa: true },
  { id: 'cat-out2', userId: 'default-user', natureza: '📦 Outros', nome: 'Imprevistos e Diversos', tipo: 'Despesa', ativa: true },
];

const hoje = new Date();
const anoAtual = hoje.getFullYear();
const mesAtual = String(hoje.getMonth() + 1).padStart(2, '0');
const compAtual = `${mesAtual}/${anoAtual}`;

export const LANCAMENTOS_INICIAIS: Lancamento[] = [
  {
    id: 'lanc-1',
    userId: 'default-user',
    data: new Date(anoAtual, hoje.getMonth(), 1),
    competencia: compAtual,
    valor: 12500,
    tipo: 'Receita',
    natureza: '💰 Impostos',
    categoria: 'Salário / Pró-labore',
    descricao: 'Recebimento de Salário Mensal',
    pagamento: '📱 Pix',
    conta: 'Conta Corrente Itaú',
    status: 'Lançado',
    origem: 'app',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  },
  {
    id: 'lanc-2',
    userId: 'default-user',
    data: new Date(anoAtual, hoje.getMonth(), 3),
    competencia: compAtual,
    valor: 2600,
    tipo: 'Despesa',
    natureza: '🏠 Moradia',
    categoria: 'Aluguel / Condomínio',
    descricao: 'Pagamento Aluguel Residencial',
    pagamento: '📱 Pix',
    conta: 'Conta Corrente Itaú',
    status: 'Lançado',
    origem: 'app',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  },
  {
    id: 'lanc-3',
    userId: 'default-user',
    data: new Date(anoAtual, hoje.getMonth(), 4),
    competencia: compAtual,
    valor: 840.50,
    tipo: 'Despesa',
    natureza: '🛒 Alimentação',
    categoria: 'Supermercado',
    descricao: 'Compras de Mantimentos do Mês',
    pagamento: '💳 Crédito',
    cartao: 'Banco do Brasil Ourocard',
    status: 'Lançado',
    origem: 'app',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  },
  {
    id: 'lanc-4',
    userId: 'default-user',
    data: new Date(anoAtual, hoje.getMonth(), 5),
    competencia: compAtual,
    valor: 250,
    tipo: 'Despesa',
    natureza: '🚗 Transporte',
    categoria: 'Combustível',
    descricao: 'Abastecimento Gasolina Comum',
    pagamento: '🏦 Débito',
    conta: 'Conta Corrente Itaú',
    status: 'Lançado',
    origem: 'app',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  },
  {
    id: 'lanc-5',
    userId: 'default-user',
    data: new Date(anoAtual, hoje.getMonth(), 6),
    competencia: compAtual,
    valor: 2000,
    tipo: 'Investimento',
    natureza: '📦 Outros',
    categoria: 'Aporte Renda Fixa',
    descricao: 'Aplicação Tesouro Direto Selic',
    pagamento: '📱 Pix',
    conta: 'Nubank Reserva',
    status: 'Lançado',
    origem: 'app',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  },
  {
    id: 'lanc-6',
    userId: 'default-user',
    data: new Date(anoAtual, hoje.getMonth(), 8),
    competencia: compAtual,
    valor: 189.90,
    tipo: 'Despesa',
    natureza: '🏥 Saúde',
    categoria: 'Farmácia',
    descricao: 'Medicamentos e Vitaminas',
    pagamento: '💳 Crédito',
    cartao: 'Banco do Brasil Ourocard',
    status: 'Lançado',
    origem: 'voz',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  },
  {
    id: 'lanc-7',
    userId: 'default-user',
    data: new Date(anoAtual, hoje.getMonth(), 10),
    competencia: compAtual,
    valor: 320,
    tipo: 'Despesa',
    natureza: '🛒 Alimentação',
    categoria: 'Restaurante / Delivery',
    descricao: 'Jantar Família Fim de Semana',
    pagamento: '💳 Crédito',
    cartao: 'Itaú Personalité',
    status: 'Lançado',
    origem: 'app',
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  }
];
