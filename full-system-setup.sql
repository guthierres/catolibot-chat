-- full-system-setup.sql
-- Script completo para configurar o sistema WhatsApp Chatbot, incluindo tabelas, funções, triggers e dados de exemplo.

-- Habilitar a extensão uuid-ossp para gerar UUIDs (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================================================
-- FUNÇÕES
-- ====================================================================================================

-- Função para atualizar a coluna 'updated_at' automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para atualizar o status do webhook na tabela whatsapp_config
CREATE OR REPLACE FUNCTION update_webhook_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Se webhook_url foi alterado, marcar como configurado
    IF NEW.webhook_url IS NOT NULL AND NEW.webhook_url != '' THEN
        NEW.webhook_status = 'configured';
        NEW.webhook_generated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ====================================================================================================
-- CRIAÇÃO DE TABELAS
-- ====================================================================================================

-- Tabela de configuração do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    access_token TEXT NOT NULL,
    phone_number_id TEXT NOT NULL,
    webhook_verify_token TEXT NOT NULL,
    webhook_url TEXT,
    business_account_id TEXT,
    app_id TEXT,
    app_secret TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de respostas automáticas
CREATE TABLE IF NOT EXISTS auto_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trigger TEXT NOT NULL,
    response TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_bold BOOLEAN DEFAULT FALSE,
    is_italic BOOLEAN DEFAULT FALSE,
    is_underline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens do WhatsApp
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

-- Tabela de contatos (antiga whatsapp_contacts, agora mais genérica)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    phone_number TEXT NOT NULL UNIQUE,
    email TEXT,
    notes TEXT,
    tags TEXT[], -- Array de tags para categorização
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de fluxos de conversa
CREATE TABLE IF NOT EXISTS conversation_flows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    trigger TEXT NOT NULL,
    welcome_message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de opções dos fluxos
CREATE TABLE IF NOT EXISTS flow_options (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id UUID REFERENCES conversation_flows(id) ON DELETE CASCADE,
    option_number INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    response_message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões de usuário (antiga user_flow_sessions, agora mais genérica)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    current_flow_id UUID REFERENCES conversation_flows(id),
    session_data JSONB,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs do webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para armazenar os fluxos do Flow Maker
CREATE TABLE IF NOT EXISTS flows (
    flow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_name TEXT NOT NULL,
    flow_type TEXT NOT NULL DEFAULT 'simple', -- 'simple' ou 'visual'
    canvas_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os nós do fluxo visual
CREATE TABLE IF NOT EXISTS flow_nodes (
    node_id TEXT PRIMARY KEY,
    flow_id UUID NOT NULL REFERENCES flows(flow_id) ON DELETE CASCADE,
    node_type TEXT NOT NULL, -- e.g., 'start', 'message', 'condition', 'action', 'end', 'quick-replies-message'
    title TEXT,
    content TEXT,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    config JSONB DEFAULT '{}'::jsonb, -- Para configurações específicas do nó (ex: opções, formatação, mídia, botões)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar as conexões entre os nós
CREATE TABLE IF NOT EXISTS flow_connections (
    connection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID NOT NULL REFERENCES flows(flow_id) ON DELETE CASCADE,
    source_node_id TEXT NOT NULL REFERENCES flow_nodes(node_id) ON DELETE CASCADE,
    target_node_id TEXT NOT NULL REFERENCES flow_nodes(node_id) ON DELETE CASCADE,
    condition_value TEXT, -- Valor que aciona esta conexão (ex: '1', 'sim', 'else-exit', 'button-label-kebab-case')
    label TEXT, -- Rótulo para a aresta no ReactFlow (ex: 'Opção 1', 'Sim', 'Else')
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de templates de mensagens para campanhas
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT,
    message_text TEXT NOT NULL,
    image_url TEXT,
    link_url TEXT,
    link_text TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    template_id UUID REFERENCES message_templates(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft', -- draft, sending, completed, failed
    total_contacts INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de contatos da campanha
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de campanhas
CREATE TABLE IF NOT EXISTS campaign_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- started, message_sent, message_failed, completed
    message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================================================
-- ALTERAÇÕES DE TABELAS (ADICIONAR COLUNAS/RESTRICOES)
-- Esta seção agora é mais para colunas que não foram adicionadas na criação inicial por algum motivo
-- ou para modificações de restrições.
-- ====================================================================================================

-- Adicionar campos para controle automático de webhook na whatsapp_config
ALTER TABLE whatsapp_config 
ADD COLUMN IF NOT EXISTS webhook_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_last_test TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_status TEXT DEFAULT 'not_configured';

-- Atualizar a restrição CHECK para node_type para incluir 'quick-replies-message'
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Encontrar o nome da restrição existente
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'flow_nodes'::regclass
      AND contype = 'c'
      AND conname LIKE 'chk_node_type%';

    -- Se a restrição existir e não incluir 'quick-replies-message', removê-la
    IF FOUND AND NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = constraint_name
        AND conrelid = 'flow_nodes'::regclass
        AND pg_get_constraintdef(oid) ILIKE '%quick-replies-message%'
    ) THEN
        EXECUTE 'ALTER TABLE flow_nodes DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Adicionar a nova restrição com o tipo 'quick-replies-message' se não existir ou se a antiga foi removida
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'flow_nodes'::regclass
        AND contype = 'c'
        AND pg_get_constraintdef(oid) ILIKE '%quick-replies-message%'
    ) THEN
        ALTER TABLE flow_nodes ADD CONSTRAINT chk_node_type CHECK (node_type IN ('start', 'message', 'condition', 'action', 'end', 'quick-replies-message'));
    END IF;
END $$;

-- ====================================================================================================
-- CRIAÇÃO DE ÍNDICES
-- ====================================================================================================

-- Índices para whatsapp_config
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_webhook_status ON whatsapp_config(webhook_status);

-- Índices para auto_responses
CREATE INDEX IF NOT EXISTS idx_auto_responses_trigger ON auto_responses(trigger);
CREATE INDEX IF NOT EXISTS idx_auto_responses_active ON auto_responses(is_active);

-- Índices para whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp DESC);

-- Índices para contacts
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_active ON contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags);

-- Índices para conversation_flows
CREATE INDEX IF NOT EXISTS idx_conversation_flows_trigger ON conversation_flows(trigger);
CREATE INDEX IF NOT EXISTS idx_conversation_flows_active ON conversation_flows(is_active);

-- Índices para flow_options
CREATE INDEX IF NOT EXISTS idx_flow_options_flow_id ON flow_options(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_options_number ON flow_options(option_number);

-- Índices para user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_phone_number ON user_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Índices para webhook_logs
CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);

-- Índices para flows (Flow Maker)
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_connections_flow_id ON flow_connections(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_connections_source_node_id ON flow_connections(source_node_id);

-- Índices para campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);
CREATE INDEX IF NOT EXISTS idx_campaign_logs_campaign ON campaign_logs(campaign_id);

-- ====================================================================================================
-- CRIAÇÃO DE TRIGGERS
-- ====================================================================================================

-- Triggers para atualizar updated_at
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_whatsapp_config_updated_at') THEN
        CREATE TRIGGER update_whatsapp_config_updated_at 
            BEFORE UPDATE ON whatsapp_config 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_auto_responses_updated_at') THEN
        CREATE TRIGGER update_auto_responses_updated_at 
            BEFORE UPDATE ON auto_responses 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
        CREATE TRIGGER update_contacts_updated_at 
            BEFORE UPDATE ON contacts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversation_flows_updated_at') THEN
        CREATE TRIGGER update_conversation_flows_updated_at 
            BEFORE UPDATE ON conversation_flows 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_sessions_updated_at') THEN
        CREATE TRIGGER update_user_sessions_updated_at 
            BEFORE UPDATE ON user_sessions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_flows_updated_at') THEN
        CREATE TRIGGER set_flows_updated_at
        BEFORE UPDATE ON flows
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_flow_nodes_updated_at') THEN
        CREATE TRIGGER set_flow_nodes_updated_at
        BEFORE UPDATE ON flow_nodes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_flow_connections_updated_at') THEN
        CREATE TRIGGER set_flow_connections_updated_at
        BEFORE UPDATE ON flow_connections
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_message_templates_updated_at') THEN
        CREATE TRIGGER update_message_templates_updated_at 
            BEFORE UPDATE ON message_templates 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaigns_updated_at') THEN
        CREATE TRIGGER update_campaigns_updated_at 
            BEFORE UPDATE ON campaigns 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Trigger para atualizar status do webhook (se já existir, será substituído)
DROP TRIGGER IF EXISTS update_webhook_status_trigger ON whatsapp_config;
CREATE TRIGGER update_webhook_status_trigger 
    BEFORE UPDATE ON whatsapp_config 
    FOR EACH ROW EXECUTE FUNCTION update_webhook_status();

-- ====================================================================================================
-- INSERÇÃO DE DADOS DE EXEMPLO
-- ====================================================================================================

-- Inserir dados de exemplo para respostas automáticas
INSERT INTO auto_responses (trigger, response, is_active, is_bold, is_italic, is_underline) VALUES
('oi', 'Olá! Como posso ajudá-lo hoje? 😊', true, false, false, false),
('olá', 'Oi! Em que posso ser útil?', true, false, false, false),
('ajuda', 'Estou aqui para ajudar! Você pode me perguntar sobre nossos produtos e serviços.', true, false, false, false),
('preço', 'Para informações sobre preços, entre em contato com nossa equipe comercial.', true, false, false, false),
('horário', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.', true, false, false, false),
('obrigado', 'De nada! Fico feliz em ajudar! 😊', true, false, false, false),
('tchau', 'Até logo! Tenha um ótimo dia! 👋', true, false, false, false)
ON CONFLICT (id) DO NOTHING;

-- Inserir configuração de exemplo (você deve substituir pelos seus dados reais)
INSERT INTO whatsapp_config (
    access_token,
    phone_number_id,
    webhook_verify_token,
    webhook_url,
    business_account_id,
    app_id,
    app_secret
) VALUES (
    'SEU_ACCESS_TOKEN_AQUI',
    'SEU_PHONE_NUMBER_ID_AQUI',
    'meu_token_secreto_123',
    'https://catolibot.vercel.app/api/webhook',
    'SEU_BUSINESS_ACCOUNT_ID_AQUI',
    'SEU_APP_ID_AQUI',
    'SEU_APP_SECRET_AQUI'
) ON CONFLICT (id) DO NOTHING;

-- Inserir fluxos de conversa de exemplo
INSERT INTO conversation_flows (name, trigger, welcome_message, is_active) VALUES
('Menu Principal', 'menu', 'Olá! 👋 Como posso ajudá-lo hoje? Escolha uma das opções abaixo:', true),
('Atendimento', 'ajuda', 'Estou aqui para ajudar! Selecione o tipo de atendimento:', true),
('Informações', 'info', 'Que informação você gostaria de saber?', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir opções para o Menu Principal
INSERT INTO flow_options (flow_id, option_number, option_text, response_message) 
SELECT 
    cf.id,
    option_data.option_number,
    option_data.option_text,
    option_data.response_message
FROM conversation_flows cf
CROSS JOIN (
    VALUES 
    (1, 'Falar com atendente', 'Aguarde um momento, você será direcionado para um de nossos atendentes. ⏳'),
    (2, 'Ver produtos', 'Aqui estão nossos principais produtos: [Link do catálogo] 📱💻🎧'),
    (3, 'Horário de funcionamento', 'Funcionamos de segunda a sexta, das 8h às 18h. Sábados das 8h às 12h. 🕐'),
    (4, 'Localização', 'Estamos localizados na Rua Example, 123 - Centro. 📍')
) AS option_data(option_number, option_text, response_message)
WHERE cf.name = 'Menu Principal'
ON CONFLICT (id) DO NOTHING;

-- Inserir opções para Atendimento
INSERT INTO flow_options (flow_id, option_number, option_text, response_message) 
SELECT 
    cf.id,
    option_data.option_number,
    option_data.option_text,
    option_data.response_message
FROM conversation_flows cf
CROSS JOIN (
    VALUES 
    (1, 'Suporte técnico', 'Você será direcionado para nossa equipe de suporte técnico. 🔧'),
    (2, 'Vendas', 'Nossa equipe de vendas entrará em contato em breve! 💼'),
    (3, 'Reclamações', 'Lamentamos o ocorrido. Um supervisor entrará em contato. 😔'),
    (4, 'Elogios', 'Muito obrigado pelo seu feedback positivo! 😊')
) AS option_data(option_number, option_text, response_message)
WHERE cf.name = 'Atendimento'
ON CONFLICT (id) DO NOTHING;

-- Inserir opções para Informações
INSERT INTO flow_options (flow_id, option_number, option_text, response_message) 
SELECT 
    cf.id,
    option_data.option_number,
    option_data.option_text,
    option_data.response_message
FROM conversation_flows cf
CROSS JOIN (
    VALUES 
    (1, 'Sobre a empresa', 'Somos uma empresa especializada em soluções digitais há mais de 10 anos. 🏢'),
    (2, 'Formas de pagamento', 'Aceitamos: PIX, cartão de crédito, débito e boleto bancário. 💳'),
    (3, 'Política de entrega', 'Entregamos em todo o Brasil. Prazo: 3-7 dias úteis. 🚚'),
    (4, 'Garantia', 'Todos os produtos têm garantia de 12 meses. 🛡️')
) AS option_data(option_number, option_text, response_message)
WHERE cf.name = 'Informações'
ON CONFLICT (id) DO NOTHING;

-- Inserir templates de exemplo para campanhas
INSERT INTO message_templates (name, subject, message_text, is_active) VALUES
('Aviso Missa Dominical', 'Missa Dominical', 'Paz e bem! 🙏\n\nLembramos que nossa Missa Dominical será às 19h.\n\nVenha participar conosco!\n\nParóquia São José', true),
('Evento Paroquial', 'Evento Especial', 'Paz e bem! ✨\n\nConvidamos você para nosso evento especial.\n\nMais informações em breve!\n\nParóquia São José', true),
('Aviso Geral', 'Comunicado Paroquial', 'Paz e bem! 📢\n\nTemos um comunicado importante para nossa comunidade.\n\nParóquia São José', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir contatos de exemplo
INSERT INTO contacts (name, phone_number, tags, is_active) VALUES
('João Silva', '5511999999999', ARRAY['paroquiano', 'ministro'], true),
('Maria Santos', '5511888888888', ARRAY['paroquiana', 'catequista'], true),
('Pedro Oliveira', '5511777777777', ARRAY['paroquiano'], true)
ON CONFLICT (phone_number) DO NOTHING;
