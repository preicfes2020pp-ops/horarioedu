/**
 * Pruebas del motor de generación de horarios (lib/motor).
 * No tocan Supabase — usan datos de prueba en memoria, aislados por diseño.
 *
 * Ejecutar con: npm test
 */
import { generarHorario } from "../lib/motor/generador";
import { validarFactibilidad } from "../lib/motor/validacion-previa";
import type { EntradaMotor } from "../lib/motor/tipos";
import { prueba, esperar, esperarVerdadero, imprimirResumen } from "./assert";

function disponibilidadCompleta(docenteId: string, dias: number[], franjaIds: string[]) {
  const set = new Set<string>();
  for (const d of dias) for (const f of franjaIds) set.add(`${d}-${f}`);
  return set;
}

const FRANJAS_ESTANDAR = [
  { id: "f1", orden: 1, es_bloque_clase: true },
  { id: "f2", orden: 2, es_bloque_clase: true },
  { id: "descanso", orden: 3, es_bloque_clase: false },
  { id: "f3", orden: 4, es_bloque_clase: true },
];
const DIAS_ESTANDAR = [1, 2, 3, 4, 5];

// ---------------------------------------------------------------------------
// 1. Profesor duplicado: el motor nunca debe asignar al mismo docente dos
//    clases en el mismo día y franja.
// ---------------------------------------------------------------------------
prueba("No genera profesor duplicado en el mismo bloque", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set(
    "docenteA",
    disponibilidadCompleta("docenteA", DIAS_ESTANDAR, ["f1", "f2", "f3"])
  );

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "g1", asignatura_id: "s1", area_id: "ar1", horas_semanales: 4 },
      { id: "a2", docente_id: "docenteA", grupo_id: "g2", asignatura_id: "s2", area_id: "ar1", horas_semanales: 4 },
    ],
    disponibilidad,
    franjas: FRANJAS_ESTANDAR,
    dias: DIAS_ESTANDAR,
    aulas: [
      { id: "aula1", tipo: "normal", activa: true },
      { id: "aula2", tipo: "normal", activa: true },
    ],
    asignaturasPorId: new Map([
      ["s1", { id: "s1", nombre: "Mate", aula_tipo_requerido: null }],
      ["s2", { id: "s2", nombre: "Ciencias", aula_tipo_requerido: null }],
    ]),
  };

  const resultado = generarHorario(entrada);
  const claves = resultado.clases.map((c) => `${c.dia_semana}-${c.franja_id}`);
  const claveDocenteOcupado = new Set<string>();
  let hayDuplicado = false;
  for (const c of resultado.clases) {
    const asig = entrada.asignaciones.find((a) => a.id === c.asignacion_id)!;
    const clave = `${asig.docente_id}-${c.dia_semana}-${c.franja_id}`;
    if (claveDocenteOcupado.has(clave)) hayDuplicado = true;
    claveDocenteOcupado.add(clave);
  }
  esperarVerdadero(!hayDuplicado, "Se encontró al mismo docente en dos clases simultáneas");
});

// ---------------------------------------------------------------------------
// 2. Aula duplicada: dos grupos compitiendo por 1 sola aula nunca deben
//    coincidir en el mismo bloque.
// ---------------------------------------------------------------------------
prueba("No genera aula duplicada en el mismo bloque", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set("docenteA", disponibilidadCompleta("docenteA", [1, 2], ["f1", "f2"]));
  disponibilidad.set("docenteB", disponibilidadCompleta("docenteB", [1, 2], ["f1", "f2"]));

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "g1", asignatura_id: "s1", area_id: "ar1", horas_semanales: 2 },
      { id: "a2", docente_id: "docenteB", grupo_id: "g2", asignatura_id: "s1", area_id: "ar1", horas_semanales: 2 },
    ],
    disponibilidad,
    franjas: [
      { id: "f1", orden: 1, es_bloque_clase: true },
      { id: "f2", orden: 2, es_bloque_clase: true },
    ],
    dias: [1, 2],
    aulas: [{ id: "unica_aula", tipo: "normal", activa: true }],
    asignaturasPorId: new Map([["s1", { id: "s1", nombre: "Mate", aula_tipo_requerido: null }]]),
  };

  const resultado = generarHorario(entrada);
  const combinaciones = resultado.clases.map((c) => `${c.aula_id}-${c.dia_semana}-${c.franja_id}`);
  esperar(new Set(combinaciones).size, combinaciones.length, "El aula única quedó doble-reservada en algún bloque");
  esperar(resultado.clases.length, 4, "Debieron ubicarse las 4 horas (2+2) sin choques");
});

// ---------------------------------------------------------------------------
// 3. Grupo duplicado: un grupo no puede tener 2 asignaturas al mismo tiempo.
// ---------------------------------------------------------------------------
prueba("No genera grupo duplicado en el mismo bloque", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set("docenteA", disponibilidadCompleta("docenteA", [1, 2, 3], ["f1", "f2"]));
  disponibilidad.set("docenteB", disponibilidadCompleta("docenteB", [1, 2, 3], ["f1", "f2"]));

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "grupoUnico", asignatura_id: "s1", area_id: "ar1", horas_semanales: 3 },
      { id: "a2", docente_id: "docenteB", grupo_id: "grupoUnico", asignatura_id: "s2", area_id: "ar1", horas_semanales: 3 },
    ],
    disponibilidad,
    franjas: [
      { id: "f1", orden: 1, es_bloque_clase: true },
      { id: "f2", orden: 2, es_bloque_clase: true },
    ],
    dias: [1, 2, 3],
    aulas: [
      { id: "aula1", tipo: "normal", activa: true },
      { id: "aula2", tipo: "normal", activa: true },
    ],
    asignaturasPorId: new Map([
      ["s1", { id: "s1", nombre: "Mate", aula_tipo_requerido: null }],
      ["s2", { id: "s2", nombre: "Ciencias", aula_tipo_requerido: null }],
    ]),
  };

  const resultado = generarHorario(entrada);
  const slotsGrupo = new Set<string>();
  let hayDuplicado = false;
  for (const c of resultado.clases) {
    const clave = `${c.dia_semana}-${c.franja_id}`;
    if (slotsGrupo.has(clave)) hayDuplicado = true;
    slotsGrupo.add(clave);
  }
  esperarVerdadero(!hayDuplicado, "El mismo grupo quedó con dos clases en el mismo bloque");
});

// ---------------------------------------------------------------------------
// 4. Disponibilidad: el motor nunca coloca una clase fuera de los bloques
//    que el docente marcó como disponibles.
// ---------------------------------------------------------------------------
prueba("Respeta la disponibilidad registrada del docente", () => {
  const disponibilidad = new Map<string, Set<string>>();
  // Solo disponible lunes, en f1 y f2 — nada más.
  disponibilidad.set("docenteA", new Set(["1-f1", "1-f2"]));

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "g1", asignatura_id: "s1", area_id: "ar1", horas_semanales: 2 },
    ],
    disponibilidad,
    franjas: [
      { id: "f1", orden: 1, es_bloque_clase: true },
      { id: "f2", orden: 2, es_bloque_clase: true },
    ],
    dias: [1, 2, 3, 4, 5],
    aulas: [{ id: "aula1", tipo: "normal", activa: true }],
    asignaturasPorId: new Map([["s1", { id: "s1", nombre: "Mate", aula_tipo_requerido: null }]]),
  };

  const resultado = generarHorario(entrada);
  const todasEnLunes = resultado.clases.every((c) => c.dia_semana === 1);
  esperarVerdadero(todasEnLunes, "Se colocó una clase fuera de la disponibilidad declarada (solo lunes)");
  esperar(resultado.clases.length, 2, "Debieron ubicarse las 2 horas dentro del único día disponible");
});

// ---------------------------------------------------------------------------
// 5. Intensidad horaria: si no alcanza la disponibilidad, reporta conflicto
//    en vez de fallar en silencio o inventar horas de más.
// ---------------------------------------------------------------------------
prueba("Reporta conflicto cuando no se puede cumplir la intensidad horaria", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set("docenteA", new Set(["1-f1", "1-f2"])); // solo 2 slots

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "g1", asignatura_id: "s1", area_id: "ar1", horas_semanales: 5 },
    ],
    disponibilidad,
    franjas: [
      { id: "f1", orden: 1, es_bloque_clase: true },
      { id: "f2", orden: 2, es_bloque_clase: true },
    ],
    dias: [1],
    aulas: [{ id: "aula1", tipo: "normal", activa: true }],
    asignaturasPorId: new Map([["s1", { id: "s1", nombre: "Mate", aula_tipo_requerido: null }]]),
  };

  const resultado = generarHorario(entrada);
  esperar(resultado.clases.length, 2, "Debió ubicar solo las 2 horas realmente posibles");
  esperar(resultado.conflictos.length, 1, "Debió reportar exactamente 1 conflicto de intensidad horaria");
  esperarVerdadero(
    resultado.conflictos[0].tipo === "intensidad_no_cumplida",
    "El conflicto reportado no es del tipo esperado"
  );
});

// ---------------------------------------------------------------------------
// 6. Jornada / descansos: nunca coloca una clase en una franja marcada como
//    descanso (es_bloque_clase: false).
// ---------------------------------------------------------------------------
prueba("Nunca ubica una clase en un bloque de descanso", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set(
    "docenteA",
    new Set(["1-f1", "1-f2", "1-descanso", "1-f3"]) // el docente "tiene" disponible el descanso, pero el motor no debe usarlo
  );

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "g1", asignatura_id: "s1", area_id: "ar1", horas_semanales: 3 },
    ],
    disponibilidad,
    franjas: FRANJAS_ESTANDAR,
    dias: [1],
    aulas: [{ id: "aula1", tipo: "normal", activa: true }],
    asignaturasPorId: new Map([["s1", { id: "s1", nombre: "Mate", aula_tipo_requerido: null }]]),
  };

  const resultado = generarHorario(entrada);
  const usaDescanso = resultado.clases.some((c) => c.franja_id === "descanso");
  esperarVerdadero(!usaDescanso, "Se colocó una clase en el bloque de descanso");
});

// ---------------------------------------------------------------------------
// 7. Generación correcta: escenario totalmente factible debe dar 0
//    conflictos y puntuación perfecta.
// ---------------------------------------------------------------------------
prueba("Genera un horario perfecto (0 conflictos, 100/100) cuando el escenario es totalmente factible", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set("docenteA", disponibilidadCompleta("docenteA", DIAS_ESTANDAR, ["f1", "f2", "f3"]));

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "g1", asignatura_id: "s1", area_id: "ar1", horas_semanales: 3 },
    ],
    disponibilidad,
    franjas: FRANJAS_ESTANDAR,
    dias: DIAS_ESTANDAR,
    aulas: [{ id: "aula1", tipo: "normal", activa: true }],
    asignaturasPorId: new Map([["s1", { id: "s1", nombre: "Mate", aula_tipo_requerido: null }]]),
  };

  const resultado = generarHorario(entrada);
  esperar(resultado.conflictos.length, 0, "No debía haber ningún conflicto");
  esperar(resultado.puntuacion, 100, "La puntuación debía ser perfecta (100/100)");
});

// ---------------------------------------------------------------------------
// 8. Aula requerida por tipo: si la asignatura exige un tipo de aula
//    específico, nunca la coloca en un aula de otro tipo.
// ---------------------------------------------------------------------------
prueba("Respeta el tipo de aula requerido por la asignatura", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set("docenteA", disponibilidadCompleta("docenteA", [1, 2], ["f1", "f2"]));

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteA", grupo_id: "g1", asignatura_id: "edfis", area_id: "ar1", horas_semanales: 2 },
    ],
    disponibilidad,
    franjas: [
      { id: "f1", orden: 1, es_bloque_clase: true },
      { id: "f2", orden: 2, es_bloque_clase: true },
    ],
    dias: [1, 2],
    aulas: [
      { id: "aulaNormal", tipo: "normal", activa: true },
      { id: "cancha", tipo: "educacion_fisica", activa: true },
    ],
    asignaturasPorId: new Map([
      ["edfis", { id: "edfis", nombre: "Educación Física", aula_tipo_requerido: "educacion_fisica" }],
    ]),
  };

  const resultado = generarHorario(entrada);
  const todasEnCancha = resultado.clases.every((c) => c.aula_id === "cancha");
  esperarVerdadero(todasEnCancha, "Se ubicó Educación Física en un aula que no es de tipo educacion_fisica");
});

// ---------------------------------------------------------------------------
// 9. Detector de imposibilidades (validación previa, Fase 12).
// ---------------------------------------------------------------------------
prueba("El detector de imposibilidades identifica falta de disponibilidad, exceso de horas y falta de aulas", () => {
  const disponibilidad = new Map<string, Set<string>>();
  disponibilidad.set("docenteX", new Set(["1-f1", "1-f2"]));

  const entrada: EntradaMotor = {
    asignaciones: [
      { id: "a1", docente_id: "docenteX", grupo_id: "g1", asignatura_id: "edfis", area_id: "ar1", horas_semanales: 5 },
    ],
    disponibilidad,
    franjas: [
      { id: "f1", orden: 1, es_bloque_clase: true },
      { id: "f2", orden: 2, es_bloque_clase: true },
    ],
    dias: [1, 2],
    aulas: [{ id: "aula1", tipo: "normal", activa: true }],
    asignaturasPorId: new Map([
      ["edfis", { id: "edfis", nombre: "Educación Física", aula_tipo_requerido: "educacion_fisica" }],
    ]),
  };

  const problemas = validarFactibilidad(entrada);
  esperar(problemas.length, 3, "Debían detectarse 3 problemas (disponibilidad, horas de grupo, tipo de aula)");
});

const todoPasó = imprimirResumen();
process.exit(todoPasó ? 0 : 1);
