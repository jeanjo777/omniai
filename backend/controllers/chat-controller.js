// OmniAI - Controller Chat IA
const chatService = require('../services/chat-service');

/**
 * Endpoint principal de chat IA
 * POST /api/chat
 */
exports.chat = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message requis' });
    }

    const response = await chatService.processMessage({
      userId,
      message,
      conversationId
    });

    res.json(response);
  } catch (error) {
    console.error('Erreur chat:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du message' });
  }
};

/**
 * Récupérer l'historique des conversations
 * GET /api/chat/history
 */
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const history = await chatService.getHistory(userId, { limit, offset });

    res.json(history);
  } catch (error) {
    console.error('Erreur historique:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
};

/**
 * Stream de réponse IA (SSE)
 * POST /api/chat/stream
 */
exports.stream = async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const convId = conversationId || require('uuid').v4();

    await chatService.streamMessage({
      userId,
      message,
      conversationId: convId,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
      onComplete: (fullResponse) => {
        res.write(`data: ${JSON.stringify({ done: true, conversationId: convId, response: fullResponse })}\n\n`);
        res.end();
      }
    });
  } catch (error) {
    console.error('Erreur stream:', error);
    res.write(`data: ${JSON.stringify({ error: 'Erreur streaming' })}\n\n`);
    res.end();
  }
};
