import { CeldaExport, FranjaExport, MetaExportacion, NOMBRE_DIA } from "./tipos";

function escaparCampo(valor: string): string {
  // Envuelve en comillas si contiene coma, comilla o salto de línea, y
  // duplica las comillas internas (formato CSV estándar RFC 4180).
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function exportarHorarioCSV(
  meta: MetaExportacion,
  franjas: FranjaExport[],
  dias: number[],
  clases: CeldaExport[]
) {
  const mapa = new Map<string, CeldaExport>();
  for (const c of clases) mapa.set(`${c.dia}-${c.franjaId}`, c);

  const franjasClase = franjas.filter((f) => f.es_bloque_clase);

  const lineas: string[] = [];
  lineas.push(escaparCampo(meta.institucionNombre));
  lineas.push(escaparCampo(`${meta.vistaEtiqueta} - Jornada: ${meta.jornada ?? "-"}`));
  lineas.push(escaparCampo(`Version ${meta.numeroVersion} - ${meta.estadoVersion}`));
  lineas.push(escaparCampo(`Generado el ${new Date().toLocaleString("es-CO")}`));
  lineas.push("");

  lineas.push(["Hora", ...dias.map((d) => NOMBRE_DIA[d] ?? String(d))].map(escaparCampo).join(","));

  for (const f of franjasClase) {
    const fila = [f.nombre];
    for (const d of dias) {
      const celda = mapa.get(`${d}-${f.id}`);
      fila.push(
        celda
          ? [celda.lineaPrincipal, celda.lineaSecundaria, celda.lineaTerciaria].filter(Boolean).join(" - ")
          : ""
      );
    }
    lineas.push(fila.map(escaparCampo).join(","));
  }

  // BOM inicial para que Excel abra correctamente las tildes y la ñ.
  const contenido = "\uFEFF" + lineas.join("\r\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = `horario-${meta.vistaEtiqueta.replace(/\s+/g, "_")}-v${meta.numeroVersion}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
