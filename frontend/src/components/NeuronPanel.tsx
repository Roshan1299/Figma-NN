import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { useGraphStore } from '@/store/graphStore'
import type { ChatMessage, ProposedSchema } from '@/hooks/useChat'
import type { AnyLayer, GraphEdge } from '@/types/graph'

interface NeuronPanelProps {
  onViewProposal: () => void
  messages: ChatMessage[]
  isStreaming: boolean
  isGeneratingSchema: boolean
  proposedSchema: ProposedSchema | null
  sendMessage: (
    message: string,
    requestSchemaChange: boolean,
    currentSchema?: { layers: Record<string, AnyLayer>; edges: GraphEdge[] }
  ) => void
  clearMessages: () => void
}

const LOADING_MESSAGES = [
  "Consulting the architecture oracle...",
  "Aligning the hidden layers...",
  "Brewing fresh gradients...",
  "Calibrating activation functions...",
  "Spinning up backpropagation...",
]

const SUGGESTED_PROMPTS = [
  "Improve my architecture",
  "Explain batch normalization",
  "When should I use dropout?",
  "What activation function to use?",
]

export function NeuronPanel({
  onViewProposal,
  messages,
  isStreaming,
  isGeneratingSchema,
  proposedSchema,
  sendMessage,
  clearMessages,
}: NeuronPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { layers, edges } = useGraphStore()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!isGeneratingSchema) { setLoadingMsgIdx(0); return }
    const id = setInterval(() => {
      setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(id)
  }, [isGeneratingSchema])

  const isArchitectureRequest = (msg: string): boolean => {
    const lower = msg.toLowerCase()
    return /\b(add|remove|change|improve|modify|replace|make|use|insert|delete|update|restructure|deeper|wider|smaller|bigger|layer|architecture|model|network)\b/.test(lower)
  }

  const handleSend = (text?: string) => {
    const msg = text ?? inputValue
    if (!msg.trim() || isStreaming) return
    const needsSchema = isArchitectureRequest(msg)
    sendMessage(msg, needsSchema, needsSchema ? { layers, edges } : undefined)
    setInputValue('')
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0a0a' }}>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-2 py-8">
            {/* Icon */}
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: '#0d3d3d', border: '1px solid #1a5555' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3ecfcf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2"/>
                <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5"/>
                <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5"/>
                <path d="M5.5 17.5A4 4 0 0 1 4 14c0-1.5.8-2.8 2-3.5"/>
                <path d="M18.5 17.5A4 4 0 0 0 20 14c0-1.5-.8-2.8-2-3.5"/>
                <path d="M8 20a4 4 0 0 0 8 0"/>
              </svg>
            </div>
            <p className="text-[15px] font-semibold text-white mb-1">Neuron</p>
            <p className="text-[12px] mb-6" style={{ color: '#555' }}>
              Ask me anything about your architecture or ML concepts
            </p>
            <div className="flex flex-col gap-1.5 w-full">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  disabled={isStreaming}
                  className="w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{
                    background: '#161618',
                    border: '1px solid #2a2a2e',
                    color: '#aaa',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#3ecfcf44'; (e.currentTarget as HTMLButtonElement).style.color = '#3ecfcf' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a2a2e'; (e.currentTarget as HTMLButtonElement).style.color = '#aaa' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'}`}
          >
            {msg.role === 'system' ? (
              <p
                className="text-[11px] font-medium px-3 py-1.5 rounded-lg"
                style={{ background: '#0d2a1a', color: '#4ade80', border: '1px solid #1a4a2e' }}
              >
                {msg.content}
              </p>
            ) : msg.role === 'user' ? (
              <div
                className="max-w-[85%] px-3 py-2 rounded-xl text-[13px] text-white"
                style={{ background: '#0d3d3d', border: '1px solid #1a5555' }}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ) : (
              <div
                className="max-w-[95%] px-3 py-2 rounded-xl text-[13px]"
                style={{ background: '#161618', border: '1px solid #2a2a2e', color: '#ccc' }}
              >
                <div className="prose prose-sm max-w-none prose-invert prose-p:my-1 prose-li:my-0.5 prose-headings:text-white prose-code:text-cyan-300">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}

        {isGeneratingSchema && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2.5 rounded-xl text-[12px] flex items-center gap-2"
              style={{ background: '#161618', border: '1px solid #2a2a2e', color: '#555' }}
            >
              <svg className="w-3.5 h-3.5 animate-spin shrink-0" style={{ color: '#3ecfcf' }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="animate-pulse">{LOADING_MESSAGES[loadingMsgIdx]}</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Proposal banner */}
      {proposedSchema && (
        <div className="px-3 pb-2 shrink-0">
          <button
            onClick={onViewProposal}
            className="w-full py-2 px-3 rounded-xl text-[12px] font-medium transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{ background: '#0d2a1a', border: '1px solid #1a4a2e', color: '#4ade80' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
            Architecture proposal ready
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 pb-3 shrink-0" style={{ borderTop: '1px solid #1e1e1e', paddingTop: '12px' }}>
        {messages.length > 0 && (
          <div className="flex justify-end mb-2">
            <button
              onClick={clearMessages}
              className="text-[11px] transition-colors cursor-pointer"
              style={{ color: '#444' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#444' }}
            >
              Clear chat
            </button>
          </div>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Neuron..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[13px] text-white outline-none focus:ring-1 focus:ring-[#3ecfcf]/40 transition-all disabled:opacity-50"
            style={{ background: '#161618', border: '1px solid #2a2a2e', minHeight: '40px', maxHeight: '100px' }}
            onInput={e => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 100) + 'px'
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isStreaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#3ecfcf' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
