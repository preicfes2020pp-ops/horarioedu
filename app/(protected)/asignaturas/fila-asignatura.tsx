"use client";

import { useState } from "react";
import { actualizarAsignatura, eliminarAsignatura } from "./actions";
import { AvatarIniciales, ChevronDerecha } from "../componentes-lista";

type Asignatura = {
  id: string;
  nombre: string;
  intensidad_horaria_semanal: number | null;
  area_nombre: string;
};

export function FilaAsignatura({
  asignatura,
  puedeGestionar,
  conBorde,
}: {
  asignatura: Asignatura;
  puedeGestionar: boolean;
  conBorde: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(formData: FormData) {
    const resultado = await actualizarAsignatura(asignatura.id, formData);
    if (resultado?.error) setError(resultado.error);
    else {
      setError(null);
      setEditando(false);
    }
  }

  async function borrar() {
    if (!confirm(`¿Eliminar "${asignatura.nombre}"?`)) return;
    const resultado = await eliminarAsignatura(asignatura.id);
    if (resultado?.error) setError(resultado.error);
  }

  if (editando) {
    return (
      <div className={`bg-brand-50/40 p-4 ${conBorde ? "border-b border-border" : ""}`}>
        <form action={guardar} className="space-y-2">
          <input
            name="nombre"
            defaultValue={asignatura.nombre}
            required
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <input
            name="intensidad_horaria_semanal"
            type="number"
            defaultValue={asignatura.intensidad_horaria_semanal ?? ""}
            placeholder="Horas/semana"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditando(false)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted">
              Cancelar
            </button>
            <button
              type="button"
              onClick={borrar}
              className="rounded-md border border-accent-coral px-3 py-1.5 text-sm text-accent-coral"
            >
              Eliminar
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
      <AvatarIniciales texto={asignatura.nombre} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{asignatura.nombre}</p>
        <p className="truncate text-xs text-muted">
          {asignatura.area_nombre}
          {asignatura.intensidad_horaria_semanal ? ` · ${asignatura.intensidad_horaria_semanal} h/sem` : ""}
        </p>
      </div>
      {puedeGestionar && <ChevronDerecha />}
    </button>
  );
}
