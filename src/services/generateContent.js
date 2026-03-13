import { getApiKey, STORAGE_KEYS } from './storage'

export async function generateContentFromWords(words) {
  const apiKey = getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY)
  if (!apiKey) {
    throw new Error('请先在设置中配置 DeepSeek API Key')
  }

  if (!words || words.length === 0) {
    throw new Error('没有可用的生词')
  }

  const wordList = words.map(w => w.word).join(', ')

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `You are a creative English writing assistant for language learners. The user will provide a list of English vocabulary words. Your task is to:

1. Identify the common THEME or topic connecting these words
2. Write a SHORT, engaging English paragraph or mini-article (100-200 words) that naturally uses ALL the given words
3. The content should be interesting, coherent, and educational
4. Bold each vocabulary word by wrapping it in **word** markdown format
5. After the English content, add a brief Chinese summary (1-2 sentences)

Format your response EXACTLY like this:

📝 Theme: [Theme Name]

[English content with **bolded** vocabulary words]

📖 中文概要：[Brief Chinese summary of the content]

Rules:
- Use ALL provided words naturally in the content
- Keep language at intermediate English level (B1-B2)
- Make the content interesting and memorable
- The theme should feel natural, not forced`
        },
        {
          role: 'user',
          content: `Please write an English paragraph using these vocabulary words: ${wordList}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 请求失败 (${response.status})`)
  }

  return response.body
}
