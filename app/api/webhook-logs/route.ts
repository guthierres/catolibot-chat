import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET - Listar logs do webhook
export async function GET(request: NextRequest) {
  try {
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") ?? "50")

    const { data, error } = await supabase
      .from("webhook_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}

// DELETE - Limpar todos os logs
export async function DELETE() {
  try {
    const { error } = await supabase.from("webhook_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) throw error

    return NextResponse.json({ success: true, message: "Logs limpos com sucesso" })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
