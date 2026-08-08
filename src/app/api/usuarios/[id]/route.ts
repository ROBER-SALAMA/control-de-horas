import { NextResponse } from "next/server";
import { execute, initDb, selectOne } from "@/lib/db";
import { conManejoErrores } from "@/lib/routeUtils";
import type { Usuario } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function PUT(request: Request, props: RouteProps) {
  return conManejoErrores(async () => {
    await initDb();
    const { id } = await props.params;

    const existente = await selectOne<Usuario>(
      "SELECT id FROM usuarios WHERE id = ?",
      [id],
    );
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
      await execute("UPDATE usuarios SET nombre = ? WHERE id = ?", [nombre, id]);
      const usuario = await selectOne<Usuario>(
        "SELECT * FROM usuarios WHERE id = ?",
        [id],
      );
      return NextResponse.json(usuario);
    } catch {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese nombre" },
        { status: 409 },
      );
    }
  });
}

export async function DELETE(_request: Request, props: RouteProps) {
  return conManejoErrores(async () => {
    await initDb();
    const { id } = await props.params;

    const existente = await selectOne<Usuario>(
      "SELECT id FROM usuarios WHERE id = ?",
      [id],
    );
    if (!existente) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    // Los registros del usuario se borran en cascada (ON DELETE CASCADE)
    await execute("DELETE FROM usuarios WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  });
}
