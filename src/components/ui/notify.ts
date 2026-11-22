import type { ExternalToast } from "sonner";

/**
 * Aviso «éxito» que carga Sonner recién al usarlo (#58): así la carta no descarga ni ejecuta la
 * librería de avisos al abrir, solo cuando la persona agrega un plato.
 */
export function notifySuccess(message: string, options?: ExternalToast): void {
  void import("sonner").then(({ toast }) => toast.success(message, options));
}
