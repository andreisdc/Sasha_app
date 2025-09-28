export interface LoginResponse {
  // TODO: Modificat bazat pe strucutra raspunsului din backend!!

  success: boolean;
  message: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  token?: string;
}
