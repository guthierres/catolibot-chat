import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// lado-server → Service Role Key
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>

    // upsert (1 só registro); se ainda não existir, cria
    const { data, error } = await supabase
      .from("whatsapp_config")
      .upsert(body, { onConflict: "id" }) // exige PK/unique id na tabela
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, config: data })
  } catch (err) {
    console.error("Erro API save-config:", err)
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
