"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  validarAulas,
  validarAsignaturas,
  validarGrupos,
  validarDisponibilidad,
  validarProfesores,
  type ErrorFila,
} from "@/lib/importador/validadores";
import { importarAulas, importarAsignaturas, importarGrupos, importarDisponibilidad } from "./actions";

type Tipo = "aulas" | "asignaturas" | "grupos" | "disponibilidad" | "profesores";

type Referencias = {
  areas: { id: string; nombre: string }[];
  grados: { id: string; nombre: string }[];
  docentes: { perfil_id: string; nombre_completo: string }[];
  franjas: { id: string; nombre: string }[];
};

const PLANTILLAS: Record<Tipo, { etiqueta: string; columnas: string }> = {
  aulas: { etiqueta: "Aulas", columnas: "nombre, tipo, capacidad, sede" },
  asignaturas: { etiqueta: "Asignaturas", columnas: "nombre, area, intensidad_horaria_semanal" },
  grupos: { etiqueta: "Grupos", columnas: "grado, nombre, codigo_grupo, jornada, anio_lectivo" },
  disponibilidad: { etiqueta: "Disponibilidad", columnas: "docente, dia_semana, franja, disponible (SI/NO)" },
  profesores: { etiqueta: "Profesores", columnas: "nombre_completo, correo, area_principal" },
};

export function Importador({ referencias }: { referencias: Referencias }) {
  const [tipo, setTipo] = useState<Tipo>("aulas");
  const [errores, setErrores] = useState<ErrorFila[]>([]);
  const [filasValidas, setFilasValidas] = useState<any[] | null>(null);
  const [totalFilas, setTotalFilas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [errorImportacion, setErrorImportacion] = useState<string | null>(null);
  const [credencialesProfesores, setCredencialesProfesores] = useState<
    { correo: string; passwordTemporal: string }[]
  >([]);

  function reiniciar() {
    setErrores([]);
    setFilasValidas(null);
    setTotalFilas(0);
    setResultado(null);
    setErrorImportacion(null);
    setCredencialesProfesores([]);
  }

  async function onArchivoSeleccionado(e: React.ChangeEvent<HTMLInputElement>) {
    reiniciar();
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    const buffer = await archivo.arrayBuffer();
    const libro = XLSX.read(buffer, { type: "array" });
    const hoja = libro.Sheets[libro.SheetNames[0]];
    const filas: Record<string, any>[] = XLSX.utils.sheet_to_json(hoja, { defval: "" });

    setTotalFilas(filas.length);

    if (filas.length === 0) {
      setErrores([{ fila: 0, mensaje: "El archivo no tiene filas de datos." }]);
      return;
    }

    if (tipo === "aulas") {
      const { errores, validas } = validarAulas(filas);
      setErrores(errores);
      if (errores.length === 0) setFilasValidas(validas);
    } else if (tipo === "asignaturas") {
      const { errores, validas } = validarAsignaturas(filas, referencias.areas);
      setErrores(errores);
      if (errores.length === 0) setFilasValidas(validas);
    } else if (tipo === "grupos") {
      const { errores, validas } = validarGrupos(filas, referencias.grados);
      setErrores(errores);
      if (errores.length === 0) setFilasValidas(validas);
    } else if (tipo === "disponibilidad") {
      const { errores, validas } = validarDisponibilidad(filas, referencias.docentes, referencias.franjas);
      setErrores(errores);
      if (errores.length === 0) setFilasValidas(validas);
    } else if (tipo === "profesores") {
      const { errores, validas } = validarProfesores(filas);
      setErrores(errores);
      if (errores.length === 0) setFilasValidas(validas);
    }

    e.target.value = "";
  }

  async function confirmarImportacion() {
    if (!filasValidas) return;
    setCargando(true);
    setErrorImportacion(null);

    // Los profesores van por el endpoint API porque crear cuentas de acceso
    // requiere privilegios administrativos server-only.
    if (tipo === "profesores") {
      const respuestaApi = await fetch("/api/profesores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profesores: filasValidas }),
      });
      const datos = await respuestaApi.json();
      setCargando(false);

      if (!respuestaApi.ok || datos.error) {
        setErrorImportacion(datos.error ?? "No se pudieron crear los profesores.");
        return;
      }

      setCredencialesProfesores(datos.creados ?? []);
      const fallidos = datos.fallidos ?? [];
      setResultado(
        `Se crearon ${datos.creados?.length ?? 0} profesor(es).` +
          (fallidos.length > 0
            ? ` ${fallidos.length} fallaron: ${fallidos.map((f: any) => `${f.correo} (${f.motivo})`).join("; ")}`
            : "")
      );
      setFilasValidas(null);
      return;
    }

    let respuesta;
    if (tipo === "aulas") respuesta = await importarAulas(filasValidas);
    else if (tipo === "asignaturas") respuesta = await importarAsignaturas(filasValidas);
    else if (tipo === "grupos") respuesta = await importarGrupos(filasValidas);
    else respuesta = await importarDisponibilidad(filasValidas);

    setCargando(false);

    if (respuesta.error) {
      setErrorImportacion(respuesta.error);
    } else {
      setResultado(`Se importaron ${respuesta.total} fila(s) correctamente.`);
      setFilasValidas(null);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-sm text-ink">Tipo de plantilla</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as Tipo);
              reiniciar();
            }}
            className="rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-brand-400"
          >
            {Object.entries(PLANTILLAS).map(([valor, p]) => (
              <option key={valor} value={valor}>
                {p.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-ink">Archivo .xlsx</label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={onArchivoSeleccionado}
            className="rounded-md border border-border px-3 py-1.5 text-sm"
          />
        </div>
      </div>

      <p className="mb-4 text-xs text-muted">
        Columnas esperadas para <strong>{PLANTILLAS[tipo].etiqueta}</strong>: {PLANTILLAS[tipo].columnas}
      </p>

      {totalFilas > 0 && errores.length === 0 && filasValidas && (
        <div className="mb-4 rounded-card border border-accent-teal/30 bg-accent-teal/10 p-4">
          <p className="mb-2 text-sm text-ink">
            ✓ {filasValidas.length} de {totalFilas} fila(s) válidas. Ningún error encontrado.
          </p>
          <button
            onClick={confirmarImportacion}
            disabled={cargando}
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {cargando ? "Importando..." : `Importar ${filasValidas.length} fila(s)`}
          </button>
        </div>
      )}

      {errores.length > 0 && (
        <div className="mb-4 rounded-card border border-accent-coral/30 bg-accent-coral/10 p-4">
          <p className="mb-2 text-sm font-medium text-accent-coral">
            Se encontraron {errores.length} error(es). Corrige el archivo y vuelve a subirlo — no
            se importó nada todavía.
          </p>
          <ul className="space-y-1">
            {errores.map((e, i) => (
              <li key={i} className="text-sm text-ink">
                <strong>Fila {e.fila}:</strong> {e.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}

      {errorImportacion && (
        <p className="mb-4 rounded-md bg-accent-coral/10 px-3 py-2 text-sm text-accent-coral">
          {errorImportacion}
        </p>
      )}

      {resultado && (
        <p className="mb-4 rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-700">{resultado}</p>
      )}

      {credencialesProfesores.length > 0 && (
        <div className="mb-4 rounded-card border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium text-ink">
            Contraseñas temporales — cópialas ahora, solo se muestran una vez:
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="py-1 font-medium">Correo</th>
                <th className="py-1 font-medium">Contraseña temporal</th>
              </tr>
            </thead>
            <tbody>
              {credencialesProfesores.map((c) => (
                <tr key={c.correo} className="border-b border-border last:border-0">
                  <td className="py-1.5 text-muted">{c.correo}</td>
                  <td className="py-1.5 font-medium text-ink">{c.passwordTemporal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
