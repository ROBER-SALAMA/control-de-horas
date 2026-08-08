import { NextResponse } from "next/server";
import { initDb, select } from "@/lib/db";
import { conManejoErrores } from "@/lib/routeUtils";
import { horasEntre } from "@/lib/horas";
import type { DetalleReporte, ReportePorUsuario, ResumenReporte } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return conManejoErrores(async () => {
    await initDb();
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get("mes"); // YYYY-MM
    const usuarioId = searchParams.get("usuario_id");

    const condiciones: string[] = [];
    const args: unknown[] = [];

    if (mes && /^\d{4}-\d{2}$/.test(mes)) {
      condiciones.push("r.fecha LIKE ?");
      args.push(`${mes}%`);
    }
    if (usuarioId) {
      condiciones.push("r.usuario_id = ?");
      args.push(usuarioId);
    }

    const sql = `
      SELECT r.*, u.nombre AS usuario_nombre
      FROM registros r
      JOIN usuarios u ON u.id = r.usuario_id
      ${condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : ""}
      ORDER BY r.fecha ASC, r.id ASC
    `;

    const registros = await select<DetalleReporte>(sql, args);

    const detalle: DetalleReporte[] = registros.map((r) => ({
      ...r,
      horas: horasEntre(r.hora_ingreso, r.hora_salida),
    }));

    const porUsuario = new Map<number, ReportePorUsuario>();
    let totalHoras = 0;
    let totalDias = 0;
    let diasConHoras = 0;

    for (const r of detalle) {
      totalDias += 1;
      const grupo = porUsuario.get(r.usuario_id) ?? {
        usuario_id: r.usuario_id,
        usuario_nombre: r.usuario_nombre ?? "Sin nombre",
        dias: 0,
        totalHoras: 0,
      };
      grupo.dias += 1;
      if (r.horas != null) {
        totalHoras += r.horas;
        diasConHoras += 1;
        grupo.totalHoras += r.horas;
      }
      porUsuario.set(r.usuario_id, grupo);
    }

    const resumen: ResumenReporte = {
      totalHoras: Math.round(totalHoras * 100) / 100,
      totalDias,
      diasConHoras,
      promedioDiario:
        diasConHoras > 0 ? Math.round((totalHoras / diasConHoras) * 100) / 100 : 0,
    };

    return NextResponse.json({
      mes: mes ?? null,
      detalle,
      resumen,
      porUsuario: Array.from(porUsuario.values()).map((g) => ({
        ...g,
        totalHoras: Math.round(g.totalHoras * 100) / 100,
      })),
    });
  });
}
