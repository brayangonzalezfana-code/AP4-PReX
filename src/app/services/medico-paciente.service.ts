import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

import { MedicoPaciente } from '../interfaces/medico-paciente.interface';
import { Usuario } from '../interfaces/usuario.interface';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class MedicoPacienteService {
  private readonly relacionesKey = 'prex_medico_pacientes';
  private readonly storageService = inject(StorageService);
  private readonly storage = inject(Storage);
  private readonly authService = inject(AuthService);

  async obtenerRelaciones(): Promise<MedicoPaciente[]> {
    await this.storageService.init();
    return (await this.storage.get(this.relacionesKey)) ?? [];
  }

  async guardarRelaciones(relaciones: MedicoPaciente[]): Promise<void> {
    await this.storageService.init();
    await this.storage.set(this.relacionesKey, relaciones);
  }

  async crearRelacion(relacion: MedicoPaciente): Promise<void> {
    const relaciones = await this.obtenerRelaciones();
    relaciones.push(relacion);
    await this.guardarRelaciones(relaciones);
  }

  async obtenerRelacionesPorMedico(medicoId: string): Promise<MedicoPaciente[]> {
    const relaciones = await this.obtenerRelaciones();
    return relaciones.filter((relacion) => relacion.medicoId === medicoId && relacion.activo);
  }

  async obtenerRelacionesPorPaciente(pacienteId: string): Promise<MedicoPaciente[]> {
    const relaciones = await this.obtenerRelaciones();
    return relaciones.filter((relacion) => relacion.pacienteId === pacienteId && relacion.activo);
  }

  async obtenerPacientesDelMedico(medicoId: string): Promise<Usuario[]> {
    const [relaciones, pacientes] = await Promise.all([
      this.obtenerRelacionesPorMedico(medicoId),
      this.authService.obtenerPacientes(),
    ]);

    const pacienteIds = new Set(relaciones.map((relacion) => relacion.pacienteId));
    return pacientes.filter((paciente) => pacienteIds.has(paciente.id));
  }

  async existeRelacion(medicoId: string, pacienteId: string): Promise<boolean> {
    const relaciones = await this.obtenerRelacionesPorMedico(medicoId);
    return relaciones.some((relacion) => relacion.pacienteId === pacienteId);
  }
}
