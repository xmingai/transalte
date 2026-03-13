import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getVocabulary, removeWord } from '@/services/storage'
import { speakText } from '@/services/tts'
import { getApiKey, STORAGE_KEYS } from '@/services/storage'
import {
  Search,
  Trash2,
  Volume2,
  BookOpen,
  Clock,
  X,
} from 'lucide-react'

export default function VocabularyPanel({ refreshKey }) {
  const [vocabulary, setVocabulary] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [speakingId, setSpeakingId] = useState(null)

  useEffect(() => {
    setVocabulary(getVocabulary())
  }, [refreshKey])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return vocabulary
    const q = searchQuery.toLowerCase()
    return vocabulary.filter(
      v => v.word.toLowerCase().includes(q) || v.translation.includes(q)
    )
  }, [vocabulary, searchQuery])

  const handleDelete = (id) => {
    const updated = removeWord(id)
    setVocabulary(updated)
  }

  const handleSpeak = async (word, id) => {
    setSpeakingId(id)
    try {
      await speakText(word, 'en-US')
    } catch {
      // silent
    } finally {
      setSpeakingId(null)
    }
  }

  const formatDate = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
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

      {/* Word list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <BookOpen className="w-12 h-12 mb-4 opacity-30" />
          <p className="text-sm">
            {searchQuery ? '没有找到匹配的单词' : '生词本还是空的，翻译后点击 📖 收藏单词'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item, index) => (
            <div
              key={item.id}
              className="group rounded-xl border border-border bg-card p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-foreground">
                      {item.word}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleSpeak(item.word, item.id)}
                      disabled={speakingId === item.id || !getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary h-6 w-6 transition-opacity"
                    >
                      <Volume2 className={`w-3.5 h-3.5 ${speakingId === item.id ? 'text-primary animate-pulse-ring' : ''}`} />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.translation}
                  </p>
                  {item.sentence && (
                    <p className="text-xs text-muted-foreground/60 mt-1 italic truncate">
                      "{item.sentence}"
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground/50 mr-2">
                    <Clock className="w-3 h-3" />
                    {formatDate(item.createdAt)}
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
}
