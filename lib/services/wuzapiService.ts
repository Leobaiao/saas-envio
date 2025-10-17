// Serviço para integração com Wuzapi
export interface WuzapiInstance {
  id: string
  instance_name: string
  instance_id: string
  api_url: string
  api_key: string
  phone_number?: string
  status: "connected" | "disconnected" | "pending" | "error"
  qr_code?: string
  is_active: boolean
  last_connected_at?: string
  metadata?: Record<string, any>
}

export class WuzapiService {
  /**
   * Testa a conexão com uma instância Wuzapi
   */
  static async testConnection(apiUrl: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${apiUrl}/status`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        return { success: false, message: "Falha na conexão com a API" }
      }

      const data = await response.json()
      return { success: true, message: "Conexão estabelecida com sucesso" }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "Erro desconhecido" }
    }
  }

  /**
   * Obtém o QR Code para conectar uma instância
   */
  static async getQRCode(apiUrl: string, apiKey: string, instanceId: string): Promise<string | null> {
    try {
      const response = await fetch(`${apiUrl}/instance/${instanceId}/qr`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.qr_code || null
    } catch (error) {
      console.error("Erro ao obter QR Code:", error)
      return null
    }
  }

  /**
   * Verifica o status de uma instância
   */
  static async getInstanceStatus(
    apiUrl: string,
    apiKey: string,
    instanceId: string,
  ): Promise<{ status: string; phone?: string }> {
    try {
      const response = await fetch(`${apiUrl}/instance/${instanceId}/status`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!response.ok) {
        return { status: "error" }
      }

      const data = await response.json()
      return {
        status: data.connected ? "connected" : "disconnected",
        phone: data.phone_number,
      }
    } catch (error) {
      return { status: "error" }
    }
  }

  /**
   * Desconecta uma instância
   */
  static async disconnectInstance(apiUrl: string, apiKey: string, instanceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/instance/${instanceId}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error("Erro ao desconectar instância:", error)
      return false
    }
  }

  /**
   * Reinicia uma instância
   */
  static async restartInstance(apiUrl: string, apiKey: string, instanceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${apiUrl}/instance/${instanceId}/restart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      return response.ok
    } catch (error) {
      console.error("Erro ao reiniciar instância:", error)
      return false
    }
  }
}
