import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Listar templates
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("message_templates")
      .select("*")
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

// POST - Criar novo template
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, subject, message_text, image_url, link_url, link_text, is_active = true } = body

    if (!name || !message_text) {
      return NextResponse.json({ success: false, error: "Nome e mensagem são obrigatórios" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("message_templates")
      .insert([{ name, subject, message_text, image_url, link_url, link_text, is_active }])
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

// PUT - Atualizar template
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, subject, message_text, image_url, link_url, link_text, is_active } = body

    if (!id || !name || !message_text) {
      return NextResponse.json({ success: false, error: "ID, nome e mensagem são obrigatórios" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("message_templates")
      .update({
        name,
        subject,
        message_text,
        image_url,
        link_url,
        link_text,
        is_active,
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

// DELETE - Excluir template
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("message_templates").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
