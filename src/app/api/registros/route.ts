import { NextResponse } from "next/server";
import db from "@/lib/db";
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
  const { searchParams } = new URL(request.url);
  const usuarioId = searchParams.get("usuario_id");
  const fecha = searchParams.get("fecha");

  const condiciones: string[] = [];
  const params: unknown[] = [];
  if (usuarioId) {
    condiciones.push("r.usuario_id = ?");
    params.push(usuarioId);
  }
  if (fecha) {
    condiciones.push("r.fecha = ?");
    params.push(fecha);
  }

  const sql =
    SELECT +
    (condiciones.length ? ` WHERE ${condiciones.join(" AND ")}` : "") +
    " ORDER BY r.fecha DESC, r.id DESC";

  const registros = db.prepare(sql).all(...params) as Registro[];
  return NextResponse.json(registros);
}

export async function POST(request: Request) {
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

  const usuario = db
    .prepare("SELECT id FROM usuarios WHERE id = ?")
    .get(usuario_id);
  if (!usuario) {
    return NextResponse.json({ error: "El usuario no existe" }, { status: 400 });
  }

  const info = db
    .prepare(
      `INSERT INTO registros (usuario_id, fecha, foto, hora_ingreso, hora_salida)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(
      usuario_id,
      fecha,
      limpiarFoto(foto),
      hora_ingreso,
      typeof hora_salida === "string" && hora_salida ? hora_salida : null,
    );

  const registro = db
    .prepare(`${SELECT} WHERE r.id = ?`)
    .get(info.lastInsertRowid) as Registro;
  return NextResponse.json(registro, { status: 201 });
}
