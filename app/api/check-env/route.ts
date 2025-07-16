import { NextResponse } from "next/server"

export async function GET() {
  const requiredEnvs = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const status: Record<string, string> = {}
  const values: Record<string, string> = {}
  let allConfigured = true

  for (const [key, value] of Object.entries(requiredEnvs)) {
    if (value) {
      status[key] = "✓ Configurada"
      // Mostrar apenas os primeiros 30 caracteres para segurança
      values[key] = value.substring(0, 30) + "..."
    } else {
      status[key] = "✗ Não configurada"
      allConfigured = false
    }
  }

  return NextResponse.json({
    success: allConfigured,
    status,
    values,
    message: allConfigured
      ? "Todas as variáveis de ambiente estão configuradas"
      : "Algumas variáveis de ambiente estão faltando",
  })
}
