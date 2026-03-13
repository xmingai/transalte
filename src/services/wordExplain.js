import { getApiKey, STORAGE_KEYS } from './storage'

export async function explainWord(word) {
  const apiKey = getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY)
  if (!apiKey) {
    throw new Error('请先在设置中配置 DeepSeek API Key')
  }

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
          content: `你是一个英语单词学习助手。用户会给你一个英文单词或短语，请你用以下固定格式回复：

释义：[词性缩写] [中文释义，最多3个含义，用"；"分隔]
例句：[一个简单实用的英文例句]
翻译：[例句的中文翻译]

规则：
- 释义要简洁精准
- 例句要简单易懂，适合英语学习者
- 词性用 n./v./adj./adv./prep./conj. 表示
- 不要输出任何多余内容`
        },
        {
          role: 'user',
          content: word,
        },
      ],
      temperature: 0.3,
      max_tokens: 256,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 请求失败 (${response.status})`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}
