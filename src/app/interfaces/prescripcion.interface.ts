export type EstadoPrescripcion = 'activa' | 'procesando' | 'completada' | 'anulada';

export interface Prescripcion {
  id: string;

  pacienteId: string;
  medicoId: string;

  medicamento: string;
  dosis: string;

  frecuencia: string;
  hora: string;

  fechaInicio: Date;
  fechaFin: Date;

  observaciones: string;

  estado: EstadoPrescripcion;
  activa: boolean;
  ocultaParaPaciente: boolean;
}
