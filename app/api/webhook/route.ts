import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Função para registrar logs
async function logWebhookEvent(eventType: string, eventData: any) {
  try {
    await supabase.from("webhook_logs").insert({
      event_type: eventType,
      event_data: eventData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error logging webhook event:", error)
  }
}

// GET - Validação do webhook pelo Facebook
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("Webhook validation attempt:", { mode, token, challenge })

  await logWebhookEvent("validation_attempt", {
    mode,
    token,
    challenge,
    url: request.url,
  })

  // Verificar se todos os parâmetros estão presentes
  if (!mode || !token || !challenge) {
    await logWebhookEvent("validation_error", {
      error: "Missing required parameters",
      received: { mode, token, challenge },
    })
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  // Verificar se o modo é 'subscribe'
  if (mode !== "subscribe") {
    await logWebhookEvent("validation_error", {
      error: "Invalid mode",
      mode,
    })
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 })
  }

  try {
    // Buscar o token de verificação no banco de dados
    const { data: config, error } = await supabase.from("whatsapp_config").select("webhook_verify_token").single()

    if (error || !config) {
      await logWebhookEvent("validation_error", {
        error: "Config not found",
        dbError: error,
      })
      return NextResponse.json({ error: "Configuration not found" }, { status: 500 })
    }

    console.log("Comparing tokens:", {
      received: token,
      stored: config.webhook_verify_token,
      match: token === config.webhook_verify_token,
    })

    // Verificar se o token corresponde
    if (token === config.webhook_verify_token) {
      await logWebhookEvent("validation_success", {
        token,
        challenge,
      })
      console.log("Webhook validation successful, returning challenge:", challenge)

      // Retornar o challenge como texto simples
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      })
    } else {
      await logWebhookEvent("validation_error", {
        error: "Token mismatch",
        received: token,
        expected: config.webhook_verify_token,
      })
      return NextResponse.json({ error: "Invalid verify token" }, { status: 403 })
    }
  } catch (error) {
    console.error("Webhook validation error:", error)
    await logWebhookEvent("validation_error", {
      error: "Server error",
      details: error instanceof Error ? error.message : "Unknown error",
    })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST - Receber mensagens do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Webhook POST received:", JSON.stringify(body, null, 2))

    await logWebhookEvent("message_received", body)

    // Verificar se é uma mensagem
    if (body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0]) {
      const change = body.entry[0].changes[0]

      if (change.field === "messages" && change.value && change.value.messages) {
        const messages = change.value.messages

        for (const message of messages) {
          // Salvar mensagem no banco de dados
          const messageData = {
            from_number: message.from,
            message_text: message.text?.body || message.type || "Mensagem não textual",
            message_type: message.type,
            timestamp: new Date(Number.parseInt(message.timestamp) * 1000).toISOString(),
            is_incoming: true,
          }

          const { error } = await supabase.from("whatsapp_messages").insert(messageData)

          if (error) {
            console.error("Error saving message:", error)
            await logWebhookEvent("message_save_error", { error, messageData })
          } else {
            await logWebhookEvent("message_saved", messageData)
          }

          // Aqui você pode adicionar lógica para processar a mensagem
          // e enviar respostas automáticas
        }
      }
    }

    // Sempre retornar 200 OK para o Facebook
    return NextResponse.json({ status: "ok" }, { status: 200 })
  } catch (error) {
    console.error("Webhook POST error:", error)
    await logWebhookEvent("webhook_error", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
