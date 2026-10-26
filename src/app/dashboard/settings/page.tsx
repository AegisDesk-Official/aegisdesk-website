"use client";

import React, { useState } from "react";
import {
  Building,
  Save,
  Globe,
  Mail,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/providers/toast-provider";

export default function CompanySettingsPage() {
  const { tenant, setTenantState } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(tenant?.name || "Apex Retail Hub");
  const [website, setWebsite] = useState(tenant?.website || "https://apexretail.io");
  const [supportEmail, setSupportEmail] = useState(tenant?.supportEmail || "support@apexretail.io");
  const [defaultLanguage, setDefaultLanguage] = useState(tenant?.defaultLanguage || "English (US)");
  const [timeZone, setTimeZone] = useState(tenant?.timeZone || "America/New_York (UTC-5)");
  const [avgHandleMinutes, setAvgHandleMinutes] = useState(11.8);
  const [agentHourlyCost, setAgentHourlyCost] = useState(30.0);
  const [reportingCurrency, setReportingCurrency] = useState("USD");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await api.updateTenantSettings({
        name,
        website,
        supportEmail,
        defaultLanguage,
        timeZone,
      });
      setTenantState(updated);
      toast({
        title: "Company Settings Saved",
        description: "Profile and calibration parameters updated successfully.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Save",
        description: err.message || "An error occurred while updating settings.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--line)]">
        <div>
          <h1 className="text-[20px] font-medium tracking-tight text-[var(--text)]">
            Company Profile &amp; Calibration
          </h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1">
            Configure organization details, operational parameters, and ROI formulas.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <form onSubmit={handleSave}>
          <div className="rounded-[12px] bg-[var(--surface)] border border-[var(--line)] p-5 sm:p-6 space-y-6">
            <div>
              <h2 className="text-[16px] font-medium text-[var(--text)]">Organization Profile</h2>
              <p className="text-[13px] text-[var(--text-dim)] mt-0.5">
                Public profile details visible in audit logs and support escalations.
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Company Display Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apex Retail Hub"
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Official Support Email *"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@company.com"
                  required
                />
                <Input
                  label="Company Website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://company.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-[13px]">
                  <label className="font-medium text-[var(--text)]">Default Support Language</label>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    className="w-full h-10 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] px-3 text-[13px] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--glow)]"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="Spanish (ES)">Spanish (ES)</option>
                    <option value="French (FR)">French (FR)</option>
                    <option value="German (DE)">German (DE)</option>
                    <option value="Portuguese (BR)">Portuguese (BR)</option>
                  </select>
                </div>

                <div className="space-y-1.5 text-[13px]">
                  <label className="font-medium text-[var(--text)]">Operating Time Zone</label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full h-10 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] px-3 text-[13px] text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--glow)]"
                  >
                    <option value="America/New_York (UTC-5)">America/New_York (UTC-5)</option>
                    <option value="America/Los_Angeles (UTC-8)">America/Los_Angeles (UTC-8)</option>
                    <option value="Europe/London (UTC+0)">Europe/London (UTC+0)</option>
                    <option value="Europe/Paris (UTC+1)">Europe/Paris (UTC+1)</option>
                    <option value="Asia/Tokyo (UTC+9)">Asia/Tokyo (UTC+9)</option>
                    <option value="Asia/Kolkata (UTC+5:30)">Asia/Kolkata (UTC+5:30)</option>
                  </select>
                </div>
              </div>

              {/* ROI & Labor Telemetry Calibration */}
              <div className="pt-4 border-t border-[var(--line)] space-y-3">
                <div>
                  <h3 className="text-[14px] font-medium text-[var(--text)]">
                    ROI &amp; Labor Telemetry Calibration
                  </h3>
                  <p className="text-[13px] text-[var(--text-dim)] mt-0.5">
                    Configures the unified formulas for Time saved (Estimate) and Cost saved (Estimate).
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                      Avg Handle Time (min)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="120"
                      value={String(avgHandleMinutes)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(",", "."));
                        setAvgHandleMinutes(isNaN(val) ? 11.8 : val);
                      }}
                      className="h-9 font-mono text-[13px]"
                    />
                    <span className="text-[12px] text-[var(--text-faint)]">Baseline: 11.8 min</span>
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                      Agent Hourly Rate ($)
                    </label>
                    <Input
                      type="number"
                      step="1"
                      min="10"
                      max="200"
                      value={String(agentHourlyCost)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value.replace(",", "."));
                        setAgentHourlyCost(isNaN(val) ? 30.0 : val);
                      }}
                      className="h-9 font-mono text-[13px]"
                    />
                    <span className="text-[12px] text-[var(--text-faint)]">Default: $30.00 / hr</span>
                  </div>

                  <div>
                    <label className="block text-[12px] font-mono text-[var(--text-dim)] mb-1">
                      Reporting Currency
                    </label>
                    <select
                      value={reportingCurrency}
                      onChange={(e) => setReportingCurrency(e.target.value)}
                      className="w-full h-9 rounded-[8px] border border-[var(--line)] bg-[var(--surface-2)] px-2 text-[13px] font-mono text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--glow)]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                    <span className="text-[12px] text-[var(--text-faint)]">Standard: USD</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[8px] bg-[var(--paper)] text-[var(--paper-ink)] hover:bg-white text-[13px] font-medium transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
