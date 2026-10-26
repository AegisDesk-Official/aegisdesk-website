export type Role = 'owner' | 'admin' | 'agent';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  companyId: string;
}

export interface CompanyTenant {
  id: string; // Tenant ID
  name: string;
  slug: string;
  website?: string;
  supportEmail: string;
  defaultLanguage: string;
  timeZone: string;
  brandColor: string;
  logoUrl?: string;
  createdAt: string;
  subscriptionPlan: 'starter' | 'professional' | 'enterprise';
  subscriptionStatus: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'pending';
}

export interface Plan {
  id: 'starter' | 'professional' | 'enterprise';
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  badge?: string;
  popular?: boolean;
  features: string[];
  limits: {
    monthlyMessages: number;
    documents: number;
    maxDocumentSizeBytes: number; // in bytes (e.g. 20MB)
    teamMembers: number;
    customDomain: boolean;
    dedicatedRAG: boolean;
  };
}

export interface AssistantConfig {
  id: string;
  tenantId: string;
  name: string;
  avatarUrl?: string;
  welcomeMessage: string;
  description: string;
  isEnabled: boolean;
  systemPrompt: string;
  tone: 'professional' | 'friendly' | 'concise' | 'empathetic' | 'custom';
  responseLanguage: string;
  fallbackMessage: string;
  escalationMessage: string;
  
  // Retrieval settings
  topKChunks: number;
  minRelevanceScore: number;
  includeCitations: boolean;
  showConfidenceScore: boolean;
  
  status: 'draft' | 'published';
  updatedAt: string;
}

export type DocumentProcessingStatus = 'uploaded' | 'queued' | 'processing' | 'ready' | 'failed';

export interface DocumentItem {
  id: string;
  tenantId: string;
  name: string;
  fileSizeBytes: number;
  mimeType: string;
  status: DocumentProcessingStatus;
  chunksCount?: number;
  errorMessage?: string;
  uploadedAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface MessageCitation {
  documentId: string;
  documentName: string;
  chunkSnippet: string;
  relevanceScore: number;
  pageNumber?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'customer' | 'assistant' | 'agent';
  content: string;
  timestamp: string;
  citations?: MessageCitation[];
}

export interface Conversation {
  id: string;
  tenantId: string;
  customerIdentifier: string;
  customerName?: string;
  status: 'active' | 'resolved' | 'escalated';
  messageCount: number;
  startedAt: string;
  lastActivityAt: string;
  summary?: string;
  language?: string;
  rating?: number;
}

export interface TeamMember {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'invited' | 'disabled';
  joinedAt: string;
  avatarUrl?: string;
}

export interface SubscriptionInfo {
  tenantId: string;
  planId: 'starter' | 'professional' | 'enterprise';
  planName: string;
  status: 'active' | 'trialing' | 'past_due' | 'cancelled' | 'pending';
  billingInterval: 'month' | 'year';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    messagesUsed: number;
    messagesLimit: number;
    documentsCount: number;
    documentsLimit: number;
    storageUsedBytes: number;
    storageLimitBytes: number;
    teamSeatsUsed: number;
    teamSeatsLimit: number;
  };
  invoices: Array<{
    id: string;
    amount: number;
    currency: string;
    status: 'paid' | 'open' | 'void';
    date: string;
    pdfUrl?: string;
  }>;
}

export interface AnalyticsData {
  timeframe: '7d' | '30d' | '90d';
  metrics: {
    totalConversations: number;
    totalConversationsChange: number;
    totalMessages: number;
    totalMessagesChange: number;
    avgLatencyMs: number;
    avgLatencyChange: number;
    resolutionRate: number; // e.g. 89%
    resolutionRateChange: number;
    ragRetrievalAccuracy: number; // e.g. 94.2%
  };
  volumeOverTime: Array<{
    date: string;
    conversations: number;
    aiHandled: number;
    escalated: number;
  }>;
  topQuestions: Array<{
    question: string;
    count: number;
    category: string;
    resolvedPct: number;
  }>;
  unansweredQuestions: Array<{
    query: string;
    frequency: number;
    lastAsked: string;
    suggestedDocumentTopic: string;
  }>;
  topDocumentsCited: Array<{
    documentName: string;
    citationCount: number;
    relevanceAvg: number;
  }>;
}
