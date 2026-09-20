"use client";

import { useState } from "react";
import { EncabezadoLista, useBusqueda } from "../componentes-lista";
import { NuevoGrupoForm } from "./nuevo-grupo-form";
import { FilaGrupo } from "./fila-grupo";

type Grupo = {
  id: string;
  nombre: string;
  codigo_grupo: string;
  jornada: string | null;
  anio_lectivo: number;
  grado_nombre: string;
};

export function ListaGrupos({ grupos, grados, puedeGestionar }: { grupos: Grupo[]; grados: any[]; puedeGestionar: boolean }) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const { busqueda, setBusqueda, filtrados } = useBusqueda(grupos, (g) => g.nombre);

  return (
    <div>
      <EncabezadoLista
        placeholder="Buscar grupo..."
        busqueda={busqueda}
        onBuscar={setBusqueda}
        mostrarFormulario={mostrarFormulario}
        onToggleFormulario={() => setMostrarFormulario((v) => !v)}
        puedeAgregar={puedeGestionar}
      />

      {mostrarFormulario && <NuevoGrupoForm grados={grados} />}

      <div className="overflow-hidden rounded-card border border-border bg-card">
        {filtrados.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">
            {grupos.length === 0 ? "Todavía no hay grupos registrados." : "Sin resultados."}
          </p>
        ) : (
          filtrados.map((g, i) => (
            <FilaGrupo key={g.id} grupo={g} puedeGestionar={puedeGestionar} conBorde={i !== filtrados.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}
