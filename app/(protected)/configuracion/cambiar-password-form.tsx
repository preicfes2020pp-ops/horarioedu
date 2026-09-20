"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CambiarPasswordForm() {
  const [abierto, setAbierto] = useState(false);
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (nueva.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    const supabase = createClient();
    const { error: errUpdate } = await supabase.auth.updateUser({ password: nueva });
    setCargando(false);

    if (errUpdate) {
      setError(errUpdate.message);
      return;
    }

    setExito(true);
    setNueva("");
    setConfirmar("");
    setTimeout(() => setAbierto(false), 2000);
  }

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-ink hover:bg-surface"
      >
        <span>Cambiar contraseña</span>
        <span className="text-muted">{abierto ? "−" : "›"}</span>
      </button>

      {abierto && (
        <form onSubmit={guardar} className="space-y-2 px-4 pb-4">
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            className="w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          {error && <p className="text-sm text-accent-coral">{error}</p>}
          {exito && <p className="text-sm text-accent-teal">Contraseña actualizada ✓</p>}
          <button
            type="submit"
            disabled={cargando}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {cargando ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}
