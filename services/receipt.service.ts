import { STORAGE_KEYS, getItems, getItem, addItem } from "@/lib/storage";
import type { Receipt, ServiceResult } from "@/types";

// ─── Read ───────────────────────────────────────────────────────────

export function getReceipts(): Receipt[] {
  return getItems<Receipt>(STORAGE_KEYS.RECEIPTS);
}

export function getReceiptById(id: string): Receipt | null {
  return getItem<Receipt>(STORAGE_KEYS.RECEIPTS, id);
}

// ─── Create ─────────────────────────────────────────────────────────

export function createReceipt(
  data: Omit<Receipt, "id" | "receiptNumber" | "issuedAt">
): ServiceResult<Receipt> {
  if (!data.donationId) {
    return { success: false, error: "Donation ID is required." };
  }

  // Check if receipt already exists for this donation
  const existing = getReceipts().find((r) => r.donationId === data.donationId);
  if (existing) {
    return { success: false, error: "Receipt already exists for this donation." };
  }

  // Generate unique receipt number
  const receiptNumber = generateReceiptNumber();

  const receipt = addItem<Receipt>(STORAGE_KEYS.RECEIPTS, {
    id: `rcpt-${Date.now().toString(36)}`,
    donationId: data.donationId,
    receiptNumber,
    issuedAt: new Date().toISOString(),
  });

  return { success: true, data: receipt };
}

// ─── Receipt Number Generation ─────────────────────────────────────

function generateReceiptNumber(): string {
  const receipts = getReceipts();
  const maxNumber = receipts.reduce((max, r) => {
    const num = parseInt(r.receiptNumber.replace("DON-", ""), 10);
    return num > max ? num : max;
  }, 0);
  const nextNumber = maxNumber + 1;
  return `DON-${nextNumber.toString().padStart(6, "0")}`;
}
