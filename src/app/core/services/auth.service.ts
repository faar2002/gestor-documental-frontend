import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, AuthResponse, User } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/v1/auth';

  // Señal reactiva para mantener la información del usuario en memoria
  private userSignal = signal<User | null>(this.getUserFromStorage());
  
  // Estado reactivo que indica si hay una sesión activa
  public isAuthenticated = computed(() => !!this.userSignal());
  
  // Acceso de solo lectura a los datos del usuario actual
  public currentUser = computed(() => this.userSignal());

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        if (res.user) {
          // Persistir el usuario en localStorage
          localStorage.setItem('user', JSON.stringify(res.user));
          
          // Si tu respuesta incluye un token explícito:
          if (res.token) {
            localStorage.setItem('token', res.token);
          }
          
          // Actualizar el estado global
          this.userSignal.set(res.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.clear();
    this.userSignal.set(null);
  }

  getUser(): User | null {
    return this.userSignal();
  }

  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
}