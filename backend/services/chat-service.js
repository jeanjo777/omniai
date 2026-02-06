// OmniAI - Service Chat IA
const OpenAI = require('openai');
const { supabase } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Prompt système pour le chat
const SYSTEM_PROMPT = `Tu es OmniAI, un assistant IA utile, clair et concis.
Tu aides les utilisateurs avec leurs questions de manière professionnelle.
Tu réponds en français par défaut, sauf si l'utilisateur parle une autre langue.
Tu es capable de générer du code, expliquer des concepts, et aider à résoudre des problèmes.`;

/**
 * Traiter un message utilisateur
 */
exports.processMessage = async ({ userId, message, conversationId }) => {
  // Créer ou récupérer la conversation
  const convId = conversationId || uuidv4();

  // Récupérer l'historique de la conversation
  const history = await getConversationHistory(convId);

  // Construire les messages pour l'API
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: message }
  ];

  // Appel à l'API OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    max_tokens: 2000,
    temperature: 0.7
  });

  const assistantMessage = completion.choices[0].message.content;

  // Sauvegarder dans Supabase
  await saveMessage(convId, userId, 'user', message);
  await saveMessage(convId, userId, 'assistant', assistantMessage);

  return {
    conversationId: convId,
    message: assistantMessage,
    usage: completion.usage
  };
};

/**
 * Stream un message (SSE)
 */
exports.streamMessage = async ({ userId, message, conversationId, onChunk, onComplete }) => {
  const convId = conversationId || uuidv4();
  const history = await getConversationHistory(convId);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history,
    { role: 'user', content: message }
  ];

  const stream = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages,
    max_tokens: 2000,
    temperature: 0.7,
    stream: true
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      fullResponse += content;
      onChunk(content);
    }
  }

  // Sauvegarder
  await saveMessage(convId, userId, 'user', message);
  await saveMessage(convId, userId, 'assistant', fullResponse);

  onComplete(fullResponse);
};

/**
 * Récupérer l'historique utilisateur
 */
exports.getHistory = async (userId, { limit, offset }) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*, messages(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
};

// Helpers internes
async function getConversationHistory(conversationId) {
  const { data } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  return data || [];
}

async function saveMessage(conversationId, userId, role, content) {
  // Upsert conversation
  await supabase.from('conversations').upsert({
    id: conversationId,
    user_id: userId,
    updated_at: new Date().toISOString()
  });

  // Insert message
  await supabase.from('messages').insert({
    id: uuidv4(),
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    created_at: new Date().toISOString()
  });
}
