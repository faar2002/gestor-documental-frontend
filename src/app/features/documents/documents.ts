import { Component, inject, OnInit, signal, ChangeDetectorRef, WritableSignal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DocumentService } from '../../core/services/document.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { DocumentItem } from '../../core/models/document.model';
import { User, UserUpdateRequest } from '../../core/models/user.model';

// Agrega estas variables dentro de tu DocumentsComponent


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
  private sanitizer = inject(DomSanitizer);

  currentUser = this.authService.currentUser;
  documents = signal<DocumentItem[]>([]);
  isLoading = signal<boolean>(false);

  // Estados del Modal de Previsualización
  showPreviewModal = signal<boolean>(false);
  previewUrl = signal<SafeResourceUrl | null>(null);
  previewDoc = signal<DocumentItem | null>(null);
  previewLoading = signal<boolean>(false);

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

  // Verifica si el rol activo del usuario es administrador
  isAdmin(): boolean {
    const roleName = this.currentUser()?.activeRole?.name;
    return roleName?.toLowerCase() === 'administrador';
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
  currentPage = signal<number>(0);
  pageSize = signal<number>(5);
  totalPages = signal<number>(0);
  totalElements = signal<number>(0);
  loadDocuments(page: number = 0): void {
    const user = this.currentUser();

    if (!user) {
      this.errorMessage.set('No se encontró información del usuario en sesión.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.currentPage.set(page);

    if (this.isAdmin()) {
      // Petición Administrador -> Paginada
      this.documentService.getAllDocuments(page, this.pageSize()).subscribe({
        next: (response) => {
          this.documents.set(response.content || []);
          this.totalPages.set(response.totalPages || 0);
          this.totalElements.set(response.totalElements || 0);
          this.isLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage.set(err.error?.message || 'Error al obtener los documentos.');
          this.isLoading.set(false);
          this.cdr.detectChanges();
        }
      });
    } else {
      // Petición Trabajador -> Paginada por email
      if (!user.email) {
        this.errorMessage.set('El usuario no posee correo para realizar la consulta.');
        this.isLoading.set(false);
        return;
      }

      this.documentService.searchDocuments(user.email, page, this.pageSize()).subscribe({
        next: (response) => {
          this.documents.set(response.content || []);
          this.totalPages.set(response.totalPages || 0);
          this.totalElements.set(response.totalElements || 0);
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
        a.download = doc.fileName;
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

  // Método para responder al cambio de tamaño de página desde el <select>
  onPageSizeChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const newSize = parseInt(selectElement.value, 10);
    
    this.pageSize.set(newSize);
    // Reiniciamos a la primera página (0) con el nuevo tamaño
    this.loadDocuments(0);
  }

  // Cambiar de página mediante los botones de la paginación
  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.loadDocuments(page);
    }
  }

  onPreview(doc: DocumentItem): void {
    this.previewDoc.set(doc);
    this.previewLoading.set(true);
    this.showPreviewModal.set(true);

    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        // Asignamos el MIME type si no viene configurado en el Blob
        const fileBlob = new Blob([blob], { type: doc.fileType || 'application/pdf' });
        const objectUrl = URL.createObjectURL(fileBlob);
        
        // Marcamos la URL como segura para Angular
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
        this.previewLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert('Error al obtener el archivo para previsualización.');
        this.closePreviewModal();
      }
    });
  }

  closePreviewModal(): void {
    this.showPreviewModal.set(false);
    this.previewUrl.set(null);
    this.previewDoc.set(null);
  }

  // Comprobar si el archivo es previsualizable (PDFs o Imágenes)
  isPreviewable(fileType: string): boolean {
    if (!fileType) return false;
    const type = fileType.toLowerCase();
    return type.includes('pdf') || type.includes('image') || type.includes('png') || type.includes('jpeg');
  }
}