import { getItems, setItems } from "@/lib/storage";

export interface MosqueSettings {
  mosqueName: string;
  address: string;
  phone: string;
  email: string;
  description: string;
  currency: string;
  dateFormat: string;
}

const defaultSettings: MosqueSettings = {
  mosqueName: "Madni Masjid",
  address: "",
  phone: "",
  email: "",
  description: "",
  currency: "PKR",
  dateFormat: "dd MMM yyyy",
};

const SETTINGS_KEY = "madni_settings";

export function getSettings(): MosqueSettings {
  if (typeof window === "undefined") return defaultSettings;
  const items = getItems<MosqueSettings>(SETTINGS_KEY);
  if (items.length === 0) return defaultSettings;
  return items[0];
}

export function updateSettings(data: Partial<MosqueSettings>): void {
  const current = getSettings();
  const updated = { ...current, ...data };
  setItems(SETTINGS_KEY, [updated]);
}
