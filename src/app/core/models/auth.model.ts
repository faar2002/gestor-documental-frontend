export * from './user.model';
export * from './company.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Company {
  id: string;
  name: string;
  taxId: string;
}

export interface WorkGroup {
  id: string;
  name: string;
  description?: string;
  company?: Company | null;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  fullName: string;
  email: string;
  enabled: boolean;
  company?: Company;
  authorizedSystemCodes: string[];
  workGroups: WorkGroup[];
  roles?: Role[];
  activeRole?: Role;
}

export interface AuthResponse {
  message: string;
  user: User;
  token?: string; // Por si el backend incluye token en la cabecera o propiedad
}