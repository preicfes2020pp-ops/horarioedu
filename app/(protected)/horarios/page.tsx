import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { SelectorVista } from "./selector-vista";
import { MatrizHorario, type CeldaClase } from "./matriz-horario";
import { TablaGeneral, type FilaGeneral } from "./tabla-general";

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: { version?: string; vista?: string; entidad?: string };
}) {
  const perfil = await getPerfilActual();
  const supabase = createClient();
  if (!perfil?.institucion_id) return null;

  const [
    { data: institucion },
    { data: franjas },
    { data: versionesRaw },
    { data: gruposRaw },
    { data: docentesRaw },
    { data: aulasRaw },
    { data: asignaturasRaw },
  ] = await Promise.all([
    supabase
      .from("instituciones")
      .select("nombre, logo_url, jornada, dias_clase")
      .eq("id", perfil.institucion_id)
      .single(),
    supabase
      .from("franjas_horarias")
      .select("id, nombre, orden, es_bloque_clase")
      .eq("institucion_id", perfil.institucion_id)
      .order("orden"),
    supabase
      .from("versiones_horario")
      .select("id, numero_version, estado")
      .eq("institucion_id", perfil.institucion_id)
      .order("numero_version", { ascending: false }),
    supabase.from("grupos").select("id, nombre").order("nombre"),
    supabase.from("docentes").select("perfil_id, perfiles ( nombre_completo )"),
    supabase.from("aulas").select("id, nombre").order("nombre"),
    supabase.from("asignaturas").select("id, nombre").order("nombre"),
  ]);

  const versiones = (versionesRaw ?? []).map((v) => ({
    id: v.id,
    etiqueta: `Versión ${v.numero_version} · ${v.estado}`,
  }));
  const grupos = (gruposRaw ?? []).map((g) => ({ id: g.id, etiqueta: g.nombre }));
  const profesores = (docentesRaw ?? []).map((d: any) => ({
    id: d.perfil_id,
    etiqueta: d.perfiles?.nombre_completo ?? "—",
  }));
  const aulas = (aulasRaw ?? []).map((a) => ({ id: a.id, etiqueta: a.nombre }));
  const asignaturas = (asignaturasRaw ?? []).map((a) => ({ id: a.id, etiqueta: a.nombre }));

  const versionId = searchParams.version || versiones[0]?.id;
  const vista = searchParams.vista || "grupo";
  const entidadId = searchParams.entidad || "";

  let clases: CeldaClase[] = [];
  let filasGeneral: FilaGeneral[] = [];

  if (versionId) {
    const { data: clasesRaw } = await supabase
      .from("horario_clases")
      .select(
        "id, dia_semana, franja_id, aula_id, aulas ( nombre ), franjas_horarias ( nombre, orden ), asignaciones_docente ( grupo_id, docente_id, asignatura_id, grupos ( nombre ), asignaturas ( nombre ), perfiles ( nombre_completo ) )"
      )
      .eq("version_id", versionId);

    if (vista === "general") {
      filasGeneral = (clasesRaw ?? []).map((c: any) => ({
        dia: c.dia_semana,
        franjaNombre: c.franjas_horarias?.nombre ?? "—",
        franjaOrden: c.franjas_horarias?.orden ?? 0,
        grupo: c.asignaciones_docente?.grupos?.nombre ?? "—",
        asignatura: c.asignaciones_docente?.asignaturas?.nombre ?? "—",
        profesor: c.asignaciones_docente?.perfiles?.nombre_completo ?? "—",
        aula: c.aulas?.nombre ?? "Sin aula",
      }));
    } else {
      const filtradas = (clasesRaw ?? []).filter((c: any) => {
        if (!entidadId) return true;
        if (vista === "grupo") return c.asignaciones_docente?.grupo_id === entidadId;
        if (vista === "profesor") return c.asignaciones_docente?.docente_id === entidadId;
        if (vista === "aula") return c.aula_id === entidadId;
        if (vista === "asignatura") return c.asignaciones_docente?.asignatura_id === entidadId;
        return true;
      });

      // En la vista "por asignatura" puede haber varios grupos distintos
      // cursándola al mismo tiempo (con profesores distintos) — se combinan
      // en una sola celda en vez de perder información.
      if (vista === "asignatura") {
        const porSlot = new Map<string, any[]>();
        for (const c of filtradas) {
          const clave = `${c.dia_semana}-${c.franja_id}`;
          if (!porSlot.has(clave)) porSlot.set(clave, []);
          porSlot.get(clave)!.push(c);
        }
        clases = [...porSlot.entries()].map(([, grupo]) => {
          const primero = grupo[0];
          return {
            claseId: primero.id,
            dia: primero.dia_semana,
            franjaId: primero.franja_id,
            lineaPrincipal: grupo
              .map((c: any) => c.asignaciones_docente?.grupos?.nombre ?? "—")
              .join(" · "),
            lineaSecundaria: grupo
              .map((c: any) => c.asignaciones_docente?.perfiles?.nombre_completo ?? "—")
              .join(" · "),
            lineaTerciaria: grupo.map((c: any) => c.aulas?.nombre ?? "—").join(" · "),
          };
        });
      } else {
        clases = filtradas.map((c: any) => {
          const asignaturaNombre = c.asignaciones_docente?.asignaturas?.nombre ?? "—";
          const grupoNombre = c.asignaciones_docente?.grupos?.nombre ?? "—";
          const docenteNombre = c.asignaciones_docente?.perfiles?.nombre_completo ?? "—";
          const aulaNombre = c.aulas?.nombre ?? "Sin aula";

          let lineaSecundaria = docenteNombre;
          if (vista === "profesor") lineaSecundaria = grupoNombre;
          if (vista === "aula") lineaSecundaria = `${grupoNombre} · ${docenteNombre}`;

          return {
            claseId: c.id,
            dia: c.dia_semana,
            franjaId: c.franja_id,
            lineaPrincipal: asignaturaNombre,
            lineaSecundaria,
            lineaTerciaria: vista === "aula" ? "" : aulaNombre,
          };
        });
      }
    }
  }

  const dias: number[] = institucion?.dias_clase ?? [1, 2, 3, 4, 5];
  // La edición por arrastre solo tiene sentido en vistas de una sola entidad
  // (una celda = una clase). En "general" y "asignatura" una celda puede
  // representar varias clases a la vez, así que ahí queda de solo lectura.
  const puedeEditar =
    (perfil.rol === "coordinador" || perfil.rol === "superadmin") &&
    vista !== "general" &&
    vista !== "asignatura";

  const versionSeleccionada = (versionesRaw ?? []).find((v) => v.id === versionId);
  const opcionesPorVista: Record<string, { id: string; etiqueta: string }[]> = {
    grupo: grupos,
    profesor: profesores,
    aula: aulas,
    asignatura: asignaturas,
  };
  const opcionesEntidad = opcionesPorVista[vista] ?? [];
  const entidadSeleccionada = opcionesEntidad.find((o) => o.id === entidadId);
  const etiquetaVista: Record<string, string> = {
    grupo: "Grupo",
    profesor: "Profesor",
    aula: "Aula",
    asignatura: "Asignatura",
  };

  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-ink">Horarios</h1>
      <p className="mb-6 text-sm text-muted">
        {puedeEditar
          ? "Arrastra una clase para reubicarla — se valida al soltar."
          : "Consulta el horario general o por grupo, profesor, aula y asignatura."}
      </p>

      <SelectorVista
        versiones={versiones}
        grupos={grupos}
        profesores={profesores}
        aulas={aulas}
        asignaturas={asignaturas}
      />

      {!versionId ? (
        <p className="text-sm text-muted">Todavía no hay ninguna versión de horario generada.</p>
      ) : vista === "general" ? (
        <TablaGeneral filas={filasGeneral} />
      ) : !entidadId ? (
        <p className="text-sm text-muted">Selecciona {vista} para ver su horario.</p>
      ) : (
        <MatrizHorario
          franjas={franjas ?? []}
          dias={dias}
          clases={clases}
          puedeEditar={puedeEditar}
          meta={{
            institucionNombre: institucion?.nombre ?? "Institución",
            logoUrl: institucion?.logo_url ?? null,
            jornada: institucion?.jornada ?? null,
            numeroVersion: versionSeleccionada?.numero_version ?? 0,
            estadoVersion: versionSeleccionada?.estado ?? "",
            vistaEtiqueta: `${etiquetaVista[vista] ?? ""} ${entidadSeleccionada?.etiqueta ?? ""}`,
          }}
        />
      )}
    </div>
  );
}
