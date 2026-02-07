// OmniAI - Service de gestion des crédits/points
const { supabase } = require('../utils/db');

const SIGNUP_BONUS = 100;

/**
 * Récupérer le solde d'un utilisateur
 */
async function getBalance(userId) {
  const { data, error } = await supabase
    .from('user_credits')
    .select('balance, total_earned, total_spent')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Pas encore de ligne → initialiser
    return await initializeUser(userId);
  }

  if (error) throw error;

  return {
    balance: data.balance,
    totalEarned: data.total_earned,
    totalSpent: data.total_spent
  };
}

/**
 * Déduire des crédits (atomique via RPC)
 */
async function deductCredits(userId, cost, type, description, metadata = {}) {
  const { data, error } = await supabase.rpc('deduct_credits', {
    p_user_id: userId,
    p_cost: cost,
    p_type: type,
    p_description: description,
    p_metadata: metadata
  });

  if (error) throw error;

  const result = data[0];
  if (!result || !result.success) {
    return {
      success: false,
      balance: result ? result.new_balance : 0
    };
  }

  return {
    success: true,
    balance: result.new_balance
  };
}

/**
 * Ajouter des crédits
 */
async function addCredits(userId, amount, type, description, metadata = {}) {
  const { data, error } = await supabase.rpc('add_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description,
    p_metadata: metadata
  });

  if (error) throw error;

  return { balance: data };
}

/**
 * Historique des transactions
 */
async function getTransactions(userId, limit = 50) {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data;
}

/**
 * Initialiser un utilisateur avec le bonus d'inscription
 */
async function initializeUser(userId) {
  const result = await addCredits(
    userId,
    SIGNUP_BONUS,
    'signup_bonus',
    'Bonus d\'inscription — Bienvenue sur OmniAI !'
  );

  return {
    balance: result.balance,
    totalEarned: SIGNUP_BONUS,
    totalSpent: 0
  };
}

module.exports = {
  getBalance,
  deductCredits,
  addCredits,
  getTransactions,
  initializeUser,
  SIGNUP_BONUS
};
