import { NextResponse } from "next/server";
import db from "@/lib/db";
import type { Usuario } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const usuarios = db
    .prepare("SELECT * FROM usuarios ORDER BY nombre COLLATE NOCASE")
    .all() as Usuario[];
  return NextResponse.json(usuarios);
}

export async function POST(request: Request) {
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
    const info = db.prepare("INSERT INTO usuarios (nombre) VALUES (?)").run(nombre);
    const usuario = db
      .prepare("SELECT * FROM usuarios WHERE id = ?")
      .get(info.lastInsertRowid) as Usuario;
    return NextResponse.json(usuario, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Ya existe un usuario con ese nombre" },
      { status: 409 },
    );
  }
}
