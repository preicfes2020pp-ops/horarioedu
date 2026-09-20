import Link from "next/link";
import { createClient, getPerfilActual } from "@/lib/supabase/server";

const DIAS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export default async function DashboardPage() {
  const perfil = await getPerfilActual();
  const supabase = createClient();
  if (!perfil?.institucion_id) return null;

  const [
    { count: profesores },
    { count: grupos },
    { count: asignaturas },
    { count: aulas },
    { data: versiones },
  ] = await Promise.all([
    supabase.from("docentes").select("perfil_id", { count: "exact", head: true }),
    supabase.from("grupos").select("id", { count: "exact", head: true }),
    supabase.from("asignaturas").select("id", { count: "exact", head: true }),
    supabase.from("aulas").select("id", { count: "exact", head: true }).eq("activa", true),
    supabase
      .from("versiones_horario")
      .select("id, numero_version, estado, puntuacion")
      .eq("institucion_id", perfil.institucion_id)
      .order("numero_version", { ascending: false }),
  ]);

  const versionVigente =
    (versiones ?? []).find((v) => v.estado === "publicado") ??
    (versiones ?? []).find((v) => v.estado === "aprobado") ??
    (versiones ?? [])[0];

  const diaHoyJS = new Date().getDay(); // 0=domingo
  const diaHoy = diaHoyJS === 0 ? null : diaHoyJS;

  let horarioHoy: {
    franja: string;
    orden: number;
    asignatura: string;
    grupo: string;
    aula: string;
  }[] = [];

  if (versionVigente && diaHoy) {
    const { data: clasesHoy } = await supabase
      .from("horario_clases")
      .select(
        "franjas_horarias ( nombre, orden ), aulas ( nombre ), asignaciones_docente ( grupos ( nombre ), asignaturas ( nombre ) )"
      )
      .eq("version_id", versionVigente.id)
      .eq("dia_semana", diaHoy);

    horarioHoy = (clasesHoy ?? [])
      .map((c: any) => ({
        franja: c.franjas_horarias?.nombre ?? "—",
        orden: c.franjas_horarias?.orden ?? 0,
        asignatura: c.asignaciones_docente?.asignaturas?.nombre ?? "—",
        grupo: c.asignaciones_docente?.grupos?.nombre ?? "—",
        aula: c.aulas?.nombre ?? "—",
      }))
      .sort((a, b) => a.orden - b.orden);
  }

  const ETIQUETA_ROL: Record<string, string> = {
    rector: "Rector/a",
    coordinador: "Coordinador/a académico/a",
    superadmin: "Administrador/a",
  };

  const tarjetas = [
    { etiqueta: "Profesores", valor: profesores ?? 0, color: "bg-brand-600", href: "/profesores" },
    { etiqueta: "Grupos", valor: grupos ?? 0, color: "bg-accent-teal", href: "/grupos" },
    { etiqueta: "Asignaturas", valor: asignaturas ?? 0, color: "bg-accent-purple", href: "/asignaturas" },
    { etiqueta: "Aulas", valor: aulas ?? 0, color: "bg-accent-amber", href: "/aulas" },
  ];

  return (
    <div>
      <p className="mb-1 text-sm text-muted">Bienvenido(a)</p>
      <h1 className="mb-5 text-lg font-semibold text-ink">
        {ETIQUETA_ROL[perfil.rol] ?? perfil.rol}
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {tarjetas.map((t) => (
          <Link
            key={t.etiqueta}
            href={t.href}
            className={`${t.color} rounded-card p-4 text-white transition active:scale-[0.98]`}
          >
            <p className="text-sm font-medium opacity-90">{t.etiqueta}</p>
            <p className="text-3xl font-semibold">{t.valor}</p>
          </Link>
        ))}
      </div>

      {versionVigente?.puntuacion != null && (
        <div className="mb-6 flex items-center justify-between rounded-card border border-border bg-card px-4 py-3">
          <div>
            <p className="text-xs text-muted">Calidad del horario vigente</p>
            <p className="text-sm font-medium text-ink">
              Versión {versionVigente.numero_version} · {versionVigente.estado}
            </p>
          </div>
          <span className="text-xl font-semibold text-brand-600">{versionVigente.puntuacion}/100</span>
        </div>
      )}

      <div className="rounded-card border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-ink">Horario de hoy</p>
          <Link href="/horarios" className="text-sm text-brand-600 hover:underline">
            Ver todo
          </Link>
        </div>

        {!diaHoy ? (
          <p className="text-sm text-muted">Hoy es domingo, no hay clases programadas.</p>
        ) : horarioHoy.length === 0 ? (
          <p className="text-sm text-muted">No hay clases registradas para hoy ({DIAS[diaHoy]}).</p>
        ) : (
          <ul className="space-y-2">
            {horarioHoy.map((c, i) => (
              <li key={i} className="flex items-center justify-between border-b border-border pb-2 text-sm last:border-0 last:pb-0">
                <span className="w-20 shrink-0 text-muted">{c.franja}</span>
                <span className="flex-1 text-ink">{c.asignatura}</span>
                <span className="text-muted">{c.grupo}</span>
                <span className="ml-2 w-16 shrink-0 text-right text-muted">{c.aula}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
