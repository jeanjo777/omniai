// OmniAI - Utilitaires d'authentification
const jwt = require('jsonwebtoken');
const { supabase } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'omniai-secret-dev';
const JWT_EXPIRES_IN = '7d';

/**
 * Générer un token JWT
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'user'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Vérifier un token JWT
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Valider un token Supabase Auth
 */
async function validateSupabaseToken(token) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Erreur validation token Supabase:', error);
    return null;
  }
}

/**
 * Récupérer l'utilisateur depuis la DB
 */
async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data;
}

/**
 * Créer ou mettre à jour un utilisateur
 */
async function upsertUser(userData) {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      id: userData.id,
      email: userData.email,
      name: userData.name || userData.email.split('@')[0],
      avatar_url: userData.avatar_url,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Vérifier si l'utilisateur est admin
 */
function isAdmin(user) {
  return user && user.role === 'admin';
}

/**
 * Vérifier si l'utilisateur a un abonnement premium
 */
async function isPremium(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, plan')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data) return false;
  return ['pro', 'enterprise'].includes(data.plan);
}

module.exports = {
  generateToken,
  verifyToken,
  validateSupabaseToken,
  getUserById,
  upsertUser,
  isAdmin,
  isPremium
};
