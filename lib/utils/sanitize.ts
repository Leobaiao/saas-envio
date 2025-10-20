export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function redactSensitiveData(data: any): any {
  const sensitiveKeys = ["password", "token", "api_key", "secret", "authorization"]

  if (typeof data !== "object" || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData)
  }

  const redacted: any = {}
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      redacted[key] = "[REDACTED]"
    } else if (typeof value === "object") {
      redacted[key] = redactSensitiveData(value)
    } else {
      redacted[key] = value
    }
  }

  return redacted
}
