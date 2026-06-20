'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { Bot, X, Send, Loader2, Sparkles, Maximize2, Minimize2 } from 'lucide-react'
import { aiService } from '@/services/aiService'
import { SettingsService } from '@/lib/supabaseService'
import { usePathname } from 'next/navigation'

export default function DraggableAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const pathname = usePathname()
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await SettingsService.getSettings()
        if (settings.general_settings?.ai_assistant_enabled !== undefined) {
          setIsEnabled(settings.general_settings.ai_assistant_enabled)
        }
      } catch (e) {
        console.error('Failed to load AI assistant settings', e)
      }
    }
    fetchSettings()

    const handleSettingsUpdate = (e: any) => {
      if (e.detail?.settings?.ai_assistant_enabled !== undefined) {
        setIsEnabled(e.detail.settings.ai_assistant_enabled)
      }
    }

    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate)
  }, [])

  const dragControls = useDragControls()
  const constraintsRef = useRef<HTMLDivElement>(null)

  // Eğer kullanıcı login sayfasındaysa veya asistan ayarlardan kapalıysa hiçbir şey gösterme
  if (!isEnabled || pathname?.startsWith('/login')) return null;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await aiService.askQuestion(userMessage)
      setMessages(prev => [...prev, { role: 'ai', content: response }])
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Üzgünüm, şu anda sistemle iletişim kuramıyorum. Lütfen daha sonra tekrar deneyin.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <React.Fragment>
      {/* Sınırları belirleyen tam ekran görünmez parent */}
      <div ref={constraintsRef} className="fixed inset-4 pointer-events-none z-50">
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.1}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setTimeout(() => setIsDragging(false), 150)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isOpen ? 0 : 1, 
            opacity: isOpen ? 0 : 1 
          }}
          transition={{ duration: 0.2 }}
          className={`absolute bottom-2 right-2 cursor-move ${isOpen ? 'pointer-events-none' : ''}`}
          style={{ touchAction: "none" }}
        >
          <button
            onClick={(e) => {
              if (isDragging) {
                e.preventDefault()
                return
              }
              setIsOpen(true)
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all flex items-center justify-center group pointer-events-auto"
          >
            <Bot className="w-8 h-8 group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col ${
              isExpanded 
                ? 'w-[800px] h-[80vh]' 
                : 'w-[400px] h-[600px] max-h-[85vh]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-200" />
                <h3 className="font-semibold text-lg">AI Asistan</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
              {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Bot className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Size nasıl yardımcı olabilirim?</p>
                    <p className="text-sm mt-1">Sistemdeki verilerle ilgili sorular sorabilirsiniz.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    <button onClick={() => setInput("Bu ayki genel ciromuz nedir?")} className="text-xs bg-white border rounded-full px-3 py-1 hover:bg-indigo-50 transition-colors">Örnek: Bu ayki genel ciromuz nedir?</button>
                    <button onClick={() => setInput("Bekleyen faturaları listele")} className="text-xs bg-white border rounded-full px-3 py-1 hover:bg-indigo-50 transition-colors">Örnek: Bekleyen faturaları listele</button>
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none shadow-sm'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                    <span className="text-sm text-gray-500">Analiz ediliyor...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <div className="flex items-end space-x-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 max-h-32 min-h-[44px] p-3 border rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none text-sm bg-gray-50"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-[10px] text-gray-400">n8n Advanced AI tarafından desteklenmektedir</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </React.Fragment>
  )
}
