-- =============================================================================
-- ContractIQ — Supabase Database Schema
-- =============================================================================
-- Paste this entire file into the Supabase SQL Editor and run on a fresh project.
-- Tables are created in dependency order. RLS is enabled on every table.
-- Storage bucket and Storage RLS policies are included at the bottom.
-- Last updated: 2026-10-05
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger function (shared by all tables with that column)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TABLE: contracts
-- Purpose: One row per uploaded contract. Stores full extracted text so the
--          AI pipeline never re-downloads the PDF from Storage.
-- =============================================================================
CREATE TABLE IF NOT EXISTS contracts (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT         NOT NULL,
  contract_type TEXT         NOT NULL CHECK (contract_type IN ('NDA', 'MSA')),
  contract_text TEXT         NOT NULL DEFAULT '',
  file_path     TEXT         NULL,       -- Supabase Storage path; null if upload failed
  status        TEXT         NOT NULL DEFAULT 'uploaded'
                             CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
  page_count    INTEGER      NOT NULL DEFAULT 0,
  token_count   INTEGER      NULL,       -- estimated token count for cost monitoring
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user_id
  ON contracts (user_id);

CREATE INDEX IF NOT EXISTS idx_contracts_user_id_created_at
  ON contracts (user_id, created_at DESC);

-- updated_at trigger
CREATE TRIGGER set_contracts_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- Row Level Security
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own contracts"
  ON contracts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own contracts"
  ON contracts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own contracts"
  ON contracts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own contracts"
  ON contracts FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: key_terms
-- Purpose: Every extracted (standard or custom) key term per contract.
--          Stores AI-extracted value, confidence score, page number, and the
--          verbatim source sentence. Inline edits update value; original_value
--          preserves the AI extraction for the feedback loop.
-- =============================================================================
CREATE TABLE IF NOT EXISTS key_terms (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id      UUID          NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_name        TEXT          NOT NULL,
  value            TEXT          NOT NULL DEFAULT '',
  original_value   TEXT          NULL,       -- populated on first user edit
  page_number      INTEGER       NOT NULL DEFAULT 1,
  confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0
                                 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source_sentence  TEXT          NOT NULL DEFAULT '',
  is_custom        BOOLEAN       NOT NULL DEFAULT FALSE,
  is_edited        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_key_terms_contract_id
  ON key_terms (contract_id);

CREATE INDEX IF NOT EXISTS idx_key_terms_user_id_contract_id
  ON key_terms (user_id, contract_id);

-- Row Level Security
ALTER TABLE key_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own key_terms"
  ON key_terms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own key_terms"
  ON key_terms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users update own key_terms"
  ON key_terms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users delete own key_terms"
  ON key_terms FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: custom_key_terms
-- Purpose: User-specified term names added during the pre-processing preview
--          step, before the OpenAI extraction call. These are injected into the
--          extraction prompt as additional targets. Max 5 per contract (enforced
--          at the application layer).
-- =============================================================================
CREATE TABLE IF NOT EXISTS custom_key_terms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term_name   TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_custom_key_terms_contract_id
  ON custom_key_terms (contract_id);

-- Row Level Security
ALTER TABLE custom_key_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own custom_key_terms"
  ON custom_key_terms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own custom_key_terms"
  ON custom_key_terms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own custom_key_terms"
  ON custom_key_terms FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: chat_sessions
-- Purpose: One session per contract per user. Anchors all chat messages for a
--          contract. UNIQUE constraint on contract_id enforces one session per
--          contract in MVP.
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL UNIQUE REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_chat_sessions_contract_id
  ON chat_sessions (contract_id);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
  ON chat_sessions (user_id);

-- Row Level Security
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own chat_sessions"
  ON chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own chat_sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own chat_sessions"
  ON chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: chat_messages
-- Purpose: Individual messages within a chat session. Stored in ascending order
--          for context-window reconstruction. The page_citation column holds the
--          integer page number parsed from the [Page X] pattern in AI responses.
-- =============================================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL CHECK (role IN ('user', 'assistant')),
  content       TEXT        NOT NULL,
  page_citations INTEGER[]  NOT NULL DEFAULT '{}',  -- page numbers from [Page X] citations in assistant response
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id_created_at
  ON chat_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id
  ON chat_messages (user_id);

-- Row Level Security
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own chat_messages"
  ON chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own chat_messages"
  ON chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own chat_messages"
  ON chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- TABLE: user_feedback
-- Purpose: Captures per-contract thumbs-up / thumbs-down ratings with an
--          optional free-text comment. Used for NPS tracking and the extraction
--          quality feedback loop. Deferred to v1.1 UI but table created at
--          launch so data is collected from day 1.
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_feedback (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID        NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      TEXT        NOT NULL CHECK (rating IN ('up', 'down')),
  comment     TEXT        NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_feedback_contract_id
  ON user_feedback (contract_id);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id
  ON user_feedback (user_id);

-- Row Level Security
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own feedback"
  ON user_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- STORAGE: contracts bucket
-- Purpose: Stores raw PDF files uploaded by users. PDF.js renders from signed
--          URLs (1-hr expiry). Storage is non-blocking — if upload fails, the
--          AI pipeline continues from contracts.contract_text in the DB.
-- File path pattern: contracts/{user_id}/{contract_id}/{filename}.pdf
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: restrict by first path segment = auth.uid()
CREATE POLICY "users upload own contracts storage"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users read own contracts storage"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "users delete own contracts storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'contracts'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- VERIFICATION QUERIES
-- Run these after applying the schema to confirm setup is correct:
--
-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   ORDER BY table_name;
-- -- Expected: chat_messages, chat_sessions, contracts, custom_key_terms,
-- --           key_terms, user_feedback
--
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables
--   WHERE schemaname = 'public';
-- -- All rows should have rowsecurity = true
--
-- SELECT * FROM storage.buckets WHERE id = 'contracts';
-- -- Should return one row with public = false
-- =============================================================================
