import { http } from './http';

export interface HealthStatus {
  status: 'ok';
  database: 'up';
  uptimeSeconds: number;
}

export async function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const { data } = await http.get<HealthStatus>('/health', { signal });
  return data;
}
