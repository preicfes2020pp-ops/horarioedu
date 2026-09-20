"use client";

import { useState } from "react";

const COLORES = ["bg-brand-600", "bg-accent-teal", "bg-accent-purple", "bg-accent-amber", "bg-accent-coral"];

function colorPorTexto(texto: string) {
  let hash = 0;
  for (let i = 0; i < texto.length; i++) hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  return COLORES[Math.abs(hash) % COLORES.length];
}

function iniciales(texto: string) {
  const partes = texto.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

export function AvatarIniciales({ texto, tamano = 42 }: { texto: string; tamano?: number }) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-medium text-white ${colorPorTexto(texto)}`}
      style={{ width: tamano, height: tamano, fontSize: tamano * 0.38 }}
    >
      {iniciales(texto) || "?"}
    </div>
  );
}

export function ChevronDerecha() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="#5B6270" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconoBuscar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="#5B6270" strokeWidth="1.8" />
      <path d="M20 20l-3.2-3.2" stroke="#5B6270" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BarraBusqueda({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2.5">
      <IconoBuscar />
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
      />
    </div>
  );
}

export function EncabezadoLista({
  placeholder,
  busqueda,
  onBuscar,
  mostrarFormulario,
  onToggleFormulario,
  puedeAgregar,
}: {
  placeholder: string;
  busqueda: string;
  onBuscar: (v: string) => void;
  mostrarFormulario: boolean;
  onToggleFormulario: () => void;
  puedeAgregar: boolean;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex-1">
        <BarraBusqueda valor={busqueda} onChange={onBuscar} placeholder={placeholder} />
      </div>
      {puedeAgregar && (
        <button
          onClick={onToggleFormulario}
          className="shrink-0 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
        >
          {mostrarFormulario ? "Cerrar" : "+ Agregar"}
        </button>
      )}
    </div>
  );
}

export function useBusqueda<T>(items: T[], obtenerTexto: (item: T) => string) {
  const [busqueda, setBusqueda] = useState("");
  const filtrados = items.filter((item) =>
    obtenerTexto(item).toLowerCase().includes(busqueda.toLowerCase())
  );
  return { busqueda, setBusqueda, filtrados };
}
