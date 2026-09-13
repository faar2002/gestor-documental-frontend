import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Role, User } from '../../../core/models/auth.model';

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

  credentials = { email: '', password: '' };
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Estados para la selección de rol
  showRoleSelection = signal<boolean>(false);
  availableRoles = signal<Role[]>([]);
  selectedRoleId: string = '';
  tempUser: User | null = null;

  onLogin(): void {
    if (!this.credentials.email || !this.credentials.password) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const roles = res.user?.roles || [];

        if (roles.length > 1) {
          // Si tiene más de 1 rol, mostramos el paso de selección
          this.tempUser = res.user;
          this.availableRoles.set(roles);
          this.selectedRoleId = roles[0].id; // Asigna el primer rol por defecto
          this.showRoleSelection.set(true);
        } else {
          // Si solo tiene 1 rol o ninguno, navegamos directo
          this.router.navigate(['/documents']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Credenciales inválidas.');
      }
    });
  }

  onConfirmRole(): void {
    if (!this.selectedRoleId) {
      this.errorMessage.set('Por favor, selecciona un rol de la lista.');
      return;
    }

    // Buscamos el objeto del rol seleccionado
    const chosenRole = this.availableRoles().find(r => r.id === this.selectedRoleId);

    if (chosenRole) {
      // 1. Asignamos el rol activo en el AuthService y localStorage
      this.authService.setActiveRole(chosenRole);
      
      // 2. Redirigimos a la pantalla principal
      this.router.navigate(['/documents']).then((navigated) => {
        if (!navigated) {
          console.error('No se pudo redirigir a /documents');
        }
      });
    } else {
      this.errorMessage.set('El rol seleccionado no es válido.');
    }
  }
}