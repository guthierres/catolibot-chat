import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: Request) {
  try {
    const { campaign_id } = await request.json()

    if (!campaign_id) {
      return NextResponse.json({ success: false, error: "ID da campanha é obrigatório" }, { status: 400 })
    }

    // Buscar dados da campanha
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
        *,
        message_templates (*),
        campaign_contacts (
          id,
          contact_id,
          status,
          contacts (name, phone_number)
        )
      `)
      .eq("id", campaign_id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ success: false, error: "Campanha não encontrada" }, { status: 404 })
    }

    if (campaign.status === "sending") {
      return NextResponse.json({ success: false, error: "Campanha já está sendo enviada" }, { status: 400 })
    }

    // Buscar configuração do WhatsApp
    const { data: config, error: configError } = await supabase.from("whatsapp_config").select("*").single()

    if (configError || !config) {
      return NextResponse.json({ success: false, error: "Configuração do WhatsApp não encontrada" }, { status: 400 })
    }

    // Atualizar status da campanha para "sending"
    await supabase
      .from("campaigns")
      .update({
        status: "sending",
        started_at: new Date().toISOString(),
      })
      .eq("id", campaign_id)

    // Log do início da campanha
    await supabase.from("campaign_logs").insert([
      {
        campaign_id: campaign.id,
        event_type: "started",
        message: "Campanha iniciada",
      },
    ])

    let sentCount = 0
    let failedCount = 0

    // Enviar mensagens para cada contato
    for (const campaignContact of campaign.campaign_contacts) {
      if (campaignContact.status !== "pending") continue

      try {
        const contact = campaignContact.contacts
        const template = campaign.message_templates

        // Construir mensagem
        let messageText = template.message_text

        // Adicionar link se existir
        if (template.link_url) {
          const linkText = template.link_text || "Clique aqui"
          messageText += `\n\n${linkText}: ${template.link_url}`
        }

        // Preparar payload para WhatsApp API
        const messagePayload: any = {
          messaging_product: "whatsapp",
          to: contact.phone_number,
          type: "text",
          text: { body: messageText },
        }

        // Se há imagem, enviar como mídia
        if (template.image_url) {
          messagePayload.type = "image"
          messagePayload.image = {
            link: template.image_url,
            caption: messageText,
          }
          delete messagePayload.text
        }

        // Enviar mensagem via WhatsApp API
        const response = await fetch(`https://graph.facebook.com/v18.0/${config.phone_number_id}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messagePayload),
        })

        const result = await response.json()

        if (response.ok) {
          // Sucesso
          await supabase
            .from("campaign_contacts")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", campaignContact.id)

          // Salvar mensagem no histórico
          await supabase.from("whatsapp_messages").insert([
            {
              from_number: contact.phone_number,
              message_text: messageText,
              message_type: template.image_url ? "image" : "text",
              timestamp: new Date().toISOString(),
              is_incoming: false,
              whatsapp_message_id: result.messages?.[0]?.id,
            },
          ])

          // Log de sucesso
          await supabase.from("campaign_logs").insert([
            {
              campaign_id: campaign.id,
              contact_id: contact.id,
              event_type: "message_sent",
              message: `Mensagem enviada para ${contact.name}`,
              metadata: { phone: contact.phone_number, whatsapp_id: result.messages?.[0]?.id },
            },
          ])

          sentCount++
        } else {
          // Erro
          const errorMessage = result.error?.message || "Erro desconhecido"

          await supabase
            .from("campaign_contacts")
            .update({
              status: "failed",
              error_message: errorMessage,
            })
            .eq("id", campaignContact.id)

          // Log de erro
          await supabase.from("campaign_logs").insert([
            {
              campaign_id: campaign.id,
              contact_id: contact.id,
              event_type: "message_failed",
              message: `Falha ao enviar para ${contact.name}: ${errorMessage}`,
              metadata: { phone: contact.phone_number, error: result.error },
            },
          ])

          failedCount++
        }

        // Delay entre mensagens para evitar rate limiting (1 segundo)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        // Erro na requisição
        const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"

        await supabase
          .from("campaign_contacts")
          .update({
            status: "failed",
            error_message: errorMessage,
          })
          .eq("id", campaignContact.id)

        failedCount++
      }
    }

    // Atualizar status final da campanha
    await supabase
      .from("campaigns")
      .update({
        status: "completed",
        sent_count: sentCount,
        failed_count: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", campaign_id)

    // Log de conclusão
    await supabase.from("campaign_logs").insert([
      {
        campaign_id: campaign.id,
        event_type: "completed",
        message: `Campanha concluída. Enviadas: ${sentCount}, Falharam: ${failedCount}`,
        metadata: { sent_count: sentCount, failed_count: failedCount },
      },
    ])

    return NextResponse.json({
      success: true,
      message: `Campanha enviada! ${sentCount} mensagens enviadas, ${failedCount} falharam.`,
      data: {
        sent_count: sentCount,
        failed_count: failedCount,
        total: sentCount + failedCount,
      },
    })
  } catch (error) {
    console.error("Erro ao enviar campanha:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
