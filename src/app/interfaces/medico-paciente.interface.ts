export interface MedicoPaciente {
  id: string;
  medicoId: string;
  pacienteId: string;
  motivoConsulta: string;
  antecedentes: string;
  alergias: string;
  observaciones: string;
  fechaRegistro: Date;
  activo: boolean;
}
