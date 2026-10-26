"use client";

import React, { useState, useEffect } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Sliders,
  CheckCircle2,
  FileText,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/providers/toast-provider";
import { AssistantConfig } from "@/types";
import { MOCK_ASSISTANT_CONFIG } from "@/lib/db/mock-data";

export default function AssistantCustomizationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"general" | "behavior" | "retrieval">("general");
  const [config, setConfig] = useState<AssistantConfig>(MOCK_ASSISTANT_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Test Chat State
  const [testMessages, setTestMessages] = useState<
    Array<{ sender: "user" | "assistant"; content: string; citations?: any[]; latencyMs?: number }>
  >([
    {
      sender: "assistant",
      content: MOCK_ASSISTANT_CONFIG.welcomeMessage,
    },
  ]);
  const [testInput, setTestInput] = useState("");
  const [isTestResponding, setIsTestResponding] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const fetched = await api.getAssistantConfig();
        setConfig(fetched);
      } catch (err) {
        console.error("Failed to load assistant configuration", err);
      }
    }
    loadConfig();
  }, []);

  const handleChange = (field: keyof AssistantConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      await api.updateAssistantConfig(config);
      setHasUnsavedChanges(false);
      toast({
        title: "Draft Configuration Saved",
        description: "Your assistant settings are saved in draft status.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Failed to Save Settings",
        description: err.message || "An error occurred while updating settings.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await api.publishAssistantConfig();
      setConfig((prev) => ({ ...prev, status: "published" }));
      setHasUnsavedChanges(false);
      toast({
        title: "Changes Published to Live Widget",
        description: "Your AI assistant is now using the updated behavior and retrieval parameters.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Publication Failed",
        description: err.message || "Could not publish configuration.",
        type: "error",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim() || isTestResponding) return;

    const userMessage = testInput.trim();
    setTestInput("");
    setTestMessages((prev) => [...prev, { sender: "user", content: userMessage }]);
    setIsTestResponding(true);

    try {
      const history = testMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const res = await api.testAssistantChat(userMessage, history);
      setTestMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          content: res.reply,
          citations: res.citations,
          latencyMs: res.latencyMs,
        },
      ]);
    } catch (err: any) {
      setTestMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          content: config.fallbackMessage || "An error occurred while retrieving knowledge base context.",
        },
      ]);
    } finally {
      setIsTestResponding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Assistant Configuration</h1>
            <Badge variant={config.status === "published" ? "success" : "warning"} className="capitalize">
              {config.status}
            </Badge>
            {hasUnsavedChanges && (
              <Badge variant="outline" className="text-amber-500 border-amber-500/30 text-[10px]">
                Unsaved Changes
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Customize instructions, response tone, and RAG retrieval boundaries for your company support agent.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            isLoading={isSaving}
            className="text-xs"
          >
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={handlePublish}
            isLoading={isPublishing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Publish to Live Widget
          </Button>
        </div>
      </div>

      {/* Main Split Grid: Settings on Left, Interactive Test Chat on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Config Tabs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "general"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              General Profile
            </button>
            <button
              onClick={() => setActiveTab("behavior")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "behavior"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Instructions & Tone
            </button>
            <button
              onClick={() => setActiveTab("retrieval")}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "retrieval"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              RAG & Retrieval Bounds
            </button>
          </div>

          {/* Tab 1: General */}
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assistant Identity & Status</CardTitle>
                <CardDescription className="text-xs">
                  Display name and greeting shown to your customers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Assistant Display Name"
                  value={config.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="e.g. Apex Concierge AI"
                />

                <Textarea
                  label="Welcome Greeting Message"
                  value={config.welcomeMessage}
                  onChange={(e) => handleChange("welcomeMessage", e.target.value)}
                  placeholder="Hello! How can I assist you today?"
                  rows={3}
                />

                <Input
                  label="Internal Description"
                  value={config.description || ""}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Official customer service assistant for online retail inquiries"
                />

                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <div>
                    <div className="text-xs font-semibold text-foreground">Enable Assistant</div>
                    <div className="text-[11px] text-muted-foreground">
                      When disabled, the customer widget shows an offline notice.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isEnabled}
                      onChange={(e) => handleChange("isEnabled", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab 2: Instructions & Tone */}
          {activeTab === "behavior" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Behavioral Directives & Tone</CardTitle>
                <CardDescription className="text-xs">
                  Guide how the AI responds and handles edge cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tone selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Support Persona & Tone</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "professional", label: "Professional" },
                      { id: "friendly", label: "Friendly" },
                      { id: "concise", label: "Concise" },
                      { id: "empathetic", label: "Empathetic" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleChange("tone", t.id)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-all ${
                          config.tone === t.id
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Textarea
                  label="System Instructions (Prompt Directives)"
                  value={config.systemPrompt}
                  onChange={(e) => handleChange("systemPrompt", e.target.value)}
                  placeholder="You are the official customer service assistant..."
                  rows={6}
                />

                <Textarea
                  label="Fallback Response (When Knowledge Base has no answer)"
                  value={config.fallbackMessage}
                  onChange={(e) => handleChange("fallbackMessage", e.target.value)}
                  placeholder="I could not find information regarding that in our official policy..."
                  rows={2}
                />

                <Textarea
                  label="Escalation Message (When transferring to a human specialist)"
                  value={config.escalationMessage}
                  onChange={(e) => handleChange("escalationMessage", e.target.value)}
                  placeholder="I am connecting you with a live specialist..."
                  rows={2}
                />
              </CardContent>
            </Card>
          )}

          {/* Tab 3: RAG & Retrieval Bounds */}
          {activeTab === "retrieval" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Retrieval Augmented Generation (RAG) Bounds</CardTitle>
                <CardDescription className="text-xs">
                  Control vector matching sensitivity and citation visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Top K Chunks */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">Maximum Context Chunks (Top-K)</span>
                    <span className="font-mono font-bold text-primary">{config.topKChunks} chunks</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={8}
                    value={config.topKChunks}
                    onChange={(e) => handleChange("topKChunks", parseInt(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Number of most relevant PDF passages injected into the LangGraph synthesis context.
                  </p>
                </div>

                {/* Min Relevance Score */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-foreground">Minimum Similarity Threshold</span>
                    <span className="font-mono font-bold text-primary">
                      {Math.round(config.minRelevanceScore * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={95}
                    value={Math.round(config.minRelevanceScore * 100)}
                    onChange={(e) => handleChange("minRelevanceScore", parseInt(e.target.value) / 100)}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Matches with lower cosine similarity will be pruned to eliminate hallucinations.
                  </p>
                </div>

                {/* Citations toggle */}
                <div className="pt-2 flex items-center justify-between border-t border-border/60">
                  <div>
                    <div className="text-xs font-semibold text-foreground">Show Document Citations</div>
                    <div className="text-[11px] text-muted-foreground">
                      Display document name and page number references in customer replies.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.includeCitations}
                      onChange={(e) => handleChange("includeCitations", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Live Interactive Preview & Test Chat */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between border-border overflow-hidden">
            <CardHeader className="bg-muted/40 border-b border-border py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-foreground">Live Assistant Test Sandbox</span>
                </div>
                <button
                  onClick={() =>
                    setTestMessages([
                      {
                        sender: "assistant",
                        content: config.welcomeMessage,
                      },
                    ])
                  }
                  className="p-1 rounded text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1"
                  title="Reset test conversation"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>
            </CardHeader>

            {/* Chat Body */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[460px] text-xs">
              {testMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted/70 text-foreground border border-border/60 rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Document citations if available */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-1.5 space-y-1 max-w-[85%]">
                      {msg.citations.map((cite, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-muted-foreground flex items-center gap-1.5"
                        >
                          <FileText className="h-3 w-3 text-indigo-500 shrink-0" />
                          <span className="truncate">
                            {cite.documentName} (p. {cite.pageNumber || 1}) • {Math.round(cite.relevanceScore * 100)}% match
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.latencyMs && (
                    <span className="text-[9px] text-muted-foreground mt-0.5 px-1 font-mono">
                      FastAPI RAG • {msg.latencyMs}ms
                    </span>
                  )}
                </div>
              ))}

              {isTestResponding && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground p-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[10px] ml-1">Searching tenant vector store...</span>
                </div>
              )}
            </div>

            {/* Test Input Form */}
            <form onSubmit={handleSendTestMessage} className="p-3 border-t border-border bg-card flex items-center gap-2">
              <input
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Ask about return policy, shipping..."
                disabled={isTestResponding}
                className="flex-1 bg-muted/60 border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isTestResponding || !testInput.trim()}
                className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
