"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconoInicio, IconoProfesores, IconoGrupos, IconoHorarios, IconoMas } from "./iconos-nav";

const TABS = [
  { href: "/dashboard", etiqueta: "Inicio", Icono: IconoInicio, roles: ["rector", "coordinador", "superadmin"] },
  { href: "/profesores", etiqueta: "Profesores", Icono: IconoProfesores, roles: ["coordinador", "rector", "superadmin"] },
  { href: "/grupos", etiqueta: "Grupos", Icono: IconoGrupos, roles: ["coordinador", "rector", "superadmin"] },
  { href: "/horarios", etiqueta: "Horarios", Icono: IconoHorarios, roles: ["rector", "coordinador", "superadmin"] },
];

type ItemMas = { href: string; etiqueta: string; roles: string[] };

const ITEMS_MAS: ItemMas[] = [
  { href: "/asignaturas", etiqueta: "Asignaturas", roles: ["coordinador", "rector", "superadmin"] },
  { href: "/aulas", etiqueta: "Aulas", roles: ["coordinador", "rector", "superadmin"] },
  { href: "/disponibilidad", etiqueta: "Disponibilidad", roles: ["coordinador", "rector", "superadmin"] },
  { href: "/generador", etiqueta: "Generador de horarios", roles: ["coordinador", "superadmin"] },
  { href: "/conflictos", etiqueta: "Conflictos", roles: ["coordinador", "rector", "superadmin"] },
  { href: "/horarios-emergentes", etiqueta: "Horarios emergentes", roles: ["coordinador", "rector", "superadmin"] },
  { href: "/importar-excel", etiqueta: "Importar Excel", roles: ["coordinador", "superadmin"] },
  { href: "/versiones", etiqueta: "Versiones", roles: ["coordinador", "rector", "superadmin"] },
  { href: "/auditoria", etiqueta: "Auditoría", roles: ["rector", "superadmin"] },
  { href: "/instituciones", etiqueta: "Institución", roles: ["superadmin"] },
  { href: "/configuracion", etiqueta: "Configuración", roles: ["rector", "coordinador", "superadmin"] },
];

export function BottomNav({ rol }: { rol: string }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  const tabsVisibles = TABS.filter((t) => t.roles.includes(rol));
  const masVisibles = ITEMS_MAS.filter((i) => i.roles.includes(rol));
  const enSeccionMas = masVisibles.some((i) => pathname.startsWith(i.href));

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setAbierto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-card p-4 pb-8"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <p className="mb-3 text-sm font-medium text-ink">Más opciones</p>
            <div className="grid grid-cols-2 gap-2">
              {masVisibles.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setAbierto(false)}
                  className="rounded-xl border border-border bg-surface px-3 py-3 text-sm text-ink hover:border-brand-400"
                >
                  {item.etiqueta}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        {tabsVisibles.map((tab) => {
          const activo = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
            >
              <tab.Icono activo={activo} />
              <span className={`text-[11px] ${activo ? "font-medium text-brand-600" : "text-muted"}`}>
                {tab.etiqueta}
              </span>
            </Link>
          );
        })}
        {masVisibles.length > 0 && (
          <button
            onClick={() => setAbierto(true)}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
          >
            <IconoMas activo={enSeccionMas} />
            <span className={`text-[11px] ${enSeccionMas ? "font-medium text-brand-600" : "text-muted"}`}>
              Más
            </span>
          </button>
        )}
      </nav>
    </>
  );
}
