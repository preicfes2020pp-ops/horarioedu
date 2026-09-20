import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CeldaExport, FranjaExport, MetaExportacion, NOMBRE_DIA } from "./tipos";

async function cargarImagenBase64(url: string): Promise<string | null> {
  try {
    const respuesta = await fetch(url);
    const blob = await respuesta.blob();
    return await new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result as string);
      lector.onerror = reject;
      lector.readAsDataURL(blob);
    });
  } catch {
    // Si el logo no se puede cargar (CORS, URL rota, etc.) se exporta sin él
    // en vez de fallar toda la exportación.
    return null;
  }
}

export async function exportarHorarioPDF(
  meta: MetaExportacion,
  franjas: FranjaExport[],
  dias: number[],
  clases: CeldaExport[]
) {
  const doc = new jsPDF({ orientation: "landscape" });
  let cursorY = 15;

  if (meta.logoUrl) {
    const logoBase64 = await cargarImagenBase64(meta.logoUrl);
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", 14, 8, 18, 18);
      } catch {
        // Formato de imagen no soportado por jsPDF; se omite sin bloquear la exportación.
      }
    }
  }

  doc.setFontSize(14);
  doc.text(meta.institucionNombre, 36, cursorY);
  cursorY += 6;
  doc.setFontSize(10);
  doc.text(`${meta.vistaEtiqueta} · Jornada: ${meta.jornada ?? "—"}`, 36, cursorY);
  cursorY += 5;
  doc.text(
    `Versión ${meta.numeroVersion} (${meta.estadoVersion}) · Generado el ${new Date().toLocaleString("es-CO")}`,
    36,
    cursorY
  );

  const mapa = new Map<string, CeldaExport>();
  for (const c of clases) mapa.set(`${c.dia}-${c.franjaId}`, c);

  const franjasClase = franjas.filter((f) => f.es_bloque_clase);

  const head = [["Hora", ...dias.map((d) => NOMBRE_DIA[d] ?? String(d))]];
  const body = franjasClase.map((f) => {
    const fila = [f.nombre];
    for (const d of dias) {
      const celda = mapa.get(`${d}-${f.id}`);
      fila.push(
        celda
          ? [celda.lineaPrincipal, celda.lineaSecundaria, celda.lineaTerciaria].filter(Boolean).join("\n")
          : ""
      );
    }
    return fila;
  });

  autoTable(doc, {
    head,
    body,
    startY: 25,
    styles: { fontSize: 8, cellPadding: 2, valign: "middle" },
    headStyles: { fillColor: [42, 75, 124] },
  });

  const nombreArchivo = `horario-${meta.vistaEtiqueta.replace(/\s+/g, "_")}-v${meta.numeroVersion}.pdf`;
  doc.save(nombreArchivo);
}
