import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Accepts one JPEG, PNG or WebP image up to 8 MB, checked by its real content (magic bytes). */
export const imageFilePipe = () =>
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES }),
      new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
    ],
    exceptionFactory: () =>
      new BadRequestException('Upload a JPEG, PNG or WebP photo of up to 8 MB'),
  });
