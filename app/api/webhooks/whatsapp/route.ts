import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log("Payload recebido da Wuzapi:", payload); // Ótimo para depurar!

    // MUDANÇA: O payload da Wuzapi pode vir dentro de um objeto "data"
    if (payload.event !== "message.received" || !payload.data) {
      // Ignora eventos que não são de recebimento de mensagem
      return NextResponse.json({ success: true, message: "Evento ignorado" });
    }

    const messageData = payload.data;
    const supabase = await createClient();

    // Registrar webhook no log
    await supabase.from("webhooks_log").insert({
      tipo: "wuzapi_incoming",
      payload: payload, // Salva o payload completo
      processado: false,
    });

    // MUDANÇA: A lógica começa a partir de "messageData"
    
    // Buscar configuração do usuário pelo ID da instância da Wuzapi
    // Assumindo que você salve o 'instanceId' na sua tabela de config
    const { data: config } = await supabase
      .from("whatsapp_config")
      .select("user_id")
      .eq("instance_id", payload.instanceId) // MUDANÇA: Usar instanceId
      .single();

    if (config) {
      // Buscar ou criar contato
      const telefone = messageData.from.replace("@c.us", ""); // MUDANÇA: Limpar o número
      let { data: contato } = await supabase
        .from("contatos")
        .select("id")
        .eq("user_id", config.user_id)
        .eq("telefone", telefone)
        .single();

      if (!contato) {
        const { data: novoContato } = await supabase
          .from("contatos")
          .insert({
            user_id: config.user_id,
            telefone: telefone,
            // MUDANÇA: Pegar o nome de "sender.name" ou "sender.pushname"
            nome: messageData.sender?.name || messageData.sender?.pushname || telefone,
            is_active: true,
          })
          .select()
          .single();

        contato = novoContato;
      }

      // Salvar mensagem recebida
      await supabase.from("mensagens").insert({
        user_id: config.user_id,
        contato_id: contato?.id,
        tipo: "recebida",
        // MUDANÇA: A mensagem vem direto de "body"
        mensagem: messageData.body || "",
        status: "entregue",
        // Wuzapi pode ter estruturas diferentes para mídia, verifique a documentação
        media_url: messageData.media_url || null,
        media_type: messageData.type,
      });

      // Lógica de respostas automáticas (já está correta e adaptável)
      const { data: respostas } = await supabase
        .from("respostas_automaticas")
        .select("*")
        .eq("user_id", config.user_id)
        .eq("is_active", true);

      if (respostas) {
        const mensagemTexto = (messageData.body || "").toLowerCase();
        const respostaEncontrada = respostas.find((r) =>
          mensagemTexto.includes(r.gatilho.toLowerCase())
        );

        if (respostaEncontrada) {
          // Lógica de envio e incremento do contador (mantém igual)
          // ...
        }
      }

      // Atualizar última mensagem do contato (mantém igual)
      await supabase
        .from("contatos")
        .update({ ultima_mensagem: new Date().toISOString() })
        .eq("id", contato?.id);
    }

    // A lógica de marcar como processado pode precisar de um ID único
    // Se o payload não for um identificador bom, considere usar o ID do log
    // await supabase.from("webhooks_log").update({ processado: true }).eq("payload", payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao processar webhook da Wuzapi:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

// Verificação do webhook para WUZAPI
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("secret"); 

  const MEU_TOKEN_SECRETO = process.env.WUZAPI_WEBHOOK_SECRET || "seu_token_super_secreto";

  if (token === MEU_TOKEN_SECRETO) {
    return NextResponse.json({ success: true, message: "Webhook verificado" }, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}