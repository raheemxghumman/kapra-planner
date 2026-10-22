import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { EnvironmentVariables } from '../../config/env.validation.js';
import { GeocodeCache } from './geocode-cache.entity.js';
import type { Geocoder, Place } from './geocoder.types.js';

/** Nominatim's usage policy: at most one request per second. */
const MIN_GAP_MS = 1_100;

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * OpenStreetMap Nominatim (free, no key). Following its usage policy we send an identifying
 * User-Agent, space requests at least 1.1 s apart (requests wait their turn in a queue) and
 * cache every answer in PostgreSQL.
 */
@Injectable()
export class NominatimGeocoder implements Geocoder {
  private readonly userAgent: string;
  /** Each request waits for the previous one; this promise is the end of the queue. */
  private queue: Promise<unknown> = Promise.resolve();
  private lastRequestAt = 0;

  constructor(
    config: ConfigService<EnvironmentVariables, true>,
    @InjectRepository(GeocodeCache) private readonly cache: Repository<GeocodeCache>,
  ) {
    this.userAgent = config.get('NOMINATIM_USER_AGENT', { infer: true });
  }

  async search(query: string, limit = 5): Promise<Place[]> {
    const key = query.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
    if (!key) return [];

    const cached = await this.cache.findOneBy({ query: key });
    if (cached) return cached.places.slice(0, limit);

    const places = await this.enqueue(() => this.fetchPlaces(key));
    await this.cache.upsert({ query: key, places }, ['query']);
    return places.slice(0, limit);
  }

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const wait = this.lastRequestAt + MIN_GAP_MS - Date.now();
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this.lastRequestAt = Date.now();
      return task();
    });
    this.queue = run.catch(() => undefined); // one failure must not block the queue
    return run;
  }

  private async fetchPlaces(query: string): Promise<Place[]> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      countrycodes: 'pk',
      limit: '5',
    }).toString();

    const response = await fetch(url, {
      headers: { 'User-Agent': this.userAgent, 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new ServiceUnavailableException('Map search is unavailable right now');

    const results = (await response.json()) as NominatimResult[];
    return results.map((result) => ({
      lat: Number(result.lat),
      lng: Number(result.lon),
      label: result.display_name.split(',').slice(0, 3).join(',').trim(),
    }));
  }
}
