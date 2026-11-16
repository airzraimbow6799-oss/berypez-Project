/**
 * Errores por campo de los formularios (checkout, Libro de Reclamaciones).
 *
 * QA-005: antes, al escribir en un campo se guardaba su error del servidor como "" y se
 * resolvía con `??`. Como "" no es null/undefined, tapaba el error de validación del propio
 * navegador: un celular mal escrito no mostraba nada junto al campo.
 */
export type ErrorMap = Readonly<Record<string, string | undefined>>;

/**
 * Mensaje a mostrar junto a un campo: primero el del servidor (si hay texto) y, si la persona
 * ya pasó por el campo, el de la validación local. Un texto vacío nunca cuenta como error.
 */
export function fieldError(
  serverErrors: ErrorMap,
  clientErrors: ErrorMap,
  touched: Readonly<Record<string, boolean | undefined>>,
  field: string,
): string | undefined {
  const fromServer = serverErrors[field];
  if (fromServer) return fromServer;
  return touched[field] ? clientErrors[field] || undefined : undefined;
}

/** Copia sin el error del servidor de ese campo (al volver a escribir, deja de valer). */
export function clearFieldError(errors: ErrorMap, field: string): ErrorMap {
  if (!(field in errors)) return errors;
  const { [field]: _removed, ...rest } = errors;
  return rest;
}
