// ─── Enums / Union Types ────────────────────────────────────────────

export type FundType =
  | "construction"
  | "madrasa"
  | "zakat"
  | "fitrana"
  | "khairat"
  | "general";

export type PaymentMethod = "cash" | "bank" | "online" | "cheque";

export type FundStatus = "active" | "inactive" | "closed";

export type ProjectStatus =
  | "planning"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

export type StudentStatus = "active" | "inactive" | "graduated" | "transferred";

export type TeacherStatus = "active" | "inactive" | "on_leave";

export type UserRole = "admin" | "manager" | "viewer";

export type UserStatus = "active" | "inactive";

// ─── Base Entity ────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Fund ───────────────────────────────────────────────────────────

export interface Fund extends BaseEntity {
  name: string;
  type: FundType;
  description: string;
  status: FundStatus;
}

// ─── Donor ──────────────────────────────────────────────────────────

export interface Donor extends BaseEntity {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

// ─── Donation ───────────────────────────────────────────────────────

export interface Donation extends BaseEntity {
  donorId: string;
  fundId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  reference: string;
  notes: string;
}

// ─── Expense ────────────────────────────────────────────────────────

export interface Expense extends BaseEntity {
  fundId: string;
  category: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  vendor: string;
  description: string;
  reference: string;
  notes: string;
}

// ─── Construction ───────────────────────────────────────────────────

export interface ConstructionProject extends BaseEntity {
  name: string;
  estimatedBudget: number;
  description: string;
  status: ProjectStatus;
  startDate: string;
  targetDate: string;
}

export interface ConstructionExpense {
  id: string;
  projectId: string;
  fundId: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  reference: string;
  createdAt: string;
}

// ─── Madrasa ────────────────────────────────────────────────────────

export interface MadrasaStudent extends BaseEntity {
  name: string;
  fatherName: string;
  phone: string;
  className: string;
  admissionDate: string;
  status: StudentStatus;
  notes: string;
}

export interface MadrasaTeacher extends BaseEntity {
  name: string;
  phone: string;
  subject: string;
  salary: number;
  joiningDate: string;
  status: TeacherStatus;
  notes: string;
}

// ─── Receipt ────────────────────────────────────────────────────────

export interface Receipt {
  id: string;
  donationId: string;
  receiptNumber: string;
  issuedAt: string;
}

// ─── User ───────────────────────────────────────────────────────────

export interface User extends BaseEntity {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

// ─── Dashboard Types ────────────────────────────────────────────────

export interface FundOverviewRow {
  fundId: string;
  fundName: string;
  received: number;
  spent: number;
  balance: number;
}

export interface DashboardStats {
  totalDonations: number;
  totalExpenses: number;
  constructionBalance: number;
  madrasaBalance: number;
  zakatBalance: number;
  fitranaBalance: number;
  khairatBalance: number;
  generalBalance: number;
}

// ─── Audit Log ─────────────────────────────────────────────────────

export type AuditAction = "create" | "update" | "delete";

export type AuditEntity = "donation" | "expense" | "fund" | "donor" | "construction_expense" | "construction_project" | "student" | "teacher" | "user" | "receipt" | "settings";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  description: string;
  timestamp: string;
  userName: string;
}

// ─── Service Result ─────────────────────────────────────────────────

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
