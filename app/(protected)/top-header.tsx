"use client";

import { useState } from "react";
import Image from "next/image";

export function TopHeader({
  nombreCompleto,
  etiquetaRol,
  onCerrarSesion,
}: {
  nombreCompleto: string;
  etiquetaRol: string;
  onCerrarSesion: () => Promise<void>;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Image src="/icon-192.png" alt="HorarioEdu" width={30} height={30} className="rounded-lg" />
        <span className="text-base font-semibold text-ink">
          Horario<span className="text-brand-600">Edu</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <form action={onCerrarSesion}>
          <button
            type="submit"
            title="Cerrar sesión"
            className="flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-medium text-muted hover:border-accent-coral hover:text-accent-coral"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 17l5-5-5-5M20 12H9M12 19H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Salir
          </button>
        </form>

        <div className="relative">
          <button
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-600"
          >
            {nombreCompleto.charAt(0).toUpperCase()}
          </button>

          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuAbierto(false)} />
              <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-border bg-card p-2 shadow-lg">
                <p className="truncate px-2 py-1 text-sm font-medium text-ink">{nombreCompleto}</p>
                <p className="px-2 pb-2 text-xs text-muted">{etiquetaRol}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
