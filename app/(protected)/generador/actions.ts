"use server";

import { revalidatePath } from "next/cache";
import { getPerfilActual } from "@/lib/supabase/server";
import { generarVersionParaInstitucion } from "@/lib/motor/generar-y-guardar";
import { construirEntradaMotor } from "@/lib/motor/generar-y-guardar";
import { validarFactibilidad } from "@/lib/motor/validacion-previa";
import { registrarAuditoria } from "@/lib/auditoria";

export async function validarAntesDeGenerar() {
  const perfil = await getPerfilActual();
  if (!perfil?.institucion_id) return { error: "No se encontró tu institución.", problemas: null };

  const { error, entrada } = await construirEntradaMotor(perfil.institucion_id);
  if (error || !entrada) return { error, problemas: null };

  const problemas = validarFactibilidad(entrada);
  return { error: null, problemas };
}

export async function generarHorarioAction() {
  const perfil = await getPerfilActual();
  if (!perfil?.institucion_id) {
    return { error: "No se encontró tu institución.", resultado: null };
  }

  const { error, resultado } = await generarVersionParaInstitucion(
    perfil.institucion_id,
    perfil.id
  );

  if (!error && resultado) {
    await registrarAuditoria("generar_horario", "version_horario", resultado.versionId, {
      puntuacion: resultado.puntuacion,
      totalClases: resultado.totalClases,
      conflictos: resultado.conflictos.length,
    });
    revalidatePath("/generador");
    revalidatePath("/versiones");
  }

  return { error, resultado };
}
