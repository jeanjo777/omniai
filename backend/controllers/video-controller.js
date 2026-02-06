// OmniAI - Controller Vidéo IA (Higgsfield)
const videoService = require('../services/video-service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer le dossier uploads si nécessaire
const uploadDir = './uploads/video-images';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration upload multi-images
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadImages = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max par image
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format image non supporté. Utilisez JPEG, PNG ou WebP.'), false);
    }
  }
}).array('images', 3); // Max 3 images

/**
 * Générer une vidéo IA à partir d'images + prompt
 * POST /api/video/generate
 */
exports.generate = (req, res) => {
  uploadImages(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Maximum 3 images autorisées' });
        }
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Taille maximale : 10 MB par image' });
        }
      }
      return res.status(400).json({ error: err.message });
    }

    try {
      const { prompt, model } = req.body;
      const userId = req.user.id;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'Au moins une image est requise' });
      }

      if (!prompt || prompt.trim() === '') {
        // Nettoyer les fichiers uploadés
        files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
        return res.status(400).json({ error: 'Prompt requis' });
      }

      const imagePaths = files.map(f => ({
        path: f.path,
        originalName: f.originalname
      }));

      const job = await videoService.createGenerationJob({
        userId,
        prompt,
        model: model || 'dop-turbo',
        imagePaths
      });

      res.json({
        jobId: job.id,
        status: 'processing',
        message: 'Génération en cours via Higgsfield AI'
      });
    } catch (error) {
      console.error('Erreur génération vidéo:', error);
      // Nettoyer les fichiers en cas d'erreur
      if (req.files) {
        req.files.forEach(f => { try { fs.unlinkSync(f.path); } catch {} });
      }
      res.status(500).json({ error: 'Erreur lors de la génération de la vidéo' });
    }
  });
};

/**
 * Récupérer une vidéo
 * GET /api/video/:id
 */
exports.getVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const video = await videoService.getById(id, userId);

    if (!video) {
      return res.status(404).json({ error: 'Vidéo non trouvée' });
    }

    res.json(video);
  } catch (error) {
    console.error('Erreur récupération vidéo:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la vidéo' });
  }
};

/**
 * Statut d'un job vidéo
 * GET /api/video/:id/status
 */
exports.getStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const status = await videoService.getJobStatus(id, userId);

    if (!status) {
      return res.status(404).json({ error: 'Job non trouvé' });
    }

    res.json(status);
  } catch (error) {
    console.error('Erreur statut vidéo:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du statut' });
  }
};
