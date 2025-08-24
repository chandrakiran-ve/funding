// Simple in-memory cache for Google Sheets data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const dataCache = new DataCache();

// Cache keys
export const CACHE_KEYS = {
  FUNDERS: 'funders',
  STATES: 'states', 
  SCHOOLS: 'schools',
  CONTRIBUTIONS: 'contributions',
  STATE_TARGETS: 'state_targets',
  PROSPECTS: 'prospects',
  USERS: 'users'
} as const;

// Helper function to get cached data or fetch fresh
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMinutes: number = 5
): Promise<T> {
  // Try to get from cache first
  const cached = dataCache.get<T>(key);
  if (cached !== null) {
    console.log(`📦 Cache HIT for ${key}`);
    return cached;
  }
  
  console.log(`🔄 Cache MISS for ${key}, fetching fresh data`);
  
  // Fetch fresh data
  try {
    const data = await fetchFn();
    dataCache.set(key, data, ttlMinutes);
    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${key}:`, error);
    throw error;
  }
}
