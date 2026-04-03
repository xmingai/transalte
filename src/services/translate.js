import { getApiKey, STORAGE_KEYS } from './storage'

export async function translateText(text, direction = 'en-zh') {
  const apiKey = getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY)
  if (!apiKey) {
    throw new Error('请先在设置中配置 DeepSeek API Key')
  }

  if (!text.trim()) {
    throw new Error('请输入要翻译的文本')
  }

  const systemContent = direction === 'zh-en'
    ? `你是一个专业的中译英翻译引擎。请将用户输入的中文翻译成地道、自然的英文。
规则：
1. 只输出翻译结果，不要输出任何解释、注释或额外内容
2. 保持原文的语气和风格
3. 专有名词请给出准确的英文表述
4. 翻译结果可以适当进行意译，以便更符合英语母语者的表达习惯
5. 如果输入的已经是英文，请润色它`
    : `你是一个专业的英译中翻译引擎。请将用户输入的英文翻译成地道、自然的中文。
规则：
1. 只输出翻译结果，不要输出任何解释、注释或额外内容
2. 保持原文的语气和风格
3. 专业术语使用通用的中文译法
4. 如果是单个单词，请给出：词性 + 主要释义（最多3个）
5. 如果输入的不是英文，请直接将其翻译成中文`

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
          content: systemContent
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      stream: true,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `API 请求失败 (${response.status})`)
  }

  return response.body
}

export function parseSSEStream(stream) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()

  return {
    async *[Symbol.asyncIterator]() {
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') return

          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content
            if (content) yield content
          } catch {
            // skip invalid JSON
          }
        }
      }
    }
  }
}
