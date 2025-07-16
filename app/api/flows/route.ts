import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Listar fluxos de conversa
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("conversation_flows")
      .select(`
        *,
        flow_options (*)
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

// POST - Criar novo fluxo de conversa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, trigger, welcome_message, flow_options = [], flow_type = "simple", is_active = true } = body

    if (!name || !trigger || !welcome_message) {
      return NextResponse.json(
        { success: false, error: "Nome, trigger e mensagem de boas-vindas são obrigatórios" },
        { status: 400 },
      )
    }

    // Criar o fluxo com flow_type correto
    const { data: flow, error: flowError } = await supabase
      .from("conversation_flows")
      .insert([
        {
          name,
          trigger,
          welcome_message,
          flow_type, // Garantir que flow_type seja incluído
          is_active,
        },
      ])
      .select()
      .single()

    if (flowError) throw flowError

    // Criar as opções do fluxo apenas para fluxos simples
    if (flow_type === "simple" && flow_options.length > 0) {
      const optionsToInsert = flow_options.map((option: any) => ({
        flow_id: flow.id,
        option_number: option.option_number,
        option_text: option.option_text,
        response_message: option.response_message,
      }))

      const { error: optionsError } = await supabase.from("flow_options").insert(optionsToInsert)

      if (optionsError) throw optionsError
    }

    return NextResponse.json({ success: true, data: flow })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// PUT - Atualizar fluxo de conversa
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, trigger, welcome_message, flow_options = [], flow_type, is_active } = body

    if (!id || !name || !trigger || !welcome_message) {
      return NextResponse.json(
        { success: false, error: "ID, nome, trigger e mensagem de boas-vindas são obrigatórios" },
        { status: 400 },
      )
    }

    // Atualizar o fluxo incluindo flow_type
    const { data: flow, error: flowError } = await supabase
      .from("conversation_flows")
      .update({
        name,
        trigger,
        welcome_message,
        flow_type, // Incluir flow_type na atualização
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (flowError) throw flowError

    // Atualizar opções apenas para fluxos simples
    if (flow_type === "simple") {
      // Remover opções antigas
      await supabase.from("flow_options").delete().eq("flow_id", id)

      // Criar novas opções
      if (flow_options.length > 0) {
        const optionsToInsert = flow_options.map((option: any) => ({
          flow_id: id,
          option_number: option.option_number,
          option_text: option.option_text,
          response_message: option.response_message,
        }))

        const { error: optionsError } = await supabase.from("flow_options").insert(optionsToInsert)

        if (optionsError) throw optionsError
      }
    }

    return NextResponse.json({ success: true, data: flow })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// DELETE - Excluir fluxo de conversa
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    // As opções serão excluídas automaticamente devido ao CASCADE
    const { error } = await supabase.from("conversation_flows").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
