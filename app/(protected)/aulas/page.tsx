import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { ListaAulas } from "./lista-aulas";

export default async function AulasPage() {
  const perfil = await getPerfilActual();
  const supabase = createClient();

  const { data: aulas, error } = await supabase
    .from("aulas")
    .select("id, nombre, capacidad, sede, tipo, activa")
    .order("nombre");

  const puedeGestionar = perfil?.rol === "coordinador" || perfil?.rol === "superadmin";

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-ink">Aulas</h1>

      {error && (
        <p className="mb-4 rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
          No se pudieron cargar las aulas: {error.message}
        </p>
      )}

      <ListaAulas aulas={aulas ?? []} puedeGestionar={puedeGestionar} />
    </div>
  );
}
