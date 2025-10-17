"use client"

import { useState, useCallback } from "react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
    const id = `toast-${++toastCounter}`
    const toast: Toast = { id, message, type, duration }

    setToasts((prev) => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "success", duration)
    },
    [showToast],
  )

  const error = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "error", duration)
    },
    [showToast],
  )

  const info = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "info", duration)
    },
    [showToast],
  )

  const warning = useCallback(
    (message: string, duration?: number) => {
      return showToast(message, "warning", duration)
    },
    [showToast],
  )

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    info,
    warning,
  }
}
