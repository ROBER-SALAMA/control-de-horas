/** Hace un fetch y devuelve el JSON. Lanza un Error con el mensaje de la API si falla. */
export async function pedirJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? "Ocurrió un error inesperado");
  }
  return data;
}

export function mensajeDeError(e: unknown): string {
  return e instanceof Error ? e.message : "Ocurrió un error inesperado";
}
