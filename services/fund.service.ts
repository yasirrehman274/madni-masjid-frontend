import { STORAGE_KEYS, getItems, getItem, addItem, updateItem, deleteItem } from "@/lib/storage";
import { addAuditLog } from "@/lib/audit";
import type { Fund, ServiceResult } from "@/types";

// ─── CRUD ───────────────────────────────────────────────────────────

export function getFunds(): Fund[] {
  return getItems<Fund>(STORAGE_KEYS.FUNDS);
}

export function getFundById(id: string): Fund | null {
  return getItem<Fund>(STORAGE_KEYS.FUNDS, id);
}

export function createFund(data: Omit<Fund, "id" | "createdAt" | "updatedAt">): ServiceResult<Fund> {
  if (!data.name.trim()) {
    return { success: false, error: "Fund name is required." };
  }
  if (!data.type) {
    return { success: false, error: "Fund type is required." };
  }
  const now = new Date().toISOString();
  const fund = addItem<Fund>(STORAGE_KEYS.FUNDS, {
    ...data,
    id: `fund-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  addAuditLog("create", "fund", fund.id, `Created fund: ${data.name}`);
  return { success: true, data: fund };
}

export function updateFund(
  id: string,
  data: Partial<Omit<Fund, "id" | "createdAt">>
): ServiceResult<Fund> {
  const updated = updateItem<Fund>(STORAGE_KEYS.FUNDS, id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return { success: false, error: "Fund not found." };
  }
  addAuditLog("update", "fund", id, `Updated fund: ${updated.name}`);
  return { success: true, data: updated };
}

export function deleteFund(id: string): ServiceResult<void> {
  const fund = getItem<Fund>(STORAGE_KEYS.FUNDS, id);
  const deleted = deleteItem<Fund>(STORAGE_KEYS.FUNDS, id);
  if (!deleted) {
    return { success: false, error: "Fund not found." };
  }
  addAuditLog("delete", "fund", id, `Deleted fund: ${fund?.name ?? "unknown"}`);
  return { success: true };
}

// ─── Fund Balance Calculations ──────────────────────────────────────

import {
  getDonationsByFund,
} from "./donation.service";
import {
  getFundExpenses,
} from "./expense.service";

export function getFundReceived(fundId: string): number {
  const donations = getDonationsByFund(fundId);
  return donations.reduce((sum, d) => sum + d.amount, 0);
}

export function getFundSpent(fundId: string): number {
  const expenses = getFundExpenses(fundId);
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getFundBalance(fundId: string): number {
  return getFundReceived(fundId) - getFundSpent(fundId);
}
