type LogLevel = "info" | "warn" | "error" | "debug"

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, any>
  error?: Error
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development"

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context, error } = entry
    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`

    if (context) {
      log += `\nContext: ${JSON.stringify(context, null, 2)}`
    }

    if (error) {
      log += `\nError: ${error.message}\nStack: ${error.stack}`
    }

    return log
  }

  private createEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      error,
    }
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined

    // Remove sensitive data
    const sanitized = { ...context }
    const sensitiveKeys = ["password", "token", "apiKey", "secret", "authorization"]

    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = "[REDACTED]"
      }
    }

    return sanitized
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.createEntry("info", message, context)
    if (this.isDevelopment) {
      console.log(this.formatLog(entry))
    }
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.createEntry("warn", message, context)
    console.warn(this.formatLog(entry))
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    const entry = this.createEntry("error", message, context, error)
    console.error(this.formatLog(entry))
  }

  debug(message: string, context?: Record<string, any>) {
    if (this.isDevelopment) {
      const entry = this.createEntry("debug", message, context)
      console.debug(this.formatLog(entry))
    }
  }
}

export const logger = new Logger()
