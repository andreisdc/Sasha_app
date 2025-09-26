export interface AuthUser {
  username: string;
  email: string;
  phoneNumber?: string;
  token?: string;
  expiresAt?: string; // ISO string
  id?: string;        // user id
  firstName?: string;
  lastName?: string;
  rating?: number;
}