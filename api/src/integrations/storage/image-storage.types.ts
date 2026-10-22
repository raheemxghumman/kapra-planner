export const IMAGE_STORAGE = Symbol('IMAGE_STORAGE');

export interface StoredImage {
  url: string;
  /** Id used to delete the image later. */
  publicId: string;
}

/** Where uploaded and generated images live. Bound to Cloudinary in StorageModule. */
export interface ImageStorage {
  upload(data: Buffer, options: { folder: string; maxSize?: number }): Promise<StoredImage>;
  remove(publicId: string): Promise<void>;
}
