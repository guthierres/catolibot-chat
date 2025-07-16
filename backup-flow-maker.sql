-- backup-flow-maker.sql
-- Script para fazer backup dos dados das tabelas do Flow Maker visual.
-- Este script seleciona todos os dados das tabelas para visualização.
-- Para um backup completo (estrutura + dados) que pode ser restaurado,
-- é recomendado usar a ferramenta 'pg_dump' do PostgreSQL.

-- Exemplo de uso do pg_dump para backup completo:
-- pg_dump -h <seu_host> -p <sua_porta> -U <seu_usuario> -d <seu_banco_de_dados> -Fc -t flows -t flow_nodes -t flow_connections > flow_maker_backup.dump

-- Seleciona todos os dados da tabela 'flows'
SELECT '--- Dados da Tabela: flows ---' AS info;
SELECT * FROM flows;

-- Seleciona todos os dados da tabela 'flow_nodes'
SELECT '--- Dados da Tabela: flow_nodes ---' AS info;
SELECT * FROM flow_nodes;

-- Seleciona todos os dados da tabela 'flow_connections'
SELECT '--- Dados da Tabela: flow_connections ---' AS info;
SELECT * FROM flow_connections;
