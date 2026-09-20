import { NextRequest, NextResponse } from "next/server";
import { createClient as createClienteAdmin } from "@supabase/supabase-js";
import { createClient, getPerfilActual } from "@/lib/supabase/server";
import { registrarAuditoria } from "@/lib/auditoria";

function generarPasswordTemporal() {
  // Password temporal legible, para que el coordinador pueda dictarla o
  // copiarla fácilmente al profesor nuevo.
  const palabras = ["Horario", "Escuela", "Clase", "Aula", "Educa"];
  const palabra = palabras[Math.floor(Math.random() * palabras.length)];
  const numero = Math.floor(1000 + Math.random() * 9000);
  return `${palabra}${numero}!`;
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

  const body = await request.json();

  // Modo masivo: se recibe un arreglo desde el importador de Excel.
  if (Array.isArray(body.profesores)) {
    const serviceRoleKeyMasivo = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabaseAdminMasivo = createClienteAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKeyMasivo,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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

      const passwordP = generarPasswordTemporal();
      const { data: usuario, error: errAuthP } = await supabaseAdminMasivo.auth.admin.createUser({
        email: correoP,
        password: passwordP,
        email_confirm: true,
      });

      if (errAuthP || !usuario.user) {
        fallidos.push({ correo: correoP, motivo: errAuthP?.message ?? "No se pudo crear la cuenta." });
        continue;
      }

      const { error: errPerfilP } = await supabaseAdminMasivo.from("perfiles").insert({
        id: usuario.user.id,
        rol: "docente",
        institucion_id: perfil.institucion_id,
        nombre_completo: nombre,
        correo: correoP,
        activo: true,
      });

      if (errPerfilP) {
        await supabaseAdminMasivo.auth.admin.deleteUser(usuario.user.id);
        fallidos.push({ correo: correoP, motivo: errPerfilP.message });
        continue;
      }

      await supabaseAdminMasivo.from("docentes").insert({
        perfil_id: usuario.user.id,
        area_principal: areaP,
      });

      creados.push({ correo: correoP, passwordTemporal: passwordP });
    }

    await registrarAuditoria("importar_profesores", "perfil", null, {
      creados: creados.length,
      fallidos: fallidos.length,
    });

    return NextResponse.json({ error: null, creados, fallidos });
  }

  const nombreCompleto = String(body.nombre_completo || "").trim();
  const correo = String(body.correo || "").trim().toLowerCase();
  const areaPrincipal = String(body.area_principal || "").trim() || null;

  if (!nombreCompleto || !correo) {
    return NextResponse.json({ error: "Nombre y correo son obligatorios." }, { status: 400 });
  }

  // 2. Cliente ADMIN (service_role, bypassa RLS) — solo se usa en este
  // endpoint server-only, nunca se envía al navegador.
  const supabaseAdmin = createClienteAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const passwordTemporal = generarPasswordTemporal();

  const { data: usuarioCreado, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
    email: correo,
    password: passwordTemporal,
    email_confirm: true,
  });

  if (errAuth || !usuarioCreado.user) {
    return NextResponse.json(
      { error: errAuth?.message ?? "No se pudo crear la cuenta." },
      { status: 400 }
    );
  }

  const { error: errPerfil } = await supabaseAdmin.from("perfiles").insert({
    id: usuarioCreado.user.id,
    rol: "docente",
    institucion_id: perfil.institucion_id,
    nombre_completo: nombreCompleto,
    correo,
    activo: true,
  });

  if (errPerfil) {
    // Revierte la cuenta de auth si no se pudo crear el perfil, para no
    // dejar una cuenta huérfana sin fila en perfiles.
    await supabaseAdmin.auth.admin.deleteUser(usuarioCreado.user.id);
    return NextResponse.json({ error: errPerfil.message }, { status: 400 });
  }

  const { error: errDocente } = await supabaseAdmin.from("docentes").insert({
    perfil_id: usuarioCreado.user.id,
    area_principal: areaPrincipal,
  });

  if (errDocente) {
    return NextResponse.json({ error: errDocente.message }, { status: 400 });
  }

  await registrarAuditoria("crear_profesor", "perfil", usuarioCreado.user.id, {
    nombre: nombreCompleto,
    correo,
  });

  return NextResponse.json({
    error: null,
    correo,
    passwordTemporal,
  });
}
