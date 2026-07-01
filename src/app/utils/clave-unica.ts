export function construirClaveUnicaToma(prescripcionId: string, pacienteId: string, fecha: Date | string): string {
  const fechaBase = new Date(fecha);
  const fechaLocal = new Date(fechaBase.getTime() - fechaBase.getTimezoneOffset() * 60000);
  const fechaTexto = fechaLocal.toISOString().slice(0, 10);

  return `${prescripcionId}-${pacienteId}-${fechaTexto}`;
}
