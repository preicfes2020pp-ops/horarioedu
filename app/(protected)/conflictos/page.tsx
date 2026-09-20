import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { TarjetaConflicto } from "./tarjeta-conflicto";

export default async function ConflictosPage() {
  const perfil = await getPerfilActual();
  const supabase = createClient();
  if (!perfil?.institucion_id) return null;

  const { data: versiones } = await supabase
    .from("versiones_horario")
    .select("id, numero_version")
    .eq("institucion_id", perfil.institucion_id);

  const versionIds = (versiones ?? []).map((v) => v.id);
  const etiquetaPorVersion = new Map((versiones ?? []).map((v) => [v.id, `Versión ${v.numero_version}`]));

  const { data: conflictosRaw, error } =
    versionIds.length > 0
      ? await supabase
          .from("conflictos_horario")
          .select("id, tipo, severidad, descripcion, resuelto, version_id, creado_en")
          .in("version_id", versionIds)
          .order("resuelto", { ascending: true })
          .order("severidad", { ascending: true })
          .order("creado_en", { ascending: false })
      : { data: [], error: null };

  const conflictos = (conflictosRaw ?? []).map((c) => ({
    id: c.id,
    tipo: c.tipo,
    severidad: c.severidad,
    descripcion: c.descripcion,
    resuelto: c.resuelto,
    version_etiqueta: etiquetaPorVersion.get(c.version_id) ?? "",
  }));

  const sinResolver = conflictos.filter((c) => !c.resuelto);
  const resueltos = conflictos.filter((c) => c.resuelto);
  const criticos = sinResolver.filter((c) => c.severidad === "critico").length;

  const puedeResolver = perfil.rol === "coordinador" || perfil.rol === "superadmin";

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-ink">Conflictos</h1>

      {error && (
        <p className="mb-4 rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
          {error.message}
        </p>
      )}

      {sinResolver.length > 0 ? (
        <div className="mb-4 rounded-card bg-accent-coral/10 px-4 py-3 text-sm font-medium text-accent-coral">
          {sinResolver.length} conflicto{sinResolver.length === 1 ? "" : "s"} encontrado{sinResolver.length === 1 ? "" : "s"}
          {criticos > 0 && ` · ${criticos} crítico${criticos === 1 ? "" : "s"}`}
        </div>
      ) : conflictos.length > 0 ? (
        <div className="mb-4 rounded-card bg-accent-teal/10 px-4 py-3 text-sm font-medium text-accent-teal">
          Sin conflictos pendientes ✓
        </div>
      ) : null}

      <div className="space-y-2.5">
        {conflictos.length === 0 && (
          <p className="text-sm text-muted">No hay conflictos registrados todavía.</p>
        )}
        {sinResolver.map((c) => (
          <TarjetaConflicto key={c.id} conflicto={c} puedeResolver={puedeResolver} />
        ))}
        {resueltos.length > 0 && (
          <>
            <p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted">Resueltos</p>
            {resueltos.map((c) => (
              <TarjetaConflicto key={c.id} conflicto={c} puedeResolver={puedeResolver} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
