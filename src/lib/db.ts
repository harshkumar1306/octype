/**
 * IndexedDB helpers.
 *
 * Object stores:
 *   - "samples" : ArrayBuffer (raw, not-yet-decoded WAV bytes) keyed by filename.
 *   - "kv"      : misc small key/value entries (settings backups, etc.).
 *
 * We deliberately store the raw ArrayBuffer (not the decoded AudioBuffer).
 * AudioBuffer instances aren't structured-cloneable across browsers
 * consistently, but ArrayBuffers are. Decoding ~150KB WAVs is fast and lets
 * us keep memory bounded by clearing decoded buffers if desired later.
 */

const DB_NAME = "octype";
// Bumped to 2 to invalidate any cache entries created before sharp-character
// URL encoding was fixed. v1 may have stored bytes for partial / wrong URLs.
const DB_VERSION = 2;
const SAMPLES_STORE = "samples";
const KV_STORE = "kv";

let dbPromise: Promise<IDBDatabase> | null = null;

/** Opens (and lazily upgrades) the Octype IndexedDB database. Cached. */
export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // On any upgrade, wipe the samples store so we don't keep bytes from
      // earlier (possibly broken) URL schemes. Re-create fresh.
      if (db.objectStoreNames.contains(SAMPLES_STORE)) {
        db.deleteObjectStore(SAMPLES_STORE);
      }
      db.createObjectStore(SAMPLES_STORE);

      if (!db.objectStoreNames.contains(KV_STORE)) {
        db.createObjectStore(KV_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

/** Reads the raw bytes for a cached sample by filename. */
export async function readSampleBytes(
  filename: string,
): Promise<ArrayBuffer | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAMPLES_STORE, "readonly");
    const store = tx.objectStore(SAMPLES_STORE);
    const req = store.get(filename);
    req.onsuccess = () => {
      const value = req.result as ArrayBuffer | undefined;
      resolve(value ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Stores raw bytes for a sample. */
export async function writeSampleBytes(
  filename: string,
  bytes: ArrayBuffer,
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAMPLES_STORE, "readwrite");
    const store = tx.objectStore(SAMPLES_STORE);
    // Store a copy — the decoder later neuters the ArrayBuffer.
    const copy = bytes.slice(0);
    store.put(copy, filename);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** Returns whether a sample is already cached. */
export async function hasSampleBytes(filename: string): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SAMPLES_STORE, "readonly");
    const store = tx.objectStore(SAMPLES_STORE);
    const req = store.getKey(filename);
    req.onsuccess = () => resolve(req.result !== undefined);
    req.onerror = () => reject(req.error);
  });
}
