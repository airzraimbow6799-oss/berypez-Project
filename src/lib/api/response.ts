import { NextResponse } from "next/server";

/** Sobre estándar de la API interna (docs/api.md). */
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; fields?: Record<string, string> } };

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, init);
}

export function fail(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { success: false, error: { code, message, ...(fields ? { fields } : {}) } },
    { status },
  );
}
