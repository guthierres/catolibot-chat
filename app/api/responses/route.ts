import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Listar respostas automáticas
export async function GET() {
  try {
    const { data, error } = await supabase.from("auto_responses").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// POST - Criar nova resposta automática
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trigger, response, is_active = true, is_bold = false, is_italic = false, is_underline = false } = body

    if (!trigger || !response) {
      return NextResponse.json({ success: false, error: "Trigger e resposta são obrigatórios" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("auto_responses")
      .insert([{ trigger, response, is_active, is_bold, is_italic, is_underline }])
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

// PUT - Atualizar resposta automática
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, trigger, response, is_active, is_bold, is_italic, is_underline } = body

    if (!id || !trigger || !response) {
      return NextResponse.json({ success: false, error: "ID, trigger e resposta são obrigatórios" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("auto_responses")
      .update({ trigger, response, is_active, is_bold, is_italic, is_underline, updated_at: new Date().toISOString() })
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

// DELETE - Excluir resposta automática
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("auto_responses").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
