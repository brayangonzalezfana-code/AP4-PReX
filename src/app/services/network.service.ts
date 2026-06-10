import { Injectable } from '@angular/core';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  isOnline: boolean = true;

  constructor() {
    this.initNetworkListener();
  }

  async initNetworkListener() {

    const status = await Network.getStatus();

    this.isOnline = status.connected;

    console.log(
      'Estado inicial:',
      this.isOnline
    );

    Network.addListener(
      'networkStatusChange',
      (status) => {

        console.log(
          'Estado de red:',
          status.connected
        );

        this.isOnline = status.connected;

        if (status.connected) {
          this.sincronizarDatos();
        }

      }
    );

  }

  sincronizarDatos() {

    const datosPendientes =
      localStorage.getItem('loginPendiente');

    if (datosPendientes) {

      console.log(
        'Sincronizando datos...',
        JSON.parse(datosPendientes)
      );

      localStorage.removeItem(
        'loginPendiente'
      );

      alert(
        '🟢 Conexión recuperada.\nDatos sincronizados correctamente.'
      );

    }

  }

  getNetworkStatus() {
    return this.isOnline;
  }

}