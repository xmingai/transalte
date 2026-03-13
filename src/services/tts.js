import { getApiKey, STORAGE_KEYS } from './storage'

let currentSource = null
let audioContext = null

function getAudioContext() {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

export async function speakText(text, languageCode = 'en-US') {
  // Stop any currently playing audio first
  stopAudio()

  const apiKey = getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY)
  if (!apiKey) {
    throw new Error('请先在设置中配置 Google Cloud TTS API Key')
  }

  if (!text.trim()) {
    throw new Error('没有可朗读的文本')
  }

  const voiceConfig = getVoiceConfig(languageCode)

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { text: text.substring(0, 5000) },
        voice: {
          languageCode: voiceConfig.languageCode,
          name: voiceConfig.name,
          ssmlGender: voiceConfig.gender,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: voiceConfig.rate,
          pitch: 0,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `TTS 请求失败 (${response.status})`)
  }

  const data = await response.json()
  const audioContent = data.audioContent

  const audioBytes = atob(audioContent)
  const audioArray = new Uint8Array(audioBytes.length)
  for (let i = 0; i < audioBytes.length; i++) {
    audioArray[i] = audioBytes.charCodeAt(i)
  }

  const ctx = getAudioContext()
  const audioBuffer = await ctx.decodeAudioData(audioArray.buffer.slice(0))
  const source = ctx.createBufferSource()
  source.buffer = audioBuffer
  source.connect(ctx.destination)
  currentSource = source
  source.start(0)

  return new Promise((resolve) => {
    source.onended = () => {
      if (currentSource === source) {
        currentSource = null
      }
      resolve()
    }
  })
}

function getVoiceConfig(languageCode) {
  if (languageCode.startsWith('zh')) {
    return {
      languageCode: 'cmn-CN',
      name: 'cmn-CN-Wavenet-C',
      gender: 'MALE',
      rate: 0.95,
    }
  }
  return {
    languageCode: 'en-US',
    name: 'en-US-Wavenet-D',
    gender: 'MALE',
    rate: 1.0,
  }
}

export function stopAudio() {
  if (currentSource) {
    try {
      currentSource.stop()
    } catch {
      // already stopped
    }
    currentSource = null
  }
}

export function isPlaying() {
  return currentSource !== null
}
