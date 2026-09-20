type Prueba = { nombre: string; pasó: boolean; error?: string };

const resultados: Prueba[] = [];

export function prueba(nombre: string, fn: () => void) {
  try {
    fn();
    resultados.push({ nombre, pasó: true });
  } catch (err: any) {
    resultados.push({ nombre, pasó: false, error: err?.message ?? String(err) });
  }
}

export async function pruebaAsync(nombre: string, fn: () => Promise<void>) {
  try {
    await fn();
    resultados.push({ nombre, pasó: true });
  } catch (err: any) {
    resultados.push({ nombre, pasó: false, error: err?.message ?? String(err) });
  }
}

export function esperar<T>(valor: T, esperado: T, mensaje?: string) {
  if (valor !== esperado) {
    throw new Error(mensaje ?? `Se esperaba ${JSON.stringify(esperado)}, se obtuvo ${JSON.stringify(valor)}`);
  }
}

export function esperarVerdadero(valor: boolean, mensaje: string) {
  if (!valor) throw new Error(mensaje);
}

export function imprimirResumen(): boolean {
  const exitosas = resultados.filter((r) => r.pasó).length;
  const fallidas = resultados.filter((r) => !r.pasó);

  console.log(`\n${"=".repeat(60)}`);
  for (const r of resultados) {
    console.log(`${r.pasó ? "✓" : "✗"} ${r.nombre}${r.error ? `\n    ${r.error}` : ""}`);
  }
  console.log(`${"=".repeat(60)}`);
  console.log(`${exitosas}/${resultados.length} pruebas exitosas`);
  if (fallidas.length > 0) {
    console.log(`${fallidas.length} prueba(s) FALLARON.`);
  }
  console.log(`${"=".repeat(60)}\n`);

  return fallidas.length === 0;
}
