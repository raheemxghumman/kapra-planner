import { User } from '../../users/entities/user.entity.js';

export class AuthResponseDto {
  /** JWT to send as "Authorization: Bearer <token>". */
  accessToken: string;

  /** Seconds until the access token expires. */
  expiresIn: number;

  /** Single-use token for POST /auth/refresh. */
  refreshToken: string;

  user: User;
}
