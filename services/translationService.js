// translationService.js
// Centralized service for Google Cloud Translation API with caching.
// Requires @google-cloud/translate npm package.
// Ensure GOOGLE_APPLICATION_CREDENTIALS env var points to the service account JSON.

const { Translate } = require('@google-cloud/translate').v2;
const pool = require('../config/db'); // MySQL connection pool

// Initialize Translate client
const translateClient = new Translate();

/**
 * Get cached translation from DB.
 * @param {string} sourceText
 * @param {string} targetLang - e.g., 'de', 'fr', 'ar'
 * @returns {Promise<string|null>} translated text or null if not cached
 */
async function getCachedTranslation(sourceText, targetLang) {
  const [rows] = await pool.execute(
    `SELECT translated_text FROM translation_cache WHERE source_text = ? AND target_lang = ? LIMIT 1`,
    [sourceText, targetLang]
  );
  if (rows.length > 0) {
    return rows[0].translated_text;
  }
  return null;
}

/**
 * Store translation in cache.
 */
async function storeTranslation(sourceText, targetLang, translatedText) {
  await pool.execute(
    `INSERT INTO translation_cache (source_text, target_lang, translated_text) VALUES (?, ?, ?) 
     ON DUPLICATE KEY UPDATE translated_text = VALUES(translated_text), updated_at = CURRENT_TIMESTAMP`,
    [sourceText, targetLang, translatedText]
  );
}

/**
 * Translate text to target language, using cache when possible.
 * @param {string} text
 * @param {string} targetLang
 * @returns {Promise<string>} translated text (original if translation fails)
 */
async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string') return text;
  // Skip translation for empty strings
  if (text.trim() === '') return text;
  try {
    // Check cache first
    const cached = await getCachedTranslation(text, targetLang);
    if (cached) return cached;
    // Call Google API
    const [translation] = await translateClient.translate(text, targetLang);
    // Store in cache
    await storeTranslation(text, targetLang, translation);
    return translation;
  } catch (err) {
    console.error('Translation error:', err);
    // Fallback to original text on error
    return text;
  }
}

module.exports = {
  translateText,
  getCachedTranslation,
  storeTranslation,
};
