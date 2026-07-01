import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

import { Prescripcion } from '../interfaces/prescripcion.interface';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class PrescripcionService {
  private readonly prescripcionesKey = 'prex_prescripciones';
  private readonly storageService = inject(StorageService);
  private readonly storage = inject(Storage);

  async obtenerPrescripciones(): Promise<Prescripcion[]> {
    await this.storageService.init();
    const prescripciones = (await this.storage.get(this.prescripcionesKey)) ?? [];

    return prescripciones.map((prescripcion: Partial<Prescripcion> & { id: string }) => ({
      ...prescripcion,
      estado: prescripcion.estado ?? (prescripcion.activa === false ? 'anulada' : 'activa'),
      activa: prescripcion.activa ?? true,
      ocultaParaPaciente: prescripcion.ocultaParaPaciente ?? false,
    })) as Prescripcion[];
  }

  async guardarPrescripciones(
    prescripciones: Prescripcion[]
  ): Promise<void> {
    await this.storageService.init();
    await this.storage.set(this.prescripcionesKey, prescripciones);
  }

  async crearPrescripcion(
    prescripcion: Prescripcion
  ): Promise<void> {
    const prescripciones = await this.obtenerPrescripciones();
    prescripciones.push(prescripcion);
    await this.guardarPrescripciones(prescripciones);
  }

  async obtenerPrescripcionesPaciente(
    pacienteId: string
  ): Promise<Prescripcion[]> {
    const prescripciones = await this.obtenerPrescripciones();
    return prescripciones.filter(
      (prescripcion) => prescripcion.pacienteId === pacienteId && !prescripcion.ocultaParaPaciente
    );
  }

  async obtenerPrescripcionesMedico(
    medicoId: string
  ): Promise<Prescripcion[]> {
    const prescripciones = await this.obtenerPrescripciones();
    return prescripciones.filter(
      (prescripcion) => prescripcion.medicoId === medicoId
    );
  }

  async actualizarPrescripcion(prescripcionActualizada: Prescripcion): Promise<void> {
    const prescripciones = await this.obtenerPrescripciones();
    const index = prescripciones.findIndex(
      (prescripcionRegistrada) => prescripcionRegistrada.id === prescripcionActualizada.id
    );

    if (index === -1) {
      return;
    }

    prescripciones[index] = prescripcionActualizada;
    await this.guardarPrescripciones(prescripciones);
  }

  async desactivarPrescripcion(id: string): Promise<void> {
    const prescripciones = await this.obtenerPrescripciones();
    const prescripcion = prescripciones.find(
      (prescripcionRegistrada) => prescripcionRegistrada.id === id
    );

    if (!prescripcion) {
      return;
    }

    prescripcion.activa = false;
    prescripcion.estado = 'anulada';
    await this.guardarPrescripciones(prescripciones);
  }

  async completarPrescripcion(id: string): Promise<void> {
    const prescripciones = await this.obtenerPrescripciones();
    const prescripcion = prescripciones.find(
      (prescripcionRegistrada) => prescripcionRegistrada.id === id
    );

    if (!prescripcion) {
      return;
    }

    prescripcion.activa = false;
    prescripcion.estado = 'completada';
    await this.guardarPrescripciones(prescripciones);
  }

  async ocultarPrescripcionParaPaciente(id: string): Promise<void> {
    const prescripciones = await this.obtenerPrescripciones();
    const prescripcion = prescripciones.find(
      (prescripcionRegistrada) => prescripcionRegistrada.id === id
    );

    if (!prescripcion) {
      return;
    }

    prescripcion.ocultaParaPaciente = true;
    await this.guardarPrescripciones(prescripciones);
  }
}
