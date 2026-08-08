export interface Usuario {
  id: number;
  nombre: string;
  creado_en: string;
}

export interface Registro {
  id: number;
  usuario_id: number;
  usuario_nombre?: string;
  fecha: string; // YYYY-MM-DD
  foto: string | null; // data URL en base64
  hora_ingreso: string; // HH:MM
  hora_salida: string | null; // HH:MM
  creado_en: string;
}

export interface DetalleReporte extends Registro {
  horas: number | null;
}

export interface ResumenReporte {
  totalHoras: number;
  totalDias: number;
  diasConHoras: number;
  promedioDiario: number;
}

export interface ReportePorUsuario {
  usuario_id: number;
  usuario_nombre: string;
  dias: number;
  totalHoras: number;
}
