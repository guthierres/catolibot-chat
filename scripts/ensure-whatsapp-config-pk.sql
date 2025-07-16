-- garante que a coluna id exista e seja única para o upsert funcionar
ALTER TABLE whatsapp_config
  ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT gen_random_uuid();
