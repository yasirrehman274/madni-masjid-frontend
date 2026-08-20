import { STORAGE_KEYS, getItems, getItem, addItem, updateItem, deleteItem } from "@/lib/storage";
import { addAuditLog } from "@/lib/audit";
import { getDonationsByDonor } from "./donation.service";
import type { Donor, ServiceResult } from "@/types";

// ─── CRUD ───────────────────────────────────────────────────────────

export function getDonors(): Donor[] {
  return getItems<Donor>(STORAGE_KEYS.DONORS);
}

export function getDonorById(id: string): Donor | null {
  return getItem<Donor>(STORAGE_KEYS.DONORS, id);
}

export function createDonor(data: Omit<Donor, "id" | "createdAt" | "updatedAt">): ServiceResult<Donor> {
  if (!data.name.trim()) {
    return { success: false, error: "Donor name is required." };
  }
  const now = new Date().toISOString();
  const donor = addItem<Donor>(STORAGE_KEYS.DONORS, {
    ...data,
    id: `donor-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  addAuditLog("create", "donor", donor.id, `Created donor: ${data.name}`);
  return { success: true, data: donor };
}

export function updateDonor(
  id: string,
  data: Partial<Omit<Donor, "id" | "createdAt">>
): ServiceResult<Donor> {
  const updated = updateItem<Donor>(STORAGE_KEYS.DONORS, id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return { success: false, error: "Donor not found." };
  }
  addAuditLog("update", "donor", id, `Updated donor: ${updated.name}`);
  return { success: true, data: updated };
}

export function deleteDonor(id: string): ServiceResult<void> {
  const donor = getItem<Donor>(STORAGE_KEYS.DONORS, id);
  const deleted = deleteItem<Donor>(STORAGE_KEYS.DONORS, id);
  if (!deleted) {
    return { success: false, error: "Donor not found." };
  }
  addAuditLog("delete", "donor", id, `Deleted donor: ${donor?.name ?? "unknown"}`);
  return { success: true };
}

// ─── Donor Calculations ─────────────────────────────────────────────

export function getDonorDonations(donorId: string) {
  return getDonationsByDonor(donorId);
}

export function getDonorTotalDonations(donorId: string): number {
  const donations = getDonorDonations(donorId);
  return donations.reduce((sum, d) => sum + d.amount, 0);
}
