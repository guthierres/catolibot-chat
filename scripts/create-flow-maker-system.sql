-- scripts/create-flow-maker-system.sql

-- Tabela para armazenar os fluxos
CREATE TABLE IF NOT EXISTS flows (
    flow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_name TEXT NOT NULL,
    flow_type TEXT NOT NULL DEFAULT 'simple', -- 'simple' ou 'visual'
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT chk_node_type CHECK (node_type IN ('start', 'message', 'condition', 'action', 'end', 'quick-replies-message'))
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

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_connections_flow_id ON flow_connections(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_connections_source_node_id ON flow_connections(source_node_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para as tabelas
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

-- Adicionar coluna canvas_config à tabela flows se não existir
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flows' AND column_name = 'canvas_config') THEN
        ALTER TABLE flows ADD COLUMN canvas_config JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Adicionar coluna flow_type à tabela flows se não existir (já existe, mas para garantir)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flows' AND column_name = 'flow_type') THEN
        ALTER TABLE flows ADD COLUMN flow_type TEXT NOT NULL DEFAULT 'simple';
    END IF;
END $$;

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

    -- Se a restrição existir, removê-la
    IF FOUND THEN
        EXECUTE 'ALTER TABLE flow_nodes DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;

    -- Adicionar a nova restrição com o tipo 'quick-replies-message'
    ALTER TABLE flow_nodes ADD CONSTRAINT chk_node_type CHECK (node_type IN ('start', 'message', 'condition', 'action', 'end', 'quick-replies-message'));
END $$;
