import { randomUUID } from "crypto";

export type AuditEventType =
  | "auth.login"
  | "auth.logout"
  | "auth.lockout"
  | "role.change"
  | "billing.refund"
  | "billing.mark_paid"
  | "operator.provision"
  | "operator.activate_live"
  | "operator.send_invite"
  | "operator.edit_fees"
  | "operator.pause"
  | "operator.view_as_client"
  | "document.upload"
  | "document.delete"
  | "organization.export"
  | "organization.delete"
  | string;

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  organizationId: string;
  ipAddress?: string;
  details: Record<string, unknown>;
  timestamp: string;
}

// In-memory persistent audit log for development/test mode
const auditLogs: AuditLogEntry[] = [
  {
    id: "aud_01_init",
    eventType: "auth.login",
    actorId: "usr_mock_operator_001",
    actorEmail: "owner@aegisdesk.ai",
    actorRole: "owner",
    organizationId: "org_apex_industries",
    ipAddress: "127.0.0.1",
    details: { method: "magic_link", mfa: "aal2" },
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
];

export function recordAuditLog(entry: {
  eventType: AuditEventType;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  organizationId: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
}): AuditLogEntry {
  const log: AuditLogEntry = {
    id: `aud_${randomUUID().slice(0, 12)}`,
    eventType: entry.eventType,
    actorId: entry.actorId,
    actorEmail: entry.actorEmail,
    actorRole: entry.actorRole,
    organizationId: entry.organizationId,
    ipAddress: entry.ipAddress || "unknown",
    details: entry.details || {},
    timestamp: new Date().toISOString(),
  };

  auditLogs.unshift(log);

  // Keep within bounds in memory (last 500 events)
  if (auditLogs.length > 500) {
    auditLogs.pop();
  }

  return log;
}

export function recordAuditEvent(entry: {
  action?: string;
  eventType?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  organizationId?: string;
  ipAddress?: string;
  details?: Record<string, unknown>;
  [key: string]: unknown;
}): AuditLogEntry {
  const eventType = (entry.eventType || entry.action || "operator.action") as AuditEventType;
  return recordAuditLog({
    eventType,
    actorId: entry.actorId || "usr_owner_001",
    actorEmail: entry.actorEmail || "owner@aegisdesk.ai",
    actorRole: entry.actorRole || "owner",
    organizationId: entry.organizationId || "org_aegis_master",
    ipAddress: entry.ipAddress || "127.0.0.1",
    details: (entry.details as Record<string, unknown>) || entry,
  });
}

export function getAuditLogs(organizationId?: string): AuditLogEntry[] {
  if (organizationId) {
    return auditLogs.filter((l) => l.organizationId === organizationId);
  }
  return [...auditLogs];
}
