"use client";

import { useState } from "react";
import { EncabezadoLista, useBusqueda } from "../componentes-lista";
import { NuevaAulaForm } from "./nueva-aula-form";
import { FilaAula } from "./fila-aula";

type Aula = {
  id: string;
  nombre: string;
  capacidad: number | null;
  sede: string | null;
  tipo: string;
  activa: boolean;
};

export function ListaAulas({ aulas, puedeGestionar }: { aulas: Aula[]; puedeGestionar: boolean }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { busqueda, setBusqueda, filtrados } = useBusqueda(aulas, (a) => a.nombre);

  return (
    <div>
      <EncabezadoLista
        placeholder="Buscar aula..."
        busqueda={busqueda}
        onBuscar={setBusqueda}
        mostrarFormulario={mostrarFormulario}
        onToggleFormulario={() => setMostrarFormulario((v) => !v)}
        puedeAgregar={puedeGestionar}
      />

      {mostrarFormulario && <NuevaAulaForm />}

      <div className="overflow-hidden rounded-card border border-border bg-card">
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            {aulas.length === 0 ? "Todavía no hay aulas registradas." : "Sin resultados."}
          </p>
        ) : (
          filtrados.map((a, i) => (
            <FilaAula key={a.id} aula={a} puedeGestionar={puedeGestionar} conBorde={i !== filtrados.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}
