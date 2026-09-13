import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, User, Role } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/v1/auth';

  // Señal Writable principal inicializada desde localStorage
  public currentUser: WritableSignal<User | null> = signal<User | null>(this.getUserFromStorage());
  
  // Estado reactivo que indica si hay una sesión activa
  public isAuthenticated = computed(() => !!this.currentUser());

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.user) {
          // Guardar usuario y token
          this.setCurrentUser(res.user);

          if (res.token) {
            localStorage.setItem('token', res.token);
          }

          // Asignación explícita: si tiene un solo rol, ese será su rol activo
          if (res.user.roles && res.user.roles.length === 1) {
            res.user.activeRole = res.user.roles[0];
          }

          this.setCurrentUser(res.user);
        }
      })
    );
  }

  // Establecer o cambiar el rol activo del usuario
  setActiveRole(role: Role): void {
    const user = this.currentUser();
    if (user) {
      user.activeRole = role;
      this.setCurrentUser(user);
    }
  }

  // Método centralizado para actualizar el usuario en memoria y en localStorage
  setCurrentUser(user: User): void {
    // Si el usuario no tiene rol activo definido pero posee un único rol en su lista, se le asigna por defecto
    if (!user.activeRole && user.roles && user.roles.length === 1) {
      user.activeRole = user.roles[0];
    }

    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout(): void {
    localStorage.clear();
    this.currentUser.set(null);
    window.location.href = '/login';
  }

  getUser(): User | null {
    return this.currentUser();
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    try {
      if (!userJson) return null;
      
      const user: User = JSON.parse(userJson);
      
      // Respaldo de seguridad al recargar la página: si solo tiene 1 rol y no hay activeRole, se le asigna
      if (!user.activeRole && user.roles && user.roles.length === 1) {
        user.activeRole = user.roles[0];
      }

      return user;
    } catch (e) {
      return null;
    }
  }
}