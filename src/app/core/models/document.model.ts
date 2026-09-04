export interface DocumentResponse {
  id: number;
  fileName: string;
  fileType: string;
  size: number;
  uploadDate: string;
  companyId?: number;
  workGroupId?: number;
}