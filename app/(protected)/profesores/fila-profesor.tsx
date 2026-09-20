"use client";

import { useState } from "react";
import { actualizarDocente } from "./actions";
import { AvatarIniciales, ChevronDerecha } from "../componentes-lista";

type Profesor = {
  perfil_id: string;
  nombre_completo: string;
  correo: string;
  area_principal: string | null;
  horas_asignadas: number;
};

export function FilaProfesor({
  profesor,
  puedeGestionar,
  conBorde,
}: {
  profesor: Profesor;
  puedeGestionar: boolean;
  conBorde: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(formData: FormData) {
    const resultado = await actualizarDocente(profesor.perfil_id, formData);
    if (resultado?.error) setError(resultado.error);
    else {
      setError(null);
      setEditando(false);
    }
  }

  if (editando) {
    return (
      <div className={`bg-brand-50/40 p-4 ${conBorde ? "border-b border-border" : ""}`}>
        <form action={guardar} className="space-y-2">
          <input
            name="area_principal"
            placeholder="Área principal"
            defaultValue={profesor.area_principal ?? ""}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="informacion_profesional"
            placeholder="Información profesional"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditando(false)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted">
              Cancelar
            </button>
            <button type="submit" className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
              Guardar
            </button>
          </div>
          {error && <p className="text-sm text-accent-coral">{error}</p>}
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => puedeGestionar && setEditando(true)}
      disabled={!puedeGestionar}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface ${
        conBorde ? "border-b border-border" : ""
      }`}
    >
      <AvatarIniciales texto={profesor.nombre_completo} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{profesor.nombre_completo}</p>
        <p className="truncate text-xs text-muted">
          {profesor.area_principal ?? "Sin área"} · {profesor.horas_asignadas} h/sem
        </p>
      </div>
      {puedeGestionar && <ChevronDerecha />}
    </button>
  );
}
