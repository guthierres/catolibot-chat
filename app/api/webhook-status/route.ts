import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest) {
  try {
    const { data: config, error } = await supabase
      .from("whatsapp_config")
      .select("webhook_url, webhook_verify_token, webhook_status, webhook_generated_at, webhook_last_test")
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      webhook_configured: !!config.webhook_url,
      webhook_status: config.webhook_status || "not_configured",
      webhook_url: config.webhook_url,
      generated_at: config.webhook_generated_at,
      last_test: config.webhook_last_test,
    })
  } catch (error) {
    console.error("Erro ao verificar status do webhook:", error)
    return NextResponse.json(
      {
        error: "Erro ao verificar status do webhook",
      },
      { status: 500 },
    )
  }
}
