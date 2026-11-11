import { handle_file } from '@gradio/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { callSpaceForImage } from './gradio-space.js';
import type { GarmentType, TryOnInput, TryOnProvider } from './tryon.types.js';

const CATEGORY: Record<GarmentType, 'tops' | 'bottoms' | 'one-pieces'> = {
  upper: 'tops',
  lower: 'bottoms',
  full: 'one-pieces',
};

/**
 * FASHN VTON v1.5 (fashn-ai/fashn-vton-1.5 Space, free ZeroGPU; open source, Apache-2.0).
 * The first choice: the most realistic open model (keeps the person's face, pose and light,
 * handles full-length garments), about 30 s. It works from the product photo of a model, and
 * needs no clothing mask ("segmentation-free").
 */
@Injectable()
export class FashnProvider implements TryOnProvider {
  readonly name = 'fashn-vton-1.5';

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  run(input: TryOnInput): Promise<Blob> {
    return callSpaceForImage(
      'fashn-ai/fashn-vton-1.5',
      '/try_on',
      {
        person_image: handle_file(input.person),
        garment_image: handle_file(input.garment),
        category: CATEGORY[input.garmentType],
        garment_photo_type: 'model',
        num_timesteps: 30,
        guidance_scale: 1.5,
        seed: 42,
        segmentation_free: true,
      },
      this.config.get('HF_TOKEN', { infer: true }),
    );
  }
}
