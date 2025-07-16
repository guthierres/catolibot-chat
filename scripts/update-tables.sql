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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_conversation_flows_trigger ON conversation_flows(trigger);
CREATE INDEX IF NOT EXISTS idx_conversation_flows_active ON conversation_flows(is_active);
CREATE INDEX IF NOT EXISTS idx_flow_options_flow_id ON flow_options(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_options_number ON flow_options(option_number);
CREATE INDEX IF NOT EXISTS idx_user_flow_sessions_phone ON user_flow_sessions(user_phone);
CREATE INDEX IF NOT EXISTS idx_user_flow_sessions_active ON user_flow_sessions(is_active);

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_conversation_flows_updated_at 
    BEFORE UPDATE ON conversation_flows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_flow_sessions_updated_at 
    BEFORE UPDATE ON user_flow_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
