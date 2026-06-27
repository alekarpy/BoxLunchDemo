/**
 * Hook to manage local cache of user photos.
 * Stores photo URLs in localStorage for persistence between sessions.
 * Includes expiration logic and automatic cleanup.
 */

const CACHE_KEY = 'user-photos-cache';
const CACHE_VERSION = 2; // Incremented to force cleanup
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 2000; // Incremented to support ~1,430 users

interface CacheEntry {
  /** Photo URL */
  url: string;
  /** Timestamp when cached */
  cachedAt: number;
}

interface PhotoCache {
  /** Cache version for invalidation */
  version: number;
  /** Map of normalized email -> cache entry */
  entries: Record<string, CacheEntry>;
  /** Last cleanup timestamp */
  lastCleanup: number;
}

/**
 * Normalizes email to use as a cache key.
 * Converts to lowercase and removes spaces.
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Retrieves the current cache from localStorage.
 * If it doesn't exist or is corrupted, returns an empty cache.
 */
function getCache(): PhotoCache {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) {
      return createEmptyCache();
    }

    const cache = JSON.parse(stored) as PhotoCache;

    // Verify cache version
    if (cache.version !== CACHE_VERSION) {
      return createEmptyCache();
    }

    return cache;
  } catch {
    // Start with empty cache if parse error occurs
    return createEmptyCache();
  }
}

/**
 * Creates an empty cache with initial structure.
 */
function createEmptyCache(): PhotoCache {
  return {
    version: CACHE_VERSION,
    entries: {},
    lastCleanup: Date.now(),
  };
}

/**
 * Saves the cache to localStorage.
 */
function saveCache(cache: PhotoCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    // If it fails (e.g. localStorage full), clean old entries and retry
    console.warn('[PhotoCache] Error al guardar la caché, limpiando entradas antiguas...', error);
    cleanupOldEntries(cache, Math.floor(MAX_CACHE_ENTRIES / 2));
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Clear entire cache if it continues to fail
      clearPhotoCache();
    }
  }
}

/**
 * Cleans up old cache entries.
 * @param cache - The cache to clean up
 * @param maxEntries - Maximum number of entries to keep
 */
function cleanupOldEntries(cache: PhotoCache, maxEntries: number): void {
  const entries = Object.entries(cache.entries);

  if (entries.length <= maxEntries) {
    return;
  }

  // Sort by timestamp (oldest first)
  const sorted = entries.sort(([, a], [, b]) => a.cachedAt - b.cachedAt);

  // Keep only the most recent entries
  const toKeep = sorted.slice(-maxEntries);
  cache.entries = Object.fromEntries(toKeep);
  cache.lastCleanup = Date.now();
}

/**
 * Cleans up expired cache entries.
 * @param cache - The cache to clean up
 */
function cleanupExpiredEntries(cache: PhotoCache): void {
  const now = Date.now();
  const newEntries: Record<string, CacheEntry> = {};

  for (const [key, entry] of Object.entries(cache.entries)) {
    if (now - entry.cachedAt < CACHE_TTL_MS) {
      newEntries[key] = entry;
    }
  }

  cache.entries = newEntries;
  cache.lastCleanup = now;
}

/**
 * Retrieves a photo from cache by email.
 * @param email - User email
 * @returns Photo URL or undefined if not cached or expired
 */
export function getCachedPhoto(email: string | undefined | null): string | undefined {
  if (!email) return undefined;

  const cache = getCache();
  const normalizedEmail = normalizeEmail(email);
  const entry = cache.entries[normalizedEmail];

  if (!entry) return undefined;

  // Check if entry expired
  const now = Date.now();
  if (now - entry.cachedAt >= CACHE_TTL_MS) {
    // Expired entry, remove it
    delete cache.entries[normalizedEmail];
    saveCache(cache);
    return undefined;
  }

  return entry.url;
}

/**
 * Saves a photo in the cache.
 * @param email - User email
 * @param photoUrl - Photo URL
 */
export function setCachedPhoto(email: string | undefined | null, photoUrl: string | undefined | null): void {
  if (!email || !photoUrl) return;

  const cache = getCache();
  const normalizedEmail = normalizeEmail(email);

  cache.entries[normalizedEmail] = {
    url: photoUrl,
    cachedAt: Date.now(),
  };

  // Clean up entries if limit exceeded
  if (Object.keys(cache.entries).length > MAX_CACHE_ENTRIES) {
    cleanupOldEntries(cache, MAX_CACHE_ENTRIES);
  }

  saveCache(cache);
}

/**
 * Saves multiple photos in cache at once.
 * More efficient than calling setCachedPhoto multiple times.
 * @param entries - Array of [email, photoUrl]
 */
export function setCachedPhotos(entries: Array<[string, string]>): void {
  if (entries.length === 0) return;

  const cache = getCache();
  const now = Date.now();

  for (const [email, photoUrl] of entries) {
    if (email && photoUrl) {
      const normalizedEmail = normalizeEmail(email);
      cache.entries[normalizedEmail] = {
        url: photoUrl,
        cachedAt: now,
      };
    }
  }

  // Clean up entries if limit exceeded
  if (Object.keys(cache.entries).length > MAX_CACHE_ENTRIES) {
    cleanupOldEntries(cache, MAX_CACHE_ENTRIES);
  }

  saveCache(cache);
}

/**
 * Retrieves multiple photos from cache.
 * @param emails - Array of emails
 * @returns Map of normalized email -> photo URL
 */
export function getCachedPhotos(emails: string[]): Map<string, string> {
  const cache = getCache();
  const now = Date.now();
  const result = new Map<string, string>();
  let hasExpired = false;

  for (const email of emails) {
    if (!email) continue;

    const normalizedEmail = normalizeEmail(email);
    const entry = cache.entries[normalizedEmail];

    if (entry) {
      if (now - entry.cachedAt < CACHE_TTL_MS) {
        result.set(normalizedEmail, entry.url);
      } else {
        // Mark for cleanup
        delete cache.entries[normalizedEmail];
        hasExpired = true;
      }
    }
  }

  // Save if changes occurred
  if (hasExpired) {
    saveCache(cache);
  }

  return result;
}

/**
 * Clears entire photo cache.
 */
export function clearPhotoCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors during clear
  }
}

/**
 * Executes periodic cache cleanup.
 * Call occasionally to keep cache clean.
 */
export function runPhotoCacheCleanup(): void {
  const cache = getCache();
  const now = Date.now();

  // Only clean if more than 1 hour has passed since last cleanup
  const oneHour = 60 * 60 * 1000;
  if (now - cache.lastCleanup < oneHour) {
    return;
  }

  cleanupExpiredEntries(cache);
  saveCache(cache);
}

/**
 * Retrieves cache statistics (for debugging).
 */
export function getPhotoCacheStats(): {
  entryCount: number;
  oldestEntry: number | null;
  newestEntry: number | null;
  cacheSize: string;
} {
  const cache = getCache();
  const entries = Object.values(cache.entries);

  let oldestEntry: number | null = null;
  let newestEntry: number | null = null;

  for (const entry of entries) {
    if (oldestEntry === null || entry.cachedAt < oldestEntry) {
      oldestEntry = entry.cachedAt;
    }
    if (newestEntry === null || entry.cachedAt > newestEntry) {
      newestEntry = entry.cachedAt;
    }
  }

  // Calculate approximate size
  let cacheSize = '0 KB';
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const bytes = new Blob([stored]).size;
      cacheSize = bytes > 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${bytes} bytes`;
    }
  } catch {
    // Ignore
  }

  return {
    entryCount: entries.length,
    oldestEntry,
    newestEntry,
    cacheSize,
  };
}

/**
 * Clears ALL caches related to Users_List.
 * Forces a complete reload from the backend.
 */
export function clearAllUsersListCache(): void {
  try {
    // Clear photo cache
    localStorage.removeItem(CACHE_KEY);

    // Clear any other user list cache
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('users') ||
        key.includes('Users') ||
        key.includes('photo') ||
        key.includes('Photo')
      )) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }

    console.log('[PhotoCache] Caché borrada por completo. Claves eliminadas.', keysToRemove.length);
  } catch (error) {
    console.error('[PhotoCache] Error al borrar la caché:', error);
  }
}
