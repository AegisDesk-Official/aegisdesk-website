"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Server,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Users,
  Radio,
  Lock,
  Key,
  CheckCircle2,
  Download,
  FileText,
  X,
  AlertCircle,
  CreditCard,
  ArrowDownLeft,
  Plus,
  Clock,
  Eye,
  Edit2,
  Pause,
  Cpu,
  RefreshCw,
  Copy,
} from "lucide-react";
import { OPERATOR_DATA } from "@/lib/dashboard-seed-data";
import { quote, pricingConfig } from "@/lib/pricing";
import { PIPELINE_STATES, ClientRecord } from "@/lib/db/operator-store";
import { Sparkline } from "@/components/admin";
import { DashboardSkeleton, DashboardEmptyState, DashboardErrorState } from "@/components/admin";

export default function OperatorConsolePage() {
  const [data, setData] = useState(OPERATOR_DATA);
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");
  const [activeTab, setActiveTab] = useState<
    "clients" | "demo_workspace" | "pipeline" | "payments" | "health" | "events" | "security" | "ai_engine"
  >("clients");

  // Real Clients & Demo Clients from backend store
  const [realClients, setRealClients] = useState<ClientRecord[]>([]);
  const [demoClients, setDemoClients] = useState<ClientRecord[]>([]);
  const [needsAttention, setNeedsAttention] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // AI Engine Tab State
  const [aiEngineStatus, setAiEngineStatus] = useState<any>(null);
  const [waitingDocuments, setWaitingDocuments] = useState<any[]>([]);
  const [orgSecrets, setOrgSecrets] = useState<Record<string, any>>({});
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [rotateSecretModalOrg, setRotateSecretModalOrg] = useState<ClientRecord | null>(null);
  const [rotateSecretMfa, setRotateSecretMfa] = useState("");
  const [rotateSecretError, setRotateSecretError] = useState<string | null>(null);
  const [isSubmittingRotateSecret, setIsSubmittingRotateSecret] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<{ orgName: string; secret: string } | null>(null);

  const loadAiEngineData = async () => {
    try {
      const res = await fetch("/api/operator/ai-engine");
      if (res.ok) {
        const json = await res.json();
        setAiEngineStatus(json.status);
        setWaitingDocuments(json.waitingDocuments || []);
        setOrgSecrets(json.orgSecrets || {});
      }
    } catch (err) {
      console.error("Failed to load AI engine data:", err);
    }
  };

  // Load operator data
  const loadData = async () => {
    try {
      const res = await fetch("/api/operator/clients");
      if (res.ok) {
        const json = await res.json();
        setRealClients(json.realClients || []);
        setDemoClients(json.demoClients || []);
        setNeedsAttention(json.needsAttention || []);
        if (json.pipeline) setPipelineStages(json.pipeline);
        if (json.leads) setLeads(json.leads);
      }
      loadAiEngineData();
    } catch (err) {
      console.error("Failed to load operator clients:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // =========================================================================
  // 1. PROVISION NEW CLIENT MODAL STATE
  // =========================================================================
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionName, setProvisionName] = useState("");
  const [provisionContact, setProvisionContact] = useState("");
  const [provisionEmail, setProvisionEmail] = useState("");
  const [provisionCurrency, setProvisionCurrency] = useState<"USD" | "INR">("USD");
  const [provisionVolume, setProvisionVolume] = useState<number>(5000);
  const [provisionSetup, setProvisionSetup] = useState<number>(3500);
  const [provisionRetainer, setProvisionRetainer] = useState<number>(1000);
  const [setupOverridden, setSetupOverridden] = useState(false);
  const [retainerOverridden, setRetainerOverridden] = useState(false);
  const [provisionMfa, setProvisionMfa] = useState("");
  const [isSubmittingProvision, setIsSubmittingProvision] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);

  const handleVolumeChange = (vol: number) => {
    setProvisionVolume(vol);
    const tiers = Math.max(0, Math.ceil((vol - pricingConfig.includedTickets) / pricingConfig.tierSize));
    if (!setupOverridden) {
      setProvisionSetup(pricingConfig.baseSetup + tiers * pricingConfig.setupPerTier);
    }
    if (!retainerOverridden) {
      setProvisionRetainer(pricingConfig.baseRetainer + tiers * pricingConfig.retainerPerTier);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProvision(true);
    setProvisionError(null);

    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "provision",
          name: provisionName,
          contactName: provisionContact,
          supportEmail: provisionEmail,
          currency: provisionCurrency,
          monthlyTickets: provisionVolume,
          setupFee: provisionSetup,
          monthlyRetainer: provisionRetainer,
          totpCode: provisionMfa,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to provision client");
      }

      setActionNotice({
        type: "success",
        text: `Client "${provisionName}" created in state Quoted. Deposit invoice ${resData.invoiceNumber} ($${(0.5 * provisionSetup).toLocaleString()}) sent to ${provisionEmail} with receipt PDF and Razorpay payment link. Added to Pipeline as "Deposit invoice sent".`,
      });
      setShowProvisionModal(false);
      setProvisionName("");
      setProvisionContact("");
      setProvisionEmail("");
      setProvisionMfa("");
      loadData();
    } catch (err: unknown) {
      setProvisionError(err instanceof Error ? err.message : "Failed to provision client");
    } finally {
      setIsSubmittingProvision(false);
    }
  };

  // =========================================================================
  // 2. CLIENT ROW ACTIONS STATE
  // =========================================================================
  const [editFeesClient, setEditFeesClient] = useState<ClientRecord | null>(null);
  const [editSetupFee, setEditSetupFee] = useState<number>(3500);
  const [editMonthlyRetainer, setEditMonthlyRetainer] = useState<number>(1000);
  const [isSubmittingEditFees, setIsSubmittingEditFees] = useState(false);
  const [editFeesError, setEditFeesError] = useState<string | null>(null);

  const [offlineModalClient, setOfflineModalClient] = useState<ClientRecord | null>(null);
  const [offlineInvoiceType, setOfflineInvoiceType] = useState<"deposit" | "settlement">("deposit");
  const [offlineReason, setOfflineReason] = useState("Wire transfer confirmed");
  const [offlineRef, setOfflineRef] = useState("");
  const [offlineMfa, setOfflineMfa] = useState("");
  const [isSubmittingOffline, setIsSubmittingOffline] = useState(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  const [activateLiveClient, setActivateLiveClient] = useState<ClientRecord | null>(null);
  const [activateLiveMfa, setActivateLiveMfa] = useState("");
  const [isSubmittingLive, setIsSubmittingLive] = useState(false);
  const [activateLiveError, setActivateLiveError] = useState<string | null>(null);

  const [refundClientTarget, setRefundClientTarget] = useState<ClientRecord | null>(null);
  const [refundAmount, setRefundAmount] = useState<string>("");
  const [refundReason, setRefundReason] = useState("");
  const [refundMfa, setRefundMfa] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  const [activeInviteLinkDisplay, setActiveInviteLinkDisplay] = useState<{ clientName: string; link: string } | null>(null);

  // Send / Resend Access Link
  const handleSendAccessLink = async (client: ClientRecord) => {
    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_invite", clientId: client.id }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to issue access link");
      setActiveInviteLinkDisplay({ clientName: client.name, link: resData.inviteLink });
      setActionNotice({
        type: "success",
        text: `Single-use activation link issued for ${client.name} (${client.supportEmail}). Valid for 7 days. Previous links revoked.`,
      });
      loadData();
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to issue access link",
      });
    }
  };

  // View As Client (Read-Only)
  const handleViewAsClient = async (client: ClientRecord) => {
    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "view_as", clientId: client.id, clientName: client.name }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to switch context");
      window.location.href = resData.redirectUrl;
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to switch context",
      });
    }
  };

  // Edit Agreed Fees
  const handleSaveEditFees = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFeesClient) return;
    setIsSubmittingEditFees(true);
    setEditFeesError(null);

    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit_fees",
          clientId: editFeesClient.id,
          setupFee: editSetupFee,
          monthlyRetainer: editMonthlyRetainer,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update fees");
      setActionNotice({
        type: "success",
        text: `Agreed fees for ${editFeesClient.name} updated: Setup $${editSetupFee.toLocaleString()}, Retainer $${editMonthlyRetainer.toLocaleString()}/mo.`,
      });
      setEditFeesClient(null);
      loadData();
    } catch (err: unknown) {
      setEditFeesError(err instanceof Error ? err.message : "Failed to edit fees");
    } finally {
      setIsSubmittingEditFees(false);
    }
  };

  // Mark Paid Offline
  const handleSaveOfflinePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offlineModalClient) return;
    setIsSubmittingOffline(true);
    setOfflineError(null);

    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark_paid",
          clientId: offlineModalClient.id,
          invoiceType: offlineInvoiceType,
          reference: offlineRef,
          reason: offlineReason,
          totpCode: offlineMfa,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to record offline payment");
      setActionNotice({
        type: "success",
        text: `${offlineModalClient.name} marked as paid offline (${offlineInvoiceType}). State updated to "${resData.client.state}".`,
      });
      setOfflineModalClient(null);
      setOfflineRef("");
      setOfflineMfa("");
      loadData();
    } catch (err: unknown) {
      setOfflineError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsSubmittingOffline(false);
    }
  };

  // Activate Live Mode
  const handleActivateLiveMode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateLiveClient) return;
    setIsSubmittingLive(true);
    setActivateLiveError(null);

    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "activate_live",
          clientId: activateLiveClient.id,
          totpCode: activateLiveMfa,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to activate live mode");
      setActionNotice({
        type: "success",
        text: `Live Mode activated for ${activateLiveClient.name}. Autonomous responses enabled.`,
      });
      setActivateLiveClient(null);
      setActivateLiveMfa("");
      loadData();
    } catch (err: unknown) {
      setActivateLiveError(err instanceof Error ? err.message : "Failed to activate live mode");
    } finally {
      setIsSubmittingLive(false);
    }
  };

  // Pause Client
  const handlePauseClient = async (client: ClientRecord) => {
    if (!confirm(`Are you sure you want to pause ${client.name}? Automated replies and shadow evaluations will halt.`)) {
      return;
    }
    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause", clientId: client.id }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to pause client");
      setActionNotice({ type: "success", text: `${client.name} transitioned to Paused.` });
      loadData();
    } catch (err: unknown) {
      setActionNotice({ type: "error", text: err instanceof Error ? err.message : "Failed to pause client" });
    }
  };

  // Refund Client
  const handleSaveRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundClientTarget) return;
    setIsSubmittingRefund(true);
    setRefundError(null);

    try {
      const res = await fetch("/api/operator/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refund",
          clientId: refundClientTarget.id,
          amount: parseFloat(refundAmount) || 0,
          reason: refundReason,
          totpCode: refundMfa,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to execute refund");
      setActionNotice({
        type: "success",
        text: `Refund executed for ${refundClientTarget.name}: $${parseFloat(refundAmount).toFixed(2)}. Logged to audit log.`,
      });
      setRefundClientTarget(null);
      setRefundAmount("");
      setRefundReason("");
      setRefundMfa("");
      loadData();
    } catch (err: unknown) {
      setRefundError(err instanceof Error ? err.message : "Failed to refund client");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  // AI Engine Actions
  const handleCheckHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch("/api/operator/ai-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "health_check" }),
      });
      const json = await res.json();
      if (res.ok) {
        setAiEngineStatus(json.status);
        setActionNotice({
          type: "success",
          text: json.result.ok
            ? `AI Engine health check passed: v${json.result.data.version} (${json.result.data.latencyMs}ms)${json.result.data.simulated ? " [Simulated]" : ""}`
            : `AI Engine check failed: ${json.result.error.message}`,
        });
      } else {
        throw new Error(json.error || "Health check failed");
      }
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to perform health check",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleRotateSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rotateSecretModalOrg) return;
    setIsSubmittingRotateSecret(true);
    setRotateSecretError(null);
    try {
      const res = await fetch("/api/operator/ai-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rotate_event_secret",
          orgId: rotateSecretModalOrg.id,
          totpCode: rotateSecretMfa,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to rotate credentials");
      setRevealedSecret({ orgName: rotateSecretModalOrg.name, secret: resData.secret });
      setRotateSecretModalOrg(null);
      setRotateSecretMfa("");
      loadAiEngineData();
    } catch (err: unknown) {
      setRotateSecretError(err instanceof Error ? err.message : "Failed to rotate credentials");
    } finally {
      setIsSubmittingRotateSecret(false);
    }
  };

  const handleRetryDocumentIngest = async (doc: any) => {
    try {
      const res = await fetch("/api/operator/ai-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "retry_document_ingest",
          orgId: doc.orgId,
          documentId: doc.id,
        }),
      });
      const resData = await res.json();
      if (res.ok) {
        setActionNotice({
          type: "success",
          text: `Document ${doc.filename} submitted to AI engine. Status: ${resData.document.status}.`,
        });
        loadAiEngineData();
      } else {
        throw new Error(resData.error || "Failed to submit document");
      }
    } catch (err: unknown) {
      setActionNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to submit document",
      });
    }
  };

  // Quote builder & Telemetry State
  const [builderTickets, setBuilderTickets] = useState<number>(5000);
  const [builderCost, setBuilderCost] = useState<number>(8.0);
  const [builderAuto, setBuilderAuto] = useState<number>(60);
  const activeBuilderQuote = quote({
    tickets: builderTickets,
    costPerTicket: builderCost,
    automationPct: builderAuto,
  });

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--text)] text-[14px] antialiased selection:bg-[var(--warn)]/20">
      {/* Top Hairline Header (Switch to Client Portal link removed) */}
      <header className="h-14 px-4 sm:px-6 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/operator" className="flex items-center gap-2 group">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--warn)]" />
            <span className="font-mono text-[13px] font-medium tracking-tight text-[var(--text)] group-hover:text-white transition-colors">
              AegisDesk // Owner Console
            </span>
          </Link>
          <span className="hidden sm:inline text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[rgba(227,179,65,0.12)] text-[var(--warn)] border border-[rgba(227,179,65,0.25)]">
            Executive Root (AAL2)
          </span>
        </div>

        <div className="flex items-center gap-3 text-[13px] font-mono">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] text-[var(--text-dim)]">
            <span className="text-[var(--text-faint)]">MRR:</span>
            <span className="text-[var(--warn)] font-semibold tabular-nums">
              ${data.monthlyRecurringRevenue.toLocaleString()}/mo
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Action feedback notice */}
        {actionNotice && (
          <div
            className={`p-3.5 rounded-[8px] border text-[13px] font-mono flex items-center justify-between gap-3 ${
              actionNotice.type === "success"
                ? "bg-[rgba(111,216,166,0.08)] border-[rgba(111,216,166,0.3)] text-[var(--verified)]"
                : "bg-[rgba(229,100,92,0.08)] border-[rgba(229,100,92,0.3)] text-[var(--blocked)]"
            }`}
          >
            <span>{actionNotice.text}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-[var(--text-dim)] hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* =================================================================== */}
        {/* NEEDS ATTENTION STRIP                                               */}
        {/* =================================================================== */}
        {needsAttention.length > 0 && (
          <section
            aria-label="Needs Attention Strip"
            className="rounded-[10px] bg-[rgba(227,179,65,0.06)] border border-[rgba(227,179,65,0.25)] p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--warn)] animate-pulse" />
                <h3 className="text-[13px] font-mono uppercase tracking-wider text-[var(--warn)] font-medium">
                  Needs Attention ({needsAttention.length})
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[var(--text-faint)]">
                Unpaid deposits • Pending settlements • Webhook alerts • Link expirations
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {needsAttention.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex items-start justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-[13px] font-medium text-[var(--text)] block">{item.title}</span>
                    <p className="text-[12px] text-[var(--text-dim)] leading-relaxed">{item.description}</p>
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${
                      item.severity === "blocked"
                        ? "bg-[rgba(229,100,92,0.12)] text-[var(--blocked)] border border-[rgba(229,100,92,0.25)]"
                        : "bg-[rgba(227,179,65,0.12)] text-[var(--warn)] border border-[rgba(227,179,65,0.25)]"
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* EXECUTIVE SUMMARY TILES                                             */}
        {/* =================================================================== */}
        <section aria-label="Executive Portfolio Metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
            <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Monthly recurring revenue</span>
            <div className="text-[22px] font-mono font-medium tabular-nums text-[var(--warn)]">
              ${data.monthlyRecurringRevenue.toLocaleString()}
            </div>
            <p className="text-[12px] font-mono text-[var(--text-faint)] mt-2">Sum of active client retainers</p>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
            <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Cash position</span>
            <div className="text-[22px] font-mono font-medium tabular-nums text-[var(--text)]">
              ${data.cashPosition.paidMonth.toLocaleString()}
            </div>
            <p className="text-[12px] font-mono text-[var(--text-faint)] mt-2">
              Invoiced: ${data.cashPosition.invoicedMonth.toLocaleString()} • Overdue: ${data.cashPosition.overdueMonth.toLocaleString()}
            </p>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
            <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Reliability (Events &amp; Site)</span>
            <div className="text-[22px] font-mono font-medium tabular-nums text-[var(--verified)]">
              {data.systemHealth.uptime30d}
            </div>
            <p className="text-[12px] font-mono text-[var(--text-faint)] mt-2">
              Error rate: {data.systemHealth.errorRate} • Events p95: {data.systemHealth.p95LatencyEvents}
            </p>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
            <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Security events</span>
            <div className="text-[22px] font-mono font-medium tabular-nums text-[var(--text)]">
              {data.securityEvents.length} Active
            </div>
            <p className="text-[12px] font-mono text-[var(--text-faint)] mt-2">0 breaches • 4 threats neutralized</p>
          </div>
        </section>

        {/* =================================================================== */}
        {/* TAB NAVIGATION                                                      */}
        {/* =================================================================== */}
        <div className="flex items-center gap-1 border-b border-[var(--line)] text-[13px] font-mono overflow-x-auto">
          <button
            onClick={() => setActiveTab("clients")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "clients"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            Clients Portfolio ({realClients.length})
          </button>
          <button
            onClick={() => setActiveTab("demo_workspace")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "demo_workspace"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            Demo workspace ({demoClients.length})
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "pipeline"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            Pipeline ({pipelineStages.reduce((acc, s) => acc + s.count, 0)})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "payments"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            Payments &amp; Cash Position
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "health"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            System Health &amp; AI Cost
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "events"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-[var(--verified)]" />
            <span>API Events</span>
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "security"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[var(--warn)]" />
            <span>Security &amp; Rejections</span>
          </button>
          <button
            onClick={() => setActiveTab("ai_engine")}
            className={`px-3.5 py-2.5 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "ai_engine"
                ? "border-[var(--warn)] text-[var(--warn)] font-medium"
                : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-[var(--glow)]" />
            <span>AI Engine</span>
            {waitingDocuments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[rgba(227,179,65,0.15)] text-[var(--warn)] text-[10px] tabular-nums font-mono">
                {waitingDocuments.length}
              </span>
            )}
          </button>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: REAL CLIENTS TABLE (FIRST RUN HANDLING)                      */}
        {/* =================================================================== */}
        {activeTab === "clients" && (
          <section aria-label="Clients Table" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-medium text-[var(--text)]">Clients Portfolio</h3>
                <p className="text-[13px] text-[var(--text-dim)]">
                  Live client tenants with agreed fees, pipeline progression, and administrative actions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProvisionError(null);
                  setShowProvisionModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] text-[13px] font-medium hover:bg-white transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Provision new client</span>
              </button>
            </div>

            {realClients.length === 0 ? (
              <div className="py-12 px-4 text-center rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
                <Users className="w-8 h-8 text-[var(--text-dim)] mx-auto" />
                <h4 className="text-[15px] font-medium text-[var(--text)]">No clients yet</h4>
                <p className="text-[13px] text-[var(--text-dim)] max-w-md mx-auto">
                  No active customer organizations provisioned. Click below to specify agreed terms and issue deposit invoice 1.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setProvisionError(null);
                    setShowProvisionModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-[8px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[13px] font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Provision new client</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[var(--line)] rounded-[8px]">
                <table className="w-full text-left text-[13px] font-mono">
                  <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[11px] text-[var(--text-dim)] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Client</th>
                      <th className="py-2.5 px-3">Pipeline State</th>
                      <th className="py-2.5 px-3 text-right">Agreed Setup</th>
                      <th className="py-2.5 px-3 text-right">Monthly Retainer</th>
                      <th className="py-2.5 px-3">Shadow Window</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {realClients.map((client) => {
                      const isDepositPaid = client.state !== "Deposit invoice sent" && client.state !== "Booked call";
                      return (
                        <tr key={client.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-sans font-medium text-[var(--text)] block text-[13px]">
                              {client.name}
                            </span>
                            <span className="text-[11px] text-[var(--text-dim)] block">
                              {client.contactName} • {client.supportEmail}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[11px] uppercase font-mono font-medium ${
                                client.state === "Live"
                                  ? "bg-[rgba(111,216,166,0.1)] text-[var(--verified)] border border-[rgba(111,216,166,0.3)]"
                                  : client.state === "Deposit paid" || client.state === "Shadow Validation"
                                  ? "bg-[rgba(227,179,65,0.1)] text-[var(--warn)] border border-[rgba(227,179,65,0.3)]"
                                  : client.state === "Paused"
                                  ? "bg-[rgba(229,100,92,0.1)] text-[var(--blocked)] border border-[rgba(229,100,92,0.3)]"
                                  : "bg-[var(--surface-2)] text-[var(--text-dim)] border border-[var(--line)]"
                              }`}
                            >
                              {client.state}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-[var(--text)]">
                            ${client.setupFee.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums text-[var(--text)]">
                            ${client.monthlyRetainer.toLocaleString()}/mo
                          </td>
                          <td className="py-3 px-3 text-[12px] text-[var(--text-dim)]">
                            {client.shadowStartedAt && client.shadowEndsAt ? (
                              <span>
                                {client.shadowStartedAt} → {client.shadowEndsAt}
                              </span>
                            ) : (
                              <span>Starts on deposit</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {isDepositPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleSendAccessLink(client)}
                                  className="h-7 px-2.5 rounded bg-[var(--paper)] text-[var(--paper-ink)] text-[11px] font-medium hover:bg-white"
                                >
                                  {client.activeInvite ? "Re-send link" : "Send access link"}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleViewAsClient(client)}
                                className="h-7 px-2 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[11px] text-[var(--text)] border border-[var(--line)] flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-[var(--text-dim)]" />
                                <span>View as client</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditFeesClient(client);
                                  setEditSetupFee(client.setupFee);
                                  setEditMonthlyRetainer(client.monthlyRetainer);
                                  setEditFeesError(null);
                                }}
                                className="h-7 px-2 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[11px] text-[var(--text)] border border-[var(--line)]"
                              >
                                Edit fees
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOfflineModalClient(client);
                                  setOfflineError(null);
                                  setOfflineRef("");
                                  setOfflineMfa("");
                                }}
                                className="h-7 px-2 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[11px] text-[var(--warn)] border border-[rgba(227,179,65,0.3)]"
                              >
                                Paid offline
                              </button>

                              {client.state !== "Live" && isDepositPaid && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActivateLiveClient(client);
                                    setActivateLiveMfa("");
                                    setActivateLiveError(null);
                                  }}
                                  className="h-7 px-2 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[11px] text-[var(--verified)] border border-[rgba(111,216,166,0.3)]"
                                >
                                  Activate live
                                </button>
                              )}

                              {client.state !== "Paused" && (
                                <button
                                  type="button"
                                  onClick={() => handlePauseClient(client)}
                                  className="h-7 px-2 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[11px] text-[var(--text-dim)] border border-[var(--line)]"
                                >
                                  Pause
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setRefundClientTarget(client);
                                  setRefundAmount(String(client.depositAmount));
                                  setRefundReason("");
                                  setRefundMfa("");
                                  setRefundError(null);
                                }}
                                className="h-7 px-2 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[11px] text-[var(--blocked)] border border-[rgba(229,100,92,0.3)]"
                              >
                                Refund
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 2: DEMO WORKSPACE (is_demo workspace with sample data)          */}
        {/* =================================================================== */}
        {activeTab === "demo_workspace" && (
          <section aria-label="Demo Workspace" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div className="w-full bg-[var(--surface-2)] border border-[rgba(227,179,65,0.3)] py-1.5 px-4 text-center font-mono text-[12px] text-[var(--warn)] rounded-[8px]">
              Demo workspace · sample data
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-medium text-[var(--text)]">Sample Workspace (Apex Retail)</h3>
                <p className="text-[13px] text-[var(--text-dim)]">
                  Isolated sandbox demonstrating live metrics, 14-day shadow calibration, and telemetry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleViewAsClient(demoClients[0] || realClients[0])}
                className="inline-flex items-center gap-1.5 px-3.5 h-8 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] text-[12px] font-medium hover:bg-white"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View demo client portal</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-[var(--line)] rounded-[8px]">
              <table className="w-full text-left text-[13px] font-mono">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[11px] text-[var(--text-dim)] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Client</th>
                    <th className="py-2.5 px-3">State</th>
                    <th className="py-2.5 px-3 text-right">Revenue</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3 text-right">Handoff</th>
                    <th className="py-2.5 px-3 text-right">AI Cost</th>
                    <th className="py-2.5 px-3 text-right">Margin</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {demoClients.map((client) => (
                    <tr key={client.id} className="hover:bg-[var(--surface-2)]/40 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-sans font-medium text-[var(--text)] block text-[13px]">
                          {client.name}
                        </span>
                        <span className="text-[11px] text-[var(--text-dim)]">
                          {client.id} • Threshold: {client.confidenceThreshold}%
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] uppercase font-mono bg-[rgba(227,179,65,0.1)] text-[var(--warn)] border border-[rgba(227,179,65,0.3)]">
                          {client.state}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[var(--text)]">
                        ${client.monthlyRetainer.toLocaleString()}/mo
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[var(--text-dim)]">
                        {client.volume.toLocaleString()} tickets
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[var(--text-dim)]">
                        {client.handoffRate}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[var(--text-dim)]">
                        ${client.aiCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-[var(--verified)]">
                        {client.margin}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleViewAsClient(client)}
                          className="h-7 px-2.5 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-2)]/80 text-[11px] text-[var(--text)] border border-[var(--line)] inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-[var(--text-dim)]" />
                          <span>View as client</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PIPELINE (7 STATES IN ORDER)                                 */}
        {/* =================================================================== */}
        {activeTab === "pipeline" && (
          <section aria-label="Commercial Pipeline" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-medium text-[var(--text)]">Commercial Pipeline</h3>
              <p className="text-[13px] text-[var(--text-dim)]">
                Ordered progression: Booked call $\rightarrow$ Deposit invoice sent $\rightarrow$ Deposit paid $\rightarrow$ Shadow Validation $\rightarrow$ Settlement due $\rightarrow$ Live $\rightarrow$ Paused.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
              {pipelineStages.map((stage) => (
                <div
                  key={stage.stage}
                  className="p-3 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] flex flex-col justify-between"
                >
                  <span className="text-[11px] font-mono text-[var(--text-faint)] uppercase truncate" title={stage.label}>
                    {stage.label}
                  </span>
                  <div className="my-2">
                    <span className="text-[24px] font-mono font-medium tabular-nums text-[var(--text)]">
                      {stage.count}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--text-dim)] ml-1">clients</span>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--warn)]">
                    ${stage.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {/* Booked Scoping Calls & Leads Table */}
            <div className="pt-4 border-t border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-mono uppercase tracking-[0.08em] text-[var(--text-faint)]">
                  Inbound Cal.com Scoping Calls &amp; Leads ({leads.length})
                </h4>
                <span className="text-[11px] font-mono text-[var(--verified)]">
                  Stage: Booked call
                </span>
              </div>

              {leads.length === 0 ? (
                <div className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] text-center text-[13px] font-mono text-[var(--text-faint)]">
                  No active scoping calls scheduled yet. New bookings from Cal.com appear here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[8px] border border-[var(--line)]">
                  <table className="w-full text-left font-mono text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--text-faint)] uppercase text-[10px]">
                        <th className="p-3 font-normal">Attendee / Contact</th>
                        <th className="p-3 font-normal">Company</th>
                        <th className="p-3 font-normal">Meeting Time</th>
                        <th className="p-3 font-normal">Helpdesk</th>
                        <th className="p-3 font-normal">Ticket Volume</th>
                        <th className="p-3 font-normal">Stage</th>
                        <th className="p-3 font-normal text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)] text-[var(--text)]">
                      {leads.map((l) => (
                        <tr key={l.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                          <td className="p-3 font-sans">
                            <strong className="block text-[var(--text)] font-medium text-[13px]">{l.name}</strong>
                            <span className="text-[11px] font-mono text-[var(--text-dim)]">{l.email}</span>
                          </td>
                          <td className="p-3 text-[var(--text)] font-sans text-[13px]">{l.company}</td>
                          <td className="p-3 text-[var(--verified)] text-[11px]">
                            {l.meeting_time ? new Date(l.meeting_time).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "Scheduled"}
                          </td>
                          <td className="p-3 text-[var(--text-dim)] font-sans text-[12px]">{l.helpdesk_used || "Zendesk"}</td>
                          <td className="p-3 text-[var(--text-dim)]">{l.tickets_per_month || "1,000 - 5,000"}</td>
                          <td className="p-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-mono bg-[rgba(111,216,166,0.12)] text-[var(--verified)]">
                              {l.stage}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setProvisionName(l.company !== "Company Undisclosed" ? l.company : "");
                                setProvisionContact(l.name !== "Prospective Client" ? l.name : "");
                                setProvisionEmail(l.email);
                                const numTickets = parseInt((l.tickets_per_month || "").replace(/[^0-9]/g, ""), 10);
                                if (!isNaN(numTickets) && numTickets > 0) {
                                  setProvisionVolume(numTickets);
                                }
                                setShowProvisionModal(true);
                              }}
                              className="px-2.5 py-1 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--glow)] text-[11px] text-[var(--glow)] transition-colors"
                            >
                              Issue Proposal &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 4: PAYMENTS & CASH POSITION                                     */}
        {/* =================================================================== */}
        {activeTab === "payments" && (
          <section aria-label="Payments and Invoices" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-medium text-[var(--text)]">Payments &amp; Retainers</h3>
              <p className="text-[13px] text-[var(--text-dim)]">
                Razorpay payment webhooks and offline wire ledger.
              </p>
            </div>
            <div className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] font-mono text-[13px] text-[var(--text-dim)]">
              All payment settlements reconcile directly to bank settlement accounts with SHA-256 HMAC proofs.
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 5: SYSTEM HEALTH & AI COST                                      */}
        {/* =================================================================== */}
        {activeTab === "health" && (
          <section aria-label="System Health" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-medium text-[var(--text)]">System Health &amp; Inference Economics</h3>
              <p className="text-[13px] text-[var(--text-dim)]">
                Real-time uptime, vector latency, and gross model inference costs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[13px]">
              <div className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1">
                <span className="text-[var(--text-faint)]">Uptime (30d)</span>
                <p className="text-[20px] text-[var(--verified)] font-medium">99.98%</p>
              </div>
              <div className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1">
                <span className="text-[var(--text-faint)]">Vector Latency (p95)</span>
                <p className="text-[20px] text-[var(--text)] font-medium">124ms</p>
              </div>
              <div className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1">
                <span className="text-[var(--text-faint)]">Gross Margin</span>
                <p className="text-[20px] text-[var(--glow)] font-medium">92.4%</p>
              </div>
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 6: API EVENTS                                                   */}
        {/* =================================================================== */}
        {activeTab === "events" && (
          <section aria-label="API Events" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-medium text-[var(--text)]">API Events Telemetry</h3>
              <p className="text-[13px] text-[var(--text-dim)]">
                Audit stream recording ticket evaluations, approvals, and escalations.
              </p>
            </div>
            <div className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] font-mono text-[13px] text-[var(--verified)]">
              ● Webhook listener operational: events stream into tenant-isolated partitions.
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 7: SECURITY & REJECTIONS                                        */}
        {/* =================================================================== */}
        {activeTab === "security" && (
          <section aria-label="Security and Rejections" className="rounded-[10px] bg-[var(--surface)] border border-[var(--line)] p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="text-[15px] font-medium text-[var(--text)]">Security &amp; Rejection Ledger</h3>
              <p className="text-[13px] text-[var(--text-dim)]">
                Neutralized attack vectors, brute-force IP rate lockouts, and HMAC discrepancies.
              </p>
            </div>
            <div className="p-4 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] font-mono text-[13px] text-[var(--text-dim)]">
              All unauthorized requests to /operator or /api/operator/* return stealth 404 responses identical to unknown routes.
            </div>
          </section>
        )}

        {/* =================================================================== */}
        {/* TAB 8: AI ENGINE INTEGRATION                                        */}
        {/* =================================================================== */}
        {activeTab === "ai_engine" && (
          <section aria-label="AI Engine Integration" className="space-y-6">
            {/* Header with Health Check Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[16px] font-medium text-[var(--text)]">
                    External AI Answering Engine
                  </h3>
                  {aiEngineStatus?.connected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[rgba(111,216,166,0.12)] border border-[rgba(111,216,166,0.3)] font-mono text-[11px] text-[var(--verified)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--verified)]" />
                      CONNECTED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[var(--surface-2)] border border-[var(--line)] font-mono text-[11px] text-[var(--text-dim)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-dim)]" />
                      NOT CONNECTED YET
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
                  Clean boundary integration points. AegisDesk contains zero AI; all inference is hosted externally.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCheckHealth}
                disabled={isCheckingHealth}
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--glow)] text-[12px] font-mono text-[var(--text)] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? "animate-spin text-[var(--glow)]" : ""}`} />
                <span>{isCheckingHealth ? "Probing Engine..." : "Check Health Now"}</span>
              </button>
            </div>

            {/* 4 Summary Telemetry Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Connection Status */}
              <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
                <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Engine Connection</span>
                <div className="text-[16px] font-mono font-medium">
                  {aiEngineStatus?.connected ? (
                    <span className="text-[var(--verified)] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Operational
                    </span>
                  ) : aiEngineStatus?.configured ? (
                    <span className="text-[var(--warn)] flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Unreachable
                    </span>
                  ) : (
                    <span className="text-[var(--text-dim)]">Not connected yet</span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-[var(--text-faint)] mt-2">
                  {aiEngineStatus?.configured ? "PIPELINE_BASE_URL set" : "Waiting for configuration"}
                </p>
              </div>

              {/* Card 2: Masked Base URL */}
              <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
                <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Base URL (Masked)</span>
                <div className="text-[13px] font-mono text-[var(--text)] truncate">
                  {aiEngineStatus?.baseUrlMasked || "None configured"}
                </div>
                <p className="text-[11px] font-mono text-[var(--text-faint)] mt-2">
                  Configured via PIPELINE_BASE_URL
                </p>
              </div>

              {/* Card 3: Last Health Check */}
              <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
                <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Last Health Check</span>
                <div className="text-[13px] font-mono text-[var(--text)]">
                  {aiEngineStatus?.lastHealth ? (
                    <span className={aiEngineStatus.lastHealth.ok ? "text-[var(--verified)]" : "text-[var(--blocked)]"}>
                      {aiEngineStatus.lastHealth.ok ? `OK (${aiEngineStatus.lastHealth.latencyMs}ms)` : "Failed"}
                      {aiEngineStatus.lastHealth.simulated && " [Simulated]"}
                    </span>
                  ) : (
                    <span className="text-[var(--text-faint)]">Never probed</span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-[var(--text-faint)] mt-2">
                  {aiEngineStatus?.lastHealth?.at ? aiEngineStatus.lastHealth.at.slice(0, 19).replace("T", " ") + " UTC" : "Pending first probe"}
                </p>
              </div>

              {/* Card 4: Last Event Received */}
              <div className="p-3.5 rounded-[8px] bg-[var(--surface)] border border-[var(--line)] flex flex-col justify-between">
                <span className="text-[12px] font-mono text-[var(--text-dim)] mb-1">Last Event Received</span>
                <div className="text-[13px] font-mono text-[var(--text)] truncate">
                  {aiEngineStatus?.lastEvent ? (
                    <span className="text-[var(--glow)]">
                      {aiEngineStatus.lastEvent.type}
                    </span>
                  ) : (
                    <span className="text-[var(--text-faint)]">No events yet</span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-[var(--text-faint)] mt-2">
                  {aiEngineStatus?.lastEvent?.at ? aiEngineStatus.lastEvent.at.slice(0, 19).replace("T", " ") + " UTC" : "Waiting for engine telemetry"}
                </p>
              </div>
            </div>

            {/* Section: Documents Waiting for Ingestion */}
            <div className="p-4 sm:p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-medium text-[var(--text)]">
                    Documents Waiting for Ingestion ({waitingDocuments.length})
                  </h4>
                  <p className="text-[12px] text-[var(--text-dim)]">
                    PDFs stored securely in private storage awaiting ingestion and vectorization by the external engine.
                  </p>
                </div>
                {waitingDocuments.length > 0 && (
                  <span className="font-mono text-[11px] text-[var(--warn)] px-2 py-0.5 rounded bg-[rgba(227,179,65,0.1)] border border-[rgba(227,179,65,0.2)]">
                    Waiting for engine
                  </span>
                )}
              </div>

              {waitingDocuments.length === 0 ? (
                <div className="p-6 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] text-center space-y-1">
                  <p className="text-[13px] text-[var(--text-dim)]">
                    No documents waiting for ingestion.
                  </p>
                  <p className="text-[11px] font-mono text-[var(--text-faint)]">
                    Uploaded client knowledge files will queue here automatically whenever the engine is offline.
                  </p>
                </div>
              ) : (
                <div className="border border-[var(--line)] rounded-[8px] overflow-hidden">
                  <table className="w-full text-left text-[12px] font-mono">
                    <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--text-dim)]">
                      <tr>
                        <th className="p-3">FILENAME</th>
                        <th className="p-3">ORGANIZATION</th>
                        <th className="p-3">FILE SIZE</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--line)]">
                      {waitingDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[var(--surface-2)]/50">
                          <td className="p-3 text-[var(--text)] font-sans">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-[var(--warn)] shrink-0" />
                              <span>{doc.filename}</span>
                            </div>
                          </td>
                          <td className="p-3 text-[var(--text-dim)] truncate max-w-[140px]">{doc.orgId}</td>
                          <td className="p-3 text-[var(--text-dim)]">{(doc.sizeBytes / 1024).toFixed(0)} KB</td>
                          <td className="p-3">
                            <span className="text-[var(--warn)] inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Waiting for engine
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRetryDocumentIngest(doc)}
                              className="px-2.5 py-1 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--glow)] text-[11px] text-[var(--text)] transition-colors"
                            >
                              Submit Ingest &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section: Organization Inbound Events Credentials (POST /api/events) */}
            <div className="p-4 sm:p-5 rounded-[10px] bg-[var(--surface)] border border-[var(--line)] space-y-3">
              <div>
                <h4 className="text-[14px] font-medium text-[var(--text)]">
                  Inbound Events API Credentials (POST /api/events)
                </h4>
                <p className="text-[12px] text-[var(--text-dim)]">
                  Each organization requires a unique HMAC-SHA256 secret to stream resolution telemetry and gate passes to AegisDesk. Secrets are encrypted with AES-256-GCM at rest and revealed exactly once upon generation.
                </p>
              </div>

              <div className="border border-[var(--line)] rounded-[8px] overflow-hidden">
                <table className="w-full text-left text-[12px] font-mono">
                  <thead className="bg-[var(--surface-2)] border-b border-[var(--line)] text-[var(--text-dim)]">
                    <tr>
                      <th className="p-3">ORGANIZATION</th>
                      <th className="p-3">ORG ID</th>
                      <th className="p-3">SECRET HINT</th>
                      <th className="p-3">LAST ROTATED</th>
                      <th className="p-3 text-right">CREDENTIAL ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)]">
                    {[...realClients, ...demoClients].length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-[var(--text-dim)] font-mono text-[12px]">
                          No client organizations provisioned yet.
                        </td>
                      </tr>
                    ) : (
                      [...realClients, ...demoClients].map((client) => {
                        const meta = orgSecrets[client.id];
                        return (
                          <tr key={client.id} className="hover:bg-[var(--surface-2)]/50">
                            <td className="p-3 text-[var(--text)] font-sans font-medium">
                              <div className="flex items-center gap-1.5">
                                <span>{client.name}</span>
                                {client.isDemo && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface-2)] text-[var(--text-dim)] border border-[var(--line)]">
                                    demo
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-[var(--text-dim)] truncate max-w-[150px]">{client.id}</td>
                            <td className="p-3">
                              {meta ? (
                                <span className="text-[var(--glow)]">•••• {meta.hint}</span>
                              ) : (
                                <span className="text-[var(--text-faint)]">Default key</span>
                              )}
                            </td>
                            <td className="p-3 text-[var(--text-dim)]">
                              {meta?.rotatedAt ? meta.rotatedAt.slice(0, 10) : meta?.createdAt ? meta.createdAt.slice(0, 10) : "Initial"}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setRotateSecretModalOrg(client);
                                  setRotateSecretError(null);
                                  setRotateSecretMfa("");
                                }}
                                className="px-2.5 py-1 rounded-[6px] bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--warn)] text-[11px] text-[var(--warn)] transition-colors"
                              >
                                Rotate Secret &rarr;
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =================================================================== */}
      {/* MODAL 1: + PROVISION NEW CLIENT DIALOG                              */}
      {/* =================================================================== */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h4 className="text-[16px] font-medium text-[var(--text)]">Provision New Client</h4>
                <p className="text-[12px] text-[var(--text-dim)]">
                  Agree commercial fees, generate deposit invoice, and create organization.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProvisionModal(false)}
                className="text-[var(--text-dim)] hover:text-white"
              >
                ✕
              </button>
            </div>

            {provisionError && (
              <div className="p-3 rounded bg-[rgba(229,100,92,0.1)] border border-[rgba(229,100,92,0.3)] text-[12px] text-[var(--blocked)] font-mono">
                {provisionError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-3.5 text-[13px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Corp"
                    value={provisionName}
                    onChange={(e) => setProvisionName(e.target.value)}
                    className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Connor"
                    value={provisionContact}
                    onChange={(e) => setProvisionContact(e.target.value)}
                    className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                    Support Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="support@acme.com"
                    value={provisionEmail}
                    onChange={(e) => setProvisionEmail(e.target.value)}
                    className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                    Billing Currency
                  </label>
                  <select
                    value={provisionCurrency}
                    onChange={(e) => setProvisionCurrency(e.target.value as "USD" | "INR")}
                    className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)] font-mono"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                  Monthly Ticket Volume: <strong className="text-[var(--text)]">{provisionVolume.toLocaleString()} tickets</strong>
                </label>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={provisionVolume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                  className="w-full accent-[var(--warn)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                    Setup Fee ({provisionCurrency})
                  </label>
                  <input
                    type="number"
                    value={provisionSetup}
                    onChange={(e) => {
                      setProvisionSetup(Number(e.target.value));
                      setSetupOverridden(true);
                    }}
                    className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)] font-mono"
                  />
                  <span className="text-[11px] font-mono text-[var(--text-faint)]">Prefilled from pricing</span>
                </div>
                <div>
                  <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                    Monthly Retainer ({provisionCurrency})
                  </label>
                  <input
                    type="number"
                    value={provisionRetainer}
                    onChange={(e) => {
                      setProvisionRetainer(Number(e.target.value));
                      setRetainerOverridden(true);
                    }}
                    className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)] font-mono"
                  />
                  <span className="text-[11px] font-mono text-[var(--text-faint)]">Prefilled from pricing</span>
                </div>
              </div>

              {/* Automatic Fee Calculations */}
              <div className="p-3.5 rounded-[8px] bg-[var(--surface-2)] border border-[var(--line)] space-y-1 font-mono text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-dim)]">50% Setup Deposit (Invoice 1):</span>
                  <strong className="text-[var(--warn)] tabular-nums">
                    ${(0.5 * provisionSetup).toLocaleString()}
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[var(--line)]">
                  <span className="text-[var(--text-dim)]">Final Settlement (0.5x setup + retainer):</span>
                  <strong className="text-[var(--text)] tabular-nums">
                    ${(0.5 * provisionSetup + provisionRetainer).toLocaleString()}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-mono text-[var(--warn)] mb-1">
                  Fresh Authenticator Code (6-digit TOTP) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={provisionMfa}
                  onChange={(e) => setProvisionMfa(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--warn)] px-3 text-[var(--text)] font-mono text-center tracking-widest text-[16px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-3 h-8 rounded text-[13px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProvision}
                  className="px-4 h-9 rounded bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[13px] font-medium"
                >
                  {isSubmittingProvision ? "Creating..." : "Create client and send deposit invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: EDIT AGREED FEES                                           */}
      {/* =================================================================== */}
      {editFeesClient && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <h4 className="text-[15px] font-medium text-[var(--text)]">Edit Agreed Fees</h4>
              <button onClick={() => setEditFeesClient(null)} className="text-[var(--text-dim)] hover:text-white">✕</button>
            </div>
            <p className="text-[12px] text-[var(--text-dim)]">
              Updating fees for <strong className="text-[var(--text)]">{editFeesClient.name}</strong>. Permitted only before the final settlement invoice is issued.
            </p>

            {editFeesError && (
              <div className="p-2.5 rounded bg-[rgba(229,100,92,0.1)] border border-[rgba(229,100,92,0.3)] text-[12px] text-[var(--blocked)] font-mono">
                {editFeesError}
              </div>
            )}

            <form onSubmit={handleSaveEditFees} className="space-y-3 font-mono text-[13px]">
              <div>
                <label className="block text-[11px] text-[var(--text-dim)] mb-1">Setup Fee ($)</label>
                <input
                  type="number"
                  value={editSetupFee}
                  onChange={(e) => setEditSetupFee(Number(e.target.value))}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-dim)] mb-1">Monthly Retainer ($)</label>
                <input
                  type="number"
                  value={editMonthlyRetainer}
                  onChange={(e) => setEditMonthlyRetainer(Number(e.target.value))}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                />
              </div>
              <div className="p-3 rounded bg-[var(--surface-2)] border border-[var(--line)] text-[12px]">
                <p>New 50% Deposit: <strong className="text-[var(--warn)]">${(0.5 * editSetupFee).toLocaleString()}</strong></p>
                <p>New Settlement: <strong className="text-[var(--text)]">${(0.5 * editSetupFee + editMonthlyRetainer).toLocaleString()}</strong></p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditFeesClient(null)}
                  className="px-3 h-8 rounded text-[12px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEditFees}
                  className="px-3.5 h-8 rounded bg-[var(--paper)] text-[var(--paper-ink)] text-[12px] font-medium"
                >
                  {isSubmittingEditFees ? "Saving..." : "Save Updated Fees"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: MARK INVOICE PAID OFFLINE                                  */}
      {/* =================================================================== */}
      {offlineModalClient && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <h4 className="text-[15px] font-medium text-[var(--text)]">Mark Invoice Paid Offline</h4>
              <button onClick={() => setOfflineModalClient(null)} className="text-[var(--text-dim)] hover:text-white">✕</button>
            </div>
            <p className="text-[12px] text-[var(--text-dim)]">
              Recording offline wire or manual deposit payment for <strong className="text-[var(--text)]">{offlineModalClient.name}</strong>.
            </p>

            {offlineError && (
              <div className="p-2.5 rounded bg-[rgba(229,100,92,0.1)] border border-[rgba(229,100,92,0.3)] text-[12px] text-[var(--blocked)] font-mono">
                {offlineError}
              </div>
            )}

            <form onSubmit={handleSaveOfflinePayment} className="space-y-3 font-mono text-[13px]">
              <div>
                <label className="block text-[11px] text-[var(--text-dim)] mb-1">Invoice Type</label>
                <select
                  value={offlineInvoiceType}
                  onChange={(e) => setOfflineInvoiceType(e.target.value as "deposit" | "settlement")}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-2 text-[var(--text)]"
                >
                  <option value="deposit">Deposit Invoice 1 (${offlineModalClient.depositAmount.toLocaleString()})</option>
                  <option value="settlement">Final Settlement Invoice 2 (${offlineModalClient.settlementAmount.toLocaleString()})</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-dim)] mb-1">Payment Reference *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WIRE-CHASE-99214"
                  value={offlineRef}
                  onChange={(e) => setOfflineRef(e.target.value)}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-dim)] mb-1">Reason / Notes *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. International wire settlement received"
                  value={offlineReason}
                  onChange={(e) => setOfflineReason(e.target.value)}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--warn)] mb-1">Fresh Authenticator Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={offlineMfa}
                  onChange={(e) => setOfflineMfa(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--warn)] px-3 text-[var(--text)] text-center tracking-widest text-[16px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfflineModalClient(null)}
                  className="px-3 h-8 rounded text-[12px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOffline}
                  className="px-3.5 h-8 rounded bg-[var(--paper)] text-[var(--paper-ink)] text-[12px] font-medium"
                >
                  {isSubmittingOffline ? "Recording..." : "Record Offline Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: ACTIVATE LIVE MODE CONFIRMATION                            */}
      {/* =================================================================== */}
      {activateLiveClient && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <h4 className="text-[15px] font-medium text-[var(--text)]">Activate Live Mode</h4>
              <button onClick={() => setActivateLiveClient(null)} className="text-[var(--text-dim)] hover:text-white">✕</button>
            </div>
            <p className="text-[12px] text-[var(--text-dim)]">
              This will transition <strong className="text-[var(--text)]">{activateLiveClient.name}</strong> from Shadow Validation to Live. Verified autonomous responses will be sent directly to customers.
            </p>

            {activateLiveError && (
              <div className="p-2.5 rounded bg-[rgba(229,100,92,0.1)] border border-[rgba(229,100,92,0.3)] text-[12px] text-[var(--blocked)] font-mono">
                {activateLiveError}
              </div>
            )}

            <form onSubmit={handleActivateLiveMode} className="space-y-3 font-mono text-[13px]">
              <div>
                <label className="block text-[11px] text-[var(--warn)] mb-1">Confirm with Fresh Authenticator Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={activateLiveMfa}
                  onChange={(e) => setActivateLiveMfa(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--warn)] px-3 text-[var(--text)] text-center tracking-widest text-[16px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivateLiveClient(null)}
                  className="px-3 h-8 rounded text-[12px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLive}
                  className="px-3.5 h-8 rounded bg-[var(--verified)] text-[var(--canvas)] font-medium text-[12px]"
                >
                  {isSubmittingLive ? "Activating..." : "Confirm & Activate Live Mode"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: REFUND CLIENT                                              */}
      {/* =================================================================== */}
      {refundClientTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <h4 className="text-[15px] font-medium text-[var(--text)]">Execute Refund</h4>
              <button onClick={() => setRefundClientTarget(null)} className="text-[var(--text-dim)] hover:text-white">✕</button>
            </div>
            <p className="text-[12px] text-[var(--text-dim)]">
              Issuing refund for <strong className="text-[var(--text)]">{refundClientTarget.name}</strong>. Workspace will be paused.
            </p>

            {refundError && (
              <div className="p-2.5 rounded bg-[rgba(229,100,92,0.1)] border border-[rgba(229,100,92,0.3)] text-[12px] text-[var(--blocked)] font-mono">
                {refundError}
              </div>
            )}

            <form onSubmit={handleSaveRefund} className="space-y-3 font-mono text-[13px]">
              <div>
                <label className="block text-[11px] text-[var(--text-dim)] mb-1">Refund Amount ($)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-dim)] mb-1">Reason for Refund *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer cancelled during shadow window"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--line)] px-3 text-[var(--text)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--warn)] mb-1">Fresh Authenticator Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={refundMfa}
                  onChange={(e) => setRefundMfa(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--warn)] px-3 text-[var(--text)] text-center tracking-widest text-[16px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundClientTarget(null)}
                  className="px-3 h-8 rounded text-[12px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRefund}
                  className="px-3.5 h-8 rounded bg-[var(--blocked)] text-white text-[12px] font-medium"
                >
                  {isSubmittingRefund ? "Refunding..." : "Confirm Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: ACTIVE ACCESS LINK POPUP                                   */}
      {/* =================================================================== */}
      {activeInviteLinkDisplay && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <h4 className="text-[15px] font-medium text-[var(--text)]">Single-Use Client Access Link</h4>
              <button onClick={() => setActiveInviteLinkDisplay(null)} className="text-[var(--text-dim)] hover:text-white">✕</button>
            </div>
            <p className="text-[12px] text-[var(--text-dim)]">
              Send this single-use activation link to <strong className="text-[var(--text)]">{activeInviteLinkDisplay.clientName}</strong>. Valid for 7 days.
            </p>
            <div className="p-3 rounded bg-[var(--canvas)] border border-[var(--line)] font-mono text-[11px] text-[var(--text)] select-all break-all">
              {activeInviteLinkDisplay.link}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeInviteLinkDisplay.link);
                  setActionNotice({ type: "success", text: "Access link copied to clipboard." });
                  setActiveInviteLinkDisplay(null);
                }}
                className="px-3.5 h-8 rounded bg-[var(--paper)] text-[var(--paper-ink)] text-[12px] font-medium"
              >
                Copy &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* MODAL 7: ROTATE EVENT SECRET CONFIRMATION (MFA PROTECTED)           */}
      {/* =================================================================== */}
      {rotateSecretModalOrg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[12px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <h4 className="text-[15px] font-medium text-[var(--text)]">Rotate Inbound Events Secret</h4>
              <button onClick={() => setRotateSecretModalOrg(null)} className="text-[var(--text-dim)] hover:text-white">✕</button>
            </div>
            <p className="text-[12px] text-[var(--text-dim)]">
              Issue or rotate the HMAC-SHA256 event secret for <strong className="text-[var(--text)]">{rotateSecretModalOrg.name}</strong> ({rotateSecretModalOrg.id}). Any previous secret for this tenant will stop working immediately.
            </p>

            {rotateSecretError && (
              <div className="p-2.5 rounded bg-[rgba(229,100,92,0.1)] border border-[rgba(229,100,92,0.3)] text-[12px] text-[var(--blocked)] font-mono">
                {rotateSecretError}
              </div>
            )}

            <form onSubmit={handleRotateSecret} className="space-y-3 font-mono text-[13px]">
              <div>
                <label className="block text-[11px] text-[var(--warn)] mb-1">Confirm with Fresh Authenticator Code *</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={rotateSecretMfa}
                  onChange={(e) => setRotateSecretMfa(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-9 rounded bg-[var(--surface-2)] border border-[var(--warn)] px-3 text-[var(--text)] text-center tracking-widest text-[16px]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRotateSecretModalOrg(null)}
                  className="px-3 h-8 rounded text-[12px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRotateSecret}
                  className="px-3.5 h-8 rounded bg-[var(--warn)] text-[var(--canvas)] font-medium text-[12px]"
                >
                  {isSubmittingRotateSecret ? "Rotating..." : "Rotate & Reveal Secret"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 8: ONE-TIME EVENT SECRET DISPLAY                              */}
      {/* =================================================================== */}
      {revealedSecret && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--glow)] rounded-[12px] max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--verified)]" />
                <h4 className="text-[15px] font-medium text-[var(--text)]">New Events API Secret</h4>
              </div>
              <button onClick={() => setRevealedSecret(null)} className="text-[var(--text-dim)] hover:text-white">✕</button>
            </div>
            <p className="text-[12px] text-[var(--text-dim)]">
              This secret is for <strong className="text-[var(--text)]">{revealedSecret.orgName}</strong> to sign telemetry payloads sent to <code className="text-[var(--glow)] font-mono">POST /api/events</code>.
            </p>

            <div className="p-3 rounded bg-[var(--canvas)] border border-[var(--line)] font-mono text-[12px] text-[var(--verified)] select-all break-all">
              {revealedSecret.secret}
            </div>

            <div className="p-3 rounded bg-[rgba(227,179,65,0.08)] border border-[rgba(227,179,65,0.25)] text-[11px] text-[var(--warn)] font-mono">
              ⚠ This secret will NOT be shown again. Store it securely in your external engine environment configuration.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(revealedSecret.secret);
                  setActionNotice({ type: "success", text: "API secret copied to clipboard." });
                  setRevealedSecret(null);
                }}
                className="px-3.5 h-8 rounded bg-[var(--paper)] text-[var(--paper-ink)] text-[12px] font-medium"
              >
                Copy Secret &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
