import * as XLSX from "xlsx";
import { CeldaExport, FranjaExport, MetaExportacion, NOMBRE_DIA } from "./tipos";

export function exportarHorarioExcel(
  meta: MetaExportacion,
  franjas: FranjaExport[],
  dias: number[],
  clases: CeldaExport[]
) {
  const mapa = new Map<string, CeldaExport>();
  for (const c of clases) mapa.set(`${c.dia}-${c.franjaId}`, c);

  const franjasClase = franjas.filter((f) => f.es_bloque_clase);

  const encabezadoInfo = [
    [meta.institucionNombre],
    [`${meta.vistaEtiqueta} · Jornada: ${meta.jornada ?? "—"}`],
    [`Versión ${meta.numeroVersion} · ${meta.estadoVersion}`],
    [`Generado el ${new Date().toLocaleString("es-CO")}`],
    [],
  ];

  const encabezadoTabla = ["Hora", ...dias.map((d) => NOMBRE_DIA[d] ?? String(d))];

  const filas = franjasClase.map((f) => {
    const fila = [f.nombre];
    for (const d of dias) {
      const celda = mapa.get(`${d}-${f.id}`);
      fila.push(
        celda
          ? [celda.lineaPrincipal, celda.lineaSecundaria, celda.lineaTerciaria].filter(Boolean).join(" - ")
          : ""
      );
    }
    return fila;
  });

  const hoja = XLSX.utils.aoa_to_sheet([...encabezadoInfo, encabezadoTabla, ...filas]);
  hoja["!cols"] = [{ wch: 14 }, ...dias.map(() => ({ wch: 28 }))];

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Horario");

  const nombreArchivo = `horario-${meta.vistaEtiqueta.replace(/\s+/g, "_")}-v${meta.numeroVersion}.xlsx`;
  XLSX.writeFile(libro, nombreArchivo);
}
