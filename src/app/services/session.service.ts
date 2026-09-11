import { Injectable, signal } from '@angular/core';
import { Usuario } from '../models/usuario.model';

const SESSION_KEY = 'ayudaya_user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private usuario = signal<Usuario | null>(this.cargar());

  getUser(): Usuario | null {
    return this.usuario();
  }

  setUser(user: Usuario, remember = true) {
    const target = remember ? localStorage : sessionStorage;
    target.setItem(SESSION_KEY, JSON.stringify(user));
    this.usuario.set(user);
  }

  clearUser() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    this.usuario.set(null);
  }

  isLoggedIn(): boolean {
    return this.usuario() !== null;
  }

  esAdmin(): boolean {
    return this.usuario()?.nombreRol === 'Administrador';
  }

  private cargar(): Usuario | null {
    const rawStorage = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return rawStorage ? JSON.parse(rawStorage) : null;
  }
}