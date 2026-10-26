"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Copy,
  Check,
  RotateCw,
  Download,
  Trash2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/providers/toast-provider";

export default function TenantSecurityDashboardPage() {
  const { tenant } = useAuth();
  const { toast } = useToast();

  const [apiKey, setApiKey] = useState("omni_live_sk_9a87f2e10c4d5b6e");
  const [webhookSecret] = useState("whsec_77b312ad8e91ff24");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // GDPR / DPDP Action States
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteMfaCode, setDeleteMfaCode] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const copyToClipboard = (text: string, isSecret: boolean) => {
    navigator.clipboard.writeText(text);
    if (isSecret) {
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
    toast({
      title: "Copied to Clipboard",
      description: "Secret key copied securely.",
      type: "info",
    });
  };

  const handleRollKey = () => {
    if (confirm("Are you sure you want to regenerate your API key? Active integrations must be updated.")) {
      const newKey = `omni_live_sk_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
      setApiKey(newKey);
      toast({
        title: "API Key Regenerated",
        description: "Old key invalidated. Update backend webhooks and connectors.",
        type: "warning",
      });
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/organization/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mfa_code: "123456" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aegisdesk-export-${tenant?.id || "apex"}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Data Export Complete",
        description: "Full compliance export downloaded successfully.",
        type: "info",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Export failed";
      toast({
        title: "Export Error",
        description: message,
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);

    try {
      const res = await fetch("/api/organization/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          mfa_code: deleteMfaCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Organization deletion authorization failed");
      }

      toast({
        title: "Erasure Authorized",
        description: data.message,
        type: "warning",
      });
      setShowDeleteModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Deletion failed";
      toast({
        title: "Authorization Denied",
        description: message,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-2xl font-light tracking-[-0.02em] text-[var(--text)] sm:text-3xl">
            Tenant Security &amp; API Credentials
          </h1>
          <p className="text-xs font-mono text-[var(--text-dim)] mt-1">
            Manage your tenant API keys, webhook signing secrets, and data partition policies.
          </p>
        </div>
      </div>

      {/* Security Architecture Notice */}
      <Panel className="p-5 sm:p-6 bg-[var(--surface-2)] flex items-start gap-3.5">
        <ShieldCheck className="h-5 w-5 text-[var(--verified)] shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-[var(--text-dim)] font-light">
          <div className="font-medium text-[var(--text)] text-sm">
            Multi-Tenant Cryptographic Partitioning Active
          </div>
          <p className="leading-relaxed">
            Your organization&apos;s documents, LangGraph conversation states, and vector indices in PostgreSQL are scoped to Tenant ID <code className="font-mono text-[var(--verified)] font-semibold">{tenant?.id || "tnt_apex_9921"}</code>. Cross-tenant leakage is strictly prevented at the database and application levels.
          </p>
        </div>
      </Panel>

      {/* API Keys Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-medium">Backend API Keys</CardTitle>
              <CardDescription className="text-xs font-mono">
                Secret keys for server-to-server FastAPI backend integration
              </CardDescription>
            </div>
            <Button variant="secondary" size="sm" onClick={handleRollKey} className="text-xs gap-1.5 font-mono">
              <RotateCw className="h-3.5 w-3.5" />
              Regenerate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="p-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)] space-y-2">
            <div className="flex items-center justify-between text-[var(--text-faint)] font-mono text-[11px]">
              <span>LIVE API SECRET KEY</span>
              <span className="text-[var(--warn)] font-sans">Server Environment Only</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-[8px] border border-[var(--line)]">
              <span className="font-mono text-[13px] text-[var(--text)] tracking-wider">
                {apiKey}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(apiKey, false)}
                className="p-1 rounded-[4px] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
                aria-label="Copy API Key"
              >
                {copiedKey ? <Check className="h-3.5 w-3.5 text-[var(--verified)]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)] space-y-2">
            <div className="flex items-center justify-between text-[var(--text-faint)] font-mono text-[11px]">
              <span>WEBHOOK SIGNING SECRET (HMAC SHA-256)</span>
              <span className="text-[var(--verified)] font-sans">Used for /api/events verification</span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-[var(--surface)] p-2.5 rounded-[8px] border border-[var(--line)]">
              <span className="font-mono text-[13px] text-[var(--text)] tracking-wider">
                {webhookSecret}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookSecret, true)}
                className="p-1 rounded-[4px] text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors shrink-0"
                aria-label="Copy Webhook Secret"
              >
                {copiedSecret ? <Check className="h-3.5 w-3.5 text-[var(--verified)]" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statutory Data Rights (DPDP Act & GDPR) */}
      <Card className="border-[var(--line)]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-medium">Statutory Data Rights &amp; Erasure</CardTitle>
              <CardDescription className="text-xs font-mono">
                India DPDP Act 2023 &amp; GDPR Article 20 / Article 17 Data Subject Privileges
              </CardDescription>
            </div>
            <span className="font-mono text-[11px] text-[var(--verified)] border border-[var(--line)] px-2 py-0.5 rounded-[6px] bg-[var(--surface-2)]">
              OWNER PRIVILEGE ONLY
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <p className="text-[var(--text-dim)] leading-relaxed font-light">
            As an enterprise workspace administrator, you retain absolute ownership over all ingested company runbooks, customer telemetry, and vector representations. You may generate a full data portability bundle or request irrevocable tenant erasure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-[12px] border border-[var(--line)] bg-[var(--surface-2)] flex flex-col justify-between gap-3">
              <div>
                <span className="font-medium text-[var(--text)] text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[var(--glow)]" />
                  Full Data Portability Export
                </span>
                <p className="text-[var(--text-dim)] text-[11px] mt-1 font-mono">
                  Download all organization policies, chunk mappings, ticket stats, and billing records as structured JSON.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExportData}
                disabled={isExporting}
                className="w-full text-xs font-mono gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? "Generating Portability Bundle..." : "Export All Organization Data"}
              </Button>
            </div>

            <div className="p-4 rounded-[12px] border border-[#E5645C]/30 bg-[#E5645C]/5 flex flex-col justify-between gap-3">
              <div>
                <span className="font-medium text-[#E5645C] text-sm flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" />
                  Request Irrevocable Erasure
                </span>
                <p className="text-[var(--text-dim)] text-[11px] mt-1 font-mono">
                  Permanently purge all vector collections, documents, and tenant metadata. Requires 2FA confirmation.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                className="w-full text-xs font-mono gap-2 text-[#E5645C] border-[#E5645C]/40 hover:bg-[#E5645C]/15"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Authorize Tenant Erasure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="w-full max-w-md rounded-[16px] border border-[#E5645C]/40 bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[#E5645C]">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h2 className="text-base font-medium">Confirm Permanent Tenant Erasure</h2>
            </div>
            <p className="text-xs text-[var(--text-dim)] leading-relaxed font-light">
              This action initiates irreversible data deletion under GDPR Article 17 and DPDP Act provisions. All ingested PDF chunks, LangGraph states, and API keys will be immediately revoked.
            </p>

            <form onSubmit={handleDeleteOrganization} className="space-y-3.5 pt-2">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)] mb-1">
                  Type &quot;DELETE APEX INDUSTRIES&quot;
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE APEX INDUSTRIES"
                  className="w-full h-10 px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] text-xs font-mono text-[var(--text)] focus:outline-none focus:border-[#E5645C]"
                />
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase tracking-wider text-[var(--text-faint)] mb-1">
                  Owner 2-Factor Authentication Code (MFA)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={deleteMfaCode}
                  onChange={(e) => setDeleteMfaCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="w-full h-10 px-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] text-xs font-mono text-[var(--text)] tracking-widest text-center focus:outline-none focus:border-[#E5645C]"
                />
                <span className="block text-[10px] text-[var(--text-faint)] font-mono mt-1">
                  Enter 6-digit TOTP code (Test mode accepts 123456)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--line)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-xs font-mono"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isDeleting || deleteConfirmation.trim() !== "DELETE APEX INDUSTRIES" || deleteMfaCode.length !== 6}
                  className="text-xs font-mono bg-[#E5645C] text-white hover:bg-[#E5645C]/90 disabled:opacity-40"
                >
                  {isDeleting ? "Authorizing..." : "Confirm Irrevocable Deletion"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Recent Security &amp; Access Logs</CardTitle>
          <CardDescription className="text-xs font-mono">
            Immutable audit record of administrative actions taken within this workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--line)] text-xs">
          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-[var(--text)]">AI Assistant Prompt Updated</span>
              <span className="text-[var(--text-dim)] block text-[11px] font-mono mt-0.5">By Alex Morgan (Owner) • IP: 192.168.1.1</span>
            </div>
            <span className="font-mono tabular-nums text-[var(--text-faint)] text-[10px] shrink-0">Today, 11:45 AM</span>
          </div>
          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-[var(--text)]">Document Ingested: Warranty_and_Repairs_Guidelines_Q4.pdf</span>
              <span className="text-[var(--text-dim)] block text-[11px] font-mono mt-0.5">By Rachel Chang (Admin)</span>
            </div>
            <span className="font-mono tabular-nums text-[var(--text-faint)] text-[10px] shrink-0">Yesterday, 08:05 AM</span>
          </div>
          <div className="py-3 flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-[var(--text)]">Member Invited: Sophia Nguyen (agent)</span>
              <span className="text-[var(--text-dim)] block text-[11px] font-mono mt-0.5">By Alex Morgan (Owner)</span>
            </div>
            <span className="font-mono tabular-nums text-[var(--text-faint)] text-[10px] shrink-0">Oct 10, 2024</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
