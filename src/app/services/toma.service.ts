import { Injectable, inject } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

import { Toma } from '../interfaces/toma.interface';
import { construirClaveUnicaToma } from '../utils/clave-unica';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class TomaService {
  private readonly tomasKey = 'prex_tomas';
  private readonly storageService = inject(StorageService);
  private readonly storage = inject(Storage);

  generarClaveUnica(prescripcionId: string, pacienteId: string, fecha: Date | string): string {
    return construirClaveUnicaToma(prescripcionId, pacienteId, fecha);
  }

  async registrarToma(toma: Toma): Promise<void> {
    const tomas = await this.obtenerTomas();
    const claveUnica = toma.claveUnica || this.generarClaveUnica(toma.prescripcionId, toma.pacienteId, toma.fecha);
    const yaRegistrada = tomas.some((tomaRegistrada) => tomaRegistrada.claveUnica === claveUnica);

    if (yaRegistrada) {
      return;
    }

    await this.guardarTomas([...tomas, { ...toma, claveUnica }]);
  }

  async obtenerTomas(): Promise<Toma[]> {
    await this.storageService.init();
    const tomas = (await this.storage.get(this.tomasKey)) ?? [];

    return (tomas as Partial<Toma>[]).map((toma) => ({
      ...toma,
      fecha: toma.fecha ? new Date(toma.fecha) : new Date(),
      claveUnica: toma.claveUnica ?? this.generarClaveUnica(toma.prescripcionId ?? '', toma.pacienteId ?? '', toma.fecha ?? new Date()),
    })) as Toma[];
  }

  async obtenerTomasPorPaciente(pacienteId: string): Promise<Toma[]> {
    const tomas = await this.obtenerTomas();
    return tomas.filter((toma) => toma.pacienteId === pacienteId);
  }

  async obtenerTomaPorClave(claveUnica: string): Promise<Toma | null> {
    const tomas = await this.obtenerTomas();
    return tomas.find((toma) => toma.claveUnica === claveUnica) ?? null;
  }

  private async guardarTomas(tomas: Toma[]): Promise<void> {
    await this.storageService.init();
    await this.storage.set(this.tomasKey, tomas);
  }
}
