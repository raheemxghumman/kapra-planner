import { Client } from '@gradio/client';

/** Calls a Hugging Face Space endpoint and downloads the first image it returns. */
export async function callSpaceForImage(
  space: string,
  endpoint: string,
  payload: Record<string, unknown>,
  token: string,
): Promise<Blob> {
  const client = await Client.connect(space, { token: token as `hf_${string}` });
  const result = await client.predict(endpoint, payload);
  const [first] = result.data as ({ url?: string } | null)[];
  if (!first?.url) throw new Error(`${space} returned no image`);

  const response = await fetch(first.url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok)
    throw new Error(`Could not download the result from ${space} (${response.status})`);
  return response.blob();
}
