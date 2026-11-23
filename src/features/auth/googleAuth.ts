// Google Magic Logon - Autenticação Google OAuth 2.0 via Firebase
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  type User 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../../services/firebase';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface PerfilGoogle {
  uid: string;
  nome: string;
  email: string;
  fotoUrl: string;
}

/**
 * Dispara o Google Magic Logon
 * Tenta popup e, se o navegador mobile bloquear, utiliza redirect
 */
export async function fazerLoginGoogle(): Promise<PerfilGoogle | null> {
  if (!auth || !isFirebaseConfigured) {
    console.error('Firebase não configurado ou indisponível.');
    throw new Error('Serviço de autenticação temporariamente indisponível.');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return extrairDadosUsuario(user);
  } catch (error: any) {
    // Tratamento para navegadores mobile que bloqueiam popups
    if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/cancelled-popup-request') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null; // O redirect recarregará a página
      } catch (redirectError) {
        console.error('Erro no redirect Google Auth:', redirectError);
        throw redirectError;
      }
    }
    console.error('Erro ao autenticar com Google:', error);
    throw error;
  }
}

/**
 * Encerra a sessão
 */
export async function fazerLogoutGoogle(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
}

/**
 * Observa alterações de autenticação em tempo real
 */
export function observarEstadoAuth(callback: (perfil: PerfilGoogle | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback(extrairDadosUsuario(user));
    } else {
      callback(null);
    }
  });
}

/**
 * Retorna o usuário autenticado atualmente, se houver
 */
export function obterUsuarioLogado(): PerfilGoogle | null {
  if (auth?.currentUser) {
    return extrairDadosUsuario(auth.currentUser);
  }
  return null;
}

function extrairDadosUsuario(user: User): PerfilGoogle {
  const isFabio = user.email?.toLowerCase().trim() === 'alveslucenafabio@gmail.com';
  return {
    uid: isFabio ? 'fabio-master-uid' : user.uid,
    nome: user.displayName || (isFabio ? 'FABIO ALVES LUCENA' : 'Usuário'),
    email: user.email || '',
    fotoUrl: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  };
}
