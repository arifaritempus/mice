export type JsonValue = any;

export function jsonParseSafe<T = JsonValue>(raw: string | null, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function lsGet<T = JsonValue>(key: string, fallback: T): T {
  try { return jsonParseSafe<T>(storage.getItem(key), fallback); } catch { return fallback; }
}

export function lsSet(key: string, value: JsonValue): void {
  try { storage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export function lsRemove(key: string): void {
  try { storage.removeItem(key); } catch { /* ignore */ }
}

// Supabase-only politika: client-side kalici storage kullanmayiz.
// Bu katman eski kodlari kirilmadan no-op olarak calistirmak icin var.
export const storage = {
  getItem(key: string): string | null {
    void key;
    return null;
  },
  setItem(key: string, value: string): void {
    void key;
    void value;
  },
  removeItem(key: string): void {
    void key;
  },
};
