import {
  importProvidersFrom,
  inject,
  isDevMode,
  provideAppInitializer,
} from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { IonicStorageModule } from '@ionic/storage-angular';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AuthService } from './app/services/auth.service';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    importProvidersFrom(IonicStorageModule.forRoot()),
    provideAppInitializer(async () => {
      if (!isDevMode()) {
        return;
      }

      const authService = inject(AuthService);
      await authService.crearMedicoDemo();
      await authService.crearAdminDemo();
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
