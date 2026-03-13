const STORAGE_KEYS = {
  DEEPSEEK_API_KEY: 'translator_deepseek_api_key',
  GOOGLE_TTS_API_KEY: 'translator_google_tts_api_key',
  VOCABULARY: 'translator_vocabulary',
  THEME: 'translator_theme',
  GENERATED_CONTENTS: 'translator_generated_contents',
}

export function getApiKey(key) {
  return localStorage.getItem(key) || ''
}

export function setApiKey(key, value) {
  localStorage.setItem(key, value)
}

export function getVocabulary() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.VOCABULARY) || '[]')
  } catch {
    return []
  }
}

export function saveVocabulary(vocab) {
  localStorage.setItem(STORAGE_KEYS.VOCABULARY, JSON.stringify(vocab))
}

export function addWord(word, translation, sentence = '') {
  const vocab = getVocabulary()
  const existing = vocab.find(v => v.word.toLowerCase() === word.toLowerCase())
  if (existing) return vocab
  
  const newEntry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    word: word.trim(),
    translation: translation.trim(),
    sentence: sentence.trim(),
    createdAt: new Date().toISOString(),
  }
  const updated = [newEntry, ...vocab]
  saveVocabulary(updated)
  return updated
}

export function removeWord(id) {
  const vocab = getVocabulary()
  const updated = vocab.filter(v => v.id !== id)
  saveVocabulary(updated)
  return updated
}

export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark'
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export function getGeneratedContents() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GENERATED_CONTENTS) || '{}')
  } catch {
    return {}
  }
}

export function saveGeneratedContent(dateKey, content) {
  const all = getGeneratedContents()
  all[dateKey] = content
  localStorage.setItem(STORAGE_KEYS.GENERATED_CONTENTS, JSON.stringify(all))
}

export function removeGeneratedContent(dateKey) {
  const all = getGeneratedContents()
  delete all[dateKey]
  localStorage.setItem(STORAGE_KEYS.GENERATED_CONTENTS, JSON.stringify(all))
}

export { STORAGE_KEYS }
