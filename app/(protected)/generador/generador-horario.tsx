"use client";

import { useState } from "react";
import { generarHorarioAction, validarAntesDeGenerar } from "./actions";

type Problema = { problema: string; causa: string; solucion: string };

const PASOS = [
  "Analizando información...",
  "Validando profesores...",
  "Validando grupos...",
  "Validando aulas...",
  "Calculando restricciones...",
  "Generando combinaciones...",
  "Optimizando horario...",
  "Verificando conflictos...",
];

type Resultado = {
  numeroVersion: number;
  puntuacion: number;
  totalClases: number;
  conflictos: { tipo: string; severidad: string; descripcion: string }[];
};

function calificacion(puntuacion: number) {
  if (puntuacion >= 90) return { texto: "Excelente", color: "text-accent-teal" };
  if (puntuacion >= 75) return { texto: "Bueno", color: "text-brand-600" };
  if (puntuacion >= 50) return { texto: "Requiere ajustes", color: "text-accent-amber" };
  return { texto: "No válido", color: "text-accent-coral" };
}

export function GeneradorHorario() {
  const [generando, setGenerando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [validando, setValidando] = useState(false);
  const [problemas, setProblemas] = useState<Problema[] | null>(null);
  const [validado, setValidado] = useState(false);

  async function validar() {
    setValidando(true);
    setError(null);
    const respuesta = await validarAntesDeGenerar();
    setValidando(false);
    if (respuesta.error) {
      setError(respuesta.error);
      return;
    }
    setProblemas(respuesta.problemas ?? []);
    setValidado(true);
  }

  async function generar() {
    setGenerando(true);
    setError(null);
    setResultado(null);
    setPasoActual(0);

    const intervalo = setInterval(() => {
      setPasoActual((p) => (p < PASOS.length - 1 ? p + 1 : p));
    }, 350);

    const respuesta = await generarHorarioAction();

    clearInterval(intervalo);
    setPasoActual(PASOS.length - 1);

    setTimeout(() => {
      setGenerando(false);
      if (respuesta.error) setError(respuesta.error);
      else if (respuesta.resultado) setResultado(respuesta.resultado);
    }, 300);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <button
          onClick={validar}
          disabled={validando}
          className="rounded-md border border-brand-600 px-4 py-2.5 text-sm font-medium text-brand-600 transition hover:bg-brand-50 disabled:opacity-60"
        >
          {validando ? "Validando..." : "🔍 Validar antes de generar"}
        </button>

        <button
          onClick={generar}
          disabled={generando}
          className="rounded-md bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {generando ? "Generando..." : "🤖 Generar horario automáticamente"}
        </button>
      </div>

      {validado && problemas && (
        <div className="mb-6">
          {problemas.length === 0 ? (
            <div className="rounded-card border border-accent-teal/30 bg-accent-teal/10 p-4 text-sm text-accent-teal">
              ✓ No se detectó ningún problema de factibilidad. Puedes generar el horario.
            </div>
          ) : (
            <div className="rounded-card border border-accent-amber/30 bg-accent-amber/10 p-4">
              <p className="mb-3 text-sm font-medium text-accent-amber">
                Se detectaron {problemas.length} problema(s) que pueden impedir un horario completo:
              </p>
              <div className="space-y-3">
                {problemas.map((p, i) => (
                  <div key={i} className="rounded-md bg-card p-3 text-sm">
                    <p className="text-ink">
                      <strong>PROBLEMA:</strong> {p.problema}
                    </p>
                    <p className="text-muted">
                      <strong>CAUSA:</strong> {p.causa}
                    </p>
                    <p className="text-muted">
                      <strong>SOLUCIÓN RECOMENDADA:</strong> {p.solucion}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-accent-amber">
                Puedes generar de todas formas — el motor ubicará lo que sí sea posible y
                reportará el resto como conflicto.
              </p>
            </div>
          )}
        </div>
      )}

      {generando && (
        <div className="mb-6 rounded-card border border-border bg-card p-4">
          <ul className="space-y-1.5">
            {PASOS.map((paso, i) => (
              <li key={paso} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    i < pasoActual
                      ? "text-accent-teal"
                      : i === pasoActual
                      ? "text-brand-600"
                      : "text-border"
                  }
                >
                  {i < pasoActual ? "✓" : i === pasoActual ? "…" : "○"}
                </span>
                <span className={i <= pasoActual ? "text-ink" : "text-muted"}>{paso}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-card border border-accent-coral/30 bg-accent-coral/10 p-4 text-sm text-accent-coral">
          {error}
        </div>
      )}

      {resultado && (
        <div className="rounded-card border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-medium text-ink">
            Horario generado — Versión {resultado.numeroVersion}
          </h2>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted">Clases ubicadas</p>
              <p className="text-lg font-medium text-ink">{resultado.totalClases}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Conflictos</p>
              <p className="text-lg font-medium text-ink">{resultado.conflictos.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Puntuación</p>
              <p className={`text-lg font-medium ${calificacion(resultado.puntuacion).color}`}>
                {resultado.puntuacion}/100 · {calificacion(resultado.puntuacion).texto}
              </p>
            </div>
          </div>

          {resultado.conflictos.length > 0 && (
            <div className="border-t border-border pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Conflictos detectados
              </p>
              <ul className="space-y-2">
                {resultado.conflictos.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span>{c.severidad === "critico" ? "🔴" : "🟠"}</span>
                    <span className="text-muted">{c.descripcion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-muted">
            Se guardó como borrador. Ve a "Versiones" para revisarlo, o al "Centro de conflictos"
            para resolver los problemas encontrados antes de aprobarlo.
          </p>
        </div>
      )}
    </div>
  );
}
