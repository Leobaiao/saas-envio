"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

// ============================================
// COMPONENTE: SIDEBAR RETRÁTIL (Retractable Sidebar)
// ============================================
// Este componente cria uma barra lateral de navegação que pode ser
// expandida ou recolhida pelo usuário, economizando espaço na tela

interface SidebarProps {
  // Permite passar classes CSS adicionais se necessário
  className?: string
  isMobileMenuOpen?: boolean
  setIsMobileMenuOpen?: (open: boolean) => void
}

export function Sidebar({ className = "", isMobileMenuOpen = false, setIsMobileMenuOpen }: SidebarProps) {
  // ============================================
  // ESTADO DO COMPONENTE (Component State)
  // ============================================

  // Estado para controlar se a sidebar está expandida ou recolhida
  // true = expandida (mostra texto), false = recolhida (mostra apenas ícones)
  const [isExpanded, setIsExpanded] = useState(true)

  // Hook do Next.js para obter a rota atual e destacar o item ativo
  const pathname = usePathname()
  const router = useRouter()

  // ============================================
  // ITENS DE NAVEGAÇÃO (Navigation Items)
  // ============================================

  // Array com todos os itens do menu de navegação
  const menuItems = [
    { href: "/dashboard", label: "Caixa de Entrada", icon: "📥" },
    { href: "/contatos", label: "Contatos", icon: "👥" },
    { href: "/campanhas", label: "Campanhas", icon: "📢" },
    { href: "/chat", label: "Chat", icon: "💬" },
    { href: "/templates", label: "Templates", icon: "📝" },
    { href: "/tags", label: "Tags", icon: "🏷️" },
    { href: "/respostas-automaticas", label: "Respostas Auto", icon: "🤖" },
    { href: "/integracao-whatsapp", label: "WhatsApp", icon: "📱" },
    { href: "/perfil", label: "Meu Perfil", icon: "👤" },
    { href: "/conta", label: "Configurações", icon: "⚙️" },
  ]

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO (Handler Functions)
  // ============================================

  /**
   * Alterna o estado da sidebar entre expandida e recolhida
   */
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded)
  }

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  // ============================================
  // RENDERIZAÇÃO (Rendering)
  // ============================================

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen?.(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full border-r-2 border-neutral-900 bg-white transition-all duration-300 z-50 ${
          isExpanded ? "w-64" : "w-20"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${className}`}
      >
        <div className="flex h-full flex-col p-6">
          {/* ============================================ */}
          {/* CABEÇALHO - Logo e Botão de Toggle */}
          {/* ============================================ */}
          <div className="mb-8 flex items-center justify-between">
            {/* Logo/Título - só aparece quando expandido */}
            {isExpanded && (
              <div className="border-2 border-neutral-900 bg-neutral-200 p-3">
                <div className="text-sm font-bold uppercase tracking-wider text-neutral-900">SAAS PLATFORM</div>
              </div>
            )}

            {/* Botão para expandir/recolher a sidebar */}
            <button
              onClick={toggleSidebar}
              className="border-2 border-neutral-900 bg-white p-2 text-lg hover:bg-neutral-100"
              title={isExpanded ? "Recolher menu" : "Expandir menu"}
            >
              {isExpanded ? "◀" : "▶"}
            </button>
          </div>

          {/* ============================================ */}
          {/* MENU DE NAVEGAÇÃO */}
          {/* ============================================ */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              // Verifica se este item está ativo (rota atual)
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 border-2 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? "border-neutral-900 bg-neutral-900 font-bold text-white"
                      : "border-neutral-400 bg-white text-neutral-700 hover:border-neutral-900"
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  {/* Ícone - sempre visível */}
                  <span className="text-lg">{item.icon}</span>

                  {/* Texto - só aparece quando expandido */}
                  {isExpanded && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* ============================================ */}
          {/* RODAPÉ - Botão de Logout */}
          {/* ============================================ */}
          <div className="border-t-2 border-neutral-300 pt-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 border-2 border-red-600 bg-white px-4 py-3 text-sm text-red-600 hover:bg-red-600 hover:text-white"
              title={!isExpanded ? "Sair" : undefined}
            >
              <span className="text-lg">🚪</span>
              {isExpanded && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
