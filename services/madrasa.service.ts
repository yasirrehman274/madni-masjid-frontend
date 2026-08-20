import { STORAGE_KEYS, getItems, getItem, addItem, updateItem, deleteItem } from "@/lib/storage";
import { addAuditLog } from "@/lib/audit";
import type { MadrasaStudent, MadrasaTeacher, ServiceResult } from "@/types";

// ─── Students CRUD ─────────────────────────────────────────────────

export function getStudents(): MadrasaStudent[] {
  return getItems<MadrasaStudent>(STORAGE_KEYS.STUDENTS);
}

export function getStudentById(id: string): MadrasaStudent | null {
  return getItem<MadrasaStudent>(STORAGE_KEYS.STUDENTS, id);
}

export function createStudent(
  data: Omit<MadrasaStudent, "id" | "createdAt" | "updatedAt">
): ServiceResult<MadrasaStudent> {
  if (!data.name.trim()) {
    return { success: false, error: "Student name is required." };
  }
  if (!data.className.trim()) {
    return { success: false, error: "Class is required." };
  }
  const now = new Date().toISOString();
  const student = addItem<MadrasaStudent>(STORAGE_KEYS.STUDENTS, {
    ...data,
    id: `stu-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  addAuditLog("create", "student", student.id, `Added student: ${data.name} (${data.className})`);
  return { success: true, data: student };
}

export function updateStudent(
  id: string,
  data: Partial<Omit<MadrasaStudent, "id" | "createdAt">>
): ServiceResult<MadrasaStudent> {
  const updated = updateItem<MadrasaStudent>(STORAGE_KEYS.STUDENTS, id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return { success: false, error: "Student not found." };
  }
  addAuditLog("update", "student", id, `Updated student: ${updated.name}`);
  return { success: true, data: updated };
}

export function deleteStudent(id: string): ServiceResult<void> {
  const student = getItem<MadrasaStudent>(STORAGE_KEYS.STUDENTS, id);
  const deleted = deleteItem<MadrasaStudent>(STORAGE_KEYS.STUDENTS, id);
  if (!deleted) {
    return { success: false, error: "Student not found." };
  }
  addAuditLog("delete", "student", id, `Deleted student: ${student?.name ?? "unknown"}`);
  return { success: true };
}

// ─── Teachers CRUD ─────────────────────────────────────────────────

export function getTeachers(): MadrasaTeacher[] {
  return getItems<MadrasaTeacher>(STORAGE_KEYS.TEACHERS);
}

export function getTeacherById(id: string): MadrasaTeacher | null {
  return getItem<MadrasaTeacher>(STORAGE_KEYS.TEACHERS, id);
}

export function createTeacher(
  data: Omit<MadrasaTeacher, "id" | "createdAt" | "updatedAt">
): ServiceResult<MadrasaTeacher> {
  if (!data.name.trim()) {
    return { success: false, error: "Teacher name is required." };
  }
  if (data.salary < 0) {
    return { success: false, error: "Salary cannot be negative." };
  }
  const now = new Date().toISOString();
  const teacher = addItem<MadrasaTeacher>(STORAGE_KEYS.TEACHERS, {
    ...data,
    id: `tch-${Date.now().toString(36)}`,
    createdAt: now,
    updatedAt: now,
  });
  addAuditLog("create", "teacher", teacher.id, `Added teacher: ${data.name} (${data.subject})`);
  return { success: true, data: teacher };
}

export function updateTeacher(
  id: string,
  data: Partial<Omit<MadrasaTeacher, "id" | "createdAt">>
): ServiceResult<MadrasaTeacher> {
  const updated = updateItem<MadrasaTeacher>(STORAGE_KEYS.TEACHERS, id, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    return { success: false, error: "Teacher not found." };
  }
  addAuditLog("update", "teacher", id, `Updated teacher: ${updated.name}`);
  return { success: true, data: updated };
}

export function deleteTeacher(id: string): ServiceResult<void> {
  const teacher = getItem<MadrasaTeacher>(STORAGE_KEYS.TEACHERS, id);
  const deleted = deleteItem<MadrasaTeacher>(STORAGE_KEYS.TEACHERS, id);
  if (!deleted) {
    return { success: false, error: "Teacher not found." };
  }
  addAuditLog("delete", "teacher", id, `Deleted teacher: ${teacher?.name ?? "unknown"}`);
  return { success: true };
}

// ─── Queries ────────────────────────────────────────────────────────

export function getActiveStudents(): MadrasaStudent[] {
  return getStudents().filter((s) => s.status === "active");
}

export function getActiveTeachers(): MadrasaTeacher[] {
  return getTeachers().filter((t) => t.status === "active");
}

export function getTotalTeacherSalary(): number {
  return getActiveTeachers().reduce((sum, t) => sum + t.salary, 0);
}
