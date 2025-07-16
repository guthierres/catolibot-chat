import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { useWebhookSite } = await request.json()

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ success: false, error: "Variáveis de ambiente não configuradas" }, { status: 500 })
    }

    // Gerar token único para verificação
    const verifyToken = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

    let webhookUrl = ""

    if (useWebhookSite) {
      // Usar webhook.site
      try {
        const webhookResponse = await fetch("https://webhook.site/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            default_status: 200,
            default_content: "OK",
            default_content_type: "text/plain",
          }),
        })

        if (webhookResponse.ok) {
          const data = await webhookResponse.json()
          webhookUrl = `https://webhook.site/${data.uuid}`
        } else {
          throw new Error("Webhook.site API falhou")
        }
      } catch (webhookError) {
        return NextResponse.json({ success: false, error: "Erro ao criar webhook no webhook.site" }, { status: 500 })
      }
    } else {
      // Usar URL específica do projeto, capturando automaticamente do ambiente
      let appBaseUrl =
        process.env.VERCEL_URL || process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:3000"

      // Garantir que a URL comece com https:// para produção, se não for localhost
      if (!appBaseUrl.startsWith("http://") && !appBaseUrl.startsWith("https://")) {
        appBaseUrl = `https://${appBaseUrl}`
      } else if (appBaseUrl.startsWith("http://localhost")) {
        // Manter http para localhost
      } else if (appBaseUrl.startsWith("http://")) {
        // Forçar https para outros domínios que não sejam localhost
        appBaseUrl = `https://${appBaseUrl.substring(7)}`
      }

      webhookUrl = `${appBaseUrl}/api/webhook`
    }

    console.log("Generated webhook URL:", webhookUrl)
    console.log("Generated verify token:", verifyToken)

    // Buscar configuração existente
    const { data: existingConfig } = await supabase.from("whatsapp_config").select("*").single()

    // Preparar dados para salvar
    const configData = {
      ...existingConfig,
      webhook_url: webhookUrl,
      webhook_verify_token: verifyToken,
      updated_at: new Date().toISOString(),
    }

    // Se não existe configuração, criar uma nova
    if (!existingConfig) {
      configData.access_token = ""
      configData.phone_number_id = ""
      configData.business_account_id = ""
      configData.app_id = ""
      configData.app_secret = ""
      configData.created_at = new Date().toISOString()
    }

    // Salvar no banco de dados
    const { data: savedConfig, error } = await supabase.from("whatsapp_config").upsert(configData).select().single()

    if (error) {
      console.error("Error saving config:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      webhook_url: webhookUrl,
      verify_token: verifyToken,
      config: savedConfig,
      message: useWebhookSite ? "Webhook URL gerada via Webhook.site!" : "Webhook URL gerada usando seu projeto!",
    })
  } catch (error) {
    console.error("Error generating webhook:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
        details: "Verifique se o banco de dados está configurado corretamente",
      },
      { status: 500 },
    )
  }
}
