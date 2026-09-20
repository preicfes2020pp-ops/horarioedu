"use client";

import { useState } from "react";
import { marcarResuelto } from "./actions";

type Conflicto = {
  id: string;
  tipo: string;
  severidad: string;
  descripcion: string;
  resuelto: boolean;
  version_etiqueta: string;
};

const ESTILO_SEVERIDAD: Record<string, { icono: string; borde: string; fondo: string }> = {
  critico: { icono: "⚠️", borde: "border-l-accent-coral", fondo: "bg-accent-coral/5" },
  advertencia: { icono: "⚠️", borde: "border-l-accent-amber", fondo: "bg-accent-amber/5" },
};

export function TarjetaConflicto({ conflicto, puedeResolver }: { conflicto: Conflicto; puedeResolver: boolean }) {
  const [resuelto, setResuelto] = useState(conflicto.resuelto);
  const [cargando, setCargando] = useState(false);

  async function resolver() {
    setCargando(true);
    const r = await marcarResuelto(conflicto.id);
    setCargando(false);
    if (!r.error) setResuelto(true);
  }

  const estilo = resuelto
    ? { icono: "✅", borde: "border-l-accent-teal", fondo: "bg-accent-teal/5" }
    : ESTILO_SEVERIDAD[conflicto.severidad] ?? ESTILO_SEVERIDAD.advertencia;

  return (
    <div className={`rounded-card border-l-4 ${estilo.borde} ${estilo.fondo} p-3.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="text-lg leading-none">{estilo.icono}</span>
          <div>
            <p className="text-sm font-medium text-ink">{conflicto.descripcion}</p>
            <p className="mt-0.5 text-xs text-muted">{conflicto.version_etiqueta}</p>
          </div>
        </div>
        {puedeResolver && !resuelto && (
          <button
            onClick={resolver}
            disabled={cargando}
            className="shrink-0 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-brand-600 disabled:opacity-60"
          >
            {cargando ? "..." : "Resolver"}
          </button>
        )}
      </div>
    </div>
  );
}
