"use client"

import { Menu, X } from "lucide-react"

interface MobileHeaderProps {
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (open: boolean) => void
}

export function MobileHeader({ isMobileMenuOpen, setIsMobileMenuOpen }: MobileHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-white border-b-2 border-neutral-900 lg:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="border-2 border-neutral-900 bg-neutral-200 px-3 py-2">
          <div className="text-sm font-bold uppercase tracking-wider text-neutral-900">SAAS</div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="border-2 border-neutral-900 bg-white p-2 hover:bg-neutral-100"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </header>
  )
}
