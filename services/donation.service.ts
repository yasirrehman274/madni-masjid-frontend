import { STORAGE_KEYS, getItems, getItem, addItem, updateItem, deleteItem } from "@/lib/storage";
import { addAuditLog } from "@/lib/audit";
import type { Donation, ServiceResult } from "@/types";

// ─── CRUD ───────────────────────────────────────────────────────────

export function getDonations(): Donation[] {
  return getItems<Donation>(STORAGE_KEYS.DONATIONS);
}

export function getDonationById(id: string): Donation | null {
  return getItem<Donation>(STORAGE_KEYS.DONATIONS, id);
}

export function createDonation(
  data: Omit<Donation, "id" | "createdAt" | "updatedAt">
): ServiceResult<Donation> {
  if (data.amount <= 0) {
    return { success: false, error: "Donation amount must be positive." };
  }
  if (!data.donorId) {
    return { success: false, error: "Donor is required." };
  }
  if (!data.fundId) {
    return { success: false, error: "Fund is required." };
  }

  const now = new Date().toISOString();
  const donation = addItem<Donation>(STORAGE_KEYS.DONATIONS, {
    ...data,
    id: `don-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  addAuditLog("create", "donation", donation.id, `Created donation: Rs. ${data.amount.toLocaleString()}`);
  return { success: true, data: donation };
}

export function updateDonation(
  id: string,
  data: Partial<Omit<Donation, "id" | "createdAt">>
): ServiceResult<Donation> {
  if (data.amount !== undefined && data.amount <= 0) {
    return { success: false, error: "Donation amount must be positive." };
  }
  const updated = updateItem<Donation>(STORAGE_KEYS.DONATIONS, id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return { success: false, error: "Donation not found." };
  }
  addAuditLog("update", "donation", id, `Updated donation: Rs. ${updated.amount.toLocaleString()}`);
  return { success: true, data: updated };
}

export function deleteDonation(id: string): ServiceResult<void> {
  const donation = getItem<Donation>(STORAGE_KEYS.DONATIONS, id);
  const deleted = deleteItem<Donation>(STORAGE_KEYS.DONATIONS, id);
  if (!deleted) {
    return { success: false, error: "Donation not found." };
  }
  addAuditLog("delete", "donation", id, `Deleted donation: Rs. ${donation?.amount.toLocaleString() ?? "unknown"}`);
  return { success: true };
}

// ─── Queries ────────────────────────────────────────────────────────

export function getDonationsByFund(fundId: string): Donation[] {
  return getDonations().filter((d) => d.fundId === fundId);
}

export function getDonationsByDonor(donorId: string): Donation[] {
  return getDonations().filter((d) => d.donorId === donorId);
}

export function getTotalDonations(): number {
  return getDonations().reduce((sum, d) => sum + d.amount, 0);
}
