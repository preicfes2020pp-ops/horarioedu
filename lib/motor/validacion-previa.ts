import type { EntradaMotor } from "./tipos";

export type ProblemaDetectado = {
  problema: string;
  causa: string;
  solucion: string;
};

export function validarFactibilidad(entrada: EntradaMotor): ProblemaDetectado[] {
  const problemas: ProblemaDetectado[] = [];
  const franjasClase = entrada.franjas.filter((f) => f.es_bloque_clase);
  const bloquesTotalesSemana = entrada.dias.length * franjasClase.length;

  // 1. Docente con más horas requeridas que slots de disponibilidad reales.
  const horasPorDocente = new Map<string, number>();
  for (const a of entrada.asignaciones) {
    horasPorDocente.set(a.docente_id, (horasPorDocente.get(a.docente_id) ?? 0) + a.horas_semanales);
  }
  for (const [docenteId, horasRequeridas] of horasPorDocente) {
    const disponibles = entrada.disponibilidad.get(docenteId);
    // Si no registró disponibilidad, se asume disponible siempre — no se
    // puede detectar este problema para ese docente todavía.
    if (!disponibles || disponibles.size === 0) continue;
    if (horasRequeridas > disponibles.size) {
      problemas.push({
        problema: `Un docente solo tiene disponibilidad de ${disponibles.size} hora(s), pero necesita ${horasRequeridas}.`,
        causa: "La disponibilidad registrada es menor que la suma de horas de sus asignaturas asignadas.",
        solucion:
          "Amplía su disponibilidad en el módulo de Disponibilidad, o reasigna parte de su carga a otro docente.",
      });
    }
  }

  // 2. Grupo con más horas semanales requeridas que bloques de clase existentes.
  const horasPorGrupo = new Map<string, number>();
  for (const a of entrada.asignaciones) {
    horasPorGrupo.set(a.grupo_id, (horasPorGrupo.get(a.grupo_id) ?? 0) + a.horas_semanales);
  }
  for (const [, horasRequeridas] of horasPorGrupo) {
    if (horasRequeridas > bloquesTotalesSemana) {
      problemas.push({
        problema: `Un grupo necesita ${horasRequeridas} horas semanales, pero la jornada solo tiene ${bloquesTotalesSemana} bloques disponibles.`,
        causa: "La suma de intensidades horarias de las asignaturas del grupo excede los bloques de la jornada.",
        solucion:
          "Reduce la intensidad horaria de alguna asignatura, agrega más días de clase, o agrega más bloques por día.",
      });
    }
  }

  // 3. Se requiere un tipo de aula que no existe en absoluto en la institución.
  const tiposRequeridos = new Set<string>();
  for (const a of entrada.asignaciones) {
    const asignatura = entrada.asignaturasPorId.get(a.asignatura_id);
    if (asignatura?.aula_tipo_requerido) tiposRequeridos.add(asignatura.aula_tipo_requerido);
  }
  for (const tipo of tiposRequeridos) {
    const existe = entrada.aulas.some((au) => au.tipo === tipo && au.activa);
    if (!existe) {
      problemas.push({
        problema: `Hay asignaturas que requieren un aula de tipo "${tipo}", pero no existe ninguna aula activa de ese tipo.`,
        causa: "No se ha registrado ningún aula con ese tipo específico, o todas están inactivas.",
        solucion: `Crea al menos un aula de tipo "${tipo}" en el módulo de Aulas, o cambia el tipo requerido de esa asignatura.`,
      });
    }
  }

  // 4. Ninguna asignación registrada en absoluto.
  if (entrada.asignaciones.length === 0) {
    problemas.push({
      problema: "No hay ninguna asignación de docente-grupo-asignatura registrada.",
      causa: "Falta configurar qué docente dicta qué asignatura a qué grupo.",
      solucion: "Registra al menos una asignación antes de generar el horario.",
    });
  }

  return problemas;
}
