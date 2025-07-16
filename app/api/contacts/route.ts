import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Listar contatos
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get("search") || ""
    const tag = url.searchParams.get("tag") || ""
    const active = url.searchParams.get("active")

    let query = supabase.from("contacts").select("*").order("name", { ascending: true })

    // Filtrar por busca
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_number.ilike.%${search}%`)
    }

    // Filtrar por tag
    if (tag) {
      query = query.contains("tags", [tag])
    }

    // Filtrar por ativo
    if (active !== null) {
      query = query.eq("is_active", active === "true")
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// POST - Criar novo contato
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, phone_number, email, notes, tags = [], is_active = true } = body

    if (!name || !phone_number) {
      return NextResponse.json({ success: false, error: "Nome e telefone são obrigatórios" }, { status: 400 })
    }

    // Limpar e formatar número de telefone
    const cleanPhone = phone_number.replace(/\D/g, "")

    const { data, error } = await supabase
      .from("contacts")
      .insert([{ name, phone_number: cleanPhone, email, notes, tags, is_active }])
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        // Unique constraint violation
        return NextResponse.json(
          { success: false, error: "Este número de telefone já está cadastrado" },
          { status: 400 },
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// PUT - Atualizar contato
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, phone_number, email, notes, tags, is_active } = body

    if (!id || !name || !phone_number) {
      return NextResponse.json({ success: false, error: "ID, nome e telefone são obrigatórios" }, { status: 400 })
    }

    // Limpar e formatar número de telefone
    const cleanPhone = phone_number.replace(/\D/g, "")

    const { data, error } = await supabase
      .from("contacts")
      .update({ name, phone_number: cleanPhone, email, notes, tags, is_active, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Este número de telefone já está cadastrado" },
          { status: 400 },
        )
      }
      throw error
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// DELETE - Excluir contato
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    const { error } = await supabase.from("contacts").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
