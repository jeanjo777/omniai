// OmniAI - Controller Code IA
const codeService = require('../services/code-service');

/**
 * Générer du code
 * POST /api/code
 */
exports.generate = async (req, res) => {
  try {
    const { prompt, language } = req.body;
    const userId = req.user.id;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    const result = await codeService.generate({
      userId,
      prompt,
      language: language || 'auto'
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur génération code:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du code' });
  }
};

/**
 * Corriger du code
 * POST /api/code/fix
 */
exports.fix = async (req, res) => {
  try {
    const { code, error: codeError, language } = req.body;
    const userId = req.user.id;

    if (!code || code.trim() === '') {
      return res.status(400).json({ error: 'Code requis' });
    }

    const result = await codeService.fix({
      userId,
      code,
      error: codeError,
      language
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur correction code:', error);
    res.status(500).json({ error: 'Erreur lors de la correction du code' });
  }
};

/**
 * Expliquer du code
 * POST /api/code/explain
 */
exports.explain = async (req, res) => {
  try {
    const { code, language } = req.body;
    const userId = req.user.id;

    if (!code || code.trim() === '') {
      return res.status(400).json({ error: 'Code requis' });
    }

    const result = await codeService.explain({
      userId,
      code,
      language
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur explication code:', error);
    res.status(500).json({ error: 'Erreur lors de l\'explication du code' });
  }
};
