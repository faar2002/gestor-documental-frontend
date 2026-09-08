import { Component, inject, OnInit, signal, ChangeDetectorRef, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../core/services/document.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { DocumentItem } from '../../core/models/document.model';
import { User, UserUpdateRequest } from '../../core/models/user.model';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './documents.html',
  styleUrl: './documents.scss'
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  private userService = inject(UserService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  currentUser = this.authService.currentUser;

  documents = signal<DocumentItem[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  selectedFile: File | null = null;

  // Modales
  showProfileModal: boolean = false;
  showEditModal: boolean = false;

  // Formulario Editable de Usuario
  editUserForm = {
    firstName: '',
    middleName: '',
    lastName: '',
    secondLastName: '',
    password: ''
  };

  ngOnInit(): void {
    this.loadDocuments();
  }

  // --- Modales de Perfil y Edición ---
  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  openEditModal(): void {
    const user = this.currentUser();
    if (user) {
      this.editUserForm = {
        firstName: user.firstName || '',
        middleName: user.middleName || '',
        lastName: user.lastName || '',
        secondLastName: user.secondLastName || '',
        password: ''
      };
      this.showProfileModal = false;
      this.showEditModal = true;
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

  onSaveUser(): void {
    const user = this.currentUser();
    if (!user || !user.company?.id) {
      this.errorMessage.set('Datos de usuario incompletos para actualizar.');
      return;
    }

    const payload: UserUpdateRequest = {
      firstName: this.editUserForm.firstName,
      middleName: this.editUserForm.middleName,
      lastName: this.editUserForm.lastName,
      secondLastName: this.editUserForm.secondLastName,
      email: user.email,
      password: this.editUserForm.password ? this.editUserForm.password : undefined,
      enabled: user.enabled,
      companyId: user.company.id,
      systemIds: user.authorizedSystemCodes || [],
      workGroupIds: user.workGroups?.map(g => g.id) || [],
      roleIds: user.roles?.map(r => r.id) || []
    };

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.userService.updateUser(user.email, user.company.id, payload).subscribe({
      next: (updatedUser) => {
        // Solución al error de compilación: Casteo explícito a WritableSignal
        (this.authService.currentUser as WritableSignal<User | null>).set(updatedUser);
        
        this.isLoading.set(false);
        this.showEditModal = false;
        this.successMessage.set('Perfil actualizado exitosamente.');
        setTimeout(() => this.successMessage.set(''), 4000);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al actualizar el perfil.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  // --- Gestión de Documentos ---
  loadDocuments(): void {
    const email = this.currentUser()?.email;

    if (!email) {
      this.errorMessage.set('No se encontró información del usuario en sesión.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.documentService.searchDocuments(email).subscribe({
      next: (response) => {
        this.documents.set(response.content);
        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al obtener los documentos.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onUpload(): void {
    const email = this.currentUser()?.email;

    if (!this.selectedFile || !email) {
      this.errorMessage.set('Selecciona un archivo válido e inicia sesión.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.documentService.uploadDocument(this.selectedFile, email).subscribe({
      next: () => {
        this.selectedFile = null;
        this.loadDocuments();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error al subir el archivo.');
        this.isLoading.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  onDownload(doc: DocumentItem): void {
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.originalName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => alert('Error al descargar el archivo.')
    });
  }

  onDelete(id: string): void {
    if (confirm('¿Estás seguro de eliminar este documento?')) {
      this.documentService.deleteDocument(id).subscribe({
        next: () => this.loadDocuments(),
        error: () => alert('No se pudo eliminar el documento.')
      });
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}