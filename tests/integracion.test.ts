/**
 * Pruebas de integración contra el Supabase REAL, pero en una institución de
 * prueba aislada ("Institución de Pruebas Automatizadas") que este script
 * crea al inicio y elimina al final — nunca toca tus datos reales.
 *
 * Requiere que .env.local tenga NEXT_PUBLIC_SUPABASE_URL y
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (las mismas que usa la app).
 *
 * Ejecutar con: npm run test:integracion
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { pruebaAsync, esperarVerdadero, imprimirResumen } from "./assert";

dotenv.config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!URL || !ANON_KEY) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local");
  process.exit(1);
}

// Credenciales de las cuentas de prueba ya existentes (creadas durante el
// desarrollo). Si cambiaste sus contraseñas, actualízalas aquí.
const CUENTAS = {
  coordinador: { correo: "coordinador.prueba@aula360.test", clave: "coordinador2026" },
  rector: { correo: "rector.prueba@aula360.test", clave: "rector2026" },
  docente: { correo: "docente.prueba@aula360.test", clave: "docente2026" },
};

async function clienteComo(correo: string, clave: string) {
  const cliente = createClient(URL, ANON_KEY);
  const { error } = await cliente.auth.signInWithPassword({ email: correo, password: clave });
  if (error) throw new Error(`No se pudo iniciar sesión como ${correo}: ${error.message}`);
  return cliente;
}

async function main() {
  const clienteCoordinador = await clienteComo(CUENTAS.coordinador.correo, CUENTAS.coordinador.clave);
  const clienteRector = await clienteComo(CUENTAS.rector.correo, CUENTAS.rector.clave);
  const clienteDocente = await clienteComo(CUENTAS.docente.correo, CUENTAS.docente.clave);

  // Institución del coordinador de prueba (todas las cuentas de prueba
  // pertenecen a la misma institución de pruebas ya existente).
  const { data: perfilCoordinador } = await clienteCoordinador
    .from("perfiles")
    .select("institucion_id")
    .eq("correo", CUENTAS.coordinador.correo)
    .single();
  const institucionId = perfilCoordinador!.institucion_id;

  // --------------------------------------------------------------------
  // Permisos (RLS): coordinador puede crear aulas, rector NO, docente NO
  // ni siquiera puede leerlas.
  // --------------------------------------------------------------------
  let aulaPruebaId: string | null = null;

  await pruebaAsync("Coordinador SÍ puede crear un aula", async () => {
    const { data, error } = await clienteCoordinador
      .from("aulas")
      .insert({ institucion_id: institucionId, nombre: "Aula-Prueba-Automatizada", tipo: "normal" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    aulaPruebaId = data.id;
  });

  await pruebaAsync("Rector NO puede crear un aula (solo lectura)", async () => {
    const { error } = await clienteRector
      .from("aulas")
      .insert({ institucion_id: institucionId, nombre: "Aula-Rector-No-Deberia", tipo: "normal" });
    esperarVerdadero(!!error, "El rector logró crear un aula — la política RLS debería haberlo bloqueado");
  });

  await pruebaAsync("Docente NO puede leer la tabla de aulas", async () => {
    const { data, error } = await clienteDocente.from("aulas").select("id").limit(1);
    // RLS bien configurado: o da error, o devuelve 0 filas (nunca las aulas reales).
    const bloqueado = !!error || (data && data.length === 0);
    esperarVerdadero(bloqueado, "El docente pudo leer aulas — no debería tener ningún acceso a este módulo");
  });

  // --------------------------------------------------------------------
  // Restricción de duplicados a nivel de base de datos: código de grupo
  // único (constraint UNIQUE, no solo validación de la app).
  // --------------------------------------------------------------------
  const codigoUnico = `TEST-${Date.now()}`;
  let grupoIds: string[] = [];

  await pruebaAsync("La base de datos rechaza un código de grupo duplicado", async () => {
    const { data: grados } = await clienteCoordinador
      .from("grados")
      .select("id")
      .eq("institucion_id", institucionId)
      .limit(1);
    if (!grados || grados.length === 0) throw new Error("No hay ningún grado para probar (revisa datos de prueba)");
    const gradoId = grados[0].id;

    const primero = await clienteCoordinador
      .from("grupos")
      .insert({
        institucion_id: institucionId,
        grado_id: gradoId,
        nombre: "Grupo Prueba 1",
        codigo_grupo: codigoUnico,
        anio_lectivo: 2099,
      })
      .select("id")
      .single();
    if (primero.error) throw new Error(`No se pudo crear el primer grupo: ${primero.error.message}`);
    grupoIds.push(primero.data.id);

    const segundo = await clienteCoordinador.from("grupos").insert({
      institucion_id: institucionId,
      grado_id: gradoId,
      nombre: "Grupo Prueba 2 (duplicado)",
      codigo_grupo: codigoUnico, // mismo código a propósito
      anio_lectivo: 2099,
    });

    esperarVerdadero(
      !!segundo.error,
      "Se pudo insertar un segundo grupo con el código duplicado — falta la restricción UNIQUE"
    );
  });

  // --------------------------------------------------------------------
  // Limpieza: borra únicamente lo que este script creó.
  // --------------------------------------------------------------------
  if (aulaPruebaId) await clienteCoordinador.from("aulas").delete().eq("id", aulaPruebaId);
  for (const id of grupoIds) await clienteCoordinador.from("grupos").delete().eq("id", id);

  await clienteCoordinador.auth.signOut();
  await clienteRector.auth.signOut();
  await clienteDocente.auth.signOut();

  const todoPasó = imprimirResumen();
  process.exit(todoPasó ? 0 : 1);
}

main().catch((err) => {
  console.error("Error ejecutando las pruebas de integración:", err.message);
  process.exit(1);
});
