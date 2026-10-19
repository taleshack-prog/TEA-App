/** Armazenamento local offline-first (IndexedDB via Dexie).
 *  Tudo que o usuário registra entra primeiro aqui e numa fila de sincronização;
 *  quando há rede, a fila é enviada à API. Garante o RNF-02 (offline-first). */
import Dexie, { type Table } from "dexie";

export interface PendenteCheckin {
  id?: number;
  payload: unknown;     // corpo do POST /checkins
  criado_em: string;
}
export interface PendenteEvento {
  id?: number;
  payload: unknown;     // corpo do POST /eventos
  criado_em: string;
}

class PonteDB extends Dexie {
  filaCheckins!: Table<PendenteCheckin, number>;
  filaEventos!: Table<PendenteEvento, number>;

  constructor() {
    super("ponte-visual");
    this.version(1).stores({
      filaCheckins: "++id, criado_em",
      filaEventos: "++id, criado_em",
    });
  }
}

export const db = new PonteDB();
