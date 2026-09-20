export type MetaExportacion = {
  institucionNombre: string;
  logoUrl: string | null;
  jornada: string | null;
  numeroVersion: number;
  estadoVersion: string;
  vistaEtiqueta: string; // ej. "Grupo 6A", "Profesor Juan Pérez"
};

export type FranjaExport = { id: string; nombre: string; orden: number; es_bloque_clase: boolean };

export type CeldaExport = {
  dia: number;
  franjaId: string;
  lineaPrincipal: string;
  lineaSecundaria: string;
  lineaTerciaria: string;
};

export const NOMBRE_DIA: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};
