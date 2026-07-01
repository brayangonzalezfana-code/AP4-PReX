import { Injectable, inject } from '@angular/core';
import { Usuario } from '../interfaces/usuario.interface';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageService = inject(StorageService);

  async crearMedicoDemo(): Promise<void> {
    const usuarios = await this.storageService.obtenerUsuarios();
    const medicoDemoExiste = usuarios.some(
      (usuarioRegistrado) =>
        usuarioRegistrado.correo === 'doctor@prex.com' ||
        usuarioRegistrado.usuario === 'doctor'
    );

    if (medicoDemoExiste) {
      return;
    }

    const medicoDemo: Usuario = {
      id: Date.now().toString(),
      nombre: 'Doctor',
      apellido: 'Demo',
      correo: 'doctor@prex.com',
      usuario: 'doctor',
      password: '1234',
      rol: 'medico',
      fechaRegistro: new Date(),
      activo: true,
    };

    usuarios.push(medicoDemo);
    await this.storageService.guardarUsuarios(usuarios);
  }

  async crearAdminDemo(): Promise<void> {
    const usuarios = await this.storageService.obtenerUsuarios();
    const adminDemoExiste = usuarios.some(
      (usuarioRegistrado) =>
        usuarioRegistrado.correo === 'admin@prex.com' ||
        usuarioRegistrado.usuario === 'admin'
    );

    if (adminDemoExiste) {
      return;
    }

    const adminDemo: Usuario = {
      id: Date.now().toString(),
      nombre: 'Admin',
      apellido: 'PReX',
      correo: 'admin@prex.com',
      usuario: 'admin',
      password: '1234',
      rol: 'admin',
      fechaRegistro: new Date(),
      activo: true,
    };

    usuarios.push(adminDemo);
    await this.storageService.guardarUsuarios(usuarios);
  }

  async registrar(usuario: Usuario): Promise<boolean> {
    const usuarios = await this.storageService.obtenerUsuarios();
    const usuarioExiste = usuarios.some(
      (usuarioRegistrado) =>
        usuarioRegistrado.correo === usuario.correo ||
        usuarioRegistrado.usuario === usuario.usuario
    );

    if (usuarioExiste) {
      return false;
    }

    usuarios.push(usuario);
    await this.storageService.guardarUsuarios(usuarios);
    return true;
  }

  async crearMedico(datosMedico: {
    nombre: string;
    apellido: string;
    correo: string;
    usuario: string;
    password: string;
  }): Promise<boolean> {
    const medico: Usuario = {
      id: Date.now().toString(),
      nombre: datosMedico.nombre,
      apellido: datosMedico.apellido,
      correo: datosMedico.correo,
      usuario: datosMedico.usuario,
      password: datosMedico.password,
      rol: 'medico',
      fechaRegistro: new Date(),
      activo: true,
    };

    return this.registrar(medico);
  }

  async login(
    usuario: string,
    password: string
  ): Promise<Usuario | null> {
    const usuarios = await this.storageService.obtenerUsuarios();
    const usuarioEncontrado =
      usuarios.find(
        (usuarioRegistrado) =>
          usuarioRegistrado.usuario === usuario
      ) ?? null;

    if (
      !usuarioEncontrado ||
      usuarioEncontrado.password !== password ||
      !usuarioEncontrado.activo
    ) {
      await this.storageService.limpiarSesion();
      return null;
    }

    await this.storageService.guardarUsuarioActual(usuarioEncontrado);
    return usuarioEncontrado;
  }

  async logout(): Promise<void> {
    await this.storageService.limpiarSesion();
  }

  async getUsuarioActual(): Promise<Usuario | null> {
    return this.obtenerUsuarioActualValidado();
  }

  async obtenerUsuarioActualValidado(): Promise<Usuario | null> {
    const usuarioActual = await this.storageService.obtenerUsuarioActual();

    if (!usuarioActual) {
      return null;
    }

    const usuarios = await this.storageService.obtenerUsuarios();
    const usuarioVigente =
      usuarios.find((usuario) => usuario.id === usuarioActual.id) ?? null;

    if (
      !usuarioVigente ||
      !usuarioVigente.activo ||
      usuarioVigente.rol !== usuarioActual.rol
    ) {
      await this.storageService.limpiarSesion();
      return null;
    }

    await this.storageService.guardarUsuarioActual(usuarioVigente);
    return usuarioVigente;
  }

  async obtenerPacientes(): Promise<Usuario[]> {
    const usuarios = await this.storageService.obtenerUsuarios();
    return usuarios.filter(
      (usuario) => usuario.rol === 'paciente' && usuario.activo
    );
  }

  async obtenerMedicos(): Promise<Usuario[]> {
    const usuarios = await this.storageService.obtenerUsuarios();
    return usuarios.filter(
      (usuario) => usuario.rol === 'medico' && usuario.activo
    );
  }

  async obtenerUsuariosPorRol(rol: Usuario['rol']): Promise<Usuario[]> {
    const usuarios = await this.storageService.obtenerUsuarios();
    return usuarios.filter((usuario) => usuario.rol === rol);
  }

  async obtenerTodosPacientes(): Promise<Usuario[]> {
    return this.obtenerUsuariosPorRol('paciente');
  }

  async obtenerTodosMedicos(): Promise<Usuario[]> {
    return this.obtenerUsuariosPorRol('medico');
  }

  async cambiarEstadoUsuario(
    usuarioId: string,
    activo: boolean
  ): Promise<boolean> {
    const usuarios = await this.storageService.obtenerUsuarios();
    const usuario = usuarios.find(
      (usuarioRegistrado) => usuarioRegistrado.id === usuarioId
    );

    if (!usuario) {
      return false;
    }

    usuario.activo = activo;
    await this.storageService.guardarUsuarios(usuarios);
    return true;
  }
}
