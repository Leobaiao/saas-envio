"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"

interface SidebarProps {
  className?: string
  isMobileMenuOpen?: boolean
  setIsMobileMenuOpen?: (open: boolean) => void
}

export function Sidebar({ className = "", isMobileMenuOpen = false, setIsMobileMenuOpen }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { href: "/dashboard", label: "Caixa de Entrada", icon: "📥" },
    { href: "/contatos", label: "Contatos", icon: "👥" },
    { href: "/campanhas", label: "Campanhas", icon: "📢" },
    { href: "/chat", label: "Chat", icon: "💬" },
    { href: "/conversas", label: "Conversas", icon: "💭" },
    { href: "/templates", label: "Templates", icon: "📝" },
    { href: "/tags", label: "Tags", icon: "🏷️" },
    { href: "/respostas-automaticas", label: "Respostas Auto", icon: "🤖" },
    { href: "/integracao-whatsapp", label: "WhatsApp", icon: "📱" },
    { href: "/admin", label: "Admin", icon: "🔧" },
    { href: "/perfil", label: "Meu Perfil", icon: "👤" },
    { href: "/conta", label: "Configurações", icon: "⚙️" },
  ]

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const handleLinkClick = () => {
    if (setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen?.(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full border-r border-border bg-sidebar transition-all duration-300 z-50 ${
          isExpanded ? "w-64" : "w-20"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${className}`}
      >
        <div className="flex h-full flex-col p-4 lg:p-6">
          <div className="mb-6 lg:mb-8 flex items-center justify-between">
            {isExpanded && (
              <div className="border-2 border-primary bg-secondary p-2 lg:p-3">
                <div className="text-xs lg:text-sm font-bold uppercase tracking-wider text-primary">SAAS PLATFORM</div>
              </div>
            )}

            <button
              onClick={toggleSidebar}
              className="border-2 border-primary bg-background p-1.5 lg:p-2 text-base lg:text-lg hover:bg-muted transition-colors"
              title={isExpanded ? "Recolher menu" : "Expandir menu"}
              aria-label={isExpanded ? "Recolher menu" : "Expandir menu"}
            >
              {isExpanded ? "◀" : "▶"}
            </button>
          </div>

          <nav className="flex-1 space-y-1.5 lg:space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center gap-2 lg:gap-3 border-2 px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm transition-colors ${
                    isActive
                      ? "border-primary bg-primary font-bold text-primary-foreground"
                      : "border-muted bg-background text-foreground hover:border-primary hover:bg-muted"
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <span className="text-base lg:text-lg">{item.icon}</span>
                  {isExpanded && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border pt-3 lg:pt-4 mt-3 lg:mt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 lg:gap-3 border-2 border-destructive bg-background px-3 lg:px-4 py-2 lg:py-3 text-xs lg:text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              title={!isExpanded ? "Sair" : undefined}
              aria-label="Sair da conta"
            >
              <span className="text-base lg:text-lg">🚪</span>
              {isExpanded && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
