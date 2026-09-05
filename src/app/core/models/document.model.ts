import { User } from './auth.model';

export interface DocumentItem {
  id: string;
  originalName: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  email: string;
  status: string;
}

export interface DocumentSearchResponse {
  content: DocumentItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}