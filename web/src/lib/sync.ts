/** Sincronização offline → online. Enfileira registros no IndexedDB e os envia
 *  quando há rede. Chamado no boot e a cada evento 'online'. */
import { enviarCheckin, enviarEvento, type CheckinBody, type EventoBody } from "./api";
import { db } from "./db";

export async function registrarCheckin(body: CheckinBody) {
  if (navigator.onLine) {
    try {
      await enviarCheckin(body);
      return { enviado: true };
    } catch {
      /* cai para a fila */
    }
  }
  await db.filaCheckins.add({ payload: body, criado_em: new Date().toISOString() });
  return { enviado: false, enfileirado: true };
}

export async function registrarEvento(body: EventoBody) {
  if (navigator.onLine) {
    try {
      await enviarEvento(body);
      return { enviado: true };
    } catch {
      /* cai para a fila */
    }
  }
  await db.filaEventos.add({ payload: body, criado_em: new Date().toISOString() });
  return { enviado: false, enfileirado: true };
}

/** Esvazia as filas pendentes. Retorna quantos itens subiram. */
export async function flush(): Promise<number> {
  if (!navigator.onLine) return 0;
  let enviados = 0;

  for (const item of await db.filaCheckins.toArray()) {
    try {
      await enviarCheckin(item.payload as CheckinBody);
      await db.filaCheckins.delete(item.id!);
      enviados++;
    } catch {
      break; // mantém a ordem; tenta de novo no próximo ciclo
    }
  }
  for (const item of await db.filaEventos.toArray()) {
    try {
      await enviarEvento(item.payload as EventoBody);
      await db.filaEventos.delete(item.id!);
      enviados++;
    } catch {
      break;
    }
  }
  return enviados;
}

export async function pendentes(): Promise<number> {
  return (await db.filaCheckins.count()) + (await db.filaEventos.count());
}

/** Liga o flush automático à volta da conexão. */
export function iniciarAutoSync() {
  window.addEventListener("online", () => void flush());
  if (navigator.onLine) void flush();
}
