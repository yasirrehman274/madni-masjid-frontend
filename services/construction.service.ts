import { STORAGE_KEYS, getItems, getItem, addItem, updateItem, deleteItem } from "@/lib/storage";
import { addAuditLog } from "@/lib/audit";
import type { ConstructionProject, ConstructionExpense, ServiceResult } from "@/types";

// ─── Projects CRUD ─────────────────────────────────────────────────

export function getProjects(): ConstructionProject[] {
  return getItems<ConstructionProject>(STORAGE_KEYS.CONSTRUCTION_PROJECTS);
}

export function getProjectById(id: string): ConstructionProject | null {
  return getItem<ConstructionProject>(STORAGE_KEYS.CONSTRUCTION_PROJECTS, id);
}

export function createProject(
  data: Omit<ConstructionProject, "id" | "createdAt" | "updatedAt">
): ServiceResult<ConstructionProject> {
  if (!data.name.trim()) {
    return { success: false, error: "Project name is required." };
  }
  if (data.estimatedBudget <= 0) {
    return { success: false, error: "Estimated budget must be positive." };
  }
  const now = new Date().toISOString();
  const project = addItem<ConstructionProject>(
    STORAGE_KEYS.CONSTRUCTION_PROJECTS,
    {
      ...data,
      id: `proj-${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
    }
  );
  addAuditLog("create", "construction_project", project.id, `Created construction project: ${data.name}`);
  return { success: true, data: project };
}

export function updateProject(
  id: string,
  data: Partial<Omit<ConstructionProject, "id" | "createdAt">>
): ServiceResult<ConstructionProject> {
  const updated = updateItem<ConstructionProject>(
    STORAGE_KEYS.CONSTRUCTION_PROJECTS,
    id,
    { ...data, updatedAt: new Date().toISOString() }
  );
  if (!updated) {
    return { success: false, error: "Project not found." };
  }
  addAuditLog("update", "construction_project", id, `Updated project: ${updated.name}`);
  return { success: true, data: updated };
}

export function deleteProject(id: string): ServiceResult<void> {
  const project = getItem<ConstructionProject>(STORAGE_KEYS.CONSTRUCTION_PROJECTS, id);
  const deleted = deleteItem<ConstructionProject>(
    STORAGE_KEYS.CONSTRUCTION_PROJECTS,
    id
  );
  if (!deleted) {
    return { success: false, error: "Project not found." };
  }
  addAuditLog("delete", "construction_project", id, `Deleted project: ${project?.name ?? "unknown"}`);
  return { success: true };
}

// ─── Construction Expenses CRUD ─────────────────────────────────────

export function getConstructionExpenses(): ConstructionExpense[] {
  return getItems<ConstructionExpense>(
    STORAGE_KEYS.CONSTRUCTION_EXPENSES
  );
}

export function getConstructionExpensesByProject(
  projectId: string
): ConstructionExpense[] {
  return getConstructionExpenses().filter((e) => e.projectId === projectId);
}

export function createConstructionExpense(
  data: Omit<ConstructionExpense, "id" | "createdAt">
): ServiceResult<ConstructionExpense> {
  if (data.amount <= 0) {
    return { success: false, error: "Amount must be positive." };
  }
  if (!data.projectId) {
    return { success: false, error: "Project is required." };
  }
  if (!data.fundId) {
    return { success: false, error: "Fund is required." };
  }
  const expense = addItem<ConstructionExpense>(
    STORAGE_KEYS.CONSTRUCTION_EXPENSES,
    {
      ...data,
      id: `cexp-${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    }
  );
  addAuditLog("create", "construction_expense", expense.id, `Created construction expense: Rs. ${data.amount.toLocaleString()} - ${data.description}`);
  return { success: true, data: expense };
}

export function updateConstructionExpense(
  id: string,
  data: Partial<Omit<ConstructionExpense, "id" | "createdAt">>
): ServiceResult<ConstructionExpense> {
  const updated = updateItem<ConstructionExpense>(
    STORAGE_KEYS.CONSTRUCTION_EXPENSES,
    id,
    data
  );
  if (!updated) {
    return { success: false, error: "Construction expense not found." };
  }
  addAuditLog("update", "construction_expense", id, `Updated construction expense: Rs. ${updated.amount.toLocaleString()} - ${updated.description}`);
  return { success: true, data: updated };
}

export function deleteConstructionExpense(id: string): ServiceResult<void> {
  const expense = getItem<ConstructionExpense>(STORAGE_KEYS.CONSTRUCTION_EXPENSES, id);
  const deleted = deleteItem<ConstructionExpense>(
    STORAGE_KEYS.CONSTRUCTION_EXPENSES,
    id
  );
  if (!deleted) {
    return { success: false, error: "Construction expense not found." };
  }
  addAuditLog("delete", "construction_expense", id, `Deleted construction expense: Rs. ${expense?.amount.toLocaleString() ?? "unknown"} - ${expense?.description ?? ""}`);
  return { success: true };
}

// ─── Project Calculations ──────────────────────────────────────────

export function getProjectTotalSpent(projectId: string): number {
  const expenses = getConstructionExpensesByProject(projectId);
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getProjectRemainingBudget(projectId: string): number {
  const project = getProjectById(projectId);
  if (!project) return 0;
  return project.estimatedBudget - getProjectTotalSpent(projectId);
}
