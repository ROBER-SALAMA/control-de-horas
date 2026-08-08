import { NextResponse } from "next/server";
import db from "@/lib/db";
import type { Usuario } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function PUT(request: Request, props: RouteProps) {
  const { id } = await props.params;

  const existente = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(id);
  if (!existente) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 },
    );
  }

  let body: { nombre?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Cuerpo de la petición inválido" },
      { status: 400 },
    );
  }

  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre es obligatorio" },
      { status: 400 },
    );
  }

  try {
    db.prepare("UPDATE usuarios SET nombre = ? WHERE id = ?").run(nombre, id);
    const usuario = db
      .prepare("SELECT * FROM usuarios WHERE id = ?")
      .get(id) as Usuario;
    return NextResponse.json(usuario);
  } catch {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese nombre" },
      { status: 409 },
    );
  }
}

export async function DELETE(_request: Request, props: RouteProps) {
  const { id } = await props.params;

  const existente = db.prepare("SELECT id FROM usuarios WHERE id = ?").get(id);
  if (!existente) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 },
    );
  }

  // Los registros del usuario se borran en cascada (ON DELETE CASCADE)
  db.prepare("DELETE FROM usuarios WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
