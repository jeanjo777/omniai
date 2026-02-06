// OmniAI - Service Vidéo IA (Higgsfield)
const { supabase } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const HIGGSFIELD_BASE = 'https://platform.higgsfield.ai';
const HIGGSFIELD_KEY_ID = process.env.HIGGSFIELD_KEY_ID;
const HIGGSFIELD_KEY_SECRET = process.env.HIGGSFIELD_KEY_SECRET;

// File d'attente simple pour les jobs vidéo
const videoQueue = [];
let isProcessing = false;

/**
 * Upload une image vers Supabase Storage et retourne l'URL publique
 */
async function uploadImageToStorage(filePath, fileName) {
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from('video-images')
    .upload(storagePath, fileBuffer, {
      contentType: getContentType(fileName),
      upsert: false
    });

  if (error) throw new Error(`Upload image failed: ${error.message}`);

  const { data } = supabase.storage
    .from('video-images')
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  return types[ext] || 'image/jpeg';
}

/**
 * Appeler l'API Higgsfield pour générer une vidéo
 */
async function callHiggsfield(imageUrls, prompt, model) {
  const authKey = `${HIGGSFIELD_KEY_ID}:${HIGGSFIELD_KEY_SECRET}`;

  const inputImages = imageUrls.map(url => ({
    type: 'image_url',
    image_url: url
  }));

  const res = await fetch(`${HIGGSFIELD_BASE}/v1/image2video/dop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Key ${authKey}`
    },
    body: JSON.stringify({
      model: model || 'dop-turbo',
      prompt,
      input_images: inputImages
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Higgsfield API error ${res.status}: ${errBody}`);
  }

  return res.json();
}

/**
 * Polling du statut d'une requête Higgsfield
 */
async function pollHiggsfield(requestId) {
  const authKey = `${HIGGSFIELD_KEY_ID}:${HIGGSFIELD_KEY_SECRET}`;

  const res = await fetch(`${HIGGSFIELD_BASE}/requests/${requestId}/status`, {
    headers: {
      'Authorization': `Key ${authKey}`
    }
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Higgsfield poll error ${res.status}: ${errBody}`);
  }

  return res.json();
}

/**
 * Créer un job de génération vidéo
 */
exports.createGenerationJob = async ({ userId, prompt, model, imagePaths }) => {
  const jobId = uuidv4();

  await supabase.from('video_jobs').insert({
    id: jobId,
    user_id: userId,
    prompt,
    model: model || 'dop-turbo',
    status: 'pending',
    created_at: new Date().toISOString()
  });

  videoQueue.push({ jobId, userId, prompt, model, imagePaths });

  if (!isProcessing) {
    processQueue();
  }

  return { id: jobId };
};

/**
 * Récupérer une vidéo par ID
 */
exports.getById = async (videoId, userId) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', videoId)
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
};

/**
 * Statut d'un job
 */
exports.getJobStatus = async (jobId, userId) => {
  const { data, error } = await supabase
    .from('video_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (error) return null;

  return {
    id: data.id,
    status: data.status,
    progress: data.progress || 0,
    videoUrl: data.video_url,
    error: data.error_message,
    createdAt: data.created_at,
    completedAt: data.completed_at
  };
};

/**
 * Traitement de la file d'attente
 */
async function processQueue() {
  if (videoQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const job = videoQueue.shift();

  try {
    // 1. Mettre à jour le statut → processing
    await supabase.from('video_jobs').update({
      status: 'processing',
      progress: 10
    }).eq('id', job.jobId);

    // 2. Uploader les images vers Supabase Storage pour obtenir des URLs publiques
    const imageUrls = [];
    for (const img of job.imagePaths) {
      const url = await uploadImageToStorage(img.path, img.originalName);
      imageUrls.push(url);
    }

    await supabase.from('video_jobs').update({ progress: 25 }).eq('id', job.jobId);

    // 3. Appeler Higgsfield API
    const result = await callHiggsfield(imageUrls, job.prompt, job.model);
    const requestId = result.request_id || result.data?.id;

    if (!requestId) {
      throw new Error('No request_id returned from Higgsfield');
    }

    await supabase.from('video_jobs').update({
      progress: 40,
      higgsfield_request_id: requestId
    }).eq('id', job.jobId);

    // 4. Polling du statut
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 120; // 10 min max (5s * 120)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;

      const status = await pollHiggsfield(requestId);
      const progress = Math.min(40 + Math.round((attempts / maxAttempts) * 55), 95);

      await supabase.from('video_jobs').update({ progress }).eq('id', job.jobId);

      if (status.status === 'completed') {
        videoUrl = status.video?.url || status.outputs?.[0] || null;
        break;
      }

      if (status.status === 'failed' || status.status === 'nsfw') {
        throw new Error(status.error || `Generation ${status.status}`);
      }
    }

    if (!videoUrl) {
      throw new Error('Video generation timed out');
    }

    // 5. Marquer comme terminé
    await supabase.from('video_jobs').update({
      status: 'completed',
      progress: 100,
      video_url: videoUrl,
      completed_at: new Date().toISOString()
    }).eq('id', job.jobId);

  } catch (error) {
    console.error('Erreur génération vidéo:', error.message);
    await supabase.from('video_jobs').update({
      status: 'failed',
      error_message: error.message
    }).eq('id', job.jobId);
  }

  // Nettoyer les fichiers temporaires
  if (job.imagePaths) {
    for (const img of job.imagePaths) {
      try { fs.unlinkSync(img.path); } catch {}
    }
  }

  // Continuer avec le prochain job
  processQueue();
}
