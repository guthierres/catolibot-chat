import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Verificar se as variáveis de ambiente existem
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        connected: false,
        error: "Variáveis de ambiente do Supabase não configuradas",
        details: {
          url: supabaseUrl ? "✓ Configurada" : "✗ Faltando NEXT_PUBLIC_SUPABASE_URL",
          key: supabaseKey ? "✓ Configurada" : "✗ Faltando SUPABASE_SERVICE_ROLE_KEY",
        },
      })
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Testar conexão tentando ler da tabela whatsapp_config
    const { data, error } = await supabase.from("whatsapp_config").select("id").limit(1)

    if (error) {
      // Se a tabela não existe, precisamos configurar
      if (error.code === "42P01" || error.message.includes("does not exist")) {
        return NextResponse.json({
          connected: true,
          needsSetup: true,
          message: "Conectado ao Supabase, mas tabelas precisam ser criadas",
        })
      }

      // Outro tipo de erro
      throw error
    }

    // Conexão bem-sucedida
    return NextResponse.json({
      connected: true,
      needsSetup: false,
      message: "Conectado ao Supabase com sucesso",
      hasData: data && data.length > 0,
    })
  } catch (error) {
    console.error("Supabase connection error:", error)

    return NextResponse.json({
      connected: false,
      error: "Erro ao conectar com Supabase",
      details: error instanceof Error ? error.message : "Erro desconhecido",
    })
  }
}
