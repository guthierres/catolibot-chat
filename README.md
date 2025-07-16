# Whatsapp chatbot setup

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/cnp-brasil/v0-whatsapp-chatbot-setup)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/dFPxMCoCzrK)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/cnp-brasil/v0-whatsapp-chatbot-setup](https://vercel.com/cnp-brasil/v0-whatsapp-chatbot-setup)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/dFPxMCoCzrK](https://v0.dev/chat/projects/dFPxMCoCzrK)**

## Credenciais da API do WhatsApp Business

Para configurar o seu chatbot, você precisará das seguintes credenciais da API do WhatsApp Business, que podem ser encontradas no seu [Meta for Developers Dashboard](https://developers.facebook.com/):

*   **Access Token (Token de Acesso)**:
    *   No painel esquerdo do seu aplicativo, navegue até **WhatsApp > API Setup**.
    *   Você encontrará um **Token de Acesso Temporário** na seção "Step 2: Send a test message". Para produção, configure um token de acesso permanente (token de sistema ou de usuário de longa duração) seguindo a documentação da Meta.

*   **Phone Number ID (ID do Número de Telefone)**:
    *   No painel esquerdo, vá para **WhatsApp > API Setup**.
    *   Encontrado na seção "Step 2: Send a test message", abaixo do token de acesso.

*   **Business Account ID (ID da Conta de Negócios)**:
    *   No painel esquerdo, vá para **WhatsApp > API Setup**.
    *   Também encontrado na seção "Step 2: Send a test message".

*   **App ID (ID do Aplicativo)**:
    *   No painel esquerdo, clique em **Configurações do Aplicativo (App Settings) > Básico (Basic)**.
    *   Localizado na parte superior desta página.

*   **App Secret (Segredo do Aplicativo)**:
    *   No painel esquerdo, clique em **Configurações do Aplicativo (App Settings) > Básico (Basic)**.
    *   Clique em "Mostrar" (Show) para revelá-lo. Mantenha este segredo em segurança.

Estas credenciais devem ser configuradas como variáveis de ambiente no seu ambiente de deploy (ex: Vercel).

## Configuração do Sistema para Novo Ambiente

Para instalar e configurar este sistema em um novo ambiente (por exemplo, outra conta Vercel ou um servidor diferente), siga os passos abaixo:

### 1. Configuração do Banco de Dados (Supabase/PostgreSQL)

O sistema utiliza um banco de dados PostgreSQL (preferencialmente Supabase) para armazenar configurações, fluxos, logs e dados de campanha.

*   **Crie um novo projeto Supabase** ou configure um banco de dados PostgreSQL.
*   **Obtenha as credenciais do seu banco de dados:**
    *   `SUPABASE_URL` (ou `POSTGRES_URL` para PostgreSQL genérico)
    *   `SUPABASE_ANON_KEY` (ou credenciais de usuário/senha para PostgreSQL genérico)
    *   `SUPABASE_SERVICE_ROLE_KEY` (para operações de servidor que exigem mais privilégios)
*   **Execute o script de configuração do banco de dados:**
    *   Utilize o arquivo `full-system-setup.sql` (gerado anteriormente) para criar todas as tabelas, funções e dados iniciais necessários. Conecte-se ao seu banco de dados e execute este script.
    *   **Importante:** Este script é idempotente, mas revise-o para garantir que ele se alinha com a versão do seu banco de dados.

### 2. Variáveis de Ambiente

As seguintes variáveis de ambiente são cruciais para o funcionamento do sistema. Elas devem ser configuradas no seu ambiente de deploy (ex: Vercel Project Settings > Environment Variables).

*   **Credenciais do Banco de Dados:**
    *   `NEXT_PUBLIC_SUPABASE_URL`: URL da sua instância Supabase (para uso no cliente).
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave `anon` pública do Supabase (para uso no cliente).
    *   `SUPABASE_URL`: URL da sua instância Supabase (para uso no servidor).
    *   `SUPABASE_ANON_KEY`: Chave `anon` pública do Supabase (para uso no servidor).
    *   `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço do Supabase (para operações de servidor).
    *   `SUPABASE_JWT_SECRET`: O JWT Secret do seu projeto Supabase, encontrado em Project Settings > API.
    *   `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DATABASE`, `POSTGRES_HOST`: Se estiver usando um PostgreSQL genérico em vez de Supabase.

*   **Credenciais da API do WhatsApp Business (Meta):**
    *   `WHATSAPP_ACCESS_TOKEN`: O token de acesso da sua API do WhatsApp Business.
    *   `PHONE_NUMBER_ID`: O ID do número de telefone da sua API do WhatsApp Business.
    *   `VERIFY_TOKEN`: Um token de verificação que você define para o webhook (pode ser qualquer string segura).

*   **Outras Variáveis:**
    *   `BLOB_READ_WRITE_TOKEN`: Token para o Vercel Blob Storage, se estiver utilizando para upload de arquivos.

### 3. Configuração do Webhook

O sistema precisa de um webhook configurado na plataforma Meta for Developers para receber mensagens e eventos do WhatsApp.

*   **URL do Webhook:** A URL do seu webhook será `https://SEU_DOMINIO.vercel.app/api/webhook`.
    *   **Exemplo:** Se o seu domínio for `catolibot.vercel.app`, a URL do webhook será `https://catolibot.vercel.app/api/webhook`.
    *   O sistema gera essa URL dinamicamente com base no domínio de deploy.
*   **Configuração na Meta for Developers:**
    1.  No seu aplicativo Meta for Developers, navegue até **WhatsApp > Configuration**.
    2.  Na seção "Webhook", clique em "Edit".
    3.  Insira a **URL do Webhook** (`https://SEU_DOMINIO.vercel.app/api/webhook`) e o **Verify Token** (o mesmo valor que você definiu para a variável de ambiente `VERIFY_TOKEN`).
    4.  Clique em "Verify and Save".
    5.  Na seção "Webhook fields", clique em "Manage" e assine os campos de webhook relevantes, como `messages`, `message_template_status_update`, etc., para que o sistema receba os eventos necessários.

### 4. Atualização de Dados Iniciais (Opcional)

Após a configuração do banco de dados, você pode precisar atualizar algumas informações na tabela `whatsapp_config` se o seu domínio ou credenciais mudarem.

*   A URL do webhook no banco de dados (`whatsapp_config.webhook_url`) é atualizada automaticamente pelo sistema quando você acessa a página de configuração, mas é bom verificar.
*   Certifique-se de que `whatsapp_config.access_token` e `whatsapp_config.phone_number_id` correspondam às suas variáveis de ambiente.

Seguindo estes passos, você poderá configurar e operar o sistema em qualquer novo ambiente de deploy.
