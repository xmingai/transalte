import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { translateText, parseSSEStream } from '@/services/translate'
import { speakText, stopAudio } from '@/services/tts'
import { addWord, getApiKey, STORAGE_KEYS } from '@/services/storage'
import {
  Languages,
  Volume2,
  VolumeX,
  Copy,
  Check,
  BookPlus,
  Loader2,
  ArrowRightLeft,
  Eraser,
} from 'lucide-react'

export default function TranslatePanel({ onWordAdded }) {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSpeakingSource, setIsSpeakingSource] = useState(false)
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wordAdded, setWordAdded] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef(null)

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim() || isTranslating) return
    setError('')
    setIsTranslating(true)
    setTranslatedText('')

    try {
      const stream = await translateText(sourceText)
      const reader = parseSSEStream(stream)
      let result = ''

      for await (const chunk of reader) {
        result += chunk
        setTranslatedText(result)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsTranslating(false)
    }
  }, [sourceText, isTranslating])

  const handleSpeak = useCallback(async (text, lang, setPlaying) => {
    if (!text.trim()) return
    setPlaying(true)
    try {
      await speakText(text, lang)
    } catch (err) {
      setError(err.message)
    } finally {
      setPlaying(false)
    }
  }, [])

  const handleCopy = useCallback(async () => {
    if (!translatedText) return
    await navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [translatedText])

  const handleAddWord = useCallback(() => {
    if (!sourceText.trim() || !translatedText.trim()) return
    addWord(sourceText.trim(), translatedText.trim())
    setWordAdded(true)
    setTimeout(() => setWordAdded(false), 2000)
    onWordAdded?.()
  }, [sourceText, translatedText, onWordAdded])

  const handleClear = useCallback(() => {
    setSourceText('')
    setTranslatedText('')
    setError('')
    stopAudio()
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleTranslate()
    }
  }, [handleTranslate])

  const charCount = sourceText.length

  return (
    <div className="animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            English
          </div>
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          <div className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
            中文
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground"
        >
          <Eraser className="w-4 h-4" />
        </Button>
      </div>

      {/* Translation panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source panel */}
        <div className="relative group">
          <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50">
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type English text here..."
              className="w-full min-h-[220px] max-h-[400px] p-5 bg-transparent text-foreground text-[15px] leading-relaxed resize-none placeholder:text-muted-foreground/60"
              autoFocus
            />
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/30">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleSpeak(sourceText, 'en-US', setIsSpeakingSource)}
                  disabled={!sourceText.trim() || isSpeakingSource || !getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY)}
                  className="text-muted-foreground hover:text-primary"
                  title="朗读英文"
                >
                  {isSpeakingSource ? (
                    <div className="animate-pulse-ring">
                      <Volume2 className="w-4 h-4 text-primary" />
                    </div>
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <span className="text-xs text-muted-foreground/70">
                {charCount > 0 && `${charCount} 字符`}
              </span>
            </div>
          </div>
        </div>

        {/* Target panel */}
        <div className="relative">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="w-full min-h-[220px] max-h-[400px] p-5 text-[15px] leading-relaxed overflow-y-auto">
              {isTranslating && !translatedText && (
                <div className="space-y-3">
                  <div className="h-4 w-3/4 rounded shimmer" />
                  <div className="h-4 w-1/2 rounded shimmer" />
                  <div className="h-4 w-2/3 rounded shimmer" />
                </div>
              )}
              {translatedText && (
                <p className="text-foreground whitespace-pre-wrap">{translatedText}</p>
              )}
              {!isTranslating && !translatedText && !error && (
                <p className="text-muted-foreground/50 select-none">翻译结果将在这里显示...</p>
              )}
              {error && (
                <div className="flex items-start gap-2 text-destructive">
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/30">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleSpeak(translatedText, 'zh-CN', setIsSpeakingTarget)}
                  disabled={!translatedText.trim() || isSpeakingTarget || !getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY)}
                  className="text-muted-foreground hover:text-primary"
                  title="朗读中文"
                >
                  {isSpeakingTarget ? (
                    <div className="animate-pulse-ring">
                      <Volume2 className="w-4 h-4 text-primary" />
                    </div>
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleCopy}
                  disabled={!translatedText}
                  className="text-muted-foreground hover:text-primary"
                  title="复制翻译"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleAddWord}
                  disabled={!sourceText.trim() || !translatedText.trim()}
                  className="text-muted-foreground hover:text-amber-500"
                  title="添加到生词本"
                >
                  {wordAdded ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <BookPlus className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {isTranslating && (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Translate button */}
      <div className="flex justify-center mt-5">
        <Button
          onClick={handleTranslate}
          disabled={!sourceText.trim() || isTranslating || !getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY)}
          className="px-8 h-11 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
        >
          {isTranslating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              翻译中...
            </>
          ) : (
            <>
              <Languages className="w-4 h-4 mr-2" />
              翻译
              <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/20 bg-white/10 px-1.5 font-mono text-[10px] font-medium">
                ⌘↵
              </kbd>
            </>
          )}
        </Button>
      </div>

      {!getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY) && (
        <p className="text-center text-sm text-amber-500/80 mt-3 animate-fade-in">
          ⚠️ 请先在「设置」中配置 DeepSeek API Key
        </p>
      )}
    </div>
  )
}
