import { getPerfilActual, createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/login/actions";
import { CambiarPasswordForm } from "./cambiar-password-form";
import { AvatarIniciales } from "../componentes-lista";

const ETIQUETA_ROL: Record<string, string> = {
  rector: "Rector/a",
  coordinador: "Coordinador/a académico/a",
  superadmin: "Administrador/a",
};

export default async function ConfiguracionPage() {
  const perfil = await getPerfilActual();
  if (!perfil) return null;

  const supabase = createClient();
  const { data: institucion } = perfil.institucion_id
    ? await supabase.from("instituciones").select("nombre").eq("id", perfil.institucion_id).single()
    : { data: null };

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold text-ink">Configuración</h1>

      <div className="mb-4 flex items-center gap-3 rounded-card border border-border bg-card p-4">
        <AvatarIniciales texto={perfil.nombre_completo ?? "?"} tamano={52} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{perfil.nombre_completo}</p>
          <p className="truncate text-xs text-muted">{perfil.correo}</p>
          <p className="text-xs text-brand-600">{ETIQUETA_ROL[perfil.rol] ?? perfil.rol}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card">
        <div className="border-b border-border px-4 py-3.5 text-sm">
          <p className="text-muted">Institución</p>
          <p className="text-ink">{institucion?.nombre ?? "—"}</p>
        </div>

        <CambiarPasswordForm />

        <form action={cerrarSesion}>
          <button
            type="submit"
            className="w-full px-4 py-3.5 text-left text-sm text-accent-coral hover:bg-accent-coral/5"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
