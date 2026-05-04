-- Migration: Confirmation flow + Google Reviews
-- Adds new notification types and Google Reviews link column

-- New notification types
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'confirmacao_interativa';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'review_request';
ALTER TYPE tipo_notificacao ADD VALUE IF NOT EXISTS 'alerta_nao_confirmado';

-- Update notification_templates CHECK constraint to include new types
ALTER TABLE notification_templates DROP CONSTRAINT IF EXISTS notification_templates_tipo_check;
ALTER TABLE notification_templates ADD CONSTRAINT notification_templates_tipo_check
  CHECK (tipo IN ('confirmacao', 'lembrete_24h', 'lembrete_retorno', 'confirmacao_interativa', 'review_request'));

-- Add Google Reviews link column to saloes
ALTER TABLE saloes ADD COLUMN IF NOT EXISTS link_google_reviews text;

-- Set the Google Reviews link for the existing salon
UPDATE saloes SET link_google_reviews = 'https://www.google.com/maps/place/Tati+%26+Rodri+Hair+Studio/@39.4618174,-0.375546,17z/data=!3m1!4b1!4m6!3m5!1s0xd604f8a1ef29279:0xfec4ab117104c8ad!8m2!3d39.4618174!4d-0.375546!16s%2Fg%2F11n4s6hzx1?entry=ttu&g_ep=EgoyMDI2MDQyNy4wIKXMDSoASAFQAw%3D%3D'
WHERE link_google_reviews IS NULL;
