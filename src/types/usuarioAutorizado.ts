export interface UsuarioAutorizado {
  id: string;
  nome: string;
  email: string; // formato lowercase para checagem exata
  status: 'ativo' | 'pausado';
  permitirSupervisao: boolean; // se true, admin pode visualizar no modo supervisão
  uid?: string; // associado automaticamente no primeiro login Google
  criadoEm: string;
  ultimoAcessoEm?: string;
}
