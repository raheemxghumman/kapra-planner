import { plainToInstance, Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/** Turns "a, b ,c" into ["a", "b", "c"] so several API keys can live in one variable. */
const toList = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : value;

/**
 * Every environment variable the API needs, validated at startup.
 * If one is missing or invalid the app refuses to start, so problems show up
 * immediately instead of in the middle of a demo.
 */
export class EnvironmentVariables {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 3000;

  @IsString()
  DATABASE_URL: string;

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  DATABASE_SSL = false;

  @IsUrl({ require_tld: false })
  WEB_ORIGIN: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @Transform(toList)
  @ArrayNotEmpty()
  @IsString({ each: true })
  GROQ_API_KEYS: string[];

  @Transform(toList)
  @ArrayNotEmpty()
  @IsString({ each: true })
  GEMINI_API_KEYS: string[];

  @IsString()
  HF_TOKEN: string;

  @IsString()
  STRIPE_SECRET_KEY: string;

  @IsString()
  STRIPE_WEBHOOK_SECRET = '';

  @IsString()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  CLOUDINARY_API_KEY: string;

  @IsString()
  CLOUDINARY_API_SECRET: string;

  @IsString()
  @MinLength(16)
  JOBS_SECRET: string;

  @IsString()
  NOMINATIM_USER_AGENT: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: false });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => `${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    throw new Error(`Invalid environment variables:\n  ${details}`);
  }
  return env;
}
