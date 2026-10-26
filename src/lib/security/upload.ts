import { randomUUID } from "crypto";

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB strict ceiling
export const PARSE_TIMEOUT_MS = 5000; // 5-second parsing timeout

// PDF Magic Signature: %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

export interface ValidatedPdfUpload {
  storageName: string;
  originalName: string;
  sizeBytes: number;
  buffer: Buffer;
  mimeType: "application/pdf";
}

/**
 * Validates an uploaded file buffer against PDF magic bytes and size constraints.
 */
export function validatePdfUpload(
  fileBuffer: Buffer,
  originalFilename: string
): { success: true; upload: ValidatedPdfUpload } | { success: false; error: string } {
  // 1. Size ceiling verification
  if (fileBuffer.byteLength > MAX_UPLOAD_BYTES) {
    return {
      success: false,
      error: `File size (${(fileBuffer.byteLength / (1024 * 1024)).toFixed(2)} MB) exceeds 25 MB maximum ceiling.`,
    };
  }

  if (fileBuffer.byteLength < 5) {
    return { success: false, error: "Empty or truncated file." };
  }

  // 2. Magic byte file signature check (independent of user-provided extension)
  const header = fileBuffer.subarray(0, 5);
  if (!header.equals(PDF_MAGIC_BYTES)) {
    return {
      success: false,
      error: "Invalid file format: File signature does not match valid PDF header (%PDF-). Executable, image, or spoofed files rejected.",
    };
  }

  // 3. Cryptographically random storage name in private bucket
  const randomStorageName = `doc_${randomUUID()}.pdf`;

  // 4. Sanitize original filename (remove path traversal attempts)
  const cleanOriginalName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, "_");

  return {
    success: true,
    upload: {
      storageName: randomStorageName,
      originalName: cleanOriginalName,
      sizeBytes: fileBuffer.byteLength,
      buffer: fileBuffer,
      mimeType: "application/pdf",
    },
  };
}

/**
 * Executes PDF parsing with strict timeout protection to prevent DoS via malicious regex/PDF bombs.
 */
export async function parsePdfWithTimeout<T>(
  parseFn: () => Promise<T>,
  timeoutMs = PARSE_TIMEOUT_MS
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`PDF text parsing exceeded ${timeoutMs}ms timeout limit.`));
    }, timeoutMs);

    if (typeof timer.unref === "function") {
      timer.unref();
    }
  });

  return Promise.race([parseFn(), timeoutPromise]);
}

/**
 * Generates security headers for serving document downloads as private attachments.
 */
export function getDocumentDownloadHeaders(originalFilename: string): Record<string, string> {
  const cleanName = originalFilename.replace(/["\r\n]/g, "");
  return {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${cleanName}"`,
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "private, no-cache, no-store, must-revalidate",
  };
}
