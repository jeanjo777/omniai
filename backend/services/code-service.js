// OmniAI - Service Code IA
const OpenAI = require('openai');
const { supabase } = require('../utils/db');
const { v4: uuidv4 } = require('uuid');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Prompt système pour la génération de code
const CODE_SYSTEM_PROMPT = `Tu es un développeur senior expert.
Tu génères du code propre, bien commenté et optimisé.
Tu détectes automatiquement le langage si non spécifié.
Tu fournis des explications claires avec le code.
Tu respectes les bonnes pratiques et les conventions du langage.`;

/**
 * Générer du code
 */
exports.generate = async ({ userId, prompt, language }) => {
  const systemPrompt = language !== 'auto'
    ? `${CODE_SYSTEM_PROMPT}\nLanguage demandé: ${language}`
    : CODE_SYSTEM_PROMPT;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Génère le code suivant:\n${prompt}` }
    ],
    max_tokens: 4000,
    temperature: 0.3
  });

  const response = completion.choices[0].message.content;

  // Log dans Supabase
  await logCodeGeneration(userId, 'generate', prompt, response);

  return {
    code: response,
    language: detectLanguage(response),
    usage: completion.usage
  };
};

/**
 * Corriger du code
 */
exports.fix = async ({ userId, code, error, language }) => {
  const prompt = error
    ? `Corrige ce code ${language || ''} qui génère l'erreur suivante:\nErreur: ${error}\n\nCode:\n${code}`
    : `Corrige et améliore ce code ${language || ''}:\n${code}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: CODE_SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ],
    max_tokens: 4000,
    temperature: 0.2
  });

  const response = completion.choices[0].message.content;

  await logCodeGeneration(userId, 'fix', code, response);

  return {
    fixedCode: response,
    usage: completion.usage
  };
};

/**
 * Expliquer du code
 */
exports.explain = async ({ userId, code, language }) => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'Tu es un expert qui explique le code de manière claire et pédagogique.' },
      { role: 'user', content: `Explique ce code ${language || ''} en détail:\n${code}` }
    ],
    max_tokens: 2000,
    temperature: 0.5
  });

  const response = completion.choices[0].message.content;

  await logCodeGeneration(userId, 'explain', code, response);

  return {
    explanation: response,
    usage: completion.usage
  };
};

// Helpers
function detectLanguage(code) {
  if (code.includes('function') && code.includes('=>')) return 'javascript';
  if (code.includes('def ') && code.includes(':')) return 'python';
  if (code.includes('public class')) return 'java';
  if (code.includes('func ') && code.includes('->')) return 'swift';
  if (code.includes('fn ') && code.includes('->')) return 'rust';
  if (code.includes('package main')) return 'go';
  if (code.includes('<?php')) return 'php';
  return 'unknown';
}

async function logCodeGeneration(userId, type, input, output) {
  try {
    await supabase.from('code_logs').insert({
      id: uuidv4(),
      user_id: userId,
      type,
      input: input.substring(0, 1000),
      output: output.substring(0, 1000),
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur log code:', error);
  }
}
