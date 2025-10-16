import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// URL base da sua WuzAPI (lida da variável de ambiente)
const WUZAPI_BASE_URL = process.env.WUZAPI_BASE_URL

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const { contato_id, conteudo, agendada_para, tem_midia, midia_url, midia_tipo } = await request.json()

    if (!contato_id || !conteudo) {
      return NextResponse.json({ error: "Contato e conteúdo são obrigatórios" }, { status: 400 })
    }

    // Buscar configuração do WhatsApp
    const { data: config } = await supabase.from("whatsapp_config").select("*").eq("user_id", user.id).single()

    // O campo 'api_key' na sua tabela 'whatsapp_config' deve armazenar o 'token' do usuário WuzAPI.
    if (!config || !config.is_active || !config.api_key) {
      return NextResponse.json({ error: "WhatsApp não configurado, inativo ou token ausente" }, { status: 400 })
    }

    // Buscar dados do contato
    const { data: contato } = await supabase.from("contatos").select("*").eq("id", contato_id).single()

    if (!contato || !contato.telefone) {
      return NextResponse.json({ error: "Contato não encontrado ou telefone ausente" }, { status: 404 })
    }
    
    // O WuzAPI espera o número de telefone no campo 'Phone'
    const phone = contato.telefone.replace(/\D/g, '') // Remove caracteres não numéricos

    // Criar registro da mensagem
    const { data: mensagem, error: mensagemError } = await supabase
      .from("mensagens")
      .insert({
        user_id: user.id,
        contato_id,
        tipo: "enviada",
        conteudo,
        status: agendada_para ? "pendente" : "enviada",
        tem_midia: tem_midia || false,
        midia_url: midia_url || null,
        midia_tipo: midia_tipo || null,
        agendada_para: agendada_para || null,
        enviada_em: agendada_para ? null : new Date().toISOString(),
      })
      .select()
      .single()

    if (mensagemError) throw mensagemError

    // Se não for agendada, enviar imediatamente
    if (!agendada_para) {
      // INÍCIO DA INTEGRAÇÃO WUZAPI
      
      let endpoint = '';
      let body: Record<string, any> = {
        Phone: phone,
      };

      if (tem_midia && midia_url && midia_tipo) {
        // NOTA IMPORTANTE:
        // WuzAPI espera o conteúdo da mídia em formato Base64 EMBEDDED (ex: data:image/jpeg;base64,...)
        // O código real precisaria de uma função para:
        // 1. Fazer fetch do midia_url.
        // 2. Converter o binário da mídia para Base64.
        // 3. Adicionar o prefixo 'data:mime_type;base64,'.
        
        // Aqui, faremos uma simulação simples com base no tipo.
        // Você precisará implementar a lógica de fetch/conversão!
        
        if (midia_tipo.startsWith("image/")) {
          endpoint = '/chat/send/image';
          body.Caption = conteudo; // O conteúdo vira a legenda da imagem
          // ASSUMIMOS que midia_url JÁ CONTÉM a string Base64 embedded para simplificar o exemplo
          body.Image = midia_url; 
        } else if (midia_tipo.startsWith("video/")) {
          endpoint = '/chat/send/video';
          body.Caption = conteudo;
          body.Video = midia_url;
        } else if (midia_tipo.startsWith("audio/")) {
          endpoint = '/chat/send/audio';
          body.Audio = midia_url;
        } else {
          // Outros tipos, como documento (document)
          endpoint = '/chat/send/document';
          body.Document = midia_url;
          // Você também precisa definir o nome do arquivo 'FileName' para documentos
          body.FileName = "documento.pdf"; 
        }

      } else {
        // Envio de mensagem de texto simples
        endpoint = '/chat/send/text';
        body.Body = conteudo;
      }
      
      if (!WUZAPI_BASE_URL || !endpoint) {
          throw new Error("WUZAPI_BASE_URL ou endpoint de envio não definidos.");
      }

      const whatsappResponse = await fetch(`${WUZAPI_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          // A WuzAPI usa o header 'Token' para autenticação de usuário
          'Token': config.api_key, 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const whatsappData = await whatsappResponse.json();

      if (whatsappData.success) {
        // A resposta de sucesso contém o Id da mensagem (Id) e o timestamp
        const messageId = whatsappData.data.Id; 
        
        await supabase
          .from("mensagens")
          .update({
            status: "enviada", // A WuzAPI não confirma 'entregue', apenas 'enviada'
            entregue_em: new Date().toISOString(),
            whatsapp_message_id: messageId,
          })
          .eq("id", mensagem.id)
      } else {
        // Tratar erro de envio da API
        const errorMessage = whatsappData.data?.Details || whatsappData.Details || "Erro desconhecido ao enviar via WuzAPI";
        await supabase
          .from("mensagens")
          .update({
            status: "erro",
            detalhes_erro: errorMessage,
          })
          .eq("id", mensagem.id)
          
        throw new Error(errorMessage);
      }
      // FIM DA INTEGRAÇÃO WUZAPI
    }

    return NextResponse.json({
      success: true,
      mensagem,
      message: agendada_para ? "Mensagem agendada com sucesso" : "Mensagem enviada com sucesso",
    })
  } catch (error: any) {
    console.error("[v0] Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: error.message || "Erro ao enviar mensagem" }, { status: 500 })
  }
}