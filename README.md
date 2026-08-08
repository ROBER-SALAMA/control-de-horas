# ⏱ Control de Horas

Aplicación web para registrar entradas y salidas de usuarios, con foto opcional,
y consultar un reporte de horas acumuladas.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** para la interfaz
- **Base de datos**: SQLite vía `better-sqlite3` (archivo local en
  `data/control-horas.db`) en desarrollo, y **Turso (libSQL en la nube)** cuando
  está desplegado en Vercel.

## Puesta en marcha

```bash
npm install     # instala dependencias
npm run dev     # http://localhost:3000
```

Para producción local:

```bash
npm run build
npm run start
```

## Desplegar en Vercel (requiere Turso)

> ⚠️ **Importante**: SQLite en archivo **no funciona en Vercel** (el sistema de
> archivos de los serverless es de solo lectura y efímero). La app usa
> automáticamente **Turso** cuando existen estas variables de entorno:

1. Crea una cuenta en [Turso](https://turso.tech) y crea una base de datos
   (p. ej. `control-horas`).
2. Obtén la URL de tu base (algo como `libsql://control-horas-<usuario>.turso.io`)
   y un token de acceso (en el panel: *Tokens* → crear token).
3. En tu proyecto de Vercel: **Settings → Environment Variables**, agrega:
   - `TURSO_DATABASE_URL` = la URL de tu base de Turso
   - `TURSO_AUTH_TOKEN` = el token de acceso
4. Sube los cambios del repo y vuelve a desplegar.

En desarrollo local no necesitas Turso: sin esas variables, la app usa el
archivo `data/control-horas.db` como antes.

## API

- `GET/POST /api/usuarios` — listar / crear usuario
- `PUT/DELETE /api/usuarios/[id]` — renombrar / eliminar usuario
- `GET/POST /api/registros` — listar / crear registro
- `PUT/DELETE /api/registros/[id]` — actualizar / eliminar registro
- `GET /api/reporte?mes=YYYY-MM&usuario_id=N` — reporte de horas

## Funcionalidades

- **Gestión de usuarios**: panel "Usuarios" en la portada para **crear,
  renombrar y eliminar** usuarios. Al eliminar se borran también sus registros.
- **Nuevo registro**: selector de fecha (por defecto la fecha actual), selector
  de usuario, botón para **tomar foto o elegirla de archivos** (en el móvil abre
  la cámara; en escritorio el explorador de archivos), hora de ingreso y hora de
  salida en **formato 12 horas (AM/PM)**.
- **Editar / Eliminar**: cada fila del historial tiene botones de editar
  (carga el registro en el formulario) y eliminar (con confirmación).
- **Reporte**: en la pestaña *Reporte* se elige el mes y el usuario. Muestra el
  total de horas, días registrados, promedio por día, un resumen por usuario y el
  detalle por jornada con el acumulado de horas.

## Estructura

```
src/
  lib/
    db.ts        # conexión SQLite y esquema (usuarios, registros)
    horas.ts     # cálculo y formateo de horas
    types.ts     # tipos compartidos
    api.ts       # helper fetch para el cliente
  app/
    api/
      usuarios/          # GET lista, POST crea usuario
      registros/         # GET lista, POST crea registro
      registros/[id]/    # PUT actualiza, DELETE elimina
      reporte/           # GET resumen y detalle de horas
    page.tsx             # portada: formulario + historial
    reporte/page.tsx     # reporte de horas acumuladas
  components/
    Navbar.tsx
```

## Base de datos

- **Local**: SQLite en `data/control-horas.db` (en `.gitignore`).
- **Vercel**: Turso (libSQL en la nube), activado con las variables
  `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`. El esquema se crea solo al primer
  uso.

Las fotos se guardan como data URL (máx. 5 MB) en la tabla `registros`.

> Nota: los datos de SQLite local y los de Turso son independientes. Si ya usaste
> la app localmente y quieres conservar esos datos en producción, habrá que
> exportarlos e importarlos a Turso.
