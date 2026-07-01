export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  password: string;
  rol: 'paciente' | 'medico' | 'admin';
  fechaRegistro: Date;
  activo: boolean;
}