import { IsString, Length } from 'class-validator';

export class RefreshTokenDto {
  /** The refresh token received from login, register or the previous refresh. */
  @IsString()
  @Length(32, 128)
  refreshToken: string;
}
