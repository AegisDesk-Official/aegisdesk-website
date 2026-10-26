/**
 * Prompt Injection & Adversarial Heuristics Engine.
 * Treats all incoming visitor queries and document inputs as untrusted data.
 * Neutralizes injection attempts prior to LLM invocation to protect AI token budgets.
 */

export interface PromptInjectionCheckResult {
  isSafe: boolean;
  detectedPattern?: string;
  category?:
    | "instruction_override"
    | "system_prompt_exfiltration"
    | "roleplay_jailbreak"
    | "delimiter_escape"
    | "cross_tenant_probe"
    | "secret_extraction";
  safeDeflection: string;
}

export const KNOWN_INJECTION_PATTERNS: Array<{
  pattern: RegExp;
  category: PromptInjectionCheckResult["category"];
  label: string;
}> = [
  {
    pattern: /(?:ignore|disregard|forget|dismiss|bypass)\s+(?:all\s+)?(?:previous|prior|existing|above|system)\s+(?:instructions|rules|prompts|guidelines|commands)/i,
    category: "instruction_override",
    label: "Ignore previous instructions",
  },
  {
    pattern: /(?:what\s+is|reveal|show|print|display|tell\s+me|expose|leak)\s+(?:your\s+)?(?:system\s+prompt|developer\s+instructions|initial\s+prompt|meta\s+prompt|base\s+instructions)/i,
    category: "system_prompt_exfiltration",
    label: "System prompt exfiltration",
  },
  {
    pattern: /(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|switch\s+to)\s+(?:developer\s+mode|dan|jailbreak|root|unrestricted|god\s+mode)/i,
    category: "roleplay_jailbreak",
    label: "Developer Mode / DAN jailbreak",
  },
  {
    pattern: /(?:print|output|repeat|show)\s+(?:the\s+text|everything|all\s+words)\s+(?:above|before\s+this|prior\s+to\s+this)/i,
    category: "instruction_override",
    label: "Print text above this line",
  },
  {
    pattern: /(?:show|reveal|give|read|print)\s+(?:me\s+)?(?:the\s+)?(?:previous|other|another)\s+(?:visitor'?s?|user'?s?|client'?s?|customer'?s?)\s+(?:data|query|message|ticket|email|phone)/i,
    category: "cross_tenant_probe",
    label: "Cross-visitor data exfiltration",
  },
  {
    pattern: /(?:repeat|quote|echo)\s+(?:the\s+)?(?:words|text|string)\s+(?:above\s+)?starting\s+with/i,
    category: "system_prompt_exfiltration",
    label: "Repeat text starting with sentinel",
  },
  {
    pattern: /(?:output|reveal|dump|show|print)\s+(?:all\s+)?(?:internal\s+)?(?:variables|api\s+keys|secrets|tokens|env\s+vars|credentials)/i,
    category: "secret_extraction",
    label: "Internal variable or secret extraction",
  },
  {
    pattern: /(?:disregard|override|skip)\s+(?:policy(?:\s+guidelines)?|rules|terms)\s+(?:and\s+)?(?:confirm|grant|give|issue|approve)\s+(?:a\s+)?(?:100%|full|cash|unauthorized)\s+refund/i,
    category: "instruction_override",
    label: "Unauthorized refund policy bypass",
  },
  {
    pattern: /(?:system\s+override|sudo\s+mode|administrative\s+override|override_authorization)\s*:/i,
    category: "roleplay_jailbreak",
    label: "Root administrator system override",
  },
  {
    pattern: /(?:translate|encode|convert)\s+(?:your\s+)?(?:system(?:\s+instructions)?|instructions|rules)\s+(?:in(?:to)?|as)\s+(?:base64|rot13|hex|morse|binary|json)/i,
    category: "system_prompt_exfiltration",
    label: "Encoded system instruction exfiltration",
  },
];

const SAFE_DEFLECTION_MESSAGE =
  "I can only provide answers based on our published sample store policies. For custom policy tests or full system demonstrations, please book a 15-minute scoping call with our engineering team.";

/**
 * Scans a visitor query against known prompt-injection and jailbreak vectors.
 */
export function inspectPromptSafety(message: string): PromptInjectionCheckResult {
  if (!message || typeof message !== "string") {
    return { isSafe: true, safeDeflection: SAFE_DEFLECTION_MESSAGE };
  }

  const normalized = message.trim();

  for (const item of KNOWN_INJECTION_PATTERNS) {
    if (item.pattern.test(normalized)) {
      return {
        isSafe: false,
        detectedPattern: item.label,
        category: item.category,
        safeDeflection: SAFE_DEFLECTION_MESSAGE,
      };
    }
  }

  return {
    isSafe: true,
    safeDeflection: SAFE_DEFLECTION_MESSAGE,
  };
}

/**
 * Post-generation output guardrail ensuring no system secrets or internal
 * environment tokens were accidentally reflected by the model.
 */
export function inspectOutputSafety(answer: string): { isSafe: boolean; sanitizedAnswer: string } {
  if (!answer) return { isSafe: true, sanitizedAnswer: "" };

  const secretKeywords = [
    "FASTAPI_BACKEND_URL",
    "DEMO_TENANT_API_KEY",
    "RAZORPAY_KEY_SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SYSTEM INSTRUCTION:",
    "AegisDesk Internal System Instructions",
  ];

  for (const keyword of secretKeywords) {
    if (answer.toLowerCase().includes(keyword.toLowerCase())) {
      return {
        isSafe: false,
        sanitizedAnswer: SAFE_DEFLECTION_MESSAGE,
      };
    }
  }

  // Enforce strict 500-character output cap
  const cappedAnswer = answer.length > 500 ? answer.slice(0, 497) + "..." : answer;

  return {
    isSafe: true,
    sanitizedAnswer: cappedAnswer,
  };
}
