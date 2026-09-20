"use client";

import { useState } from "react";
import { actualizarAula, eliminarAula } from "./actions";
import { AvatarIniciales, ChevronDerecha } from "../componentes-lista";

const TIPOS: Record<string, string> = {
  normal: "Normal",
  laboratorio: "Laboratorio",
  informatica: "Informática",
  ingles: "Inglés",
  educacion_fisica: "Educación física",
  auditorio: "Auditorio",
  especializada: "Especializada",
};

type Aula = {
  id: string;
  nombre: string;
  capacidad: number | null;
  sede: string | null;
  tipo: string;
  activa: boolean;
};

export function FilaAula({ aula, puedeGestionar, conBorde }: { aula: Aula; puedeGestionar: boolean; conBorde: boolean }) {
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(formData: FormData) {
    const resultado = await actualizarAula(aula.id, formData);
    if (resultado?.error) setError(resultado.error);
    else {
      setError(null);
      setEditando(false);
    }
  }

  async function borrar() {
    if (!confirm(`¿Eliminar el aula "${aula.nombre}"?`)) return;
    const resultado = await eliminarAula(aula.id);
    if (resultado?.error) setError(resultado.error);
  }

  if (editando) {
    return (
      <div className={`bg-brand-50/40 p-4 ${conBorde ? "border-b border-border" : ""}`}>
        <form action={guardar} className="space-y-2">
          <input name="nombre" defaultValue={aula.nombre} required className="w-full rounded-md border border-border px-3 py-2 text-sm" />
          <input
            name="capacidad"
            type="number"
            defaultValue={aula.capacidad ?? ""}
            placeholder="Capacidad"
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <select name="tipo" defaultValue={aula.tipo} className="w-full rounded-md border border-border px-3 py-2 text-sm">
            {Object.entries(TIPOS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditando(false)} className="rounded-md border border-border px-3 py-1.5 text-sm text-muted">
              Cancelar
            </button>
            <button type="button" onClick={borrar} className="rounded-md border border-accent-coral px-3 py-1.5 text-sm text-accent-coral">
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
      <AvatarIniciales texto={aula.nombre} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{aula.nombre}</p>
        <p className="truncate text-xs text-muted">
          {TIPOS[aula.tipo] ?? aula.tipo}
          {aula.capacidad ? ` · Capacidad ${aula.capacidad}` : ""}
        </p>
      </div>
      {puedeGestionar && <ChevronDerecha />}
    </button>
  );
}
