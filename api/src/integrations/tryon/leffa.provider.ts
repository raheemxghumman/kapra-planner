import { handle_file } from '@gradio/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { callSpaceForImage } from './gradio-space.js';
import type { GarmentType, TryOnInput, TryOnProvider } from './tryon.types.js';

const GARMENT: Record<GarmentType, { model: 'viton_hd' | 'dress_code'; type: string }> = {
  upper: { model: 'viton_hd', type: 'upper_body' },
  lower: { model: 'dress_code', type: 'lower_body' },
  // The "dresses" mask covers the body to the knees, which suits long kurtas and suits.
  full: { model: 'dress_code', type: 'dresses' },
};

/**
 * Leffa (franciszzj/Leffa Space, free ZeroGPU). The fallback when IDM-VTON is busy or out of
 * quota. Weaker when the garment photo shows a whole model, so it is not the first choice.
 */
@Injectable()
export class LeffaProvider implements TryOnProvider {
  readonly name = 'leffa';

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  run(input: TryOnInput): Promise<Blob> {
    const garment = GARMENT[input.garmentType];
    return callSpaceForImage(
      'franciszzj/Leffa',
      '/leffa_predict_vt',
      {
        src_image_path: handle_file(input.person),
        ref_image_path: handle_file(input.garment),
        ref_acceleration: false,
        step: 30,
        scale: 2.5,
        seed: 42,
        vt_model_type: garment.model,
        vt_garment_type: garment.type,
        vt_repaint: false,
      },
      this.config.get('HF_TOKEN', { infer: true }),
    );
  }
}
