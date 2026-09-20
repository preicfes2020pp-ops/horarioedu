import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { ListaProfesores } from "./lista-profesores";

export default async function ProfesoresPage() {
  const perfil = await getPerfilActual();
  const supabase = createClient();

  const [{ data: docentes, error }, { data: asignaciones }] = await Promise.all([
    supabase
      .from("docentes")
      .select("perfil_id, area_principal, perfiles ( nombre_completo, correo )"),
    supabase.from("asignaciones_docente").select("docente_id, horas_semanales"),
  ]);

  const horasPorDocente = new Map<string, number>();
  for (const a of asignaciones ?? []) {
    horasPorDocente.set(a.docente_id, (horasPorDocente.get(a.docente_id) ?? 0) + a.horas_semanales);
  }

  const filas = (docentes ?? []).map((d: any) => ({
    perfil_id: d.perfil_id,
    nombre_completo: d.perfiles?.nombre_completo ?? "—",
    correo: d.perfiles?.correo ?? "—",
    area_principal: d.area_principal,
    horas_asignadas: horasPorDocente.get(d.perfil_id) ?? 0,
  }));

  const puedeGestionar = perfil?.rol === "coordinador" || perfil?.rol === "superadmin";

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-ink">Profesores</h1>

      {error && (
        <p className="mb-4 rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
          No se pudieron cargar los profesores: {error.message}
        </p>
      )}

      <ListaProfesores profesores={filas} puedeGestionar={puedeGestionar} />
    </div>
  );
}
