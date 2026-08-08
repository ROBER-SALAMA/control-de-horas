# ⏱ Control de Horas

Aplicación web para registrar entradas y salidas de usuarios, con foto opcional,
y consultar un reporte de horas acumuladas.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** para la interfaz
- **SQLite** vía `better-sqlite3` (archivo local en `data/control-horas.db`)

## Puesta en marcha

```bash
npm install     # instala dependencias (mejor-sqlite3 incluido)
npm run dev     # http://localhost:3000
```

Para producción:

```bash
npm run build
npm run start
```

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

El archivo SQLite se crea automáticamente en `data/control-horas.db` (está en
`.gitignore`). Las fotos se guardan como data URL (máx. 5 MB) en la tabla
`registros`.
