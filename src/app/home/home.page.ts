import { Component } from '@angular/core';

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';

import { FormsModule } from '@angular/forms';

import { NetworkService } from '../services/network.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonButton,
    FormsModule
  ],
})
export class HomePage {

  usuario: string = '';
  password: string = '';

  constructor(
    public networkService: NetworkService
  ) {}

  ingresar() {

    const datos = {
      usuario: this.usuario,
      fecha: new Date()
    };

    if (this.networkService.isOnline) {

      console.log(
        'Datos enviados al servidor',
        datos
      );

      alert(
        '🟢 Conectado.\nDatos enviados correctamente.'
      );

    } else {

      localStorage.setItem(
        'loginPendiente',
        JSON.stringify(datos)
      );

      alert(
        '🔴 Modo Offline.\nDatos guardados localmente.'
      );

    }

  }

}