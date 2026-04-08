import * as winston from "winston";

/**
 * Sensitive field patterns to redact from log output.
 * Matches common credentials, tokens, and secrets.
 */
const SENSITIVE_PATTERNS: Array<{ regex: RegExp; replacement: string }> = [
  // JSON fields: "password": "value" or "password":"value"
  {
    regex:
      /"(password|passwd|secret|token|accessToken|refreshToken|access_token|refresh_token|api_key|apiKey|authorization|jwt|credit_card|card_number|cvv|ssn)"\s*:\s*"[^"]*"/gi,
    replacement: '"$1":"[REDACTED]"',
  },
  // Query string parameters: password=value&
  {
    regex:
      /(password|token|secret|api_key|apiKey|access_token|refresh_token)=([^&\s]+)/gi,
    replacement: "$1=[REDACTED]",
  },
  // Bearer tokens in log messages
  { regex: /Bearer\s+[A-Za-z0-9\-_\.]+/gi, replacement: "Bearer [REDACTED]" },
  // JWT-like patterns (three base64 segments separated by dots)
  {
    regex: /\beyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g,
    replacement: "[REDACTED_JWT]",
  },
];

function redactString(input: string): string {
  let result = input;
  for (const { regex, replacement } of SENSITIVE_PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}

function redactObject(obj: any): any {
  if (typeof obj === "string") return redactString(obj);
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) return obj.map(redactObject);

  const redacted: Record<string, any> = {};
  const sensitiveKeys =
    /^(password|passwd|secret|token|accessToken|refreshToken|access_token|refresh_token|api_key|apiKey|authorization|jwt|credit_card|card_number|cvv|ssn)$/i;

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveKeys.test(key)) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactObject(value);
    } else if (typeof value === "string") {
      redacted[key] = redactString(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

/**
 * Winston format that redacts sensitive data (passwords, tokens, API keys, JWTs)
 * from log messages and metadata before they are written to any transport.
 *
 * Usage: Add to winston format chain: winston.format.combine(redactFormat(), ...)
 */
export const redactFormat = winston.format((info) => {
  if (typeof info.message === "string") {
    info.message = redactString(info.message);
  }

  // Redact any extra metadata fields
  const { level, message, timestamp, context, ...meta } = info;
  if (Object.keys(meta).length > 0) {
    const redactedMeta = redactObject(meta);
    Object.assign(info, redactedMeta);
  }

  return info;
});
