-- Contas iniciais do GoSafe. Rode UMA vez, depois que a API subiu pela primeira vez
-- (é o Flyway que cria a tabela users). Pode ser colado no SQL Editor do Neon.
--
-- ANTES DE RODAR: troque as senhas abaixo. Não salve este arquivo com senhas reais no Git.
-- Rodar de novo não duplica nem altera contas que já existem.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TEMP TABLE contas_iniciais (name text, username text, email text, senha text, role text) ON COMMIT DROP;

INSERT INTO contas_iniciais (name, username, email, senha, role) VALUES
    ('Conta Inicial',    'inicial',       'inicial@gosafe.example',       'TROQUE-SENHA-INICIAL', 'USER'),
    ('Visualização 1',   'visualizacao1', 'visualizacao1@gosafe.example', 'TROQUE-SENHA-VISUAL1', 'USER'),
    ('Visualização 2',   'visualizacao2', 'visualizacao2@gosafe.example', 'TROQUE-SENHA-VISUAL2', 'USER'),
    ('Administração',    'admin',         'admin@gosafe.example',         'TROQUE-SENHA-ADMIN',   'ADMIN');

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM contas_iniciais WHERE senha LIKE 'TROQUE-%') THEN
        RAISE EXCEPTION 'Troque as senhas de exemplo antes de rodar este script.';
    END IF;
    IF EXISTS (SELECT 1 FROM contas_iniciais WHERE length(senha) < 8 OR length(senha) > 72) THEN
        RAISE EXCEPTION 'Cada senha deve ter entre 8 e 72 caracteres.';
    END IF;
END $$;

INSERT INTO users (id, name, username, email, password_hash, sex, role, created_at, updated_at)
SELECT gen_random_uuid(), name, lower(username), lower(email), crypt(senha, gen_salt('bf', 10)),
       'NOT_INFORMED', role, now(), now()
FROM contas_iniciais
ON CONFLICT DO NOTHING;

SELECT u.username, u.email, u.role
FROM users u
JOIN contas_iniciais c ON u.username = lower(c.username)
ORDER BY u.role DESC, u.username;

COMMIT;
