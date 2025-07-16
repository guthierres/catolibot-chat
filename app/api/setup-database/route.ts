import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const CREATE_TABLES_SQL = `
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_number TEXT NOT NULL,
    message_text TEXT,
    message_type TEXT DEFAULT 'text',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_incoming BOOLEAN DEFAULT true,
    response_sent TEXT,
    whatsapp_message_id TEXT,
    raw_data JSONB
);

-- Criar tabela de respostas automáticas
CREATE TABLE IF NOT EXISTS auto_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de fluxos de conversa
CREATE TABLE IF NOT EXISTS conversation_flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    welcome_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de opções de fluxo
CREATE TABLE IF NOT EXISTS flow_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID REFERENCES conversation_flows(id) ON DELETE CASCADE,
    option_number INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    response_message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de sessões de usuário
CREATE TABLE IF NOT EXISTS user_flow_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_phone TEXT NOT NULL,
    flow_id UUID REFERENCES conversation_flows(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de logs do webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de contatos
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    email TEXT,
    notes TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    message_text TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    link_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft',
    total_contacts INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de contatos da campanha
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar tabela de logs de campanhas
CREATE TABLE IF NOT EXISTS campaign_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir dados de exemplo
INSERT INTO auto_responses (trigger, response, is_active) VALUES
('oi', 'Olá! Como posso ajudá-lo hoje?', true),
('olá', 'Oi! Em que posso ser útil?', true),
('ajuda', 'Estou aqui para ajudar! Digite "menu" para ver as opções disponíveis.', true)
ON CONFLICT DO NOTHING;

INSERT INTO conversation_flows (name, trigger, welcome_message, is_active) VALUES
('Menu Principal', 'menu', 'Escolha uma das opções abaixo:', true)
ON CONFLICT DO NOTHING;

-- Inserir templates de exemplo
INSERT INTO message_templates (name, subject, message_text, is_active) VALUES
('Aviso Missa Dominical', 'Missa Dominical', 'Paz e bem! 🙏\n\nLembramos que nossa Missa Dominical será às 19h.\n\nVenha participar conosco!\n\nParóquia São José', true),
('Evento Paroquial', 'Evento Especial', 'Paz e bem! ✨\n\nConvidamos você para nosso evento especial.\n\nMais informações em breve!\n\nParóquia São José', true),
('Aviso Geral', 'Comunicado Paroquial', 'Paz e bem! 📢\n\nTemos um comunicado importante para nossa comunidade.\n\nParóquia São José', true)
ON CONFLICT DO NOTHING;

-- Inserir contatos de exemplo
INSERT INTO contacts (name, phone_number, tags, is_active) VALUES
('João Silva', '5511999999999', ARRAY['paroquiano', 'ministro'], true),
('Maria Santos', '5511888888888', ARRAY['paroquiana', 'catequista'], true),
('Pedro Oliveira', '5511777777777', ARRAY['paroquiano'], true)
ON CONFLICT (phone_number) DO NOTHING;
`

export async function POST() {
  try {
    // Verificar se as tabelas já existem
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "whatsapp_config")

    if (tablesError) {
      console.error("Error checking tables:", tablesError)
      return NextResponse.json({
        success: false,
        needsSetup: true,
        sqlScript: CREATE_TABLES_SQL,
        error: "Não foi possível verificar as tabelas. Execute o script SQL manualmente.",
      })
    }

    if (!tables || tables.length === 0) {
      // Tabelas não existem, retornar script para execução manual
      return NextResponse.json({
        success: false,
        needsSetup: true,
        sqlScript: CREATE_TABLES_SQL,
        message: "Execute o script SQL no Supabase Dashboard para configurar o banco de dados.",
      })
    }

    // Tabelas existem, sistema está pronto
    return NextResponse.json({
      success: true,
      needsSetup: false,
      message: "Banco de dados configurado e pronto para uso!",
    })
  } catch (error) {
    console.error("Setup database error:", error)
    return NextResponse.json(
      {
        success: false,
        needsSetup: true,
        sqlScript: CREATE_TABLES_SQL,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
