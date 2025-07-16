-- Inserir fluxo de exemplo
INSERT INTO conversation_flows (name, trigger, welcome_message, is_active) VALUES
('Menu Principal', 'menu', 'Olá! 👋 Como posso ajudá-lo hoje? Escolha uma das opções abaixo:', true),
('Atendimento', 'ajuda', 'Estou aqui para ajudar! Selecione o tipo de atendimento:', true),
('Informações', 'info', 'Que informação você gostaria de saber?', true);

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
WHERE cf.name = 'Menu Principal';

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
WHERE cf.name = 'Atendimento';

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
WHERE cf.name = 'Informações';
