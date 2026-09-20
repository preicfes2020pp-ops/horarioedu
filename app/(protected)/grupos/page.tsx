import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { ListaGrupos } from "./lista-grupos";

export default async function GruposPage() {
  const perfil = await getPerfilActual();
  const supabase = createClient();

  const [{ data: grupos, error }, { data: grados }] = await Promise.all([
    supabase
      .from("grupos")
      .select("id, nombre, codigo_grupo, jornada, anio_lectivo, grados ( nombre )")
      .order("nombre"),
    supabase.from("grados").select("id, nombre").order("nombre"),
  ]);

  const filas = (grupos ?? []).map((g: any) => ({
    id: g.id,
    nombre: g.nombre,
    codigo_grupo: g.codigo_grupo,
    jornada: g.jornada,
    anio_lectivo: g.anio_lectivo,
    grado_nombre: g.grados?.nombre ?? "Sin grado",
  }));

  const puedeGestionar = perfil?.rol === "coordinador" || perfil?.rol === "superadmin";

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-ink">Grupos</h1>

      {error && (
        <p className="mb-4 rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
          No se pudieron cargar los grupos: {error.message}
        </p>
      )}

      <ListaGrupos grupos={filas} grados={grados ?? []} puedeGestionar={puedeGestionar} />
    </div>
  );
}
