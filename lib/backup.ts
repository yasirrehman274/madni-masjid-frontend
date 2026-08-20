import { STORAGE_KEYS } from "@/lib/storage";

export interface BackupData {
  version: string;
  exportedAt: string;
  mosqueName: string;
  collections: Record<string, unknown>;
}

const ALL_KEYS = [
  STORAGE_KEYS.FUNDS,
  STORAGE_KEYS.DONORS,
  STORAGE_KEYS.DONATIONS,
  STORAGE_KEYS.EXPENSES,
  STORAGE_KEYS.CONSTRUCTION_PROJECTS,
  STORAGE_KEYS.CONSTRUCTION_EXPENSES,
  STORAGE_KEYS.STUDENTS,
  STORAGE_KEYS.TEACHERS,
  STORAGE_KEYS.RECEIPTS,
  STORAGE_KEYS.USERS,
  STORAGE_KEYS.AUDIT_LOG,
  "madni_settings",
];

export function exportBackup(): BackupData {
  const collections: Record<string, unknown> = {};
  for (const key of ALL_KEYS) {
    const raw = localStorage.getItem(key);
    collections[key] = raw ? JSON.parse(raw) : [];
  }

  const settingsRaw = localStorage.getItem("madni_settings");
  const settings = settingsRaw ? JSON.parse(settingsRaw) : [{}];

  return {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    mosqueName: settings[0]?.mosqueName ?? "Madni Masjid",
    collections,
  };
}

export function downloadBackup(): void {
  const data = exportBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().split("T")[0];
  a.href = url;
  a.download = `madni-masjid-backup-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackupFile(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!obj.version || !obj.exportedAt || !obj.collections) return false;
  if (typeof obj.collections !== "object") return false;
  return true;
}

export function restoreBackup(data: BackupData): { success: boolean; count: number; error?: string } {
  try {
    let count = 0;
    for (const key of ALL_KEYS) {
      if (data.collections[key] !== undefined) {
        localStorage.setItem(key, JSON.stringify(data.collections[key]));
        count++;
      }
    }
    return { success: true, count };
  } catch {
    return { success: false, count: 0, error: "Failed to write to localStorage. Storage may be full." };
  }
}
