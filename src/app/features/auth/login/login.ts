import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); // Inyectamos el detector de cambios

  credentials: LoginRequest = {
    email: '',
    password: ''
  };

  errorMessage: string = '';
  successMessage: string = ''; // Mensaje de éxito

  onSubmit(): void {
    if (this.credentials.email && this.credentials.password) {
      this.errorMessage = '';
      this.successMessage = '';

      this.authService.login(this.credentials).subscribe({
        next: (response) => {
          // Asignamos el mensaje "Inicio de sesión exitoso" del backend
          this.successMessage = response.message || 'Inicio de sesión exitoso';
          this.cdr.detectChanges();

          // Esperamos 1.5 segundos para que el usuario lo vea antes de redirigir
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 1500);
        },
        error: (err) => {
          if (err.error && err.error.message) {
            this.errorMessage = err.error.message;
          } else {
            this.errorMessage = 'Ocurrió un error al intentar iniciar sesión.';
          }
          this.cdr.detectChanges();
        }
      });
    }
  }
}