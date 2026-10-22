import { createHash } from 'node:crypto';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import type { ImageStorage, StoredImage } from './image-storage.types.js';

/**
 * Cloudinary through its REST API (no SDK). Each request is signed:
 *   signature = sha1("key1=value1&key2=value2..." + apiSecret), keys sorted alphabetically,
 * so the API secret never leaves the server.
 */
@Injectable()
export class CloudinaryStorage implements ImageStorage {
  private readonly logger = new Logger(CloudinaryStorage.name);
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.cloudName = config.get('CLOUDINARY_CLOUD_NAME', { infer: true });
    this.apiKey = config.get('CLOUDINARY_API_KEY', { infer: true });
    this.apiSecret = config.get('CLOUDINARY_API_SECRET', { infer: true });
  }

  async upload(data: Buffer, options: { folder: string; maxSize?: number }): Promise<StoredImage> {
    const params: Record<string, string> = {
      folder: `kapra/${options.folder}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    // "Incoming transformation": Cloudinary shrinks big photos before storing them.
    if (options.maxSize)
      params.transformation = `c_limit,w_${options.maxSize},h_${options.maxSize}`;

    const form = new FormData();
    Object.entries(this.sign(params)).forEach(([key, value]) => form.append(key, value));
    form.append('file', new Blob([new Uint8Array(data)]));

    const body = await this.post('image/upload', form);
    return { url: String(body.secure_url), publicId: String(body.public_id) };
  }

  async remove(publicId: string): Promise<void> {
    const form = new FormData();
    const signed = this.sign({
      public_id: publicId,
      timestamp: String(Math.floor(Date.now() / 1000)),
    });
    Object.entries(signed).forEach(([key, value]) => form.append(key, value));
    try {
      await this.post('image/destroy', form);
    } catch (error) {
      // Deleting is best effort: a leftover file must not block deleting the record.
      this.logger.warn(`Could not delete ${publicId}: ${(error as Error).message}`);
    }
  }

  private sign(params: Record<string, string>): Record<string, string> {
    const toSign = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    const signature = createHash('sha1')
      .update(toSign + this.apiSecret)
      .digest('hex');
    return { ...params, api_key: this.apiKey, signature };
  }

  private async post(path: string, form: FormData): Promise<Record<string, unknown>> {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/${path}`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    const body = (await response.json()) as Record<string, unknown> & {
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Image storage failed: ${body.error?.message ?? response.status}`,
      );
    }
    return body;
  }
}
