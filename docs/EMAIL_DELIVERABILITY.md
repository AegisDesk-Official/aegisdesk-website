# AegisDesk — Enterprise Email Deliverability & DNS Architecture

Complete guide to configuring production email deliverability via **Resend** for `aegisdesk.ai` (and client subdomains). This ensures 99.8%+ inbox placement across Google Workspace, Microsoft 365, and corporate security gateways (Mimecast, Proofpoint) with strict DMARC enforcement.

---

## 1. Exact DNS Records to Add

Add the following 5 DNS records at your domain registrar / DNS provider (Cloudflare, AWS Route 53, or Namecheap):

### 1. SPF (Sender Policy Framework)
*Authorizes Resend's underlying mail transfer agents (Amazon SES) to send emails on behalf of `aegisdesk.ai`.*

| Field | Value | Notes |
|---|---|---|
| **Type** | `TXT` | Standard DNS text record |
| **Name / Host** | `@` (or `aegisdesk.ai.`) | Apex sending domain |
| **Value** | `v=spf1 include:amazonses.com ~all` | If you already have Google Workspace, merge: `v=spf1 include:_spf.google.com include:amazonses.com ~all` |
| **TTL** | `3600` (1 hour) or `Auto` | Fast propagation |

---

### 2. DKIM (DomainKeys Identified Mail) — 3 CNAME Records
*Cryptographically signs every outbound invoice, setup receipt, and alert, preventing domain spoofing and man-in-the-middle tampering.*

Resend generates three unique 2048-bit DKIM selector records for each domain:

#### Record 2A (DKIM Selector 1)
| Field | Value |
|---|---|
| **Type** | `CNAME` |
| **Name / Host** | `resend._domainkey.aegisdesk.ai` |
| **Value / Target** | `resend._domainkey.resend.email` (or provider hash provided in Resend console) |
| **Proxy Status** | DNS Only (Gray cloud in Cloudflare — **Never proxy DKIM CNAMEs**) |
| **TTL** | `3600` or `Auto` |

#### Record 2B (DKIM Selector 2)
| Field | Value |
|---|---|
| **Type** | `CNAME` |
| **Name / Host** | `s1._domainkey.aegisdesk.ai` |
| **Value / Target** | `s1.domainkey.uXXXXXX.wlXXX.sendgrid.net` or `dkim1.amazonses.com` |
| **Proxy Status** | DNS Only |
| **TTL** | `3600` or `Auto` |

#### Record 2C (DKIM Selector 3)
| Field | Value |
|---|---|
| **Type** | `CNAME` |
| **Name / Host** | `s2._domainkey.aegisdesk.ai` |
| **Value / Target** | `s2.domainkey.uXXXXXX.wlXXX.sendgrid.net` or `dkim2.amazonses.com` |
| **Proxy Status** | DNS Only |
| **TTL** | `3600` or `Auto` |

---

### 3. DMARC (Domain-based Message Authentication, Reporting & Conformance)
*Specifies how recipient email servers (Gmail, Outlook) must handle unauthenticated emails claiming to originate from `@aegisdesk.ai`.*

| Field | Value |
|---|---|
| **Type** | `TXT` |
| **Name / Host** | `_dmarc.aegisdesk.ai` |
| **Value** | `v=DMARC1; p=reject; pct=100; rua=mailto:dmarc-reports@aegisdesk.ai; ruf=mailto:dmarc-forensics@aegisdesk.ai; aspf=r; adkim=r` |
| **TTL** | `3600` or `Auto` |

**DMARC Tag Breakdown:**
- `v=DMARC1`: Protocol version 1.
- `p=reject`: Highest security policy. Rejects and drops any phishing or spoofed email that fails both SPF and DKIM. (Use `p=none` for the first 48 hours during testing, then transition to `p=quarantine`, then `p=reject`).
- `pct=100`: Applies policy to 100% of outbound messages.
- `rua=mailto:dmarc-reports@aegisdesk.ai`: Aggregate XML daily delivery reports sent to your security inbox.
- `ruf=mailto:dmarc-forensics@aegisdesk.ai`: Forensic failure reports for immediate incident response.
- `aspf=r` & `adkim=r`: Relaxed alignment mode for SPF and DKIM.

---

### 4. Custom Return-Path / Mail-From (Bounces Domain)
*Ensures 100% SPF alignment by routing bounce telemetry through a custom subdomain rather than a shared vendor domain.*

#### Record 4A: MX Record
| Field | Value | Priority |
|---|---|---|
| **Type** | `MX` | - |
| **Name / Host** | `bounces.aegisdesk.ai` | - |
| **Value / Target** | `feedback-smtp.us-east-1.amazonses.com` | `10` |
| **TTL** | `3600` or `Auto` | - |

#### Record 4B: SPF Record for Subdomain
| Field | Value |
|---|---|
| **Type** | `TXT` |
| **Name / Host** | `bounces.aegisdesk.ai` |
| **Value** | `v=spf1 include:amazonses.com ~all` |
| **TTL** | `3600` or `Auto` |

---

## 2. Step-by-Step: How to Add in Resend Console

1. Navigate to [Resend Dashboard](https://resend.com/domains) $\rightarrow$ **Domains**.
2. Click **Add Domain** and enter `aegisdesk.ai` (Region: `us-east-1` or `eu-west-1`).
3. Resend displays the exact generated DNS tokens for your account.
4. Copy each record into your Cloudflare / DNS panel.
   *Crucial Cloudflare Note:* Toggle **Proxy status** to **DNS only** (gray cloud) for all CNAME and TXT records. Cloudflare proxying breaks mail routing.
5. In Resend, click **Verify Domain**. Status will update from `Pending` $\rightarrow$ `Verified`.

---

## 3. How to Check and Validate DNS Records from the Terminal

Run these command-line checks to confirm worldwide DNS propagation:

### 1. Verify SPF Record
```bash
dig TXT aegisdesk.ai +short
# Expected output contains:
# "v=spf1 include:amazonses.com ~all"
```

### 2. Verify DKIM Record
```bash
dig CNAME resend._domainkey.aegisdesk.ai +short
# Expected output resolves to:
# resend._domainkey.resend.email.
```

### 3. Verify DMARC Record
```bash
dig TXT _dmarc.aegisdesk.ai +short
# Expected output:
# "v=DMARC1; p=reject; pct=100; rua=mailto:dmarc-reports@aegisdesk.ai; ruf=mailto:dmarc-forensics@aegisdesk.ai; aspf=r; adkim=r"
```

### 4. Verify Custom Mail-From MX Record
```bash
dig MX bounces.aegisdesk.ai +short
# Expected output:
# 10 feedback-smtp.us-east-1.amazonses.com.
```

### 5. Using nslookup (Windows / Alternative)
```bash
nslookup -type=TXT aegisdesk.ai
nslookup -type=TXT _dmarc.aegisdesk.ai
```

---

## 4. Online Validation Tools

1. **Mail-Tester:** Send a test email to the temporary address generated by [mail-tester.com](https://www.mail-tester.com). Verify a **10/10 deliverability score**.
2. **Google Admin Toolbox CheckMX:** Run `aegisdesk.ai` on [toolbox.googleapps.com/apps/checkmx](https://toolbox.googleapps.com/apps/checkmx) to confirm Google Workspace acceptance.
3. **DMARCian / EasyDMARC:** Check syntax and aggregate parsing of `_dmarc.aegisdesk.ai`.
