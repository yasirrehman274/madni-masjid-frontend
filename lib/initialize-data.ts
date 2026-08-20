import { STORAGE_KEYS, setItems, getItems } from "@/lib/storage";
import {
  seedFunds,
  seedDonors,
  seedDonations,
  seedExpenses,
  seedConstructionProjects,
  seedConstructionExpenses,
  seedStudents,
  seedTeachers,
  seedReceipts,
  seedUsers,
} from "@/data/seed";

import type {
  Fund,
  Donor,
  Donation,
  Expense,
  ConstructionProject,
  ConstructionExpense,
  MadrasaStudent,
  MadrasaTeacher,
  Receipt,
  User,
} from "@/types";

// ─── Seed Mapping ───────────────────────────────────────────────────

interface SeedEntry {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
}

const seedEntries: SeedEntry[] = [
  { key: STORAGE_KEYS.FUNDS, data: seedFunds },
  { key: STORAGE_KEYS.DONORS, data: seedDonors },
  { key: STORAGE_KEYS.DONATIONS, data: seedDonations },
  { key: STORAGE_KEYS.EXPENSES, data: seedExpenses },
  { key: STORAGE_KEYS.CONSTRUCTION_PROJECTS, data: seedConstructionProjects },
  { key: STORAGE_KEYS.CONSTRUCTION_EXPENSES, data: seedConstructionExpenses },
  { key: STORAGE_KEYS.STUDENTS, data: seedStudents },
  { key: STORAGE_KEYS.TEACHERS, data: seedTeachers },
  { key: STORAGE_KEYS.RECEIPTS, data: seedReceipts },
  { key: STORAGE_KEYS.USERS, data: seedUsers },
];

// ─── Initialization ─────────────────────────────────────────────────

let initialized = false;

export function initializeData(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;

  const alreadyInit = window.localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (alreadyInit === "true") {
    initialized = true;
    return;
  }

  for (const entry of seedEntries) {
    const existing = getItems(entry.key);
    if (existing.length === 0) {
      setItems(entry.key, entry.data);
    }
  }

  window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
  initialized = true;
}

// ─── Helpers for type-safe seed access ──────────────────────────────

export function getSeedFunds(): Fund[] {
  return seedFunds;
}

export function getSeedDonors(): Donor[] {
  return seedDonors;
}

export function getSeedDonations(): Donation[] {
  return seedDonations;
}

export function getSeedExpenses(): Expense[] {
  return seedExpenses;
}

export function getSeedConstructionProjects(): ConstructionProject[] {
  return seedConstructionProjects;
}

export function getSeedConstructionExpenses(): ConstructionExpense[] {
  return seedConstructionExpenses;
}

export function getSeedStudents(): MadrasaStudent[] {
  return seedStudents;
}

export function getSeedTeachers(): MadrasaTeacher[] {
  return seedTeachers;
}

export function getSeedReceipts(): Receipt[] {
  return seedReceipts;
}

export function getSeedUsers(): User[] {
  return seedUsers;
}
