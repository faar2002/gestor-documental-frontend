import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../core/services/document.service';
import { AuthService } from '../../core/services/auth.service';
import { DocumentItem } from '../../core/models/document.model';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents.html',
  styleUrl: './documents.scss'
})
export class DocumentsComponent implements OnInit {
  private documentService = inject(DocumentService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  currentUser = this.authService.currentUser;

  documents = signal<DocumentItem[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  
  // Archivo seleccionado por el usuario
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.loadDocuments();
  }

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
        this.loadDocuments(); // Recarga la lista de documentos
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
