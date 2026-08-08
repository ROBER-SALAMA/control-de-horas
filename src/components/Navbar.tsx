"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const enlaces = [
  { href: "/", label: "Registros" },
  { href: "/reporte", label: "Reporte" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 font-semibold text-zinc-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-lg text-white shadow-sm shadow-indigo-500/30">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </span>
          <span className="hidden sm:block">Control de Horas</span>
        </Link>

        <nav className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
          {enlaces.map((e) => {
            const activo = pathname === e.href;
            return (
              <Link
                key={e.href}
                href={e.href}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  activo
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {e.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
