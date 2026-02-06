// OmniAI - Service Image IA
const OpenAI = require('openai');
const { supabase } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Générer une image avec DALL-E 3
 */
exports.generate = async ({ userId, prompt, style, size }) => {
  // Appel à DALL-E 3
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    style,
    quality: 'hd',
    response_format: 'url'
  });

  const imageUrl = response.data[0].url;
  const revisedPrompt = response.data[0].revised_prompt;

  // Sauvegarder dans Supabase
  const imageId = uuidv4();

  const { error } = await supabase.from('images').insert({
    id: imageId,
    user_id: userId,
    prompt,
    revised_prompt: revisedPrompt,
    url: imageUrl,
    style,
    size,
    created_at: new Date().toISOString()
  });

  if (error) {
    console.error('Erreur sauvegarde image:', error);
  }

  // TODO: Télécharger et stocker l'image dans Supabase Storage
  // pour éviter l'expiration du lien OpenAI

  return {
    id: imageId,
    url: imageUrl,
    prompt,
    revisedPrompt,
    style,
    size
  };
};

/**
 * Récupérer une image par ID
 */
exports.getById = async (imageId, userId) => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('id', imageId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
};

/**
 * Lister les images d'un utilisateur
 */
exports.listByUser = async (userId, { limit, offset }) => {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

/**
 * Éditer une image (inpainting)
 */
exports.edit = async ({ userId, imageId, mask, prompt }) => {
  // TODO: Implémenter l'édition d'image avec masque
  console.log('Edit image - à implémenter');
  return { message: 'Fonctionnalité à venir' };
};

/**
 * Créer des variations d'une image
 */
exports.createVariations = async ({ userId, imageId }) => {
  // TODO: Implémenter les variations
  console.log('Create variations - à implémenter');
  return { message: 'Fonctionnalité à venir' };
};
