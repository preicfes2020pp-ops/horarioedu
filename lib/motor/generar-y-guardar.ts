import { createClient } from "@/lib/supabase/server";
import { generarHorario } from "./generador";
import type { Asignatura, EntradaMotor } from "./tipos";

export type ResultadoGeneracion = {
  versionId: string;
  numeroVersion: number;
  puntuacion: number;
  totalClases: number;
  conflictos: { tipo: string; severidad: string; descripcion: string }[];
};

/**
 * Trae de Supabase todo lo necesario para correr el motor sobre una
 * institución y arma la EntradaMotor. La usan tanto la validación previa
 * (Fase 12) como la generación real.
 */
export async function construirEntradaMotor(
  institucionId: string
): Promise<{ error: string | null; entrada: EntradaMotor | null }> {
  const supabase = createClient();

  const { data: institucion } = await supabase
    .from("instituciones")
    .select("dias_clase")
    .eq("id", institucionId)
    .single();

  const dias: number[] = institucion?.dias_clase ?? [1, 2, 3, 4, 5];

  const { data: asignacionesRaw, error: errAsignaciones } = await supabase
    .from("asignaciones_docente")
    .select("id, docente_id, grupo_id, asignatura_id, area_id, horas_semanales")
    .eq("institucion_id", institucionId);

  if (errAsignaciones) return { error: errAsignaciones.message, entrada: null };

  const { data: franjasRaw, error: errFranjas } = await supabase
    .from("franjas_horarias")
    .select("id, orden, es_bloque_clase")
    .eq("institucion_id", institucionId)
    .order("orden");

  if (errFranjas) return { error: errFranjas.message, entrada: null };

  const { data: aulasRaw, error: errAulas } = await supabase
    .from("aulas")
    .select("id, tipo, activa")
    .eq("institucion_id", institucionId)
    .eq("activa", true);

  if (errAulas) return { error: errAulas.message, entrada: null };

  const { data: areasRaw } = await supabase
    .from("areas")
    .select("id")
    .eq("institucion_id", institucionId);
  const areaIds = (areasRaw ?? []).map((a) => a.id);

  const { data: asignaturasRaw } = await supabase
    .from("asignaturas")
    .select("id, nombre, aula_tipo_requerido")
    .in("area_id", areaIds.length > 0 ? areaIds : ["00000000-0000-0000-0000-000000000000"]);

  const asignaturasPorId = new Map<string, Asignatura>(
    (asignaturasRaw ?? []).map((a) => [
      a.id,
      { id: a.id, nombre: a.nombre, aula_tipo_requerido: a.aula_tipo_requerido },
    ])
  );

  const docenteIds = [...new Set((asignacionesRaw ?? []).map((a) => a.docente_id))];
  const { data: disponibilidadRaw } = await supabase
    .from("disponibilidad_docentes")
    .select("docente_id, dia_semana, franja_id, disponible")
    .in("docente_id", docenteIds.length > 0 ? docenteIds : ["00000000-0000-0000-0000-000000000000"]);

  const disponibilidad = new Map<string, Set<string>>();
  for (const fila of disponibilidadRaw ?? []) {
    if (!fila.disponible) continue;
    if (!disponibilidad.has(fila.docente_id)) disponibilidad.set(fila.docente_id, new Set());
    disponibilidad.get(fila.docente_id)!.add(`${fila.dia_semana}-${fila.franja_id}`);
  }

  return {
    error: null,
    entrada: {
      asignaciones: asignacionesRaw ?? [],
      disponibilidad,
      franjas: franjasRaw ?? [],
      dias,
      aulas: aulasRaw ?? [],
      asignaturasPorId,
    },
  };
}

/**
 * Corre el motor CSP para TODAS las asignaciones de una institución y guarda
 * el resultado como una nueva versión en `versiones_horario` + `horario_clases`.
 * La usan tanto el generador regular (/generador) como el generador de
 * "horario alternativo completo" para emergencias (/horarios-emergentes).
 */
export async function generarVersionParaInstitucion(
  institucionId: string,
  creadoPorPerfilId: string
): Promise<{ error: string | null; resultado: ResultadoGeneracion | null }> {
  const supabase = createClient();

  const { error: errEntrada, entrada } = await construirEntradaMotor(institucionId);
  if (errEntrada || !entrada) return { error: errEntrada, resultado: null };

  if (entrada.asignaciones.length === 0) {
    return {
      error:
        "No hay ninguna asignación de docente-grupo-asignatura registrada todavía. Crea al menos una antes de generar el horario.",
      resultado: null,
    };
  }
  if (entrada.franjas.filter((f) => f.es_bloque_clase).length === 0) {
    return {
      error: "No hay franjas horarias de clase configuradas para tu institución.",
      resultado: null,
    };
  }
  if (entrada.aulas.length === 0) {
    return { error: "No hay aulas activas registradas para tu institución.", resultado: null };
  }

  const resultadoMotor = generarHorario(entrada);

  const anioLectivo = new Date().getFullYear();
  const { data: ultimaVersion } = await supabase
    .from("versiones_horario")
    .select("numero_version")
    .eq("institucion_id", institucionId)
    .eq("anio_lectivo", anioLectivo)
    .order("numero_version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const numeroVersion = (ultimaVersion?.numero_version ?? 0) + 1;

  const { data: versionCreada, error: errVersion } = await supabase
    .from("versiones_horario")
    .insert({
      institucion_id: institucionId,
      numero_version: numeroVersion,
      anio_lectivo: anioLectivo,
      estado: "borrador",
      puntuacion: resultadoMotor.puntuacion,
      creado_por: creadoPorPerfilId,
    })
    .select("id, numero_version")
    .single();

  if (errVersion || !versionCreada) {
    return { error: errVersion?.message ?? "No se pudo crear la versión.", resultado: null };
  }

  if (resultadoMotor.clases.length > 0) {
    const filasClases = resultadoMotor.clases.map((c) => ({
      institucion_id: institucionId,
      asignacion_id: c.asignacion_id,
      dia_semana: c.dia_semana,
      franja_id: c.franja_id,
      aula_id: c.aula_id,
      version_id: versionCreada.id,
    }));

    const { error: errInsertClases } = await supabase.from("horario_clases").insert(filasClases);
    if (errInsertClases) return { error: errInsertClases.message, resultado: null };
  }

  if (resultadoMotor.conflictos.length > 0) {
    const filasConflictos = resultadoMotor.conflictos.map((c) => ({
      version_id: versionCreada.id,
      tipo: c.tipo,
      severidad: c.severidad,
      descripcion: c.descripcion,
      entidad_afectada: c.entidad_afectada,
    }));

    await supabase.from("conflictos_horario").insert(filasConflictos);
  }

  return {
    error: null,
    resultado: {
      versionId: versionCreada.id,
      numeroVersion: versionCreada.numero_version,
      puntuacion: resultadoMotor.puntuacion,
      totalClases: resultadoMotor.clases.length,
      conflictos: resultadoMotor.conflictos,
    },
  };
}
