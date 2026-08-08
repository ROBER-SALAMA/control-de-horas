"use client";

const HORAS = ["12", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];

const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

interface HoraInputProps {
  /** Hora en formato 24h "HH:MM" o "" si está vacía. */
  value: string;
  /** Devuelve la hora en formato 24h "HH:MM" o "" si se limpió. */
  onChange: (v: string) => void;
}

interface Partes {
  h12: string;
  m: string;
  p: "AM" | "PM";
}

/** "17:30" -> { h12: "05", m: "30", p: "PM" } */
function descomponer(v: string): Partes | null {
  if (!/^\d{2}:\d{2}$/.test(v)) return null;
  const h = Number(v.slice(0, 2));
  if (h > 23) return null;
  const h12 = h % 12 === 0 ? "12" : String(h % 12).padStart(2, "0");
  return { h12, m: v.slice(3), p: h < 12 ? "AM" : "PM" };
}

/** { h12: "05", m: "30", p: "PM" } -> "17:30" */
function componer(h12: string, m: string, p: "AM" | "PM"): string {
  let h = Number(h12) % 12; // 12 -> 0
  if (p === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m}`;
}

export default function HoraInput({ value, onChange }: HoraInputProps) {
  const partes = descomponer(value);

  const estilosSelect =
    "rounded-md border-0 bg-transparent px-1 py-1.5 text-sm font-medium text-zinc-900 outline-none hover:bg-zinc-50";

  return (
    <div className="flex w-full items-center gap-0.5 rounded-xl border border-zinc-300 bg-white px-1.5 py-1 shadow-sm transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
      <select
        value={partes?.h12 ?? ""}
        onChange={(e) =>
          onChange(componer(e.target.value, partes?.m ?? "00", partes?.p ?? "AM"))
        }
        className={estilosSelect}
        aria-label="Hora"
      >
        <option value="">--</option>
        {HORAS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>

      <span className="select-none text-sm text-zinc-300">:</span>

      <select
        value={partes?.m ?? ""}
        onChange={(e) =>
          onChange(componer(partes?.h12 ?? "12", e.target.value, partes?.p ?? "AM"))
        }
        className={estilosSelect}
        aria-label="Minutos"
      >
        <option value="">--</option>
        {MINUTOS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      <select
        value={partes?.p ?? "AM"}
        onChange={(e) =>
          onChange(
            componer(
              partes?.h12 ?? "12",
              partes?.m ?? "00",
              e.target.value as "AM" | "PM",
            ),
          )
        }
        className={`${estilosSelect} text-xs font-semibold uppercase text-zinc-500`}
        aria-label="Periodo"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>

      {value !== "" && (
        <button
          type="button"
          onClick={() => onChange("")}
          title="Limpiar hora"
          className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
