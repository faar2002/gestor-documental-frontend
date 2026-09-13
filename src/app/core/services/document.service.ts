import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentSearchResponse } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/documents';

  // Endpoint de Administrador paginado
  getAllDocuments(page: number = 0, size: number = 10): Observable<DocumentSearchResponse> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);
      
    return this.http.get<DocumentSearchResponse>(this.apiUrl, { params });
  }
  
  searchDocuments(
    email: string,
    page: number = 0,
    size: number = 5,
    sortBy: string = 'uploadedAt',
    direction: string = 'desc'
  ): Observable<DocumentSearchResponse> {
    const params = new HttpParams()
      .set('email', email)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('direction', direction);

    return this.http.get<DocumentSearchResponse>(`${this.apiUrl}/search`, { params });
  }

  // Método para subir archivo con form-data (file + email)
  uploadDocument(file: File, email: string): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    return this.http.post<Document>(`${this.apiUrl}/upload`, formData);
  }

  downloadDocument(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, { responseType: 'blob' });
  }

  deleteDocument(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}