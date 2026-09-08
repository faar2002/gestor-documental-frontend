import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, User } from '../models/auth.model';

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
        }
      })
    );
  }

  // Método centralizado para actualizar el usuario en memoria y en localStorage
  setCurrentUser(user: User): void {
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
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  }
}