// ─── Storage Key Configuration ──────────────────────────────────────

export const STORAGE_KEYS = {
  FUNDS: "madni_funds",
  DONORS: "madni_donors",
  DONATIONS: "madni_donations",
  EXPENSES: "madni_expenses",
  CONSTRUCTION_PROJECTS: "madni_construction_projects",
  CONSTRUCTION_EXPENSES: "madni_construction_expenses",
  STUDENTS: "madni_students",
  TEACHERS: "madni_teachers",
  RECEIPTS: "madni_receipts",
  USERS: "madni_users",
  AUDIT_LOG: "madni_audit_log",
  INITIALIZED: "madni_initialized",
} as const;

// ─── Safe localStorage Access ───────────────────────────────────────

function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === "undefined") return false;
    const testKey = "__madni_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ─── Generic CRUD Operations ────────────────────────────────────────

export function getItems<T>(key: string): T[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getItem<T extends { id: string }>(
  key: string,
  id: string
): T | null {
  const items = getItems<T>(key);
  return items.find((item) => item.id === id) ?? null;
}

export function setItems<T>(key: string, items: T[]): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Silently fail if storage is full or unavailable
  }
}

export function addItem<T extends { id: string }>(key: string, item: T): T {
  const items = getItems<T>(key);
  items.push(item);
  setItems(key, items);
  return item;
}

export function updateItem<T extends { id: string }>(
  key: string,
  id: string,
  updates: Partial<T>
): T | null {
  const items = getItems<T>(key);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;
  items[index] = { ...items[index], ...updates };
  setItems(key, items);
  return items[index];
}

export function deleteItem<T extends { id: string }>(
  key: string,
  id: string
): boolean {
  const items = getItems<T>(key);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  setItems(key, filtered);
  return true;
}

export function clearItems(key: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

// ─── ID Generation ──────────────────────────────────────────────────

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomPart}`;
}

// ─── Timestamp Helper ───────────────────────────────────────────────

export function nowISO(): string {
  return new Date().toISOString();
}
