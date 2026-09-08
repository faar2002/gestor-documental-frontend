import { Injectable, inject, signal, WritableSignal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserUpdateRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/users';

  updateUser(email: string, companyId: string, payload: UserUpdateRequest): Observable<User> {
    const params = new HttpParams()
      .set('email', email)
      .set('companyId', companyId);

    return this.http.put<User>(this.apiUrl, payload, { params });
  }
}