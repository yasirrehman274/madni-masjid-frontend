import { STORAGE_KEYS, getItems, setItems, generateId, nowISO } from "@/lib/storage";
import type { AuditLog, AuditAction, AuditEntity } from "@/types";

export function getAuditLogs(): AuditLog[] {
  return getItems<AuditLog>(STORAGE_KEYS.AUDIT_LOG);
}

export function addAuditLog(
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  description: string,
  userName: string = "Administrator"
): void {
  const log: AuditLog = {
    id: `audit-${generateId()}`,
    action,
    entity,
    entityId,
    description,
    timestamp: nowISO(),
    userName,
  };
  const logs = getAuditLogs();
  logs.unshift(log);
  if (logs.length > 500) logs.length = 500;
  setItems(STORAGE_KEYS.AUDIT_LOG, logs);
}

export function clearAuditLogs(): void {
  setItems(STORAGE_KEYS.AUDIT_LOG, []);
}
