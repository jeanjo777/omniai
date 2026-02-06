// OmniAI - Middleware d'authentification
const { verifyToken, validateSupabaseToken, getUserById } = require('../utils/auth');

/**
 * Middleware d'authentification
 * Vérifie le token JWT ou Supabase
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token d\'authentification requis' });
    }

    const token = authHeader.replace('Bearer ', '');

    // Essayer d'abord avec JWT
    let user = verifyToken(token);

    // Si JWT échoue, essayer avec Supabase
    if (!user) {
      user = await validateSupabaseToken(token);
    }

    if (!user) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }

    // Récupérer les données complètes de l'utilisateur
    const fullUser = await getUserById(user.id);

    if (!fullUser) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    // Attacher l'utilisateur à la requête
    req.user = {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      role: fullUser.role || 'user',
      plan: fullUser.plan || 'free'
    };

    next();
  } catch (error) {
    console.error('Erreur auth middleware:', error);
    res.status(401).json({ error: 'Erreur d\'authentification' });
  }
}

/**
 * Middleware optionnel (n'échoue pas si pas de token)
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      let user = verifyToken(token);

      if (!user) {
        user = await validateSupabaseToken(token);
      }

      if (user) {
        const fullUser = await getUserById(user.id);
        if (fullUser) {
          req.user = fullUser;
        }
      }
    }

    next();
  } catch (error) {
    // Continuer sans utilisateur
    next();
  }
}

/**
 * Middleware admin uniquement
 */
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}

module.exports = authMiddleware;
module.exports.optional = optionalAuth;
module.exports.adminOnly = adminOnly;
