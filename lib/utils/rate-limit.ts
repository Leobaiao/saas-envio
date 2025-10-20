import type { NextRequest } from "next/server"

interface RateLimitConfig {
  interval: number // milliseconds
  uniqueTokenPerInterval: number
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(config: RateLimitConfig) {
  return {
    check: (request: NextRequest, limit: number, token: string): { success: boolean; remaining: number } => {
      const now = Date.now()
      const tokenData = rateLimitMap.get(token)

      if (!tokenData || now > tokenData.resetTime) {
        rateLimitMap.set(token, {
          count: 1,
          resetTime: now + config.interval,
        })
        return { success: true, remaining: limit - 1 }
      }

      if (tokenData.count >= limit) {
        return { success: false, remaining: 0 }
      }

      tokenData.count++
      return { success: true, remaining: limit - tokenData.count }
    },
  }
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(token)
    }
  }
}, 60000) // Clean every minute
