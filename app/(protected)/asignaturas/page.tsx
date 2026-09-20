import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { ListaAsignaturas } from "./lista-asignaturas";

export default async function AsignaturasPage() {
  const perfil = await getPerfilActual();
  const supabase = createClient();

  const [{ data: asignaturas, error }, { data: areas }] = await Promise.all([
    supabase
      .from("asignaturas")
      .select("id, nombre, intensidad_horaria_semanal, areas ( nombre )")
      .order("nombre"),
    supabase.from("areas").select("id, nombre").order("nombre"),
  ]);

  const filas = (asignaturas ?? []).map((a: any) => ({
    id: a.id,
    nombre: a.nombre,
    intensidad_horaria_semanal: a.intensidad_horaria_semanal,
    area_nombre: a.areas?.nombre ?? "Sin área",
  }));

  const puedeGestionar = perfil?.rol === "coordinador" || perfil?.rol === "superadmin";

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-ink">Asignaturas</h1>

      {error && (
        <p className="mb-4 rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
          No se pudieron cargar las asignaturas: {error.message}
        </p>
      )}

      <ListaAsignaturas asignaturas={filas} areas={areas ?? []} puedeGestionar={puedeGestionar} />
    </div>
  );
}
