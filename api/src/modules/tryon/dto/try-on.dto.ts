import { IsUUID } from 'class-validator';

export class CreateTryOnDto {
  @IsUUID()
  photoId: string;

  @IsUUID()
  productId: string;
}
