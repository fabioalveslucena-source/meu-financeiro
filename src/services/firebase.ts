// Configuração do Firebase e Firestore com suporte a ambiente online ou offline (LocalStorage)
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// As variáveis podem ser definidas no .env (VITE_FIREBASE_API_KEY, etc.)
// Se não estiverem preenchidas, o sistema opera em modo Local Seguro com persistência contínua
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoKeyMockFinancial2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "meu-financeiro-pro.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "meu-financeiro-pro",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "meu-financeiro-pro.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const isFirebaseConfigured = Boolean(
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase operando em modo offline / fallback de desenvolvimento local:", error);
}

export { app, db, auth };
