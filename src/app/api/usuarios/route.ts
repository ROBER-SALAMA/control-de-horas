import { NextResponse } from "next/server";
import { execute, initDb, select, selectOne } from "@/lib/db";
import { conManejoErrores } from "@/lib/routeUtils";
import type { Usuario } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return conManejoErrores(async () => {
    await initDb();
    const usuarios = await select<Usuario>(
      "SELECT * FROM usuarios ORDER BY nombre COLLATE NOCASE",
    );
    return NextResponse.json(usuarios);
  });
}

export async function POST(request: Request) {
  return conManejoErrores(async () => {
    await initDb();

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
      const { lastInsertRowid } = await execute(
        "INSERT INTO usuarios (nombre) VALUES (?)",
        [nombre],
      );
      const usuario = await selectOne<Usuario>(
        "SELECT * FROM usuarios WHERE id = ?",
        [lastInsertRowid],
      );
      return NextResponse.json(usuario, { status: 201 });
    } catch {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese nombre" },
        { status: 409 },
      );
    }
  });
}
