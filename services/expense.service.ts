import { STORAGE_KEYS, getItems, getItem, addItem, updateItem, deleteItem } from "@/lib/storage";
import { addAuditLog } from "@/lib/audit";
import { getDonationsByFund } from "./donation.service";
import type { Expense, ServiceResult } from "@/types";

// ─── CRUD ───────────────────────────────────────────────────────────

export function getExpenses(): Expense[] {
  return getItems<Expense>(STORAGE_KEYS.EXPENSES);
}

export function getExpenseById(id: string): Expense | null {
  return getItem<Expense>(STORAGE_KEYS.EXPENSES, id);
}

export function createExpense(
  data: Omit<Expense, "id" | "createdAt" | "updatedAt">
): ServiceResult<Expense> {
  if (data.amount <= 0) {
    return { success: false, error: "Expense amount must be positive." };
  }
  if (!data.fundId) {
    return { success: false, error: "Fund is required." };
  }

  // ── Fund balance protection ─────────────────────────────────────
  const fundDonations = getDonationsByFund(data.fundId);
  const totalReceived = fundDonations.reduce((sum, d) => sum + d.amount, 0);
  const existingExpenses = getFundExpenses(data.fundId);
  const totalSpent = existingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const currentBalance = totalReceived - totalSpent;

  if (data.amount > currentBalance) {
    return {
      success: false,
      error: `Insufficient balance in this fund. Available: Rs. ${currentBalance.toLocaleString()}, Requested: Rs. ${data.amount.toLocaleString()}`,
    };
  }

  const now = new Date().toISOString();
  const expense = addItem<Expense>(STORAGE_KEYS.EXPENSES, {
    ...data,
    id: `exp-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  addAuditLog("create", "expense", expense.id, `Created expense: Rs. ${data.amount.toLocaleString()} - ${data.description}`);
  return { success: true, data: expense };
}

export function updateExpense(
  id: string,
  data: Partial<Omit<Expense, "id" | "createdAt">>
): ServiceResult<Expense> {
  if (data.amount !== undefined && data.amount <= 0) {
    return { success: false, error: "Expense amount must be positive." };
  }

  // ── Fund balance protection on update ───────────────────────────
  if (data.amount !== undefined || data.fundId !== undefined) {
    const existing = getItem<Expense>(STORAGE_KEYS.EXPENSES, id);
    if (existing) {
      const fundId = data.fundId ?? existing.fundId;
      const newAmount = data.amount ?? existing.amount;

      const fundDonations = getDonationsByFund(fundId);
      const totalReceived = fundDonations.reduce((sum, d) => sum + d.amount, 0);
      const allExpenses = getFundExpenses(fundId);
      const otherExpenses = allExpenses.filter((e) => e.id !== id);
      const totalSpent = otherExpenses.reduce((sum, e) => sum + e.amount, 0) + newAmount;
      const projectedBalance = totalReceived - totalSpent;

      if (projectedBalance < 0) {
        return {
          success: false,
          error: `Insufficient balance in this fund. Projected balance would be: Rs. ${projectedBalance.toLocaleString()}`,
        };
      }
    }
  }

  const updated = updateItem<Expense>(STORAGE_KEYS.EXPENSES, id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return { success: false, error: "Expense not found." };
  }
  addAuditLog("update", "expense", id, `Updated expense: Rs. ${updated.amount.toLocaleString()} - ${updated.description}`);
  return { success: true, data: updated };
}

export function deleteExpense(id: string): ServiceResult<void> {
  const expense = getItem<Expense>(STORAGE_KEYS.EXPENSES, id);
  const deleted = deleteItem<Expense>(STORAGE_KEYS.EXPENSES, id);
  if (!deleted) {
    return { success: false, error: "Expense not found." };
  }
  addAuditLog("delete", "expense", id, `Deleted expense: Rs. ${expense?.amount.toLocaleString() ?? "unknown"} - ${expense?.description ?? ""}`);
  return { success: true };
}

// ─── Queries ────────────────────────────────────────────────────────

export function getExpensesByFund(fundId: string): Expense[] {
  return getExpenses().filter((e) => e.fundId === fundId);
}

export function getFundExpenses(fundId: string): Expense[] {
  return getExpenses().filter((e) => e.fundId === fundId);
}

export function getTotalExpenses(): number {
  return getExpenses().reduce((sum, e) => sum + e.amount, 0);
}
