// OmniAI - Controller Image IA
const imageService = require('../services/image-service');

/**
 * Générer une image
 * POST /api/image/generate
 */
exports.generate = async (req, res) => {
  try {
    const { prompt, style, size } = req.body;
    const userId = req.user.id;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'Prompt requis' });
    }

    // Validation taille
    const validSizes = ['256x256', '512x512', '1024x1024', '1024x1792', '1792x1024'];
    const imageSize = validSizes.includes(size) ? size : '1024x1024';

    const result = await imageService.generate({
      userId,
      prompt,
      style: style || 'vivid',
      size: imageSize
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur génération image:', error);
    res.status(500).json({ error: 'Erreur lors de la génération de l\'image' });
  }
};

/**
 * Récupérer une image
 * GET /api/image/:id
 */
exports.getImage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const image = await imageService.getById(id, userId);

    if (!image) {
      return res.status(404).json({ error: 'Image non trouvée' });
    }

    res.json(image);
  } catch (error) {
    console.error('Erreur récupération image:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'image' });
  }
};

/**
 * Lister les images de l'utilisateur
 * GET /api/images
 */
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const images = await imageService.listByUser(userId, { limit, offset });

    res.json(images);
  } catch (error) {
    console.error('Erreur liste images:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des images' });
  }
};
