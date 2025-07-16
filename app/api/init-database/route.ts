import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    // Tentar inserir um registro de teste em cada tabela para verificar se existem
    // Se a tabela não existir, o erro será capturado e retornaremos instruções

    const tables = [
      { name: "whatsapp_config", testData: { access_token: "test" } },
      { name: "auto_responses", testData: { trigger: "test", response: "test", is_active: true } },
      {
        name: "whatsapp_messages",
        testData: { from_number: "test", message_text: "test", message_type: "text", is_incoming: true },
      },
      {
        name: "conversation_flows",
        testData: { name: "test", trigger: "test", welcome_message: "test", is_active: true },
      },
      { name: "flow_options", testData: { option_number: 1, option_text: "test", response_message: "test" } },
    ]

    const missingTables = []

    for (const table of tables) {
      try {
        // Tentar fazer uma consulta simples para verificar se a tabela existe
        const { error } = await supabase.from(table.name).select("*").limit(1)

        if (error && error.message.includes("does not exist")) {
          missingTables.push(table.name)
        }
      } catch (err) {
        missingTables.push(table.name)
      }
    }

    if (missingTables.length > 0) {
      return NextResponse.json(
        {
          success: false,
          needsManualSetup: true,
          missingTables,
          message: "Tabelas não encontradas. Execute os scripts SQL manualmente.",
          sqlScript: `
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de configuração do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token TEXT,
    phone_number_id TEXT,
    webhook_verify_token TEXT,
    webhook_url TEXT,
    business_account_id TEXT,
    app_id TEXT,
    app_secret TEXT,
    webhook_status TEXT DEFAULT 'not_configured',
    webhook_generated_at TIMESTAMP WITH TIME ZONE,
    webhook_last_test TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de respostas automáticas
CREATE TABLE IF NOT EXISTS auto_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_number TEXT NOT NULL,
    message_text TEXT,
    message_type TEXT NOT NULL DEFAULT 'text',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_incoming BOOLEAN NOT NULL,
    response_sent TEXT,
    whatsapp_message_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de fluxos de conversa
CREATE TABLE IF NOT EXISTS conversation_flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    welcome_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de opções dos fluxos
CREATE TABLE IF NOT EXISTS flow_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID REFERENCES conversation_flows(id) ON DELETE CASCADE,
    option_number INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    response_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de sessões de fluxo do usuário
CREATE TABLE IF NOT EXISTS user_flow_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_phone TEXT NOT NULL,
    flow_id UUID REFERENCES conversation_flows(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir dados de exemplo
INSERT INTO auto_responses (trigger, response, is_active) VALUES
('oi', 'Olá! Como posso ajudá-lo hoje? 😊', true),
('olá', 'Oi! Em que posso ser útil?', true),
('ajuda', 'Estou aqui para ajudar! Você pode me perguntar sobre nossos produtos e serviços.', true),
('preço', 'Para informações sobre preços, entre em contato com nossa equipe comercial.', true),
('horário', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.', true),
('obrigado', 'De nada! Fico feliz em ajudar! 😊', true),
('tchau', 'Até logo! Tenha um ótimo dia! 👋', true)
ON CONFLICT DO NOTHING;

-- Inserir fluxo de exemplo
INSERT INTO conversation_flows (name, trigger, welcome_message, is_active) VALUES
('Menu Principal', 'menu', 'Olá! 👋 Como posso ajudá-lo hoje? Escolha uma das opções abaixo:', true),
('Atendimento', 'atendimento', 'Estou aqui para ajudar! Selecione o tipo de atendimento:', true)
ON CONFLICT DO NOTHING;

-- Inserir opções para o Menu Principal (assumindo que o ID será gerado)
DO $$
DECLARE
    menu_id UUID;
BEGIN
    SELECT id INTO menu_id FROM conversation_flows WHERE name = 'Menu Principal' LIMIT 1;
    
    IF menu_id IS NOT NULL THEN
        INSERT INTO flow_options (flow_id, option_number, option_text, response_message) VALUES
        (menu_id, 1, 'Falar com atendente', 'Aguarde um momento, você será direcionado para um de nossos atendentes. ⏳'),
        (menu_id, 2, 'Ver produtos', 'Aqui estão nossos principais produtos: [Link do catálogo] 📱💻🎧'),
        (menu_id, 3, 'Horário de funcionamento', 'Funcionamos de segunda a sexta, das 8h às 18h. Sábados das 8h às 12h. 🕐'),
        (menu_id, 4, 'Localização', 'Estamos localizados na Rua Example, 123 - Centro. 📍')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
        `,
        },
        { status: 400 },
      )
    }

    // Se chegou aqui, todas as tabelas existem
    // Verificar se há dados de exemplo
    const { data: existingResponses } = await supabase.from("auto_responses").select("id").limit(1)

    if (!existingResponses || existingResponses.length === 0) {
      // Inserir dados de exemplo
      await supabase.from("auto_responses").insert([
        { trigger: "oi", response: "Olá! Como posso ajudá-lo hoje? 😊", is_active: true },
        { trigger: "olá", response: "Oi! Em que posso ser útil?", is_active: true },
        {
          trigger: "ajuda",
          response: "Estou aqui para ajudar! Você pode me perguntar sobre nossos produtos e serviços.",
          is_active: true,
        },
        { trigger: "obrigado", response: "De nada! Fico feliz em ajudar! 😊", is_active: true },
      ])
    }

    return NextResponse.json({
      success: true,
      message: "Sistema verificado e configurado com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao verificar banco:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar banco de dados",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
