/**
 * SampleCache — IndexedDB-backed cache of raw WAV bytes.
 *
 * The first network fetch of a sample stores the bytes; subsequent loads
 * skip the network. `decodeAudioData` is then called once per session to
 * produce the playable AudioBuffer (held in SampleBank).
 */

import { hasSampleBytes, readSampleBytes, writeSampleBytes } from "@/lib/db";

/** Loads bytes from cache, or fetches over the network and caches. */
export async function loadSampleBytes(
  publicUrl: string,
  cacheKey: string,
): Promise<ArrayBuffer> {
  const cached = await readSampleBytes(cacheKey);
  if (cached) return cached;

  const res = await fetch(publicUrl, { cache: "force-cache" });
  if (!res.ok) {
    throw new Error(`Sample fetch failed (${res.status}): ${publicUrl}`);
  }
  const bytes = await res.arrayBuffer();
  // Persist a copy before decoding (decode neuters the source ArrayBuffer).
  await writeSampleBytes(cacheKey, bytes);
  return bytes;
}

/** Re-export hasSampleBytes for convenience. */
export { hasSampleBytes };
