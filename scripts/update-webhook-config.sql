-- Adicionar campos para controle automático de webhook
ALTER TABLE whatsapp_config 
ADD COLUMN IF NOT EXISTS webhook_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_last_test TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_status TEXT DEFAULT 'not_configured';

-- Criar índice para webhook_status
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_webhook_status ON whatsapp_config(webhook_status);

-- Atualizar trigger para webhook_status
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

-- Criar trigger para atualizar status do webhook
DROP TRIGGER IF EXISTS update_webhook_status_trigger ON whatsapp_config;
CREATE TRIGGER update_webhook_status_trigger 
    BEFORE UPDATE ON whatsapp_config 
    FOR EACH ROW EXECUTE FUNCTION update_webhook_status();
