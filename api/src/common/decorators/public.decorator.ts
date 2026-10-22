import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marks a route as open to everyone. Every other route requires a valid access token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
