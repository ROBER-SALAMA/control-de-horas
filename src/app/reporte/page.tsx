"use client";

import { useEffect, useState } from "react";
import type {
  DetalleReporte,
  ReportePorUsuario,
  ResumenReporte,
  Usuario,
} from "@/lib/types";
import { mensajeDeError, pedirJson } from "@/lib/api";
import {
  formatearFecha,
  formatearHoras,
  formatearHora12,
  mesActual,
  nombreMes,
} from "@/lib/horas";

interface DatosReporte {
  mes: string | null;
  detalle: DetalleReporte[];
  resumen: ResumenReporte;
  porUsuario: ReportePorUsuario[];
}

const estilosInput =
  "rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

export default function ReportePage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [mes, setMes] = useState(mesActual());
  const [usuarioId, setUsuarioId] = useState("");
  const [datos, setDatos] = useState<DatosReporte | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refresco, setRefresco] = useState(0);

  useEffect(() => {
    let activo = true;
    pedirJson<Usuario[]>("/api/usuarios")
      .then((us) => {
        if (activo) setUsuarios(us);
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    const params = new URLSearchParams({ mes });
    if (usuarioId) params.set("usuario_id", usuarioId);
    pedirJson<DatosReporte>(`/api/reporte?${params.toString()}`)
      .then((data) => {
        if (activo) setDatos(data);
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
  }, [mes, usuarioId, refresco]);

  const seleccionUnUsuario = usuarioId !== "";
  const resumen = datos?.resumen;

  // Acumulado para el usuario seleccionado (fila por fila, en orden de fecha)
  const acumuladoPorId = new Map<number, number>();
  if (datos && seleccionUnUsuario) {
    let acumulado = 0;
    for (const r of datos.detalle) {
      if (r.horas != null) acumulado += r.horas;
      acumuladoPorId.set(r.id, Math.round(acumulado * 100) / 100);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
          Reporte de horas
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {datos?.mes ? nombreMes(datos.mes) : "Todas las fechas"} · consulta
          cuántas horas acumuladas lleva cada usuario.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Mes
          </label>
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className={estilosInput}
          />
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Usuario
          </label>
          <select
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value)}
            className={estilosInput}
          >
            <option value="">Todos los usuarios</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setRefresco((r) => r + 1)}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Consultar
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Tarjetas de resumen */}
      {resumen && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-500 to-violet-600 p-5 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-100">
              Total de horas
            </p>
            <p className="mt-1.5 text-3xl font-bold">
              {formatearHoras(resumen.totalHoras)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Días registrados
            </p>
            <p className="mt-1.5 text-3xl font-bold text-zinc-900">
              {resumen.totalDias}
            </p>
            <p className="text-xs text-zinc-400">
              {resumen.diasConHoras} con horas completas
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Promedio por día
            </p>
            <p className="mt-1.5 text-3xl font-bold text-zinc-900">
              {formatearHoras(resumen.promedioDiario)}
            </p>
            <p className="text-xs text-zinc-400">por jornada con salida</p>
          </div>
        </div>
      )}

      {/* Resumen por usuario */}
      {datos && !seleccionUnUsuario && datos.porUsuario.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="font-semibold text-zinc-900">Horas por usuario</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {datos.porUsuario.map((u, i) => (
              <div
                key={u.usuario_id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-50/60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                  {u.usuario_nombre.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-zinc-900">
                    {u.usuario_nombre}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {u.dias} día{u.dias !== 1 && "s"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-zinc-900">
                    {formatearHoras(u.totalHoras)}
                  </p>
                  <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{
                        width: `${
                          datos.resumen.totalHoras > 0
                            ? (u.totalHoras / datos.resumen.totalHoras) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <span className="w-16 text-right text-sm text-zinc-400">
                  #{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalle */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-semibold text-zinc-900">Detalle por jornada</h2>
          <p className="text-xs text-zinc-500">
            {datos?.detalle.length ?? 0} registro
            {datos?.detalle.length !== 1 && "s"} en el periodo
          </p>
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-400">
            Consultando…
          </div>
        ) : !datos || datos.detalle.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="text-2xl">📊</span>
            <p className="text-sm font-medium text-zinc-600">
              Sin registros en este periodo
            </p>
            <p className="text-xs text-zinc-400">
              Prueba con otro mes o con otro usuario.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs uppercase tracking-wide text-zinc-400">
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  {!seleccionUnUsuario && (
                    <th className="px-3 py-3 font-semibold">Usuario</th>
                  )}
                  <th className="px-3 py-3 font-semibold">Entrada</th>
                  <th className="px-3 py-3 font-semibold">Salida</th>
                  <th className="px-3 py-3 font-semibold">Horas</th>
                  {seleccionUnUsuario && (
                    <th className="px-5 py-3 text-right font-semibold">
                      Acumulado
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {datos.detalle.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-50 transition-colors last:border-0 hover:bg-zinc-50/60"
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-zinc-700">
                      {formatearFecha(r.fecha)}
                    </td>
                    {!seleccionUnUsuario && (
                      <td className="whitespace-nowrap px-3 py-3 text-zinc-700">
                        {r.usuario_nombre}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                      {formatearHora12(r.hora_ingreso)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                      {formatearHora12(r.hora_salida)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {r.horas != null ? (
                        <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                          {formatearHoras(r.horas)}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    {seleccionUnUsuario && (
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-emerald-600">
                        {acumuladoPorId.get(r.id) != null
                          ? formatearHoras(acumuladoPorId.get(r.id) ?? 0)
                          : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
