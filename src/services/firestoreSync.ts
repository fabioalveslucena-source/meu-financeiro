// Sincronização em Tempo Real com o Google Cloud Firestore
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  type Unsubscribe 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { Lancamento, Cartao, DespesaRecorrente } from '../types';

export class FirestoreSyncService {
  private static unsubscribers: Unsubscribe[] = [];

  /**
   * Ativa a escuta em tempo real (multi-dispositivos PC, Mac, Mobile)
   */
  public static iniciarSincronizacao(
    uid: string,
    callbacks: {
      onLancamentosAtualizados: (lancamentos: Lancamento[]) => void;
      onCartoesAtualizados: (cartoes: Cartao[]) => void;
      onRecorrentesAtualizados: (recorrentes: DespesaRecorrente[]) => void;
    }
  ): void {
    if (!db || !isFirebaseConfigured || !uid) {
      console.info('Firestore: operando em modo local offline.');
      return;
    }

    this.pararSincronizacao();

    try {
      // 1. Escuta Lançamentos em Tempo Real
      const refLancamentos = collection(db, 'usuarios', uid, 'lancamentos');
      const unsubLanc = onSnapshot(query(refLancamentos), (snapshot) => {
        const dados: Lancamento[] = [];
        snapshot.forEach((d) => {
          dados.push(d.data() as Lancamento);
        });
        if (dados.length > 0) {
          callbacks.onLancamentosAtualizados(dados);
        }
      }, (err) => console.warn('Erro listener lancamentos Firestore:', err));
      this.unsubscribers.push(unsubLanc);

      // 2. Escuta Cartões em Tempo Real
      const refCartoes = collection(db, 'usuarios', uid, 'cartoes');
      const unsubCartoes = onSnapshot(query(refCartoes), (snapshot) => {
        const dados: Cartao[] = [];
        snapshot.forEach((d) => {
          dados.push(d.data() as Cartao);
        });
        if (dados.length > 0) {
          callbacks.onCartoesAtualizados(dados);
        }
      }, (err) => console.warn('Erro listener cartoes Firestore:', err));
      this.unsubscribers.push(unsubCartoes);

      // 3. Escuta Recorrentes em Tempo Real
      const refRecorrentes = collection(db, 'usuarios', uid, 'recorrentes');
      const unsubRec = onSnapshot(query(refRecorrentes), (snapshot) => {
        const dados: DespesaRecorrente[] = [];
        snapshot.forEach((d) => {
          dados.push(d.data() as DespesaRecorrente);
        });
        if (dados.length > 0) {
          callbacks.onRecorrentesAtualizados(dados);
        }
      }, (err) => console.warn('Erro listener recorrentes Firestore:', err));
      this.unsubscribers.push(unsubRec);

    } catch (e) {
      console.warn('Erro ao registrar listeners do Firestore:', e);
    }
  }

  /**
   * Salva ou atualiza um lançamento na nuvem
   */
  public static async salvarLancamento(uid: string, lancamento: Lancamento): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    try {
      const docRef = doc(db, 'usuarios', uid, 'lancamentos', lancamento.id);
      await setDoc(docRef, {
        ...lancamento,
        data: typeof lancamento.data === 'string' ? lancamento.data : new Date(lancamento.data).toISOString()
      }, { merge: true });
    } catch (e) {
      console.error('Erro ao salvar no Firestore:', e);
    }
  }

  /**
   * Remove um lançamento na nuvem
   */
  public static async excluirLancamento(uid: string, lancamentoId: string): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    try {
      const docRef = doc(db, 'usuarios', uid, 'lancamentos', lancamentoId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Erro ao excluir no Firestore:', e);
    }
  }

  /**
   * Cancela as escutas ativas para poupar memória e conexões
   */
  public static pararSincronizacao(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }
}
