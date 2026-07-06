/**
 * SampleCache — IndexedDB-backed cache of raw WAV bytes.
 *
 * The first network fetch of a sample stores the bytes; subsequent loads
 * skip the network. `decodeAudioData` is then called once per session to
 * produce the playable AudioBuffer (held in SampleBank).
 */

import { hasSampleBytes, readSampleBytes, writeSampleBytes } from "@/lib/db";
import { logger } from "@/lib/logger";

/** Loads bytes from cache, or fetches over the network and caches. */
export async function loadSampleBytes(
  publicUrl: string,
  cacheKey: string,
): Promise<ArrayBuffer> {
  let cached: ArrayBuffer | null = null;
  try {
    cached = await readSampleBytes(cacheKey);
  } catch (err) {
    logger.warn(`Failed to read sample from IndexedDB cache: ${cacheKey}`, err);
  }
  if (cached) return cached;

  // `cors` mode is required for cross-origin R2/CDN fetches; the bucket must
  // send Access-Control-Allow-Origin. `force-cache` lets the browser/SW reuse
  // a previously fetched copy.
  const res = await fetch(publicUrl, { cache: "force-cache", mode: "cors" });
  if (!res.ok) {
    throw new Error(`Sample fetch failed (${res.status}): ${publicUrl}`);
  }
  const bytes = await res.arrayBuffer();
  // Persist a copy before decoding (decode neuters the source ArrayBuffer).
  try {
    await writeSampleBytes(cacheKey, bytes);
  } catch (err) {
    logger.warn(`Failed to write sample to IndexedDB cache: ${cacheKey}`, err);
  }
  return bytes;
}

/** Re-export hasSampleBytes for convenience. */
export { hasSampleBytes };
