"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Registro, Usuario } from "@/lib/types";
import { mensajeDeError, pedirJson } from "@/lib/api";
import HoraInput from "@/components/HoraInput";
import {
  fechaHoyLocal,
  formatearFecha,
  formatearHoras,
  formatearHora12,
  horasEntre,
} from "@/lib/horas";

const estilosInput =
  "w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </label>
  );
}

export default function RegistrosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [cargando, setCargando] = useState(true);

  // Formulario
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [usuarioId, setUsuarioId] = useState("");
  const [foto, setFoto] = useState<string | null>(null);
  const [fotoNombre, setFotoNombre] = useState("");
  const [horaIngreso, setHoraIngreso] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Nuevo usuario
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [creandoUsuario, setCreandoUsuario] = useState(false);

  // Gestión de usuarios (renombrar / eliminar)
  const [editandoUsuarioId, setEditandoUsuarioId] = useState<number | null>(null);
  const [nombreEditando, setNombreEditando] = useState("");
  const [confirmarBorradoUsuario, setConfirmarBorradoUsuario] = useState<
    number | null
  >(null);

  // Feedback
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmarBorrado, setConfirmarBorrado] = useState<number | null>(null);
  const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null);

  // Filtro del historial
  const [filtroUsuario, setFiltroUsuario] = useState("");

  const inputFotoRef = useRef<HTMLInputElement>(null);

  const cargarRegistros = useCallback(async () => {
    try {
      setRegistros(await pedirJson<Registro[]>("/api/registros"));
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    pedirJson<Usuario[]>("/api/usuarios")
      .then((us) => {
        if (activo) setUsuarios(us);
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e));
      });
    pedirJson<Registro[]>("/api/registros")
      .then((re) => {
        if (activo) setRegistros(re);
      })
      .catch((e) => {
        if (activo) setError(mensajeDeError(e));
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(null), 3500);
    return () => clearTimeout(t);
  }, [mensaje]);

  function notificar(msg: string) {
    setMensaje(msg);
    setError(null);
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;
    setCreandoUsuario(true);
    setError(null);
    try {
      const nuevo = await pedirJson<Usuario>("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreNuevo }),
      });
      setUsuarios((prev) => [...prev, nuevo]);
      setUsuarioId(String(nuevo.id));
      setNombreNuevo("");
      notificar(`Usuario "${nuevo.nombre}" creado`);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCreandoUsuario(false);
    }
  }

  function onFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen");
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setError("La imagen es demasiado grande (máx. 5 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFoto(reader.result as string);
      setFotoNombre(archivo.name);
    };
    reader.readAsDataURL(archivo);
    e.target.value = "";
  }

  function resetForm() {
    setFecha(fechaHoyLocal());
    setUsuarioId("");
    setFoto(null);
    setFotoNombre("");
    setHoraIngreso("");
    setHoraSalida("");
    setEditandoId(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!usuarioId) return setError("Selecciona un usuario");
    if (!fecha) return setError("Selecciona una fecha");
    if (!horaIngreso) return setError("Ingresa la hora de entrada");

    const payload = {
      usuario_id: Number(usuarioId),
      fecha,
      foto,
      hora_ingreso: horaIngreso,
      hora_salida: horaSalida || null,
    };

    try {
      if (editandoId != null) {
        await pedirJson<Registro>(`/api/registros/${editandoId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        notificar("Registro actualizado correctamente");
      } else {
        await pedirJson<Registro>("/api/registros", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        notificar("Registro guardado correctamente");
      }
      resetForm();
      cargarRegistros();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }

  function editar(r: Registro) {
    setEditandoId(r.id);
    setFecha(r.fecha);
    setUsuarioId(String(r.usuario_id));
    setFoto(r.foto);
    setFotoNombre(r.foto ? "Imagen del registro" : "");
    setHoraIngreso(r.hora_ingreso);
    setHoraSalida(r.hora_salida ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function eliminar(id: number) {
    try {
      await pedirJson<{ ok: boolean }>(`/api/registros/${id}`, {
        method: "DELETE",
      });
      setRegistros((prev) => prev.filter((r) => r.id !== id));
      notificar("Registro eliminado");
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setConfirmarBorrado(null);
    }
  }

  function iniciarEdicionUsuario(u: Usuario) {
    setEditandoUsuarioId(u.id);
    setNombreEditando(u.nombre);
  }

  function cancelarEdicionUsuario() {
    setEditandoUsuarioId(null);
    setNombreEditando("");
  }

  async function guardarEdicionUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!nombreEditando.trim() || editandoUsuarioId == null) return;
    try {
      const actualizado = await pedirJson<Usuario>(
        `/api/usuarios/${editandoUsuarioId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: nombreEditando }),
        },
      );
      setUsuarios((prev) =>
        prev.map((u) => (u.id === actualizado.id ? actualizado : u)),
      );
      setRegistros((prev) =>
        prev.map((r) =>
          r.usuario_id === actualizado.id
            ? { ...r, usuario_nombre: actualizado.nombre }
            : r,
        ),
      );
      setEditandoUsuarioId(null);
      setNombreEditando("");
      notificar(`Usuario renombrado a "${actualizado.nombre}"`);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }

  async function eliminarUsuario(id: number) {
    const nombre = usuarios.find((u) => u.id === id)?.nombre ?? "";
    try {
      await pedirJson<{ ok: boolean }>(`/api/usuarios/${id}`, {
        method: "DELETE",
      });
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      setRegistros((prev) => prev.filter((r) => r.usuario_id !== id));
      if (usuarioId === String(id)) setUsuarioId("");
      if (filtroUsuario === String(id)) setFiltroUsuario("");
      notificar(`Usuario "${nombre}" y sus registros eliminados`);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setConfirmarBorradoUsuario(null);
    }
  }

  const horasFormulario =
    editandoId != null
      ? null
      : horasEntre(horaIngreso, horaSalida || null);

  const registrosFiltrados = filtroUsuario
    ? registros.filter((r) => r.usuario_id === Number(filtroUsuario))
    : registros;

  const totalHorasFiltradas = registrosFiltrados.reduce(
    (acc, r) => acc + (horasEntre(r.hora_ingreso, r.hora_salida) ?? 0),
    0,
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Registro de jornadas
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Registra la entrada y salida de cada usuario, con foto opcional.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulario */}
        <div className="lg:col-span-1">
          <form
            onSubmit={guardar}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
                {editandoId != null ? (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                    </svg>
                  </span>
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                )}
                {editandoId != null ? "Editar registro" : "Nuevo registro"}
              </h2>
              {editandoId != null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                >
                  Cancelar
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Etiqueta>Fecha</Etiqueta>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={estilosInput}
                  required
                />
              </div>

              <div>
                <Etiqueta>Usuario</Etiqueta>
                <select
                  value={usuarioId}
                  onChange={(e) => setUsuarioId(e.target.value)}
                  className={estilosInput}
                  required
                >
                  <option value="">Selecciona un usuario…</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre}
                    </option>
                  ))}
                </select>
                {usuarios.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-600">
                    Aún no hay usuarios. Créalo en el panel inferior.
                  </p>
                )}
              </div>

              <div>
                <Etiqueta>Foto (opcional)</Etiqueta>
                <input
                  ref={inputFotoRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFoto}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => inputFotoRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-3.5 py-3 text-sm font-medium text-zinc-600 transition hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-600"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                    <circle cx="12" cy="13" r="3" />
                  </svg>
                  Tomar foto o elegir archivo
                </button>
                {foto && (
                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFotoAmpliada(foto)}
                      className="group relative overflow-hidden rounded-lg border border-zinc-200 shadow-sm transition hover:scale-105"
                      title="Ver foto"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={foto}
                        alt="Vista previa"
                        className="h-14 w-14 object-cover"
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-zinc-600">{fotoNombre}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setFoto(null);
                          setFotoNombre("");
                        }}
                        className="mt-1 text-xs font-medium text-red-500 transition hover:text-red-700"
                      >
                        Quitar foto
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Etiqueta>Hora de ingreso</Etiqueta>
                  <HoraInput value={horaIngreso} onChange={setHoraIngreso} />
                </div>
                <div>
                  <Etiqueta>Hora de salida</Etiqueta>
                  <HoraInput value={horaSalida} onChange={setHoraSalida} />
                </div>
              </div>

              {editandoId == null && horasFormulario != null && (
                <p className="rounded-xl bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-700">
                  Horas de esta jornada:{" "}
                  <span className="font-semibold">
                    {formatearHoras(horasFormulario)}
                  </span>
                </p>
              )}

              {error && (
                <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  editandoId != null
                    ? "bg-amber-500 shadow-amber-500/30 hover:bg-amber-600 focus:ring-amber-500"
                    : "bg-indigo-600 shadow-indigo-600/30 hover:bg-indigo-700 focus:ring-indigo-500"
                }`}
              >
                {editandoId != null ? "Actualizar registro" : "Guardar registro"}
              </button>
            </div>
          </form>

          {/* Gestión de usuarios */}
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-zinc-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M22 11h-6" />
                </svg>
              </span>
              Usuarios
            </h2>

            <form onSubmit={crearUsuario} className="flex gap-2">
              <input
                type="text"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                placeholder="Nombre del usuario nuevo"
                className={estilosInput}
              />
              <button
                type="submit"
                disabled={creandoUsuario || !nombreNuevo.trim()}
                className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creandoUsuario ? "…" : "Crear"}
              </button>
            </form>

            {usuarios.length > 0 && (
              <ul className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
                {usuarios.map((u) => {
                  const confirmando = confirmarBorradoUsuario === u.id;
                  const editando = editandoUsuarioId === u.id;
                  const cantidadRegistros = registros.filter(
                    (r) => r.usuario_id === u.id,
                  ).length;
                  return (
                    <li key={u.id} className="py-2.5">
                      {editando ? (
                        <form onSubmit={guardarEdicionUsuario} className="flex gap-2">
                          <input
                            type="text"
                            value={nombreEditando}
                            onChange={(e) => setNombreEditando(e.target.value)}
                            className={estilosInput}
                            autoFocus
                          />
                          <button
                            type="submit"
                            title="Guardar nombre"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={cancelarEdicionUsuario}
                            title="Cancelar"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white">
                            {u.nombre.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">
                            {u.nombre}
                          </span>
                          {confirmando ? (
                            <span className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => eliminarUsuario(u.id)}
                                className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                              >
                                Sí, eliminar
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmarBorradoUsuario(null)}
                                className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
                              >
                                No
                              </button>
                            </span>
                          ) : (
                            <span className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => iniciarEdicionUsuario(u)}
                                title="Renombrar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmarBorradoUsuario(u.id)}
                                title="Eliminar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                </svg>
                              </button>
                            </span>
                          )}
                        </div>
                      )}
                      {confirmando && (
                        <p className="mt-1.5 text-[11px] leading-snug text-red-500">
                          Se eliminarán también {cantidadRegistros} registro
                          {cantidadRegistros !== 1 && "s"} de este usuario.
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Lista de registros */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
              <div>
                <h2 className="font-semibold text-zinc-900">Historial</h2>
                <p className="text-xs text-zinc-500">
                  {registrosFiltrados.length} registro
                  {registrosFiltrados.length !== 1 && "s"}
                  {totalHorasFiltradas > 0 && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="font-semibold text-indigo-600">
                        {formatearHoras(totalHorasFiltradas)}
                      </span>{" "}
                      en total
                    </>
                  )}
                </p>
              </div>
              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                aria-label="Filtrar por usuario"
              >
                <option value="">Todos los usuarios</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>

            {cargando ? (
              <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
                Cargando registros…
              </div>
            ) : registrosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-2xl">
                  {filtroUsuario ? "🔍" : "🕐"}
                </span>
                <p className="text-sm font-medium text-zinc-600">
                  {filtroUsuario
                    ? "Sin registros para este usuario"
                    : "Todavía no hay registros"}
                </p>
                <p className="text-xs text-zinc-400">
                  {filtroUsuario
                    ? "Prueba con otro filtro o registra una jornada."
                    : "Usa el formulario para agregar tu primera jornada."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                      <th className="px-5 py-3 font-semibold">Foto</th>
                      <th className="px-3 py-3 font-semibold">Fecha</th>
                      <th className="px-3 py-3 font-semibold">Usuario</th>
                      <th className="px-3 py-3 font-semibold">Entrada</th>
                      <th className="px-3 py-3 font-semibold">Salida</th>
                      <th className="px-3 py-3 font-semibold">Horas</th>
                      <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrosFiltrados.map((r) => {
                      const horas = horasEntre(r.hora_ingreso, r.hora_salida);
                      const confirmando = confirmarBorrado === r.id;
                      return (
                        <tr
                          key={r.id}
                          className={`border-b border-zinc-50 transition-colors last:border-0 hover:bg-zinc-50/60 ${
                            editandoId === r.id ? "bg-amber-50/60" : ""
                          }`}
                        >
                          <td className="px-5 py-3">
                            {r.foto ? (
                              <button
                                type="button"
                                onClick={() => setFotoAmpliada(r.foto)}
                                className="block overflow-hidden rounded-lg border border-zinc-200 shadow-sm transition hover:scale-110"
                                title="Ver foto"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={r.foto}
                                  alt="Foto del registro"
                                  className="h-10 w-10 object-cover"
                                />
                              </button>
                            ) : (
                              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-300">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                                </svg>
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-medium text-zinc-700">
                            {formatearFecha(r.fecha)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                            {r.usuario_nombre}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                            {formatearHora12(r.hora_ingreso)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                            {formatearHora12(r.hora_salida)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3">
                            {horas != null ? (
                              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                                {formatearHoras(horas)}
                              </span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => editar(r)}
                                title="Editar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                </svg>
                              </button>
                              {confirmando ? (
                                <span className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => eliminar(r.id)}
                                    className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
                                  >
                                    Sí, eliminar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmarBorrado(null)}
                                    className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-200"
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmarBorrado(r.id)}
                                  title="Eliminar"
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast de confirmación */}
      {mensaje && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-400">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {mensaje}
        </div>
      )}

      {/* Visor de foto */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setFotoAmpliada(null)}
        >
          <button
            type="button"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={() => setFotoAmpliada(null)}
            title="Cerrar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={fotoAmpliada}
            alt="Foto ampliada"
            className="max-h-[85vh] max-w-full rounded-xl shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}
