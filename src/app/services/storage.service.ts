import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

import { MedicoPaciente } from '../interfaces/medico-paciente.interface';
import { Prescripcion } from '../interfaces/prescripcion.interface';
import { Toma } from '../interfaces/toma.interface';
import { Usuario } from '../interfaces/usuario.interface';
import { construirClaveUnicaToma } from '../utils/clave-unica';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private readonly usuariosKey = 'prex_usuarios';
  private readonly sesionKey = 'prex_usuario_actual';
  private readonly prescripcionesKey = 'prex_prescripciones';
  private readonly tomasKey = 'prex_tomas';
  private readonly relacionesKey = 'prex_medico_pacientes';
  private readonly storage = inject(Storage);
  private storageInstance: Storage | null = null;
  private initPromise: Promise<Storage> =
    this.storage.create().then((storage) => {
      this.storageInstance = storage;
      return storage;
    });
  private migrationPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    const storage = await this.getStorage();
    if (!this.migrationPromise) {
      this.migrationPromise = this.migrarDatosLegacy(storage);
    }

    await this.migrationPromise;
  }

  async obtenerUsuarios(): Promise<Usuario[]> {
    const storage = await this.getStorage();
    return (await storage.get(this.usuariosKey)) ?? [];
  }

  async guardarUsuarios(usuarios: Usuario[]): Promise<void> {
    const storage = await this.getStorage();
    await storage.set(this.usuariosKey, usuarios);
  }

  async obtenerUsuarioActual(): Promise<Usuario | null> {
    const storage = await this.getStorage();
    return (await storage.get(this.sesionKey)) ?? null;
  }

  async guardarUsuarioActual(usuario: Usuario): Promise<void> {
    const storage = await this.getStorage();
    await storage.set(this.sesionKey, usuario);
  }

  async limpiarSesion(): Promise<void> {
    const storage = await this.getStorage();
    await storage.remove(this.sesionKey);
  }

  private async getStorage(): Promise<Storage> {
    if (this.storageInstance) {
      return this.storageInstance;
    }

    return this.initPromise;
  }

  private async migrarDatosLegacy(storage: Storage): Promise<void> {
    await Promise.all([
      this.migrarPrescripciones(storage),
      this.migrarTomas(storage),
      this.migrarRelaciones(storage),
    ]);
  }

  private async migrarPrescripciones(storage: Storage): Promise<void> {
    const prescripciones = ((await storage.get(this.prescripcionesKey)) ?? []) as Partial<Prescripcion>[];
    const prescripcionesNormalizadas = prescripciones.map((prescripcion) => ({
      ...prescripcion,
      estado: prescripcion.estado ?? (prescripcion.activa === false ? 'anulada' : 'activa'),
      activa: prescripcion.activa ?? true,
      ocultaParaPaciente: prescripcion.ocultaParaPaciente ?? false,
    })) as Prescripcion[];

    if (JSON.stringify(prescripciones) !== JSON.stringify(prescripcionesNormalizadas)) {
      await storage.set(this.prescripcionesKey, prescripcionesNormalizadas);
    }
  }

  private async migrarTomas(storage: Storage): Promise<void> {
    const tomas = ((await storage.get(this.tomasKey)) ?? []) as Partial<Toma>[];
    const tomasNormalizadas = tomas.map((toma) => ({
      ...toma,
      fecha: toma.fecha ? new Date(toma.fecha) : new Date(),
      claveUnica: toma.claveUnica ?? construirClaveUnicaToma(toma.prescripcionId ?? '', toma.pacienteId ?? '', toma.fecha ?? new Date()),
    })) as Toma[];

    if (JSON.stringify(tomas) !== JSON.stringify(tomasNormalizadas)) {
      await storage.set(this.tomasKey, tomasNormalizadas);
    }
  }

  private async migrarRelaciones(storage: Storage): Promise<void> {
    const relaciones = ((await storage.get(this.relacionesKey)) ?? []) as Partial<MedicoPaciente>[];
    const relacionesNormalizadas = relaciones.map((relacion) => ({
      ...relacion,
      activo: relacion.activo ?? true,
    })) as MedicoPaciente[];

    if (JSON.stringify(relaciones) !== JSON.stringify(relacionesNormalizadas)) {
      await storage.set(this.relacionesKey, relacionesNormalizadas);
    }
  }
}
