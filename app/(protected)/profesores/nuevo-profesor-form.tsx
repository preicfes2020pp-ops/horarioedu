"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function NuevoProfesorForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [credenciales, setCredenciales] = useState<{ correo: string; passwordTemporal: string } | null>(
    null
  );
  const formRef = useRef<HTMLFormElement>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setCredenciales(null);

    const formData = new FormData(e.currentTarget);
    const respuesta = await fetch("/api/profesores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre_completo: formData.get("nombre_completo"),
        correo: formData.get("correo"),
        area_principal: formData.get("area_principal"),
      }),
    });

    const datos = await respuesta.json();
    setCargando(false);

    if (!respuesta.ok || datos.error) {
      setError(datos.error ?? "No se pudo crear el profesor.");
      return;
    }

    setCredenciales({ correo: datos.correo, passwordTemporal: datos.passwordTemporal });
    formRef.current?.reset();
    router.refresh();
  }

  return (
    <div className="mb-6 rounded-card border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-medium text-ink">Crear profesor nuevo</h2>
      <form ref={formRef} onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          name="nombre_completo"
          placeholder="Nombre completo"
          required
          className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand-400 sm:col-span-2"
        />
        <input
          name="correo"
          type="email"
          placeholder="Correo institucional"
          required
          className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
        <input
          name="area_principal"
          placeholder="Área principal"
          className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand-400"
        />

        {error && <p className="sm:col-span-4 text-sm text-accent-coral">{error}</p>}

        {credenciales && (
          <div className="sm:col-span-4 rounded-md bg-brand-50 px-3 py-3 text-sm text-brand-700">
            <p className="mb-1 font-medium">Cuenta creada. Comparte esto con el profesor:</p>
            <p>
              Correo: <strong>{credenciales.correo}</strong>
            </p>
            <p>
              Contraseña temporal: <strong>{credenciales.passwordTemporal}</strong>
            </p>
            <p className="mt-1 text-xs text-brand-700/80">
              Esta contraseña solo se muestra una vez. Recomiéndale cambiarla al iniciar sesión.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={cargando}
          className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60 sm:col-span-4 sm:w-fit"
        >
          {cargando ? "Creando cuenta..." : "+ Crear profesor"}
        </button>
      </form>
    </div>
  );
}
