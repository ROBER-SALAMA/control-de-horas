import { NextResponse } from "next/server";
import { execute, initDb, select, selectOne } from "@/lib/db";
import { conManejoErrores } from "@/lib/routeUtils";
import type { Registro } from "@/lib/types";

export const dynamic = "force-dynamic";

const SELECT = `
  SELECT r.*, u.nombre AS usuario_nombre
  FROM registros r
  JOIN usuarios u ON u.id = r.usuario_id
`;

/** Valida que la foto sea una imagen data URL razonable. */
function limpiarFoto(foto: unknown): string | null {
  if (typeof foto !== "string" || !foto.startsWith("data:image/")) return null;
  // ~10 MB máx. en base64 para no inflar la base de datos
  if (foto.length > 10_000_000) return null;
  return foto;
}

export async function GET(request: Request) {
  return conManejoErrores(async () => {
    await initDb();
    const { searchParams } = new URL(request.url);
    const usuarioId = searchParams.get("usuario_id");
    const fecha = searchParams.get("fecha");

    const condiciones: string[] = [];
    const args: unknown[] = [];
    if (usuarioId) {
      condiciones.push("r.usuario_id = ?");
      args.push(usuarioId);
    }
    if (fecha) {
      condiciones.push("r.fecha = ?");
      args.push(fecha);
    }

    const sql =
      SELECT +
      (condiciones.length ? ` WHERE ${condiciones.join(" AND ")}` : "") +
      " ORDER BY r.fecha DESC, r.id DESC";

    const registros = await select<Registro>(sql, args);
    return NextResponse.json(registros);
  });
}

export async function POST(request: Request) {
  return conManejoErrores(async () => {
    await initDb();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Cuerpo de la petición inválido" },
        { status: 400 },
      );
    }

    const { usuario_id, fecha, foto, hora_ingreso, hora_salida } = body;

    if (!usuario_id || !fecha || typeof hora_ingreso !== "string" || !hora_ingreso) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios (usuario, fecha, hora de ingreso)" },
        { status: 400 },
      );
    }

    const usuario = await selectOne<{ id: number }>(
      "SELECT id FROM usuarios WHERE id = ?",
      [usuario_id],
    );
    if (!usuario) {
      return NextResponse.json({ error: "El usuario no existe" }, { status: 400 });
    }

    const { lastInsertRowid } = await execute(
      `INSERT INTO registros (usuario_id, fecha, foto, hora_ingreso, hora_salida)
       VALUES (?, ?, ?, ?, ?)`,
      [
        usuario_id,
        fecha,
        limpiarFoto(foto),
        hora_ingreso,
        typeof hora_salida === "string" && hora_salida ? hora_salida : null,
      ],
    );

    const registro = await selectOne<Registro>(
      `${SELECT} WHERE r.id = ?`,
      [lastInsertRowid],
    );
    return NextResponse.json(registro, { status: 201 });
  });
}
