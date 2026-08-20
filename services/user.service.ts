import { STORAGE_KEYS, getItems, getItem, addItem, updateItem, deleteItem } from "@/lib/storage";
import { addAuditLog } from "@/lib/audit";
import type { User, ServiceResult } from "@/types";

// ─── CRUD ───────────────────────────────────────────────────────────

export function getUsers(): User[] {
  return getItems<User>(STORAGE_KEYS.USERS);
}

export function getUserById(id: string): User | null {
  return getItem<User>(STORAGE_KEYS.USERS, id);
}

export function createUser(
  data: Omit<User, "id" | "createdAt" | "updatedAt">
): ServiceResult<User> {
  if (!data.name.trim()) {
    return { success: false, error: "User name is required." };
  }
  if (!data.email.trim()) {
    return { success: false, error: "Email is required." };
  }

  // Check for duplicate email
  const existing = getUsers().find((u) => u.email === data.email);
  if (existing) {
    return { success: false, error: "A user with this email already exists." };
  }

  const now = new Date().toISOString();
  const user = addItem<User>(STORAGE_KEYS.USERS, {
    ...data,
    id: `usr-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  addAuditLog("create", "user", user.id, `Created user: ${data.name} (${data.email})`);
  return { success: true, data: user };
}

export function updateUser(
  id: string,
  data: Partial<Omit<User, "id" | "createdAt">>
): ServiceResult<User> {
  if (data.email !== undefined) {
    const existing = getUsers().find((u) => u.email === data.email && u.id !== id);
    if (existing) {
      return { success: false, error: "A user with this email already exists." };
    }
  }

  const updated = updateItem<User>(STORAGE_KEYS.USERS, id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return { success: false, error: "User not found." };
  }
  addAuditLog("update", "user", id, `Updated user: ${updated.name} (${updated.email})`);
  return { success: true, data: updated };
}

export function deleteUser(id: string): ServiceResult<void> {
  const user = getItem<User>(STORAGE_KEYS.USERS, id);
  const deleted = deleteItem<User>(STORAGE_KEYS.USERS, id);
  if (!deleted) {
    return { success: false, error: "User not found." };
  }
  addAuditLog("delete", "user", id, `Deleted user: ${user?.name ?? "unknown"}`);
  return { success: true };
}
