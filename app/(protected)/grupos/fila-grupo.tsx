"use client";

import { useState } from "react";
import { eliminarGrupo } from "./actions";
import { AvatarIniciales, ChevronDerecha } from "../componentes-lista";

type Grupo = {
  id: string;
  nombre: string;
  codigo_grupo: string;
  jornada: string | null;
  anio_lectivo: number;
  grado_nombre: string;
};

export function FilaGrupo({ grupo, puedeGestionar, conBorde }: { grupo: Grupo; puedeGestionar: boolean; conBorde: boolean }) {
  const [confirmando, setConfirmando] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function borrar() {
    setBorrando(true);
    const resultado = await eliminarGrupo(grupo.id);
    if (resultado?.error) {
      setError(resultado.error);
      setBorrando(false);
    }
  }

  return (
    <div className={conBorde ? "border-b border-border" : ""}>
      <div className="flex items-center gap-3 px-4 py-3">
        <AvatarIniciales texto={grupo.nombre} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{grupo.nombre}</p>
          <p className="truncate text-xs text-muted">
            {grupo.grado_nombre} · {grupo.codigo_grupo}
            {grupo.jornada ? ` · ${grupo.jornada}` : ""}
          </p>
        </div>
        {puedeGestionar ? (
          <button onClick={() => setConfirmando((v) => !v)} className="shrink-0">
            <ChevronDerecha />
          </button>
        ) : null}
      </div>

      {confirmando && (
        <div className="flex items-center justify-between bg-accent-coral/5 px-4 py-2.5">
          <span className="text-sm text-ink">¿Eliminar este grupo?</span>
          <div className="flex gap-2">
            <button onClick={() => setConfirmando(false)} className="rounded-md border border-border px-2.5 py-1 text-xs text-muted">
              Cancelar
            </button>
            <button
              onClick={borrar}
              disabled={borrando}
              className="rounded-md bg-accent-coral px-2.5 py-1 text-xs font-medium text-white disabled:opacity-50"
            >
              {borrando ? "..." : "Eliminar"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="px-4 pb-2 text-xs text-accent-coral">{error}</p>}
    </div>
  );
}
