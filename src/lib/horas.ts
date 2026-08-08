/** Convierte "HH:MM" a minutos desde medianoche. Devuelve NaN si es inválido. */
export function aMinutos(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (
    Number.isNaN(h) ||
    Number.isNaN(m) ||
    h < 0 ||
    h > 23 ||
    m < 0 ||
    m > 59
  ) {
    return NaN;
  }
  return h * 60 + m;
}

/**
 * Horas trabajadas entre ingreso y salida (decimales).
 * Si la salida es anterior a la entrada, se asume que cruza la medianoche.
 * Devuelve null si falta la salida o algún valor es inválido.
 */
export function horasEntre(
  ingreso: string,
  salida: string | null | undefined,
): number | null {
  if (!salida) return null;
  const inicio = aMinutos(ingreso);
  const fin = aMinutos(salida);
  if (Number.isNaN(inicio) || Number.isNaN(fin)) return null;
  let diff = fin - inicio;
  if (diff < 0) diff += 24 * 60; // jornada que cruza la medianoche
  return Math.round((diff / 60) * 100) / 100;
}

/** 7.5 -> "7h 30m" */
export function formatearHoras(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  if (m === 60) return `${h + 1}h 0m`;
  return `${h}h ${m}m`;
}

/** "2026-08-07" -> "07/08/2026" */
export function formatearFecha(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  if (!y || !m || !d) return fecha;
  return `${d}/${m}/${y}`;
}

/** Fecha local de hoy en formato YYYY-MM-DD (evita problemas de zona horaria). */
export function fechaHoyLocal(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Mes actual en formato YYYY-MM. */
export function mesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
}

/** "17:30" -> "5:30 PM"; "08:05" -> "8:05 AM". Devuelve "—" si es inválido o vacío. */
export function formatearHora12(
  hhmm: string | null | undefined,
): string {
  if (!hhmm || !/^\d{2}:\d{2}$/.test(hhmm)) return "—";
  const h = Number(hhmm.slice(0, 2));
  if (h > 23) return "—";
  const p = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${hhmm.slice(3)} ${p}`;
}

/** "2026-08" -> "Agosto 2026" */
export function nombreMes(mes: string): string {
  const [y, m] = mes.split("-");
  const nombres = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const n = Number(m);
  if (!y || Number.isNaN(n) || n < 1 || n > 12) return mes;
  return `${nombres[n - 1]} ${y}`;
}
