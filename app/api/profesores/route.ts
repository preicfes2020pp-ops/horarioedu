import { NextRequest, NextResponse } from "next/server";
import { createClient as createClienteAdmin, type SupabaseClient } from "@supabase/supabase-js";
import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";
import { randomInt } from "crypto";

// Alfabeto sin caracteres ambiguos (sin 0/O, sin 1/I/l) para que el
// coordinador pueda dictar o transcribir la contraseña sin confusiones.
const ALFABETO_SEGURO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const PALABRAS = [
  "Horario", "Escuela", "Clase", "Aula", "Educa",
  "Colegio", "Docente", "Grado", "Grupo", "Materia",
  "Salon", "Tablero", "Recreo", "Jornada", "Semestre",
  "Cuaderno", "Pizarron", "Campus", "Instituto", "Academia",
];

function generarPasswordTemporal() {
  // Genera una contraseña con criptografía real (crypto.randomInt), no
  // Math.random(). Combina una palabra legible + 6 caracteres aleatorios
  // de un alfabeto de 32 símbolos: 32^6 ≈ 1.073 billones de combinaciones
  // por sufijo, multiplicado por 20 palabras posibles.
  const palabra = PALABRAS[randomInt(0, PALABRAS.length)];
  let sufijo = "";
  for (let i = 0; i < 6; i++) {
    sufijo += ALFABETO_SEGURO[randomInt(0, ALFABETO_SEGURO.length)];
  }
  return `${palabra}-${sufijo}!`;
}

const MAX_PROFESORES_POR_IMPORTACION = 200;

// Crea un profesor completo (auth + perfil + docente). Si cualquier paso
// falla, revierte todo lo anterior para no dejar cuentas huérfanas.
async function crearProfesorCompleto(
  supabaseAdmin: SupabaseClient,
  datos: { nombre: string; correo: string; area: string | null; institucionId: string }
): Promise<{ ok: true; correo: string; passwordTemporal: string } | { ok: false; correo: string; motivo: string }> {
  const passwordTemporal = generarPasswordTemporal();

  const { data: usuarioCreado, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
    email: datos.correo,
    password: passwordTemporal,
    email_confirm: true,
  });

  if (errAuth || !usuarioCreado.user) {
    return { ok: false, correo: datos.correo, motivo: errAuth?.message ?? "No se pudo crear la cuenta." };
  }

  const userId = usuarioCreado.user.id;

  const { error: errPerfil } = await supabaseAdmin.from("perfiles").insert({
    id: userId,
    rol: "docente",
    institucion_id: datos.institucionId,
    nombre_completo: datos.nombre,
    correo: datos.correo,
    activo: true,
  });

  if (errPerfil) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: false, correo: datos.correo, motivo: errPerfil.message };
  }

  const { error: errDocente } = await supabaseAdmin.from("docentes").insert({
    perfil_id: userId,
    area_principal: datos.area,
  });

  if (errDocente) {
    // Revierte también el perfil y la cuenta de auth: sin fila en
    // "docentes" el profesor queda en un estado inconsistente, así que
    // es más seguro deshacer todo y que el coordinador lo intente de nuevo.
    await supabaseAdmin.from("perfiles").delete().eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: false, correo: datos.correo, motivo: errDocente.message };
  }

  return { ok: true, correo: datos.correo, passwordTemporal };
}

export async function POST(request: NextRequest) {
  // 1. Verifica con el cliente NORMAL (respeta RLS) quién está pidiendo esto.
  const perfil = await getPerfilActual();
  if (!perfil || (perfil.rol !== "coordinador" && perfil.rol !== "superadmin")) {
    return NextResponse.json(
      { error: "No tienes permiso para crear profesores." },
      { status: 403 }
    );
  }
  if (!perfil.institucion_id) {
    return NextResponse.json({ error: "No se encontró tu institución." }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "El servidor no tiene configurada SUPABASE_SERVICE_ROLE_KEY. Agrégala a tu .env.local (nunca la subas a git ni la pongas en variables NEXT_PUBLIC_).",
      },
      { status: 500 }
    );
  }

  // 2. Cliente ADMIN (service_role, bypassa RLS) — solo se usa en este
  // endpoint server-only, nunca se envía al navegador.
  const supabaseAdmin = createClienteAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body = await request.json();

  // Modo masivo: se recibe un arreglo desde el importador de Excel.
  if (Array.isArray(body.profesores)) {
    if (body.profesores.length > MAX_PROFESORES_POR_IMPORTACION) {
      return NextResponse.json(
        {
          error: `Solo se pueden importar hasta ${MAX_PROFESORES_POR_IMPORTACION} profesores por archivo. Divide tu Excel en partes más pequeñas.`,
        },
        { status: 400 }
      );
    }

    const creados: { correo: string; passwordTemporal: string }[] = [];
    const fallidos: { correo: string; motivo: string }[] = [];

    for (const p of body.profesores) {
      const nombre = String(p.nombre_completo || "").trim();
      const correoP = String(p.correo || "").trim().toLowerCase();
      const areaP = String(p.area_principal || "").trim() || null;

      if (!nombre || !correoP) {
        fallidos.push({ correo: correoP || "(sin correo)", motivo: "Datos incompletos." });
        continue;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoP)) {
        fallidos.push({ correo: correoP, motivo: "Correo con formato inválido." });
        continue;
      }

      const resultado = await crearProfesorCompleto(supabaseAdmin, {
        nombre,
        correo: correoP,
        area: areaP,
        institucionId: perfil.institucion_id,
      });

      if (resultado.ok) {
        creados.push({ correo: resultado.correo, passwordTemporal: resultado.passwordTemporal });
      } else {
        fallidos.push({ correo: resultado.correo, motivo: resultado.motivo });
      }
    }

    await registrarAuditoria("importar_profesores", "perfil", null, {
      creados: creados.length,
      fallidos: fallidos.length,
    });

    return NextResponse.json({ error: null, creados, fallidos });
  }

  // Modo individual.
  const nombreCompleto = String(body.nombre_completo || "").trim();
  const correo = String(body.correo || "").trim().toLowerCase();
  const areaPrincipal = String(body.area_principal || "").trim() || null;

  if (!nombreCompleto || !correo) {
    return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return NextResponse.json({ error: "El correo no tiene un formato válido." }, { status: 400 });
  }

  const resultado = await crearProfesorCompleto(supabaseAdmin, {
    nombre: nombreCompleto,
    correo,
    area: areaPrincipal,
    institucionId: perfil.institucion_id,
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.motivo }, { status: 400 });
  }

  await registrarAuditoria("crear_profesor", "perfil", null, {
    nombre: nombreCompleto,
    correo: resultado.correo,
  });

  return NextResponse.json({
    error: null,
    correo: resultado.correo,
    passwordTemporal: resultado.passwordTemporal,
  });
}
