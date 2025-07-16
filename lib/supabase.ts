import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are missing")
  console.warn("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓ Set" : "✗ Missing")
  console.warn("NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✓ Set" : "✗ Missing")
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : new Proxy({} as any, {
        get() {
          throw new Error("Supabase client not available - check environment variables")
        },
      })

export async function testSupabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        connected: false,
        error: "Environment variables missing",
        details: {
          supabaseUrl: supabaseUrl ? "✓ Set" : "✗ Missing",
          supabaseAnonKey: supabaseAnonKey ? "✓ Set" : "✗ Missing",
        },
      }
    }

    console.log("Testing Supabase connection...")
    console.log("URL:", supabaseUrl)
    console.log("Key:", supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : "Missing")

    // Teste simples de conectividade
    const { data, error } = await supabase.from("whatsapp_config").select("count").limit(1)

    if (error) {
      console.log("Supabase error:", error)

      if (error.code === "PGRST116") {
        // Tabela não existe mas conexão funciona
        return {
          connected: true,
          needsSetup: true,
          message: "Conectado, mas tabelas precisam ser criadas",
        }
      }

      // Outros erros
      return {
        connected: false,
        error: error.message,
        code: error.code,
        details: error.details,
      }
    }

    console.log("Supabase connection successful:", data)
    return {
      connected: true,
      needsSetup: false,
      message: "Conectado com sucesso",
    }
  } catch (error) {
    console.error("Connection test error:", error)
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Unknown error",
      type: "network_error",
    }
  }
}
