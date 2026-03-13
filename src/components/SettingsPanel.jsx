import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getApiKey, setApiKey, STORAGE_KEYS } from '@/services/storage'
import {
  Settings as SettingsIcon,
  Key,
  Eye,
  EyeOff,
  Check,
  ExternalLink,
} from 'lucide-react'

export default function SettingsPanel() {
  const [deepseekKey, setDeepseekKey] = useState('')
  const [googleKey, setGoogleKey] = useState('')
  const [showDeepseek, setShowDeepseek] = useState(false)
  const [showGoogle, setShowGoogle] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDeepseekKey(getApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY))
    setGoogleKey(getApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY))
  }, [])

  const handleSave = () => {
    setApiKey(STORAGE_KEYS.DEEPSEEK_API_KEY, deepseekKey.trim())
    setApiKey(STORAGE_KEYS.GOOGLE_TTS_API_KEY, googleKey.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">设置</h2>
          <p className="text-xs text-muted-foreground">配置 API 密钥</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* DeepSeek API Key */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">DeepSeek API Key</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            用于英译中翻译。
            <a
              href="https://platform.deepseek.com/api_keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline ml-1"
            >
              获取 API Key <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <div className="relative">
            <Input
              type={showDeepseek ? 'text' : 'password'}
              value={deepseekKey}
              onChange={(e) => setDeepseekKey(e.target.value)}
              placeholder="sk-..."
              className="pr-10 font-mono text-sm"
            />
            <button
              onClick={() => setShowDeepseek(!showDeepseek)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {deepseekKey && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-500">已配置</span>
            </div>
          )}
        </div>

        {/* Google Cloud TTS API Key */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Key className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">Google Cloud TTS API Key</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            用于文本朗读。
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-primary hover:underline ml-1"
            >
              获取 API Key <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <div className="relative">
            <Input
              type={showGoogle ? 'text' : 'password'}
              value={googleKey}
              onChange={(e) => setGoogleKey(e.target.value)}
              placeholder="AIza..."
              className="pr-10 font-mono text-sm"
            />
            <button
              onClick={() => setShowGoogle(!showGoogle)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showGoogle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {googleKey && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-emerald-500">已配置</span>
            </div>
          )}
        </div>

        {/* Save */}
        <Button
          onClick={handleSave}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              已保存
            </>
          ) : (
            '保存设置'
          )}
        </Button>

        {/* Info */}
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            🔒 所有 API Key 仅存储在浏览器本地 (localStorage)，不会上传到任何服务器。
            翻译请求直接从浏览器发往 API 服务商。
          </p>
        </div>
      </div>
    </div>
  )
}
