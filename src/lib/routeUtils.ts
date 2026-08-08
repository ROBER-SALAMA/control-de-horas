import { NextResponse } from "next/server";

/**
 * Envuelve un route handler para que cualquier error inesperado (p. ej. de la
 * base de datos) se devuelva como JSON legible en lugar de un error 500 genérico.
 */
export async function conManejoErrores(
  fn: () => Promise<Response>,
): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    console.error("Error en la API:", e);
    const mensaje =
      e instanceof Error && e.message ? e.message : "Error interno del servidor";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
