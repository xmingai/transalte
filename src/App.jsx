import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import TranslatePanel from '@/components/TranslatePanel'
import VocabularyPanel from '@/components/VocabularyPanel'
import SettingsPanel from '@/components/SettingsPanel'
import { getTheme, setTheme } from '@/services/storage'
import {
  Languages,
  BookOpen,
  Settings,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react'

export default function App() {
  const [currentTheme, setCurrentTheme] = useState('dark')
  const [vocabRefreshKey, setVocabRefreshKey] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const theme = getTheme()
    setCurrentTheme(theme)
    setTheme(theme)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = currentTheme === 'dark' ? 'light' : 'dark'
    setCurrentTheme(next)
    setTheme(next)
  }, [currentTheme])

  const handleWordAdded = useCallback(() => {
    setVocabRefreshKey(prev => prev + 1)
  }, [])

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Ambient gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[60%] h-[60%] rounded-full bg-blue-500/[0.03] dark:bg-blue-500/[0.06] blur-[100px]" />
        <div className="absolute -bottom-[30%] -right-[20%] w-[50%] h-[50%] rounded-full bg-indigo-500/[0.03] dark:bg-indigo-500/[0.06] blur-[100px]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Translate
              </h1>
              <p className="text-xs text-muted-foreground">
                AI 智能翻译 · 英 → 中
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
              title={currentTheme === 'dark' ? '切换浅色模式' : '切换深色模式'}
            >
              {currentTheme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Tab layout — only Translate & Vocabulary */}
        <Tabs defaultValue="translate" className="w-full">
          <TabsList className="w-full max-w-xs mx-auto grid grid-cols-2 mb-6">
            <TabsTrigger value="translate" className="gap-1.5">
              <Languages className="w-4 h-4" />
              翻译
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="gap-1.5">
              <BookOpen className="w-4 h-4" />
              生词本
            </TabsTrigger>
          </TabsList>

          <TabsContent value="translate">
            <TranslatePanel onWordAdded={handleWordAdded} />
          </TabsContent>

          <TabsContent value="vocabulary">
            <VocabularyPanel refreshKey={vocabRefreshKey} />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pb-6 text-center">
          <p className="text-xs text-muted-foreground/40">
            Powered by DeepSeek AI & Google Cloud TTS
          </p>
        </footer>
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">设置</DialogTitle>
            <DialogDescription className="sr-only">配置 API 密钥</DialogDescription>
          </DialogHeader>
          <SettingsPanel />
        </DialogContent>
      </Dialog>
    </div>
  )
}
