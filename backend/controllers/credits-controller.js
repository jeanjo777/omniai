// OmniAI - Contrôleur des crédits/points
const creditsService = require('../services/credits-service');
const { stripe, CREDIT_PACKS } = require('../utils/stripe');

/**
 * GET /api/credits/balance
 */
async function getBalance(req, res) {
  try {
    const data = await creditsService.getBalance(req.user.id);
    res.json({
      ...data,
      plan: req.user.plan || 'free',
      unlimited: req.user.plan === 'enterprise'
    });
  } catch (error) {
    console.error('Erreur getBalance:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du solde' });
  }
}

/**
 * GET /api/credits/transactions
 */
async function getTransactions(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const data = await creditsService.getTransactions(req.user.id, limit);
    res.json({ transactions: data });
  } catch (error) {
    console.error('Erreur getTransactions:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des transactions' });
  }
}

/**
 * POST /api/credits/purchase
 */
async function createPurchase(req, res) {
  try {
    const { packId } = req.body;
    const pack = CREDIT_PACKS[packId];

    if (!pack) {
      return res.status(400).json({ error: 'Pack invalide' });
    }

    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `${pack.credits} Points OmniAI`,
              description: `Pack ${pack.name} — ${pack.credits} points à utiliser sur OmniAI`
            },
            unit_amount: pack.price
          },
          quantity: 1
        }
      ],
      success_url: `${origin}/pricing?credits_success=true&pack=${packId}`,
      cancel_url: `${origin}/pricing?credits_canceled=true`,
      metadata: {
        type: 'credits',
        userId: req.user.id,
        packId,
        credits: String(pack.credits)
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Erreur createPurchase:', error);
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
}

module.exports = {
  getBalance,
  getTransactions,
  createPurchase
};
