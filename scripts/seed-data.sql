-- Inserir dados de exemplo para respostas automáticas
INSERT INTO auto_responses (trigger, response, is_active) VALUES
('oi', 'Olá! Como posso ajudá-lo hoje? 😊', true),
('olá', 'Oi! Em que posso ser útil?', true),
('ajuda', 'Estou aqui para ajudar! Você pode me perguntar sobre nossos produtos e serviços.', true),
('preço', 'Para informações sobre preços, entre em contato com nossa equipe comercial.', true),
('horário', 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.', true),
('obrigado', 'De nada! Fico feliz em ajudar! 😊', true),
('tchau', 'Até logo! Tenha um ótimo dia! 👋', true);

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
    'https://webhook.site/your-unique-url',
    'SEU_BUSINESS_ACCOUNT_ID_AQUI',
    'SEU_APP_ID_AQUI',
    'SEU_APP_SECRET_AQUI'
) ON CONFLICT DO NOTHING;
