"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/providers/toast-provider";
import { TeamMember, Role } from "@/types";
import { formatDate } from "@/lib/utils";

export default function TeamManagementPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "agent">("agent");
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    async function loadTeam() {
      try {
        const team = await api.getTeamMembers();
        setMembers(team);
      } catch (err) {
        console.error("Failed to load team members", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      const newMember = await api.inviteTeamMember({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });

      setMembers((prev) => [...prev, newMember]);
      setInviteModalOpen(false);
      setInviteName("");
      setInviteEmail("");
      toast({
        title: "Invitation Sent",
        description: `Invitation dispatched to ${inviteEmail} with ${inviteRole} role.`,
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Send Invitation",
        description: err.message || "Could not invite team member.",
        type: "error",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from this tenant workspace?`)) return;

    try {
      await api.removeTeamMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast({
        title: "Member Removed",
        description: `${memberName} has been removed from your workspace.`,
        type: "info",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Remove",
        description: err.message,
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Team Members & Access Control
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage authorized staff members, role assignments, and workspace invitations.
          </p>
        </div>

        <Button
          onClick={() => setInviteModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
        >
          <UserPlus className="h-4 w-4" />
          Invite Team Member
        </Button>
      </div>

      {/* Role explanation notice */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card">
          <Badge variant="indigo" className="mb-2 uppercase text-[10px]">
            Owner
          </Badge>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Full control over billing subscriptions, company settings, member deletion, and API keys.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <Badge variant="secondary" className="mb-2 uppercase text-[10px]">
            Admin
          </Badge>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Can upload and delete knowledge base PDFs, customize the assistant prompt, and view analytics.
          </p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <Badge variant="outline" className="mb-2 uppercase text-[10px]">
            Support Agent
          </Badge>
          <p className="text-xs text-muted-foreground leading-relaxed">
            View customer conversations, live chat transcripts, and handle escalated human queries.
          </p>
        </div>
      </div>

      {/* Team table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workspace Members ({members.length})</CardTitle>
          <CardDescription className="text-xs">
            Staff authorized to access this tenant workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/40 text-muted-foreground border-y border-border">
                <tr>
                  <th className="px-6 py-3 font-semibold">User</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Joined / Invited</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center text-xs">
                          {m.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{m.name}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={m.role === "owner" ? "indigo" : m.role === "admin" ? "secondary" : "outline"}
                        className="uppercase text-[10px] font-semibold"
                      >
                        {m.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={m.status === "active" ? "success" : "warning"}
                        className="capitalize text-[10px]"
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {formatDate(m.joinedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.role !== "owner" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(m.id, m.name)}
                          className="h-7 px-2 text-destructive hover:bg-destructive/10"
                          title="Remove Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite New Team Member"
        description="Send an invitation link to a colleague with specific role permissions."
      >
        <form onSubmit={handleInvite} className="space-y-4 text-xs">
          <Input
            label="Full Name *"
            placeholder="e.g. Rachel Chang"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            required
          />

          <Input
            type="email"
            label="Company Email Address *"
            placeholder="rachel@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="font-medium text-foreground">Select Role *</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInviteRole("agent")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  inviteRole === "agent"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="font-semibold text-xs">Support Agent</div>
                <div className="text-[10px] opacity-80 mt-0.5">Chat conversations & tickets</div>
              </button>

              <button
                type="button"
                onClick={() => setInviteRole("admin")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  inviteRole === "admin"
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="font-semibold text-xs">Administrator</div>
                <div className="text-[10px] opacity-80 mt-0.5">Documents & AI parameters</div>
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isInviting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Send Invitation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
