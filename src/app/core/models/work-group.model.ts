export interface WorkGroupRequest {
  name: string;
  description?: string;
  companyId: number;
}

export interface WorkGroup {
  id: number;
  name: string;
  description?: string;
  companyId: number;
}