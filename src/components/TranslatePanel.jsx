import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { translateText, parseSSEStream } from '@/services/translate'
import { speakText, stopAudio } from '@/services/tts'
import { explainWord } from '@/services/wordExplain'
import { addWord, getApiKey, STORAGE_KEYS } from '@/services/storage'
import {
  Languages,
  Volume2,
  Square,
  Copy,
  Check,
  BookPlus,
  Loader2,
  ArrowRightLeft,
  Eraser,
  X,
} from 'lucide-react'

export default function TranslatePanel({ onWordAdded }) {
  const [sourceText, setSourceText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSpeakingSource, setIsSpeakingSource] = useState(false)
  const [isSpeakingTarget, setIsSpeakingTarget] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  // Word selection state
  const [selectedWord, setSelectedWord] = useState('')
  const [selectionPos, setSelectionPos] = useState(null)
  const [isExplaining, setIsExplaining] = useState(false)
  const [wordExplanation, setWordExplanation] = useState('')
  const [wordAdded, setWordAdded] = useState(false)
  const sourceRef = useRef(null)
  const popupRef = useRef(null)

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

  const handleStopSpeak = useCallback((setPlaying) => {
    stopAudio()
    setPlaying(false)
  }, [])

  const handleCopy = useCallback(async () => {
    if (!translatedText) return
    await navigator.clipboard.writeText(translatedText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [translatedText])

  const handleClear = useCallback(() => {
    setSourceText('')
    setTranslatedText('')
    setError('')
    dismissPopup()
    stopAudio()
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleTranslate()
    }
  }, [handleTranslate])

  // Handle text selection via mouse position
  const handleSourceMouseUp = useCallback((e) => {
    const textarea = sourceRef.current
    if (!textarea) return

    const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd).trim()

    if (selected && selected.length > 0 && selected.length < 80 && /[a-zA-Z]/.test(selected)) {
      setSelectedWord(selected)
      setWordExplanation('')
      setWordAdded(false)

      // Position popup near the mouse cursor
      setSelectionPos({
        top: e.clientY + 8,
        left: e.clientX,
      })
    } else {
      // Don't dismiss if popup is showing explanation
      if (!wordExplanation && !isExplaining) {
        setSelectedWord('')
        setSelectionPos(null)
      }
    }
  }, [wordExplanation, isExplaining])

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        dismissPopup()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Explain & add word
  const handleExplainAndAdd = useCallback(async () => {
    if (!selectedWord || isExplaining) return
    setIsExplaining(true)
    setWordExplanation('')

    try {
      const explanation = await explainWord(selectedWord)
      setWordExplanation(explanation)
      addWord(selectedWord, explanation)
      setWordAdded(true)
      onWordAdded?.()
    } catch (err) {
      setError(err.message)
      dismissPopup()
    } finally {
      setIsExplaining(false)
    }
  }, [selectedWord, isExplaining, onWordAdded])

  const dismissPopup = useCallback(() => {
    setSelectedWord('')
    setSelectionPos(null)
    setWordExplanation('')
    setWordAdded(false)
  }, [])

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
              ref={sourceRef}
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              onKeyDown={handleKeyDown}
              onMouseUp={handleSourceMouseUp}
              placeholder="Type English text here..."
              className="w-full min-h-[220px] max-h-[400px] p-5 bg-transparent text-foreground text-[15px] leading-relaxed resize-none placeholder:text-muted-foreground/60"
              autoFocus
            />
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/50 bg-muted/30">
              <div className="flex items-center gap-1">
                {isSpeakingSource ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleStopSpeak(setIsSpeakingSource)}
                    className="text-primary hover:text-destructive"
                    title="停止朗读"
                  >
                    <div className="animate-pulse-ring">
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleSpeak(sourceText, 'en-US', setIsSpeakingSource)}
                    disabled={!sourceText.trim() || !getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY)}
                    className="text-muted-foreground hover:text-primary"
                    title="朗读英文"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
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
                {isSpeakingTarget ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleStopSpeak(setIsSpeakingTarget)}
                    className="text-primary hover:text-destructive"
                    title="停止朗读"
                  >
                    <div className="animate-pulse-ring">
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleSpeak(translatedText, 'zh-CN', setIsSpeakingTarget)}
                    disabled={!translatedText.trim() || !getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY)}
                    className="text-muted-foreground hover:text-primary"
                    title="朗读中文"
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                )}
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

      {/* Word selection popup — compact, attached to cursor */}
      {selectedWord && selectionPos && (
        <div
          ref={popupRef}
          className="fixed z-50 animate-fade-in"
          style={{
            top: `${selectionPos.top}px`,
            left: `${selectionPos.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {/* Before query: compact pill with word + icon button */}
          {!wordExplanation && !isExplaining && (
            <div className="flex items-center gap-1.5 bg-card border border-border rounded-lg shadow-xl px-2.5 py-1.5">
              <span className="text-sm font-medium text-foreground max-w-[120px] truncate">
                {selectedWord}
              </span>
              <button
                onClick={handleExplainAndAdd}
                disabled={!getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY)}
                className="w-7 h-7 rounded-md bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-40"
                title="查询并加入生词本"
              >
                <BookPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Loading state */}
          {isExplaining && (
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg shadow-xl px-3 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
              <span className="text-xs text-muted-foreground">查询中...</span>
            </div>
          )}

          {/* Result: compact card with explanation */}
          {wordExplanation && (
            <div className="bg-card border border-border rounded-xl shadow-2xl p-3 max-w-[260px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-foreground">{selectedWord}</span>
                <button
                  onClick={dismissPopup}
                  className="text-muted-foreground hover:text-foreground transition-colors ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {wordExplanation}
              </div>
              {wordAdded && (
                <div className="flex items-center gap-1 text-[10px] text-green-500 mt-1.5">
                  <Check className="w-3 h-3" />
                  已加入生词本
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
