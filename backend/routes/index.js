// OmniAI - Routes principales
const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat-controller');
const codeController = require('../controllers/code-controller');
const imageController = require('../controllers/image-controller');
const videoController = require('../controllers/video-controller');
const creditsController = require('../controllers/credits-controller');
const authMiddleware = require('../middleware/auth');
const creditsMiddleware = require('../middleware/credits');
const { creditDescription } = require('../middleware/credits');
const { stripe, createCheckoutSession, createPortalSession, handleWebhook } = require('../utils/stripe');

// Routes publiques
router.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: Date.now() });
});

// Routes Crédits/Points
router.get('/credits/balance', authMiddleware, creditsController.getBalance);
router.get('/credits/transactions', authMiddleware, creditsController.getTransactions);
router.post('/credits/purchase', authMiddleware, creditsController.createPurchase);

// Routes Chat IA (gratuit)
router.post('/chat', authMiddleware, chatController.chat);
router.post('/chat/stream', authMiddleware, chatController.stream);
router.get('/chat/history', authMiddleware, chatController.getHistory);

// Routes Code IA (1 point)
router.post('/code', authMiddleware, creditDescription('Code IA — Génération'), creditsMiddleware(1), codeController.generate);
router.post('/code/fix', authMiddleware, creditDescription('Code IA — Correction'), creditsMiddleware(1), codeController.fix);
router.post('/code/explain', authMiddleware, creditDescription('Code IA — Explication'), creditsMiddleware(1), codeController.explain);

// Routes Image IA (3 points)
router.post('/image/generate', authMiddleware, creditDescription('Image IA — Génération'), creditsMiddleware(3), imageController.generate);
router.get('/image/:id', authMiddleware, imageController.getImage);

// Routes Vidéo IA (5 points)
router.post('/video/generate', authMiddleware, creditDescription('Vidéo IA — Génération'), creditsMiddleware(5), videoController.generate);
router.get('/video/:id', authMiddleware, videoController.getVideo);
router.get('/video/:id/status', authMiddleware, videoController.getStatus);

// Routes Stripe
router.post('/stripe/checkout', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.id;
    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await createCheckoutSession(
      userId,
      plan,
      `${origin}/pricing?success=true`,
      `${origin}/pricing?canceled=true`
    );

    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/stripe/portal', authMiddleware, async (req, res) => {
  try {
    const { customerId } = req.body;
    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await createPortalSession(customerId, `${origin}/pricing`);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
