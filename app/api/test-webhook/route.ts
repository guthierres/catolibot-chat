import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { webhook_url, verify_token } = await request.json()

    if (!webhook_url || !verify_token) {
      return NextResponse.json(
        { success: false, error: "URL do webhook e token de verificação são obrigatórios" },
        { status: 400 },
      )
    }

    // Log do início do teste
    await supabase.from("webhook_logs").insert({
      event_type: "test_started",
      event_data: {
        webhook_url,
        verify_token: `${verify_token.substring(0, 10)}...`,
        timestamp: new Date().toISOString(),
      },
    })

    // Simular a validação do Facebook
    const testUrl = new URL(webhook_url)
    testUrl.searchParams.set("hub.mode", "subscribe")
    testUrl.searchParams.set("hub.verify_token", verify_token)
    testUrl.searchParams.set("hub.challenge", "test_challenge_123")

    console.log("Testing webhook URL:", testUrl.toString())

    try {
      const response = await fetch(testUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent": "facebookexternalhit/1.1",
        },
      })

      const responseText = await response.text()

      console.log("Webhook test response:", {
        status: response.status,
        statusText: response.statusText,
        body: responseText,
      })

      if (response.ok && responseText === "test_challenge_123") {
        await supabase.from("webhook_logs").insert({
          event_type: "test_success",
          event_data: {
            message: "Webhook validation successful",
            status: response.status,
            response_body: responseText,
          },
        })

        return NextResponse.json({
          success: true,
          message: "✅ Webhook validado com sucesso! Pode configurar no Facebook.",
          details: {
            status: response.status,
            response: responseText,
          },
        })
      } else {
        await supabase.from("webhook_logs").insert({
          event_type: "test_failed",
          event_data: {
            error: "Invalid response",
            status: response.status,
            expected: "test_challenge_123",
            received: responseText,
          },
        })

        return NextResponse.json({
          success: false,
          error: `❌ Falha na validação. Status: ${response.status}, Resposta: ${responseText}`,
          details: {
            status: response.status,
            expected: "test_challenge_123",
            received: responseText,
          },
        })
      }
    } catch (fetchError) {
      await supabase.from("webhook_logs").insert({
        event_type: "test_failed",
        event_data: {
          error: "Network error",
          details: fetchError instanceof Error ? fetchError.message : "Unknown error",
        },
      })

      return NextResponse.json({
        success: false,
        error: `❌ Erro de rede: ${fetchError instanceof Error ? fetchError.message : "Erro desconhecido"}`,
      })
    }
  } catch (error) {
    console.error("Test webhook error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
