'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from './button'
import { cn } from '@/lib/utils'
import { ChevronDown, MessageCircle, X, Send, Bot, ArrowRight, ExternalLink, Sparkles } from 'lucide-react'
import { chatbotEngine } from '@/lib/chatbot-engine'
import { detectLanguage, getWelcomeMessage, getMessage, getContextualSuggestions, type Language } from '@/lib/chatbot-language'

interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: NavigationSuggestion[]
  confidence?: number
}

interface NavigationSuggestion {
  label: string
  href: string
  description: string
  external?: boolean
  icon?: string
}

// Get current page context
function getCurrentPageContext() {
  if (typeof window === 'undefined') return { page: '/', title: 'Revamp IT', section: 'Main' }
  
  const path = window.location.pathname
  return { page: path, title: 'Revamp IT', section: 'Navigation' }
}

export default function RevampCopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('de')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with contextual welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const context = getCurrentPageContext()
      setMessages([{
        id: '1',
        type: 'assistant',
        content: getWelcomeMessage(context.page, currentLanguage),
        timestamp: new Date(),
        suggestions: getContextualSuggestions(context.page, currentLanguage),
        confidence: 1.0
      }])
    }
  }, [messages.length, currentLanguage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom()
      // Focus input when opening
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, isOpen, isMinimized])

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return

    const trimmedInput = inputValue.trim()
    
    // Detect language from user input
    const detectedLanguage = detectLanguage(trimmedInput, currentLanguage)
    if (detectedLanguage !== currentLanguage) {
      setCurrentLanguage(detectedLanguage)
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const context = getCurrentPageContext()
      const conversationContext = {
        currentPage: context.page,
        userHistory: messages.slice(-5).map(m => m.content),
        language: detectedLanguage
      }

      // Use the intelligent chatbot engine
      const response = await chatbotEngine.processMessage(trimmedInput, conversationContext)
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Copilot error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getMessage('error', currentLanguage),
        timestamp: new Date(),
        suggestions: [
          { 
            label: currentLanguage === 'de' ? '📞 Support kontaktieren' : '📞 Contact Support', 
            href: '/contact', 
            description: currentLanguage === 'de' ? 'Direkte Hilfe von unserem Team' : 'Direct help from our team'
          }
        ],
        confidence: 0.5
      }
      setMessages(prev => [...prev, errorMessage])
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

  const handleSuggestionClick = (suggestion: NavigationSuggestion) => {
    if (suggestion.external) {
      window.open(suggestion.href, '_blank')
    } else {
      window.location.href = suggestion.href
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700",
          "text-white rounded-full p-4 shadow-lg hover:shadow-xl",
          "transition-all duration-300 ease-in-out transform hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
          isOpen && "hidden"
        )}
        aria-label={currentLanguage === 'de' ? 'Revamp IT Assistent öffnen' : 'Open Revamp IT Assistant'}
      >
        <div className="relative">
          <Bot className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse">
            <Sparkles className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
          </div>
        </div>
      </button>

      {/* Chat Interface */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-6 right-6 z-50",
          "bg-white rounded-2xl shadow-2xl border border-gray-200/80 backdrop-blur-sm",
          "w-96 transition-all duration-300 ease-in-out",
          isMinimized ? "h-16" : "h-[28rem]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white">
                  <div className="w-1 h-1 bg-white rounded-full mx-auto mt-0.5"></div>
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-800">{currentLanguage === 'de' ? 'Revamp IT Assistent' : 'Revamp IT Assistant'}</span>
                <p className="text-xs text-gray-600">{getMessage('status', currentLanguage)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={isMinimized ? getMessage('buttons', currentLanguage).maximize : getMessage('buttons', currentLanguage).minimize}
              >
                <ChevronDown className={cn("w-4 h-4 transition-transform", isMinimized && "rotate-180")} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors"
                aria-label={getMessage('buttons', currentLanguage).close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Messages */}
          {!isMinimized && (
            <>
              <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-transparent">
                {messages.map((message) => (
                  <div key={message.id} className={cn(
                    "flex",
                    message.type === 'user' ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[85%] p-3 rounded-2xl shadow-sm",
                      message.type === 'user'
                        ? "bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                    )}>
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      
                      {/* Navigation Suggestions */}
                      {message.type === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-1.5">
                          {message.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="flex items-center justify-between w-full text-left p-2.5 text-xs bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-green-50 hover:to-blue-50 rounded-lg border border-gray-200/50 hover:border-green-300/50 text-gray-700 hover:text-gray-900 transition-all duration-200 group"
                            >
                              <div className="flex-1">
                                <div className="font-medium flex items-center">
                                  {suggestion.label}
                                </div>
                                {suggestion.description && (
                                  <div className="text-gray-500 mt-0.5 text-xs">{suggestion.description}</div>
                                )}
                              </div>
                              <div className="flex items-center ml-2">
                                {suggestion.external ? (
                                  <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-green-600 transition-colors" />
                                ) : (
                                  <ArrowRight className="w-3 h-3 text-gray-400 group-hover:text-green-600 transition-colors" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md p-3 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-gray-500">{getMessage('typing', currentLanguage)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={getMessage('placeholder', currentLanguage)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm transition-colors"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 rounded-full px-4 shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}