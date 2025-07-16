import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: "Número e mensagem são obrigatórios" }, { status: 400 })
    }

    // Buscar configuração
    const { data: config, error: configError } = await supabase.from("whatsapp_config").select("*").single()

    if (configError || !config) {
      return NextResponse.json({ error: "Configuração não encontrada" }, { status: 400 })
    }

    // Enviar mensagem via WhatsApp API
    const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        text: { body: message },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error?.message || "Erro ao enviar mensagem")
    }

    // Salvar mensagem no banco
    await supabase.from("whatsapp_messages").insert([
      {
        from_number: to,
        message_text: message,
        message_type: "text",
        timestamp: new Date().toISOString(),
        is_incoming: false,
        whatsapp_message_id: result.messages?.[0]?.id,
      },
    ])

    return NextResponse.json({
      success: true,
      message_id: result.messages?.[0]?.id,
    })
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno" }, { status: 500 })
  }
}
