"use client";

import { useState } from "react";
import { EncabezadoLista, useBusqueda } from "../componentes-lista";
import { NuevaAsignaturaForm } from "./nueva-asignatura-form";
import { FilaAsignatura } from "./fila-asignatura";

type Asignatura = {
  id: string;
  nombre: string;
  intensidad_horaria_semanal: number | null;
  area_nombre: string;
};

export function ListaAsignaturas({
  asignaturas,
  areas,
  puedeGestionar,
}: {
  asignaturas: Asignatura[];
  areas: any[];
  puedeGestionar: boolean;
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { busqueda, setBusqueda, filtrados } = useBusqueda(asignaturas, (a) => a.nombre);

  return (
    <div>
      <EncabezadoLista
        placeholder="Buscar asignatura..."
        busqueda={busqueda}
        onBuscar={setBusqueda}
        mostrarFormulario={mostrarFormulario}
        onToggleFormulario={() => setMostrarFormulario((v) => !v)}
        puedeAgregar={puedeGestionar}
      />

      {mostrarFormulario && <NuevaAsignaturaForm areas={areas} />}

      <div className="overflow-hidden rounded-card border border-border bg-card">
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            {asignaturas.length === 0 ? "Todavía no hay asignaturas registradas." : "Sin resultados."}
          </p>
        ) : (
          filtrados.map((a, i) => (
            <FilaAsignatura
              key={a.id}
              asignatura={a}
              puedeGestionar={puedeGestionar}
              conBorde={i !== filtrados.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
