import { Global, Module } from '@nestjs/common';
import { CloudinaryStorage } from './cloudinary.storage.js';
import { IMAGE_STORAGE } from './image-storage.types.js';

/** Binds IMAGE_STORAGE to Cloudinary. Global so any feature module can store images. */
@Global()
@Module({
  providers: [{ provide: IMAGE_STORAGE, useClass: CloudinaryStorage }],
  exports: [IMAGE_STORAGE],
})
export class StorageModule {}
