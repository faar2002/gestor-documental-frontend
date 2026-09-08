import { Company } from './company.model';

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface WorkGroup {
  id: string;
  name: string;
  description?: string;
  company?: Company;
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
  authorizedSystemCodes?: string[];
  workGroups?: WorkGroup[];
  roles?: Role[];
}

export interface UserUpdateRequest {
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  password?: string;
  enabled: boolean;
  companyId: string;
  systemIds: string[];
  workGroupIds: string[];
  roleIds: string[];
}