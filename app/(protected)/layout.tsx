import { redirect } from "next/navigation";
import { getPerfilActual } from "@/lib/supabase/server";
import { cerrarSesion } from "../login/actions";
import { BottomNav } from "./bottom-nav";
import { TopHeader } from "./top-header";

const ETIQUETA_ROL: Record<string, string> = {
  docente: "Docente",
  rector: "Rector",
  coordinador: "Coordinador académico",
  superadmin: "Administrador",
};

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfilActual();

  if (!perfil) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopHeader
        nombreCompleto={perfil.nombre_completo ?? ""}
        etiquetaRol={ETIQUETA_ROL[perfil.rol] ?? perfil.rol}
        onCerrarSesion={cerrarSesion}
      />

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-4">{children}</main>

      <BottomNav rol={perfil.rol} />
    </div>
  );
}
