-- 0004_agreement_signature.sql
-- Adds typed signature name to partner agreement record

ALTER TABLE partners
  ADD COLUMN agreement_signature_name text;
