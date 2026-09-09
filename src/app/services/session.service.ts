import { Injectable } from '@angular/core';

const SESSION_KEY = 'ayudaya_user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  getUser() {
    const rawStorage = localStorage.getItem(SESSION_KEY) ?? sessionStorage.getItem(SESSION_KEY);
    return rawStorage ? JSON.parse(rawStorage) : null;
  }

  setUser(user: any, remember = true) {
    const target = remember ? localStorage : sessionStorage;
    target.setItem(SESSION_KEY, JSON.stringify(user));
  }

  clearUser() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  isLoggedIn(): boolean {
    return this.getUser() !== null;
  }
}