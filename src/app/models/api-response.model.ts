export interface ApiResponseDTO<T> {
  timestamp: string;
  status: number;
  message: string;
  path: string;
  error: string | null;
  data: T;
}
