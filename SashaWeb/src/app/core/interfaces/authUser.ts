export interface AuthUser {
  id?: string;              // user id
  username: string;
  email: string;
  phoneNumber?: string;
  token?: string;
  expiresAt?: string;       // ISO string
  firstName?: string;
  lastName?: string;
  rating?: number;
  profilePicture?: string;  // data URL sau URL imagine
  isSeller?: boolean;       // adaugă aici
}
