// OmniAI - Middleware de vérification des crédits
const { deductCredits, getBalance } = require('../services/credits-service');

/**
 * Middleware de vérification et déduction des crédits
 * @param {number} cost - Coût en points de l'action
 */
function creditsMiddleware(cost) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userPlan = req.user.plan || 'free';

      // Enterprise = illimité, bypass
      if (userPlan === 'enterprise') {
        res.set('X-Credits-Remaining', 'unlimited');
        return next();
      }

      // Déduction atomique
      const result = await deductCredits(
        userId,
        cost,
        'usage',
        req.creditDescription || 'Utilisation IA',
        { endpoint: req.originalUrl, cost }
      );

      if (!result.success) {
        return res.status(402).json({
          error: 'Crédits insuffisants',
          balance: result.balance,
          cost,
          needed: cost - result.balance,
          upgrade: 'Achetez des points supplémentaires sur /pricing'
        });
      }

      // Ajouter le solde restant dans les headers
      res.set('X-Credits-Remaining', String(result.balance));
      res.set('X-Credits-Cost', String(cost));

      next();
    } catch (error) {
      console.error('Erreur credits middleware:', error);
      // En cas d'erreur technique, on laisse passer (fail open)
      next();
    }
  };
}

/**
 * Middleware pour définir la description du crédit
 */
function creditDescription(description) {
  return (req, res, next) => {
    req.creditDescription = description;
    next();
  };
}

module.exports = creditsMiddleware;
module.exports.creditDescription = creditDescription;
