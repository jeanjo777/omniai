// OmniAI - Routes principales
const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chat-controller');
const codeController = require('../controllers/code-controller');
const imageController = require('../controllers/image-controller');
const videoController = require('../controllers/video-controller');
const authMiddleware = require('../middleware/auth');
const quotaMiddleware = require('../middleware/quota');
const { stripe, createCheckoutSession, createPortalSession, handleWebhook } = require('../utils/stripe');

// Routes publiques
router.get('/status', (req, res) => {
  res.json({ status: 'online', timestamp: Date.now() });
});

// Routes Chat IA
router.post('/chat', authMiddleware, quotaMiddleware('chat'), chatController.chat);
router.get('/chat/history', authMiddleware, chatController.getHistory);

// Routes Code IA (publiques)
router.post('/code', codeController.generate);
router.post('/code/fix', codeController.fix);
router.post('/code/explain', codeController.explain);

// Routes Image IA
router.post('/image/generate', authMiddleware, quotaMiddleware('image'), imageController.generate);
router.get('/image/:id', authMiddleware, imageController.getImage);

// Routes Vidéo IA (Higgsfield image-to-video)
router.post('/video/generate', authMiddleware, quotaMiddleware('video'), videoController.generate);
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
