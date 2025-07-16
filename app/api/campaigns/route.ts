import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Listar campanhas
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("campaigns")
      .select(`
        *,
        message_templates (name, subject),
        campaign_contacts (
          id,
          status,
          contacts (name, phone_number)
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// POST - Criar nova campanha
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, template_id, contact_ids, scheduled_at } = body

    if (!name || !template_id || !contact_ids || contact_ids.length === 0) {
      return NextResponse.json({ success: false, error: "Nome, template e contatos são obrigatórios" }, { status: 400 })
    }

    // Criar a campanha
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert([
        {
          name,
          template_id,
          total_contacts: contact_ids.length,
          scheduled_at: scheduled_at || null,
          status: scheduled_at ? "scheduled" : "draft",
        },
      ])
      .select()
      .single()

    if (campaignError) throw campaignError

    // Adicionar contatos à campanha
    const campaignContacts = contact_ids.map((contact_id: string) => ({
      campaign_id: campaign.id,
      contact_id,
      status: "pending",
    }))

    const { error: contactsError } = await supabase.from("campaign_contacts").insert(campaignContacts)

    if (contactsError) throw contactsError

    // Log da criação da campanha
    await supabase.from("campaign_logs").insert([
      {
        campaign_id: campaign.id,
        event_type: "created",
        message: `Campanha criada com ${contact_ids.length} contatos`,
        metadata: { contact_count: contact_ids.length },
      },
    ])

    return NextResponse.json({ success: true, data: campaign })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// PUT - Atualizar campanha
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, template_id, scheduled_at, status } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("campaigns")
      .update({
        name,
        template_id,
        scheduled_at,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// DELETE - Excluir campanha
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    // Verificar se a campanha não está sendo enviada
    const { data: campaign } = await supabase.from("campaigns").select("status").eq("id", id).single()

    if (campaign?.status === "sending") {
      return NextResponse.json(
        { success: false, error: "Não é possível excluir uma campanha em envio" },
        { status: 400 },
      )
    }

    const { error } = await supabase.from("campaigns").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
