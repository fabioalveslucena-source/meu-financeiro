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

export const USUARIO_PADRAO_FABIO: PerfilGoogle = {
  uid: 'fabio-master-uid',
  nome: 'FABIO ALVES LUCENA',
  email: 'alveslucenafabio@gmail.com',
  fotoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
};

/**
 * Dispara o Google Magic Logon
 * Tenta popup e, se o navegador mobile bloquear, utiliza redirect
 */
export async function fazerLoginGoogle(): Promise<PerfilGoogle | null> {
  if (!auth || !isFirebaseConfigured) {
    console.warn('Firebase não configurado com chaves de produção. Ativando sessão Magic Logon local para FABIO ALVES LUCENA.');
    return USUARIO_PADRAO_FABIO;
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

function extrairDadosUsuario(user: User): PerfilGoogle {
  const isFabio = user.email?.toLowerCase() === 'alveslucenafabio@gmail.com';
  return {
    uid: user.uid,
    nome: isFabio ? 'FABIO ALVES LUCENA' : (user.displayName || 'FABIO ALVES LUCENA'),
    email: user.email || 'alveslucenafabio@gmail.com',
    fotoUrl: user.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  };
}
