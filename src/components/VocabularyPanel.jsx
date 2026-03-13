import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getVocabulary, removeWord } from '@/services/storage'
import { speakText, stopAudio } from '@/services/tts'
import { getApiKey, STORAGE_KEYS } from '@/services/storage'
import { generateContentFromWords } from '@/services/generateContent'
import { parseSSEStream } from '@/services/translate'
import {
  Search,
  Trash2,
  Volume2,
  Square,
  BookOpen,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'

export default function VocabularyPanel({ refreshKey }) {
  const [vocabulary, setVocabulary] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [speakingId, setSpeakingId] = useState(null)
  const [collapsedDates, setCollapsedDates] = useState({})
  // Content generation state
  const [generatingDate, setGeneratingDate] = useState(null)
  const [generatedContents, setGeneratedContents] = useState({})
  const [copiedDate, setCopiedDate] = useState(null)

  useEffect(() => {
    setVocabulary(getVocabulary())
  }, [refreshKey])

  // Group vocabulary by date
  const groupedByDate = useMemo(() => {
    const items = searchQuery.trim()
      ? vocabulary.filter(v => {
          const q = searchQuery.toLowerCase()
          return v.word.toLowerCase().includes(q) || v.translation.includes(q)
        })
      : vocabulary

    const groups = {}
    items.forEach(item => {
      const date = new Date(item.createdAt)
      const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(item)
    })

    // Sort dates descending (newest first)
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateKey, words]) => ({
        dateKey,
        label: formatDateLabel(dateKey),
        words,
      }))
  }, [vocabulary, searchQuery])

  const handleDelete = (id) => {
    const updated = removeWord(id)
    setVocabulary(updated)
  }

  const handleSpeak = async (word, id) => {
    if (speakingId === id) {
      stopAudio()
      setSpeakingId(null)
      return
    }
    setSpeakingId(id)
    try {
      await speakText(word, 'en-US')
    } catch {
      // silent
    } finally {
      setSpeakingId(null)
    }
  }

  const toggleDateCollapse = (dateKey) => {
    setCollapsedDates(prev => ({
      ...prev,
      [dateKey]: !prev[dateKey],
    }))
  }

  // Generate English content from a day's words
  const handleGenerateContent = useCallback(async (dateKey, words) => {
    if (generatingDate) return
    setGeneratingDate(dateKey)
    setGeneratedContents(prev => ({ ...prev, [dateKey]: '' }))

    try {
      const stream = await generateContentFromWords(words)
      const reader = parseSSEStream(stream)
      let result = ''

      for await (const chunk of reader) {
        result += chunk
        setGeneratedContents(prev => ({ ...prev, [dateKey]: result }))
      }
    } catch (err) {
      setGeneratedContents(prev => ({
        ...prev,
        [dateKey]: `❌ 生成失败: ${err.message}`,
      }))
    } finally {
      setGeneratingDate(null)
    }
  }, [generatingDate])

  const handleCopyContent = async (dateKey) => {
    const content = generatedContents[dateKey]
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      setCopiedDate(dateKey)
      setTimeout(() => setCopiedDate(null), 2000)
    } catch {
      // silent
    }
  }

  // Parse explanation to highlight structure
  const renderExplanation = (text) => {
    if (!text) return null
    const lines = text.split('\n').filter(l => l.trim())
    return (
      <div className="space-y-0.5">
        {lines.map((line, i) => {
          const trimmed = line.trim()
          if (trimmed.startsWith('释义：') || trimmed.startsWith('释义:')) {
            return (
              <p key={i} className="text-sm text-foreground/90">
                <span className="text-primary font-medium">释义</span>
                <span className="text-muted-foreground ml-1">{trimmed.replace(/^释义[：:]/, '').trim()}</span>
              </p>
            )
          }
          if (trimmed.startsWith('例句：') || trimmed.startsWith('例句:')) {
            return (
              <p key={i} className="text-xs text-muted-foreground/80 italic mt-1">
                {trimmed.replace(/^例句[：:]/, '').trim()}
              </p>
            )
          }
          if (trimmed.startsWith('翻译：') || trimmed.startsWith('翻译:')) {
            return (
              <p key={i} className="text-xs text-muted-foreground/60">
                {trimmed.replace(/^翻译[：:]/, '').trim()}
              </p>
            )
          }
          return (
            <p key={i} className="text-sm text-muted-foreground">{trimmed}</p>
          )
        })}
      </div>
    )
  }

  // Render generated content with markdown bold support
  const renderGeneratedContent = (text) => {
    if (!text) return null
    // Split by **word** pattern and render with highlights
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} className="font-semibold text-amber-400">
            {part.slice(2, -2)}
          </span>
        )
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">生词本</h2>
            <p className="text-xs text-muted-foreground">
              {vocabulary.length} 个单词
              {groupedByDate.length > 0 && ` · ${groupedByDate.length} 天`}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索单词或释义..."
          className="pl-10 pr-10 bg-card"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Word list grouped by date */}
      {groupedByDate.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">
            {searchQuery ? '没有找到匹配的单词' : '生词本还是空的，翻译时选中英文单词即可收藏'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(({ dateKey, label, words }) => {
            const isCollapsed = collapsedDates[dateKey]
            const isGenerating = generatingDate === dateKey
            const generatedContent = generatedContents[dateKey]
            const hasApiKey = !!getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY)

            return (
              <div key={dateKey} className="animate-slide-up">
                {/* Date header */}
                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => toggleDateCollapse(dateKey)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span>{label}</span>
                    <span className="text-xs text-muted-foreground/50 ml-1">
                      ({words.length} 词)
                    </span>
                  </button>

                  <div className="flex-1 h-px bg-border/50" />

                  {/* Generate content button */}
                  <button
                    onClick={() => handleGenerateContent(dateKey, words)}
                    disabled={isGenerating || !hasApiKey}
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-gradient-to-r from-violet-500/10 to-amber-500/10 border border-violet-500/20 text-violet-400 hover:text-violet-300 hover:border-violet-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    title="根据当天生词生成英文内容"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    <span>{isGenerating ? '生成中...' : 'AI 生成'}</span>
                  </button>
                </div>

                {/* Generated content card */}
                {generatedContent && (
                  <div className="mb-3 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-amber-500/5 p-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-violet-400">
                        <Sparkles className="w-3 h-3" />
                        <span>AI 生成内容</span>
                      </div>
                      <button
                        onClick={() => handleCopyContent(dateKey)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="复制内容"
                      >
                        {copiedDate === dateKey ? (
                          <>
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-green-500">已复制</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>复制</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                      {renderGeneratedContent(generatedContent)}
                    </div>
                  </div>
                )}

                {/* Word cards */}
                {!isCollapsed && (
                  <div className="space-y-2">
                    {words.map((item, index) => (
                      <div
                        key={item.id}
                        className="group rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-base font-semibold text-foreground">
                                {item.word}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleSpeak(item.word, item.id)}
                                disabled={!getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary h-6 w-6 transition-opacity"
                              >
                                {speakingId === item.id ? (
                                  <Square className="w-3 h-3 fill-primary text-primary" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </Button>
                            </div>
                            {renderExplanation(item.translation)}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground/50 mr-2">
                              <Clock className="w-3 h-3" />
                              {formatTime(item.createdAt)}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDelete(item.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-7 w-7 transition-opacity"
                              title="删除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Format date label for group header
function formatDateLabel(dateKey) {
  const date = new Date(dateKey + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const target = new Date(dateKey + 'T00:00:00')

  if (target.getTime() === today.getTime()) return '📅 今天'
  if (target.getTime() === yesterday.getTime()) return '📅 昨天'

  const diff = Math.floor((today - target) / 86400000)
  if (diff < 7) return `📅 ${diff} 天前`

  return `📅 ${date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' })}`
}

// Format time within a date group (just show time)
function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
