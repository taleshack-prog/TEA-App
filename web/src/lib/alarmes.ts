/** Alarmes de check-in — MÓDULO ISOLADO (ponto fraco conhecido do PWA).
 *
 *  No PWA não há garantia de notificação agendada em segundo plano, sobretudo
 *  no iOS. Estratégia em camadas, da melhor à mínima:
 *   1) Notification Triggers API (showTrigger) quando existir — agenda de verdade.
 *   2) setTimeout enquanto o app está aberto — cobre o uso em primeiro plano.
 *   3) Fallback visual na Home (contagem regressiva) — sempre presente.
 *
 *  Quando migrarmos para push nativo/servidor, troca-se só este arquivo. */

export async function pedirPermissao(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export function suportaAgendamento(): boolean {
  // Notification Triggers (Chromium). Ausente no iOS/Safari.
  return "serviceWorker" in navigator && "TimestampTrigger" in window;
}

/** Agenda os horários do dia. Retorna o modo efetivamente usado. */
export async function agendarCheckins(
  horarios: string[],
): Promise<"triggers" | "timeout" | "indisponivel"> {
  if (Notification.permission !== "granted") return "indisponivel";

  const reg = await navigator.serviceWorker?.ready;

  if (reg && "TimestampTrigger" in window) {
    for (const hhmm of horarios) {
      const quando = proximoHorario(hhmm);
      try {
        await reg.showNotification("Hora do check-in", {
          body: "Toque para registrar em menos de 1 minuto.",
          tag: `checkin-${hhmm}`,
          // @ts-expect-error showTrigger é experimental (não tipado)
          showTrigger: new TimestampTrigger(quando.getTime()),
        });
      } catch {
        /* ignora horário que falhar */
      }
    }
    return "triggers";
  }

  // Fallback: timers em primeiro plano (perdidos se o app fechar).
  for (const hhmm of horarios) {
    const ms = proximoHorario(hhmm).getTime() - Date.now();
    if (ms > 0 && ms < 24 * 3600 * 1000) {
      setTimeout(() => {
        new Notification("Hora do check-in", {
          body: "Toque para registrar em menos de 1 minuto.",
        });
      }, ms);
    }
  }
  return "timeout";
}

/** Próxima ocorrência de "HH:MM" (hoje se ainda não passou, senão amanhã). */
export function proximoHorario(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}
