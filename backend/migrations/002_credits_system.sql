-- OmniAI - Système de crédits/points cumulatifs
-- Migration 002: Tables credits

-- Table des soldes utilisateurs
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT user_credits_user_id_unique UNIQUE (user_id),
  CONSTRAINT user_credits_balance_non_negative CHECK (balance >= 0)
);

-- Table des transactions de crédits
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup_bonus', 'subscription', 'purchase', 'usage')),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);

-- Fonction RPC pour déduire des crédits de façon atomique
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_cost INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE(new_balance INTEGER, success BOOLEAN) AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- Verrouiller la ligne pour éviter les race conditions
  SELECT balance INTO v_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Vérifier si l'utilisateur a un solde
  IF v_balance IS NULL THEN
    RETURN QUERY SELECT 0::INTEGER, FALSE;
    RETURN;
  END IF;

  -- Vérifier si le solde est suffisant
  IF v_balance < p_cost THEN
    RETURN QUERY SELECT v_balance, FALSE;
    RETURN;
  END IF;

  -- Déduire les crédits
  UPDATE user_credits
  SET balance = balance - p_cost,
      total_spent = total_spent + p_cost,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Logger la transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, metadata)
  VALUES (p_user_id, -p_cost, p_type, p_description, p_metadata);

  RETURN QUERY SELECT (v_balance - p_cost)::INTEGER, TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction RPC pour ajouter des crédits
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Créer ou mettre à jour le solde
  INSERT INTO user_credits (user_id, balance, total_earned)
  VALUES (p_user_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = user_credits.balance + p_amount,
      total_earned = user_credits.total_earned + p_amount,
      updated_at = now()
  RETURNING balance INTO v_new_balance;

  -- Logger la transaction
  INSERT INTO credit_transactions (user_id, amount, type, description, metadata)
  VALUES (p_user_id, p_amount, p_type, p_description, p_metadata);

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own transactions
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access credits"
  ON user_credits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access transactions"
  ON credit_transactions FOR ALL
  USING (true)
  WITH CHECK (true);
