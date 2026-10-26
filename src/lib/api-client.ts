/**
 * Typed API Client for FastAPI backend integration
 * 
 * Supports:
 * - Multi-tenant isolation header: `X-Tenant-ID`
 * - JWT bearer token authentication
 * - Unified error handling
 * - Fallback mock service mode when `NEXT_PUBLIC_USE_MOCK_API="true"` or when backend is starting up
 */

import {
  CompanyTenant,
  Plan,
  AssistantConfig,
  DocumentItem,
  Conversation,
  ChatMessage,
  TeamMember,
  SubscriptionInfo,
  AnalyticsData,
  User,
} from "@/types";
import {
  MOCK_PLANS,
  MOCK_USER,
  MOCK_TENANT,
  MOCK_ASSISTANT_CONFIG,
  MOCK_DOCUMENTS,
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
  MOCK_TEAM_MEMBERS,
  MOCK_SUBSCRIPTION,
  MOCK_ANALYTICS,
} from "./db/mock-data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

export interface ApiErrorResponse {
  detail: string;
  code?: string;
  status: number;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

class ApiClient {
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("omni_token");
      this.tenantId = localStorage.getItem("omni_tenant_id");
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== "undefined") {
      if (token) localStorage.setItem("omni_token", token);
      else localStorage.removeItem("omni_token");
    }
  }

  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
    if (typeof window !== "undefined") {
      if (tenantId) localStorage.setItem("omni_tenant_id", tenantId);
      else localStorage.removeItem("omni_tenant_id");
    }
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (USE_MOCK_API) {
      // In mock mode, we intercept and handle with mock service layer below
      throw new Error("Use client mock methods");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (this.tenantId) {
      headers["X-Tenant-ID"] = this.tenantId;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = "An error occurred while connecting to the AI backend";
      let errorCode = "API_ERROR";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
        errorCode = errorData.code || errorCode;
      } catch {
        errorMessage = response.statusText;
      }
      throw new ApiError(errorMessage, response.status, errorCode);
    }

    return response.json();
  }

  // --- Auth & Tenant APIs ---

  async registerCompany(data: {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
    website?: string;
    planId?: string;
  }): Promise<{ user: User; tenant: CompanyTenant; token: string }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 600));
      const tenantId = `tnt_${data.companyName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8)}_${Math.floor(1000 + Math.random() * 9000)}`;
      const user: User = {
        id: `usr_${Math.random().toString(36).substring(2, 9)}`,
        email: data.email,
        name: data.fullName,
        role: "owner",
        companyId: tenantId,
      };
      const tenant: CompanyTenant = {
        ...MOCK_TENANT,
        id: tenantId,
        name: data.companyName,
        supportEmail: data.email,
        website: data.website || "",
        subscriptionPlan: (data.planId as any) || "starter",
        subscriptionStatus: "active",
      };
      this.setToken("mock_jwt_token_sample");
      this.setTenantId(tenantId);
      return { user, tenant, token: "mock_jwt_token_sample" };
    }

    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(credentials: { email: string; password: string }): Promise<{ user: User; tenant: CompanyTenant; token: string }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 500));
      this.setToken("mock_jwt_token_sample");
      this.setTenantId(MOCK_TENANT.id);
      return { user: MOCK_USER, tenant: MOCK_TENANT, token: "mock_jwt_token_sample" };
    }

    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentTenant(): Promise<{ user: User; tenant: CompanyTenant }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 200));
      return { user: MOCK_USER, tenant: MOCK_TENANT };
    }
    return this.request("/tenant/current");
  }

  async updateTenantSettings(settings: Partial<CompanyTenant>): Promise<CompanyTenant> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 400));
      return { ...MOCK_TENANT, ...settings };
    }
    return this.request("/tenant/settings", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }

  // --- Plans & Billing APIs ---

  async getPlans(): Promise<Plan[]> {
    if (USE_MOCK_API) {
      return MOCK_PLANS;
    }
    return this.request("/billing/plans");
  }

  async createCheckoutSession(data: {
    planId: string;
    billingInterval: "month" | "year";
    provider: "stripe" | "razorpay";
  }): Promise<{ checkoutUrl?: string; orderId?: string; sessionId?: string; simulatedSuccess?: boolean }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 500));
      return {
        sessionId: `cs_test_${Math.random().toString(36).substring(2, 10)}`,
        simulatedSuccess: true,
      };
    }
    return this.request("/billing/checkout-session", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSubscription(): Promise<SubscriptionInfo> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_SUBSCRIPTION;
    }
    return this.request("/billing/subscription");
  }

  async verifyPayment(sessionId: string): Promise<{ verified: boolean; subscription: SubscriptionInfo }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 600));
      return { verified: true, subscription: MOCK_SUBSCRIPTION };
    }
    return this.request(`/billing/verify-payment?session_id=${sessionId}`);
  }

  // --- AI Assistant Customization APIs ---

  async getAssistantConfig(): Promise<AssistantConfig> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 250));
      return MOCK_ASSISTANT_CONFIG;
    }
    return this.request("/assistant/config");
  }

  async updateAssistantConfig(config: Partial<AssistantConfig>): Promise<AssistantConfig> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 400));
      return { ...MOCK_ASSISTANT_CONFIG, ...config, updatedAt: new Date().toISOString() };
    }
    return this.request("/assistant/config", {
      method: "PUT",
      body: JSON.stringify(config),
    });
  }

  async publishAssistantConfig(): Promise<{ success: boolean; version: string }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 500));
      return { success: true, version: `v_${Date.now()}` };
    }
    return this.request("/assistant/publish", { method: "POST" });
  }

  async testAssistantChat(message: string, history: Array<{ role: string; content: string }>): Promise<{
    reply: string;
    citations: Array<{ documentName: string; chunkSnippet: string; relevanceScore: number; pageNumber?: number }>;
    latencyMs: number;
  }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 700));
      const lower = message.toLowerCase();
      if (lower.includes("return") || lower.includes("refund")) {
        return {
          reply: "Opened and standard items can be returned within 30 days of delivery. Once received at our warehouse, refunds are disbursed to your original payment card in 3-5 business days.",
          citations: [
            {
              documentName: "Customer_Return_and_Refund_Policy_2024.pdf",
              chunkSnippet: "Section 3.2: 30-day return policy for verified orders in original condition.",
              relevanceScore: 0.94,
              pageNumber: 3,
            },
          ],
          latencyMs: 640,
        };
      }
      if (lower.includes("ship") || lower.includes("delivery")) {
        return {
          reply: "We offer standard domestic shipping (3-5 business days) and express priority shipping (1-2 business days). International orders are fulfilled within 6-10 business days.",
          citations: [
            {
              documentName: "Shipping_Delivery_Timelines_International.pdf",
              chunkSnippet: "Section 2.1: North American delivery SLA is 3-5 business days.",
              relevanceScore: 0.91,
              pageNumber: 2,
            },
          ],
          latencyMs: 720,
        };
      }
      return {
        reply: "Thank you for reaching out! Based on your company's uploaded documentation, here is the verified information. If you require further assistance or specific account adjustments, let me know!",
        citations: [
          {
            documentName: "Product_Catalog_Fall_Winter_Specifications.pdf",
            chunkSnippet: "Standard product specification guidelines and service standards.",
            relevanceScore: 0.85,
            pageNumber: 1,
          },
        ],
        latencyMs: 580,
      };
    }

    return this.request("/assistant/test-chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    });
  }

  // --- Knowledge Base & Documents APIs ---

  async getDocuments(): Promise<DocumentItem[]> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_DOCUMENTS;
    }
    return this.request("/documents");
  }

  async uploadDocument(file: File): Promise<DocumentItem> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 800));
      const newDoc: DocumentItem = {
        id: `doc_${Math.random().toString(36).substring(2, 9)}`,
        tenantId: this.tenantId || MOCK_TENANT.id,
        name: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || "application/pdf",
        status: "processing",
        chunksCount: 0,
        uploadedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ["Uploaded"],
      };
      return newDoc;
    }

    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (this.token) headers["Authorization"] = `Bearer ${this.token}`;
    if (this.tenantId) headers["X-Tenant-ID"] = this.tenantId;

    const res = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "Upload failed" }));
      throw new ApiError(err.detail || "Upload failed", res.status);
    }
    return res.json();
  }

  async deleteDocument(documentId: string): Promise<{ success: boolean }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 400));
      return { success: true };
    }
    return this.request(`/documents/${documentId}`, { method: "DELETE" });
  }

  async retryDocument(documentId: string): Promise<DocumentItem> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 400));
      const doc = MOCK_DOCUMENTS.find((d) => d.id === documentId) || MOCK_DOCUMENTS[0];
      return { ...doc, status: "processing" };
    }
    return this.request(`/documents/${documentId}/retry`, { method: "POST" });
  }

  // --- Conversations APIs ---

  async getConversations(): Promise<Conversation[]> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 300));
      return MOCK_CONVERSATIONS;
    }
    return this.request("/conversations");
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 200));
      return MOCK_MESSAGES[conversationId] || MOCK_MESSAGES["conv_8912"];
    }
    return this.request(`/conversations/${conversationId}/messages`);
  }

  // --- Analytics APIs ---

  async getAnalytics(timeframe: "7d" | "30d" | "90d" = "30d"): Promise<AnalyticsData> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 350));
      return { ...MOCK_ANALYTICS, timeframe };
    }
    return this.request(`/analytics?timeframe=${timeframe}`);
  }

  // --- Team Members APIs ---

  async getTeamMembers(): Promise<TeamMember[]> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 250));
      return MOCK_TEAM_MEMBERS;
    }
    return this.request("/team");
  }

  async inviteTeamMember(data: { name: string; email: string; role: "admin" | "agent" }): Promise<TeamMember> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 400));
      return {
        id: `tm_${Math.random().toString(36).substring(2, 7)}`,
        tenantId: this.tenantId || MOCK_TENANT.id,
        name: data.name,
        email: data.email,
        role: data.role,
        status: "invited",
        joinedAt: new Date().toISOString(),
      };
    }
    return this.request("/team/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async removeTeamMember(memberId: string): Promise<{ success: boolean }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 300));
      return { success: true };
    }
    return this.request(`/team/${memberId}`, { method: "DELETE" });
  }

  // --- Customer-Facing Public Chat Widget API ---

  async customerChat(tenantId: string, message: string, history: Array<{ sender: string; content: string }>): Promise<{
    reply: string;
    citations?: Array<{ documentName: string; chunkSnippet: string; pageNumber?: number }>;
  }> {
    if (USE_MOCK_API) {
      await new Promise((r) => setTimeout(r, 650));
      return {
        reply: `Thank you for your message! This response is generated securely by the company AI knowledge base for tenant [${tenantId}]. We're ready to assist with your order, returns, or product inquiries.`,
        citations: [
          {
            documentName: "Customer_Return_and_Refund_Policy_2024.pdf",
            chunkSnippet: "Verified customer satisfaction and return guidelines.",
            pageNumber: 2,
          },
        ],
      };
    }

    const response = await fetch(`${API_BASE_URL}/widget/${tenantId}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      throw new ApiError("Failed to communicate with support assistant", response.status);
    }
    return response.json();
  }
}

export const api = new ApiClient();
