"use client";

import { useState } from "react";
import { EncabezadoLista, useBusqueda } from "../componentes-lista";
import { NuevoProfesorForm } from "./nuevo-profesor-form";
import { FilaProfesor } from "./fila-profesor";

type Profesor = {
  perfil_id: string;
  nombre_completo: string;
  correo: string;
  area_principal: string | null;
  horas_asignadas: number;
};

export function ListaProfesores({
  profesores,
  puedeGestionar,
}: {
  profesores: Profesor[];
  puedeGestionar: boolean;
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { busqueda, setBusqueda, filtrados } = useBusqueda(profesores, (p) => p.nombre_completo);

  return (
    <div>
      <EncabezadoLista
        placeholder="Buscar profesor..."
        busqueda={busqueda}
        onBuscar={setBusqueda}
        mostrarFormulario={mostrarFormulario}
        onToggleFormulario={() => setMostrarFormulario((v) => !v)}
        puedeAgregar={puedeGestionar}
      />

      {mostrarFormulario && <NuevoProfesorForm />}

      <div className="overflow-hidden rounded-card border border-border bg-card">
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            {profesores.length === 0 ? "Todavía no hay profesores registrados." : "Sin resultados."}
          </p>
        ) : (
          filtrados.map((p, i) => (
            <FilaProfesor
              key={p.perfil_id}
              profesor={p}
              puedeGestionar={puedeGestionar}
              conBorde={i !== filtrados.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}
