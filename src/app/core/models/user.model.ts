export interface UserRequest {
  username: string;
  passwordHash: string;
  companyId?: number;
  workGroupId?: number;
  systemAccessIds?: number[];
}

export interface UserResponse {
  id: number;
  username: string;
  companyName?: string;
  workGroupName?: string;
  systemAccessNames?: string[];
}