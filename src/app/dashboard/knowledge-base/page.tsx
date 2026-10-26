"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertCircle,
  PlusCircle,
  Hash,
  ShieldCheck,
  Search,
  ExternalLink,
} from "lucide-react";
import { CLIENT_OVERVIEW_DATA } from "@/lib/dashboard-seed-data";
import { DemoTag } from "@/components/portal/demo-tag";
import { InspectStatesBar } from "@/components/portal/inspect-states-bar";
import { DashboardSkeleton, DashboardEmptyState, DashboardErrorState } from "@/components/portal/state-views";

interface DocItem {
  id: string;
  filename: string;
  filesize: string;
  sha256: string;
  chunks?: number;
  status: "waiting_for_engine" | "queued" | "indexed" | "ready" | "failed";
  statusDetail?: string | null;
  indexedAt: string;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [policyGaps] = useState(CLIENT_OVERVIEW_DATA.policyGaps);
  const [activeTab, setActiveTab] = useState<"documents" | "gaps">("documents");
  const [viewState, setViewState] = useState<"normal" | "loading" | "empty" | "error">("normal");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await fetch("/api/documents/upload");
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.documents)) {
          setDocuments(json.documents);
        }
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload rejected");
      }

      const newDoc: DocItem = {
        id: data.document.id,
        filename: data.document.filename,
        filesize: `${(data.document.sizeBytes / 1024).toFixed(0)} KB`,
        sha256: data.document.sha256,
        status: data.document.status || "waiting_for_engine",
        statusDetail: data.document.statusDetail,
        indexedAt: "Just now",
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setShowUploadModal(false);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  if (viewState === "loading" || isLoadingDocs) {
    return (
      <div className="space-y-4">
        <DashboardSkeleton rows={6} />
      </div>
    );
  }

  if (viewState === "error") {
    return (
      <div className="space-y-4">
        <DashboardErrorState
          message="Failed to connect to private document storage."
          onRetry={() => {
            setViewState("normal");
            fetchDocuments();
          }}
        />
        <DashboardSkeleton rows={3} />
      </div>
    );
  }

  if (viewState === "empty" || (documents.length === 0 && activeTab === "documents")) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-medium text-[var(--text)] tracking-tight">
              Knowledge Base &amp; Policy Gaps
            </h1>
            <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
              Strict grounding corpus: only verified clauses from these documents are cited to customers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[12px] font-medium transition-colors shrink-0"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload PDF Document</span>
          </button>
        </div>

        <DashboardEmptyState
          title="No company knowledge documents indexed"
          description="Upload your support manuals, return policies, or freight SLAs in PDF format. Documents are stored in private storage and marked 'Waiting for the AI engine' until the inference engine is connected."
          actionLabel="Upload First PDF"
          onAction={() => setShowUploadModal(true)}
        />

        {showUploadModal && renderUploadModal()}
      </div>
    );
  }

  function renderStatusBadge(doc: DocItem) {
    if (doc.status === "waiting_for_engine") {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--warn)]">
          <Clock className="w-3 h-3 shrink-0" />
          <span>Waiting for the AI engine</span>
        </span>
      );
    }
    if (doc.status === "queued") {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--glow)]">
          <Clock className="w-3 h-3 shrink-0" />
          <span>Queued for engine</span>
        </span>
      );
    }
    if (doc.status === "indexed" || doc.status === "ready") {
      return (
        <span className="inline-flex items-center gap-1 text-[12px] text-[var(--verified)]">
          <CheckCircle2 className="w-3 h-3 shrink-0" />
          <span>Indexed</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[12px] text-[var(--blocked)]">
        <AlertCircle className="w-3 h-3 shrink-0" />
        <span>Indexing failed</span>
      </span>
    );
  }

  function renderUploadModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in-50">
        <div className="w-full max-w-md rounded-[12px] border border-[var(--line-strong)] bg-[var(--surface)] p-5 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
            <h4 className="text-[14px] font-medium text-[var(--text)]">
              Secure Document Ingestion (25MB Max)
            </h4>
            <button
              onClick={() => setShowUploadModal(false)}
              className="text-[var(--text-faint)] hover:text-[var(--text)] text-sm"
            >
              ✕
            </button>
          </div>
          <p className="text-[12px] text-[var(--text-dim)]">
            PDFs are cryptographically inspected for header signatures (%PDF-), stored under random UUIDs in private storage, and marked &quot;Waiting for the AI engine&quot; until indexing commences.
          </p>

          {uploadError && (
            <div className="p-3 rounded-[6px] border border-[#E5645C]/30 bg-[#E5645C]/10 text-[#E5645C] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          <input
            type="file"
            accept=".pdf,application/pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-[var(--line)] rounded-[8px] p-6 text-center space-y-2 bg-[var(--surface-2)] cursor-pointer hover:border-[var(--glow)] transition-colors"
          >
            <UploadCloud className="w-8 h-8 text-[var(--glow)] mx-auto" />
            <p className="text-[12px] text-[var(--text)] font-medium">
              {isUploading ? "Inspecting magic bytes & saving..." : "Click or drag & drop PDF (max 25MB)"}
            </p>
            <p className="text-[11px] text-[var(--text-faint)] font-mono">
              Magic signature check (%PDF-) • Private bucket isolation
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-3 h-8 rounded-[6px] text-[12px] text-[var(--text-dim)] hover:bg-[var(--surface-2)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3 h-8 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] text-[12px] font-medium disabled:opacity-50"
            >
              Select PDF File
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-medium text-[var(--text)] tracking-tight">
              Knowledge Base &amp; Policy Gaps
            </h1>
            <DemoTag />
          </div>
          <p className="text-[12px] text-[var(--text-dim)] mt-0.5">
            Strict grounding corpus: only verified clauses from these documents are cited to customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[6px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[12px] font-medium transition-colors shrink-0"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload PDF Document</span>
        </button>
      </div>

      {/* Tabs: Documents vs Policy Gaps */}
      <div className="flex items-center gap-1 border-b border-[var(--line)] text-[12px] font-mono">
        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`px-3 py-2 border-b-2 transition-colors ${
            activeTab === "documents"
              ? "border-[var(--glow)] text-[var(--glow)] font-medium"
              : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
          }`}
        >
          Source Documents ({documents.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("gaps")}
          className={`px-3 py-2 border-b-2 transition-colors ${
            activeTab === "gaps"
              ? "border-[var(--glow)] text-[var(--glow)] font-medium"
              : "border-transparent text-[var(--text-dim)] hover:text-[var(--text)]"
          }`}
        >
          Policy Gaps &amp; Ambiguities ({policyGaps.length})
        </button>
      </div>

      {activeTab === "documents" ? (
        <div className="border border-[var(--line)] rounded-[8px] bg-[var(--surface)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-[var(--line)] bg-[var(--surface-2)] text-[12px] font-mono text-[var(--text-dim)]">
                <tr>
                  <th className="py-2.5 px-3">DOCUMENT FILENAME</th>
                  <th className="py-2.5 px-3">FILE SIZE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">LAST SYNCED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] font-mono text-[13px]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[var(--surface-2)]/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--glow)] shrink-0" />
                        <span className="text-[var(--text)] font-sans font-medium text-[13px]">{doc.filename}</span>
                      </div>
                      <span className="text-[12px] text-[var(--text-dim)] truncate max-w-[280px] block mt-0.5">
                        SHA-256: {doc.sha256.slice(0, 16)}...
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-dim)]">{doc.filesize}</td>
                    <td className="py-3 px-3">{renderStatusBadge(doc)}</td>
                    <td className="py-3 px-3 text-right text-[var(--text-dim)] text-[12px]">{doc.indexedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {policyGaps.map((gap) => (
            <div
              key={gap.id || gap.topic}
              className="p-4 rounded-[8px] border border-[var(--line)] bg-[var(--surface)] text-[12px] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] text-[var(--warn)] font-medium">{gap.topic}</span>
                <span className="font-mono text-[11px] text-[var(--text-faint)] tabular-nums">
                  {gap.frequency} escalation occurrences
                </span>
              </div>
              <p className="text-[var(--text-dim)] text-[12px] leading-relaxed">
                Query: &quot;{gap.query}&quot; — Missing coverage: {gap.unmatchedClause}
              </p>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && renderUploadModal()}
    </div>
  );
}
