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
  if (foto.length > 10_000_000) return null;
  return foto;
}

type RouteProps = { params: Promise<{ id: string }> };

export async function PUT(request: Request, props: RouteProps) {
  const { id } = await props.params;

  const existente = db.prepare("SELECT id FROM registros WHERE id = ?").get(id);
  if (!existente) {
    return NextResponse.json(
      { error: "Registro no encontrado" },
      { status: 404 },
    );
  }

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

  db.prepare(
    `UPDATE registros
     SET usuario_id = ?, fecha = ?, foto = ?, hora_ingreso = ?, hora_salida = ?
     WHERE id = ?`,
  ).run(
    usuario_id,
    fecha,
    limpiarFoto(foto),
    hora_ingreso,
    typeof hora_salida === "string" && hora_salida ? hora_salida : null,
    id,
  );

  const actualizado = db
    .prepare(`${SELECT} WHERE r.id = ?`)
    .get(id) as Registro;
  return NextResponse.json(actualizado);
}

export async function DELETE(_request: Request, props: RouteProps) {
  const { id } = await props.params;
  const info = db.prepare("DELETE FROM registros WHERE id = ?").run(id);
  if (info.changes === 0) {
    return NextResponse.json(
      { error: "Registro no encontrado" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
