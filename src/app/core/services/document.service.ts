import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentResponse } from '../models/document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = '/api/documents';

  constructor(private http: HttpClient) {}

  uploadDocument(file: File, companyId?: number, workGroupId?: number): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (companyId) formData.append('companyId', companyId.toString());
    if (workGroupId) formData.append('workGroupId', workGroupId.toString());

    return this.http.post<DocumentResponse>(`${this.apiUrl}/upload`, formData);
  }

  downloadDocument(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/download/${id}`, { responseType: 'blob' });
  }

  getAll(): Observable<DocumentResponse[]> {
    return this.http.get<DocumentResponse[]>(this.apiUrl);
  }
}