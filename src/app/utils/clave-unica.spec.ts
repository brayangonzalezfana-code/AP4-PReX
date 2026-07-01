import { construirClaveUnicaToma } from './clave-unica';

describe('construirClaveUnicaToma', () => {
  it('debe generar la misma clave para una misma prescripción, paciente y fecha', () => {
    const fecha = new Date('2025-01-15T10:30:00.000Z');

    const claveUno = construirClaveUnicaToma('presc-1', 'pac-1', fecha);
    const claveDos = construirClaveUnicaToma('presc-1', 'pac-1', new Date('2025-01-15T23:59:59.000Z'));

    expect(claveUno).toBe('presc-1-pac-1-2025-01-15');
    expect(claveDos).toBe(claveUno);
  });
});
