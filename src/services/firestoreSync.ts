// Sincronização em Tempo Real com o Google Cloud Firestore
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  deleteDoc, 
  writeBatch,
  onSnapshot, 
  query, 
  type Unsubscribe 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { Lancamento, Cartao, Categoria, Natureza } from '../types';
import type { UsuarioPerfil } from '../stores/financeStore';

export const MASTER_UID = 'fabio-master-uid';

export class FirestoreSyncService {
  private static unsubscribers: Unsubscribe[] = [];
  private static isSyncing = false;

  /**
   * Salva ou atualiza um lançamento na nuvem
   */
  public static async salvarLancamento(uid: string = MASTER_UID, lancamento: Lancamento): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    try {
      const docRef = doc(db, 'usuarios', uid, 'lancamentos', lancamento.id);
      await setDoc(docRef, {
        ...lancamento,
        data: typeof lancamento.data === 'string' ? lancamento.data : new Date(lancamento.data).toISOString(),
        atualizadoEm: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error('Erro ao salvar lançamento no Firestore:', e);
    }
  }

  /**
   * Remove um lançamento na nuvem
   */
  public static async excluirLancamento(uid: string = MASTER_UID, lancamentoId: string): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    try {
      const docRef = doc(db, 'usuarios', uid, 'lancamentos', lancamentoId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Erro ao excluir no Firestore:', e);
    }
  }

  /**
   * Salva um lote de lançamentos na nuvem (Batch Write)
   */
  public static async enviarTodosLancamentos(uid: string = MASTER_UID, lancamentos: Lancamento[]): Promise<number> {
    if (!db || !isFirebaseConfigured || !uid || lancamentos.length === 0) return 0;
    try {
      // Divide em lotes de 450 (limite do Firestore é 500 por batch)
      const tamLote = 450;
      let enviados = 0;

      for (let i = 0; i < lancamentos.length; i += tamLote) {
        const pedaco = lancamentos.slice(i, i + tamLote);
        const batch = writeBatch(db);

        for (const item of pedaco) {
          const docRef = doc(db, 'usuarios', uid, 'lancamentos', item.id);
          batch.set(docRef, {
            ...item,
            data: typeof item.data === 'string' ? item.data : new Date(item.data).toISOString(),
            atualizadoEm: new Date().toISOString()
          }, { merge: true });
        }

        await batch.commit();
        enviados += pedaco.length;
      }

      return enviados;
    } catch (e) {
      console.error('Erro ao enviar lote para o Firestore:', e);
      throw e;
    }
  }

  /**
   * Baixa todos os lançamentos existentes no Firestore
   */
  public static async baixarTodosLancamentos(uid: string = MASTER_UID): Promise<Lancamento[]> {
    if (!db || !isFirebaseConfigured || !uid) return [];
    try {
      const colRef = collection(db, 'usuarios', uid, 'lancamentos');
      const snap = await getDocs(colRef);
      const lista: Lancamento[] = [];
      snap.forEach((d) => {
        const data = d.data();
        lista.push({
          ...data,
          data: new Date(data.data),
          criadoEm: data.criadoEm ? new Date(data.criadoEm) : new Date(),
          atualizadoEm: data.atualizadoEm ? new Date(data.atualizadoEm) : new Date(),
        } as Lancamento);
      });
      return lista;
    } catch (e) {
      console.error('Erro ao baixar lançamentos do Firestore:', e);
      return [];
    }
  }

  /**
   * Salva os cartões na nuvem
   */
  public static async salvarCartoes(uid: string = MASTER_UID, cartoes: Cartao[]): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    try {
      const batch = writeBatch(db);
      for (const c of cartoes) {
        const docRef = doc(db, 'usuarios', uid, 'cartoes', c.id);
        batch.set(docRef, c, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.error('Erro ao salvar cartões no Firestore:', e);
    }
  }

  /**
   * Baixa cartões do Firestore
   */
  public static async baixarCartoes(uid: string = MASTER_UID): Promise<Cartao[]> {
    if (!db || !isFirebaseConfigured || !uid) return [];
    try {
      const snap = await getDocs(collection(db, 'usuarios', uid, 'cartoes'));
      const lista: Cartao[] = [];
      snap.forEach((d) => lista.push(d.data() as Cartao));
      return lista;
    } catch (e) {
      console.error('Erro ao baixar cartões do Firestore:', e);
      return [];
    }
  }

  /**
   * Salva perfil do usuário na nuvem
   */
  public static async salvarPerfil(uid: string = MASTER_UID, usuario: UsuarioPerfil): Promise<void> {
    if (!db || !isFirebaseConfigured || !uid) return;
    try {
      const docRef = doc(db, 'usuarios', uid, 'perfil', 'dados');
      await setDoc(docRef, { ...usuario, atualizadoEm: new Date().toISOString() }, { merge: true });
    } catch (e) {
      console.error('Erro ao salvar perfil no Firestore:', e);
    }
  }

  /**
   * Baixa perfil do usuário do Firestore
   */
  public static async baixarPerfil(uid: string = MASTER_UID): Promise<UsuarioPerfil | null> {
    if (!db || !isFirebaseConfigured || !uid) return null;
    try {
      const snap = await getDoc(doc(db, 'usuarios', uid, 'perfil', 'dados'));
      if (snap.exists()) {
        return snap.data() as UsuarioPerfil;
      }
      return null;
    } catch (e) {
      console.error('Erro ao baixar perfil do Firestore:', e);
      return null;
    }
  }

  /**
   * Sincronização Bidirecional Inteligente (Merge Local <-> Cloud)
   * Garante que nenhum dado seja perdido e que todos os aparelhos tenham a mesma base.
   */
  public static async sincronizarTudo(
    uid: string = MASTER_UID,
    estadoLocal: {
      lancamentos: Lancamento[];
      cartoes: Cartao[];
      usuario: UsuarioPerfil;
      categorias: Categoria[];
      naturezas: Natureza[];
    }
  ): Promise<{
    lancamentosSincronizados: Lancamento[];
    cartoesSincronizados: Cartao[];
    usuarioSincronizado: UsuarioPerfil | null;
    novosImportados: number;
    novosEnviados: number;
  }> {
    if (this.isSyncing) {
      return {
        lancamentosSincronizados: estadoLocal.lancamentos,
        cartoesSincronizados: estadoLocal.cartoes,
        usuarioSincronizado: estadoLocal.usuario,
        novosImportados: 0,
        novosEnviados: 0
      };
    }

    this.isSyncing = true;

    try {
      // 1. Baixar dados da nuvem
      const lancamentosNuvem = await this.baixarTodosLancamentos(uid);
      const cartoesNuvem = await this.baixarCartoes(uid);
      const perfilNuvem = await this.baixarPerfil(uid);

      // 2. Fazer Merge dos Lançamentos por ID
      const mapaLancamentos = new Map<string, Lancamento>();
      
      // Adiciona primeiro o que está na nuvem
      lancamentosNuvem.forEach((l) => mapaLancamentos.set(l.id, l));

      let novosEnviados = 0;
      const paraEnviar: Lancamento[] = [];

      // Adiciona o que está local e identifica o que precisa subir para a nuvem
      estadoLocal.lancamentos.forEach((local) => {
        if (!mapaLancamentos.has(local.id)) {
          // Documento local que não existia na nuvem: deve ser enviado!
          mapaLancamentos.set(local.id, local);
          paraEnviar.push(local);
        }
      });

      if (paraEnviar.length > 0) {
        await this.enviarTodosLancamentos(uid, paraEnviar);
        novosEnviados = paraEnviar.length;
      }

      // Se a nuvem estava vazia e enviamos todos os locais, salvar perfil e cartões também
      if (lancamentosNuvem.length === 0 && estadoLocal.lancamentos.length > 0) {
        await this.enviarTodosLancamentos(uid, estadoLocal.lancamentos);
        await this.salvarCartoes(uid, estadoLocal.cartoes);
        await this.salvarPerfil(uid, estadoLocal.usuario);
      }

      const listaFinalLancamentos = Array.from(mapaLancamentos.values()).sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      const novosImportados = Math.max(0, listaFinalLancamentos.length - estadoLocal.lancamentos.length);

      // Merge de Cartões
      const mapaCartoes = new Map<string, Cartao>();
      cartoesNuvem.forEach((c) => mapaCartoes.set(c.id, c));
      estadoLocal.cartoes.forEach((c) => {
        if (!mapaCartoes.has(c.id)) {
          mapaCartoes.set(c.id, c);
        }
      });
      const listaFinalCartoes = Array.from(mapaCartoes.values());

      return {
        lancamentosSincronizados: listaFinalLancamentos,
        cartoesSincronizados: listaFinalCartoes.length > 0 ? listaFinalCartoes : estadoLocal.cartoes,
        usuarioSincronizado: perfilNuvem || estadoLocal.usuario,
        novosImportados,
        novosEnviados
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Ativa a escuta contínua em tempo real (multi-dispositivos PC, Mac, Mobile)
   */
  public static iniciarEscutaTempoReal(
    uid: string = MASTER_UID,
    onLancamentosAtualizados: (lancamentos: Lancamento[]) => void
  ): void {
    if (!db || !isFirebaseConfigured || !uid) return;

    this.pararSincronizacao();

    try {
      const refLancamentos = collection(db, 'usuarios', uid, 'lancamentos');
      const unsub = onSnapshot(query(refLancamentos), (snapshot) => {
        // Evita loop de atualização se estivermos fazendo envio em lote
        if (this.isSyncing) return;

        const dados: Lancamento[] = [];
        snapshot.forEach((d) => {
          const item = d.data();
          dados.push({
            ...item,
            data: new Date(item.data),
            criadoEm: item.criadoEm ? new Date(item.criadoEm) : new Date(),
            atualizadoEm: item.atualizadoEm ? new Date(item.atualizadoEm) : new Date(),
          } as Lancamento);
        });

        if (dados.length > 0) {
          dados.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
          onLancamentosAtualizados(dados);
        }
      }, (err) => console.warn('Erro listener Firestore:', err));

      this.unsubscribers.push(unsub);
    } catch (e) {
      console.warn('Erro ao registrar listener Firestore:', e);
    }
  }

  /**
   * Cancela as escutas ativas para poupar memória e conexões
   */
  public static pararSincronizacao(): void {
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch (_) {}
    });
    this.unsubscribers = [];
  }
}
