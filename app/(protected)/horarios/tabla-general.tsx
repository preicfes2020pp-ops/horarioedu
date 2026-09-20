const DIAS: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};

export type FilaGeneral = {
  dia: number;
  franjaNombre: string;
  franjaOrden: number;
  grupo: string;
  asignatura: string;
  profesor: string;
  aula: string;
};

export function TablaGeneral({ filas }: { filas: FilaGeneral[] }) {
  const ordenadas = [...filas].sort((a, b) => {
    if (a.dia !== b.dia) return a.dia - b.dia;
    return a.franjaOrden - b.franjaOrden;
  });

  return (
    <div className="overflow-x-auto rounded-card border border-border bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 font-medium">Día</th>
            <th className="px-3 py-2 font-medium">Hora</th>
            <th className="px-3 py-2 font-medium">Grupo</th>
            <th className="px-3 py-2 font-medium">Asignatura</th>
            <th className="px-3 py-2 font-medium">Profesor</th>
            <th className="px-3 py-2 font-medium">Aula</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted">
                Esta versión todavía no tiene clases.
              </td>
            </tr>
          ) : (
            ordenadas.map((f, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                <td className="px-3 py-2 text-sm text-ink">{DIAS[f.dia] ?? f.dia}</td>
                <td className="px-3 py-2 text-sm text-muted">{f.franjaNombre}</td>
                <td className="px-3 py-2 text-sm text-muted">{f.grupo}</td>
                <td className="px-3 py-2 text-sm text-ink">{f.asignatura}</td>
                <td className="px-3 py-2 text-sm text-muted">{f.profesor}</td>
                <td className="px-3 py-2 text-sm text-muted">{f.aula}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
