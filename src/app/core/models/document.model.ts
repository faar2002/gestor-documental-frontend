import { User } from './auth.model';

export interface DocumentItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploaderEmail: string;
  userEmaildb: string;
  companyID?: string;
  status?: string;
}

export interface DocumentSearchResponse {
  content: DocumentItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}