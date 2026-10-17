// Configuração do Firebase e Firestore com suporte a ambiente online ou offline (LocalStorage)
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// As variáveis podem ser definidas no .env (VITE_FIREBASE_API_KEY, etc.)
// Se não estiverem preenchidas, o sistema opera em modo Local Seguro com persistência contínua
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCEzAq8ydMnDV1BDkCNLYXQNZVnu9ZKrXU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "meu-financeiro-39138.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "meu-financeiro-39138",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "meu-financeiro-39138.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "690681764618",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:690681764618:web:1d49dad4c992a230d578f3",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-M2DPVQMLWJ"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export const isFirebaseConfigured = true;

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
