import { handle_file } from '@gradio/client';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { callSpaceForImage } from './gradio-space.js';
import type { TryOnInput, TryOnProvider } from './tryon.types.js';

/**
 * IDM-VTON (yisol/IDM-VTON Space, free ZeroGPU). The main provider: keeps embroidery, prints,
 * colours and the person's face (about 30 s). Limitation: long kurtas come out at top length.
 */
@Injectable()
export class IdmVtonProvider implements TryOnProvider {
  readonly name = 'idm-vton';

  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  run(input: TryOnInput): Promise<Blob> {
    return callSpaceForImage(
      'yisol/IDM-VTON',
      '/tryon',
      {
        dict: { background: handle_file(input.person), layers: [], composite: null },
        garm_img: handle_file(input.garment),
        garment_des: input.description,
        is_checked: true, // let the Space build the clothing mask automatically
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      },
      this.config.get('HF_TOKEN', { infer: true }),
    );
  }
}
