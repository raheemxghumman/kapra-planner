export type UserRole = 'customer' | 'brand' | 'tailor' | 'admin';
export type UserStatus = 'active' | 'pending' | 'suspended';

/** Mirrors the User entity the API returns (password fields are never sent). */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  user: User;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput extends LoginInput {
  name: string;
  role: Exclude<UserRole, 'admin'>;
  phone?: string;
  city?: string;
}
