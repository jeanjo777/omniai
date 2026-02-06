// OmniAI - Middleware de gestion des quotas
const { supabase } = require('../utils/db');
const { getPlanLimits } = require('../utils/stripe');

/**
 * Middleware de vérification des quotas
 * @param {string} type - Type de ressource (chat, code, image, video)
 */
function quotaMiddleware(type) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userPlan = req.user.plan || 'free';

      // Récupérer les limites du plan
      const limits = getPlanLimits(userPlan);
      const limit = limits[type];

      // -1 = illimité
      if (limit === -1) {
        return next();
      }

      // Compter l'usage du jour
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count, error } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', type)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Erreur vérification quota:', error);
        // En cas d'erreur, on laisse passer (fail open)
        return next();
      }

      if (count >= limit) {
        return res.status(429).json({
          error: 'Quota journalier atteint',
          type,
          used: count,
          limit,
          resetAt: getNextReset(),
          upgrade: userPlan === 'free' ? 'Passez à Pro pour plus de quotas' : null
        });
      }

      // Logger l'usage
      await logUsage(userId, type);

      // Ajouter les infos de quota à la réponse
      res.set('X-Quota-Remaining', String(limit - count - 1));
      res.set('X-Quota-Limit', String(limit));

      next();
    } catch (error) {
      console.error('Erreur quota middleware:', error);
      next();
    }
  };
}

/**
 * Logger une utilisation
 */
async function logUsage(userId, type, metadata = {}) {
  try {
    await supabase.from('usage_logs').insert({
      user_id: userId,
      type,
      metadata,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur log usage:', error);
  }
}

/**
 * Récupérer les stats d'usage d'un utilisateur
 */
async function getUsageStats(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('usage_logs')
    .select('type')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  if (error) return {};

  const stats = {
    chat: 0,
    code: 0,
    image: 0,
    video: 0
  };

  data.forEach(log => {
    if (stats[log.type] !== undefined) {
      stats[log.type]++;
    }
  });

  return stats;
}

/**
 * Heure du prochain reset (minuit UTC)
 */
function getNextReset() {
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return tomorrow.toISOString();
}

module.exports = quotaMiddleware;
module.exports.logUsage = logUsage;
module.exports.getUsageStats = getUsageStats;
