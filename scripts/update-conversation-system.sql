-- Criar tabelas do sistema WhatsApp Chatbot

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_incoming BOOLEAN DEFAULT true,
  response_sent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Tabela de sessões de usuário
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  current_flow_id UUID REFERENCES conversation_flows(id),
  session_data JSONB,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_auto_responses_trigger ON auto_responses(trigger);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversation_flows_trigger ON conversation_flows(trigger);
CREATE INDEX IF NOT EXISTS idx_flow_options_flow_id ON flow_options(flow_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_phone_number ON user_sessions(phone_number);

-- Inserir dados de exemplo
INSERT INTO auto_responses (trigger, response, is_active) VALUES
('oi', 'Olá! Como posso ajudá-lo hoje?', true),
('olá', 'Oi! Em que posso ser útil?', true),
('ajuda', 'Estou aqui para ajudar! Digite "menu" para ver as opções disponíveis.', true)
ON CONFLICT DO NOTHING;

INSERT INTO conversation_flows (name, trigger, welcome_message, is_active) VALUES
('Menu Principal', 'menu', 'Olá! Como posso ajudá-lo hoje? Escolha uma das opções abaixo:', true)
ON CONFLICT DO NOTHING;

-- Inserir opções do menu principal
INSERT INTO flow_options (flow_id, option_number, option_text, response_message)
SELECT 
  cf.id,
  1,
  'Informações sobre produtos',
  'Aqui estão nossas informações sobre produtos. Em que posso ajudá-lo especificamente?'
FROM conversation_flows cf 
WHERE cf.trigger = 'menu'
ON CONFLICT DO NOTHING;

INSERT INTO flow_options (flow_id, option_number, option_text, response_message)
SELECT 
  cf.id,
  2,
  'Suporte técnico',
  'Você foi direcionado para o suporte técnico. Descreva seu problema que iremos ajudá-lo.'
FROM conversation_flows cf 
WHERE cf.trigger = 'menu'
ON CONFLICT DO NOTHING;

INSERT INTO flow_options (flow_id, option_number, option_text, response_message)
SELECT 
  cf.id,
  3,
  'Preços e orçamentos',
  'Para informações sobre preços e orçamentos, por favor nos informe qual produto ou serviço você tem interesse.'
FROM conversation_flows cf 
WHERE cf.trigger = 'menu'
ON CONFLICT DO NOTHING;

INSERT INTO flow_options (flow_id, option_number, option_text, response_message)
SELECT 
  cf.id,
  4,
  'Falar com atendente',
  'Aguarde um momento, você será direcionado para um de nossos atendentes.'
FROM conversation_flows cf 
WHERE cf.trigger = 'menu'
ON CONFLICT DO NOTHING;
