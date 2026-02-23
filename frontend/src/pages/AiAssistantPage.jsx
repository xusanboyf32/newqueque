import { useState, useEffect, useRef } from 'react'
import { aiAPI } from '../api/ai'

function TypingDots() {
  return (
    <div className="typing-dots">
      <span /><span /><span />
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`msg-row${isUser ? ' user' : ''}`}>
      {!isUser && (
        <div className="msg-avatar">✨</div>
      )}
      <div className={`msg-bubble${isUser ? ' user' : ''}`}>
        <div className="msg-text">{msg.content}</div>
        {msg.sources?.length > 0 && (
          <div className="msg-sources">
            {msg.sources.map((s, i) => (
              <span key={i} className="source-tag">
                {s.type === 'doctor' ? '👨‍⚕️' : s.type === 'department' ? '🏥' : '📚'}
                {s.name || s.title}
              </span>
            ))}
          </div>
        )}
        <div className="msg-time">
          {new Date(msg.created_at || Date.now()).toLocaleTimeString('uz-UZ', {
            hour: '2-digit', minute: '2-digit'
          })}
        </div>
      </div>
      {isUser && <div className="msg-avatar user">👤</div>}
    </div>
  )
}

export default function AiAssistantPage() {
  const [messages, setMessages]         = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId]  = useState(null)
  const [input, setInput]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [typing, setTyping]             = useState(false)
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Suhbatlar ro'yxatini yuklash
  useEffect(() => {
    aiAPI.getConversations()
      .then(setConversations)
      .catch(() => {})
  }, [])

  // Har yangi xabar kelganda pastga scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Bitta suhbatni yuklash
  const loadConversation = async (id) => {
    try {
      const data = await aiAPI.getConversation(id)
      setMessages(data.messages || [])
      setActiveConvId(id)
      setSidebarOpen(false)
    } catch {}
  }

  // Yangi suhbat
  const newChat = () => {
    setMessages([])
    setActiveConvId(null)
    setSidebarOpen(false)
    inputRef.current?.focus()
  }

  // Xabar yuborish
  const sendMessage = async () => {
    const q = input.trim()
    if (!q || loading) return

    // Optimistic UI
    const tempUser = { role: 'user', content: q, created_at: new Date().toISOString() }
    setMessages(prev => [...prev, tempUser])
    setInput('')
    setTyping(true)
    setLoading(true)

    try {
      const res = await aiAPI.chat({ question: q, conversation_id: activeConvId })
      setActiveConvId(res.conversation_id)

      const aiMsg = {
        role: 'assistant',
        content: res.response,
        sources: res.sources,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])

      // Suhbatlar ro'yxatini yangilash
      aiAPI.getConversations().then(setConversations).catch(() => {})

    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Xatolik yuz berdi. Iltimos qayta urinib ko'ring.",
        created_at: new Date().toISOString(),
      }])
    } finally {
      setTyping(false)
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const deleteConversation = async (id, e) => {
    e.stopPropagation()
    await aiAPI.deleteConversation(id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConvId === id) newChat()
  }

  const SUGGESTIONS = [
    "Bosh og'rig'i uchun nima qilish kerak?",
    "Qanday doktorlar bor?",
    "Navbat olish uchun nima qilish kerak?",
    "Qon tahlili haqida ma'lumot bering",
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap');

        .ai-root {
          display: flex; height: 100vh;
          background: var(--bg);
          font-family: 'DM Sans', sans-serif;
          color: var(--text-primary);
          position: relative;
        }

        /* ── Conversation sidebar ── */
        .conv-sidebar {
          width: 260px; flex-shrink: 0;
          background: var(--surface);
          border-right: 1px solid var(--border);
          display: flex; flex-direction: column;
          transition: transform 0.3s;
        }
        @media (max-width: 768px) {
          .conv-sidebar {
            position: fixed; top: 0; left: 0; bottom: 0;
            z-index: 60; transform: translateX(-100%);
          }
          .conv-sidebar.open { transform: translateX(0); }
        }
        .conv-header {
          padding: 20px 16px 12px;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center;
          justify-content: space-between;
        }
        .conv-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700; color: var(--text-primary);
        }
        .new-chat-btn {
          padding: 6px 12px; border-radius: 8px;
          background: rgba(0,200,170,0.1);
          border: 1px solid rgba(0,200,170,0.2);
          color: #00c8aa; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .new-chat-btn:hover { background: rgba(0,200,170,0.18); }

        .conv-list {
          flex: 1; overflow-y: auto; padding: 8px;
        }
        .conv-item {
          padding: 10px 12px; border-radius: 10px;
          cursor: pointer; margin-bottom: 2px;
          border: none; background: none; width: 100%;
          text-align: left; transition: background 0.15s;
          display: flex; align-items: center;
          justify-content: space-between; gap: 8px;
        }
        .conv-item:hover { background: var(--hover); }
        .conv-item.active { background: rgba(0,200,170,0.1); }
        .conv-item-text { flex: 1; overflow: hidden; }
        .conv-item-title {
          font-size: 13px; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          font-weight: 500;
        }
        .conv-item-sub {
          font-size: 11px; color: var(--text-muted);
          margin-top: 2px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }
        .conv-delete {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); font-size: 14px; padding: 2px 4px;
          border-radius: 6px; opacity: 0;
          transition: opacity 0.15s, background 0.15s;
        }
        .conv-item:hover .conv-delete { opacity: 1; }
        .conv-delete:hover { background: rgba(255,80,80,0.1); color: #ff6060; }

        /* ── Chat area ── */
        .chat-area {
          flex: 1; display: flex; flex-direction: column;
          min-width: 0;
        }

        /* Chat header */
        .chat-header {
          height: 56px; flex-shrink: 0;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center;
          padding: 0 20px; gap: 12px;
          background: var(--surface);
        }
        .chat-header-icon {
          width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #00c8aa22, #5282ff22);
          border: 1px solid rgba(0,200,170,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .chat-header-info h3 {
          font-family: 'Syne', sans-serif;
          font-size: 14px; font-weight: 700; color: var(--text-primary);
        }
        .chat-header-info p {
          font-size: 11px; color: #00c8aa; display: flex; align-items: center; gap: 4px;
        }
        .online-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00c8aa; animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        .conv-toggle-btn {
          margin-left: auto;
          background: var(--hover); border: none; cursor: pointer;
          color: var(--text-muted); font-size: 18px;
          width: 34px; height: 34px; border-radius: 10px;
          display: none; align-items: center; justify-content: center;
        }
        @media (max-width: 768px) { .conv-toggle-btn { display: flex; } }

        /* Messages */
        .messages-area {
          flex: 1; overflow-y: auto;
          padding: 20px 16px;
          display: flex; flex-direction: column; gap: 16px;
        }

        /* Welcome */
        .welcome-screen {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 32px 16px; gap: 24px; text-align: center;
        }
        .welcome-icon {
          width: 72px; height: 72px; border-radius: 22px;
          background: linear-gradient(135deg, rgba(0,200,170,0.15), rgba(82,130,255,0.15));
          border: 1px solid rgba(0,200,170,0.2);
          display: flex; align-items: center; justify-content: center;
          font-size: 36px;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        .welcome-title {
          font-family: 'Syne', sans-serif;
          font-size: 22px; font-weight: 700; color: var(--text-primary);
        }
        .welcome-sub { font-size: 14px; color: var(--text-muted); max-width: 300px; }

        .suggestions {
          display: flex; flex-wrap: wrap; gap: 8px;
          justify-content: center; max-width: 480px;
        }
        .suggestion-chip {
          padding: 8px 14px; border-radius: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text-secondary); font-size: 13px;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          text-align: left;
        }
        .suggestion-chip:hover {
          border-color: rgba(0,200,170,0.4);
          color: #00c8aa; background: rgba(0,200,170,0.05);
        }

        /* Message bubbles */
        .msg-row {
          display: flex; align-items: flex-end; gap: 10px;
          animation: msgIn 0.25s ease both;
        }
        .msg-row.user { flex-direction: row-reverse; }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-avatar {
          width: 32px; height: 32px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
          background: rgba(0,200,170,0.12);
          border: 1px solid rgba(0,200,170,0.15);
        }
        .msg-avatar.user {
          background: rgba(82,130,255,0.12);
          border-color: rgba(82,130,255,0.15);
        }
        .msg-bubble {
          max-width: min(72%, 480px);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px 16px 16px 4px;
          padding: 12px 16px;
        }
        .msg-bubble.user {
          background: linear-gradient(135deg, rgba(0,200,170,0.12), rgba(0,168,140,0.08));
          border-color: rgba(0,200,170,0.2);
          border-radius: 16px 16px 4px 16px;
        }
        .msg-text {
          font-size: 14px; line-height: 1.6;
          color: var(--text-primary);
          white-space: pre-wrap; word-break: break-word;
        }
        .msg-sources {
          display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px;
        }
        .source-tag {
          padding: 2px 8px; border-radius: 10px;
          background: rgba(0,200,170,0.08);
          border: 1px solid rgba(0,200,170,0.15);
          font-size: 11px; color: #00c8aa;
        }
        .msg-time {
          font-size: 10px; color: var(--text-muted);
          margin-top: 6px; text-align: right;
        }

        /* Typing */
        .typing-dots {
          display: flex; align-items: center; gap: 4px;
          padding: 4px 0;
        }
        .typing-dots span {
          width: 7px; height: 7px; border-radius: 50%;
          background: #00c8aa; opacity: 0.4;
          animation: dot 1.2s infinite;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dot {
          0%,80%,100% { opacity: 0.3; transform: scale(0.8); }
          40%          { opacity: 1;   transform: scale(1); }
        }

        /* Input area */
        .input-area {
          padding: 12px 16px 16px;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .input-wrap {
          display: flex; align-items: flex-end; gap: 10px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px; padding: 8px 8px 8px 16px;
          transition: border-color 0.2s;
        }
        .input-wrap:focus-within { border-color: rgba(0,200,170,0.4); }
        .chat-input {
          flex: 1; background: none; border: none; outline: none;
          color: var(--text-primary); font-family: 'DM Sans', sans-serif;
          font-size: 14px; resize: none; max-height: 120px;
          min-height: 24px; line-height: 1.5;
        }
        .chat-input::placeholder { color: var(--text-muted); }
        .send-btn {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          background: linear-gradient(135deg, #00c8aa, #00a88c);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; transition: opacity 0.2s, transform 0.15s;
        }
        .send-btn:hover:not(:disabled) { opacity: 0.88; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .input-hint {
          font-size: 11px; color: var(--text-muted);
          text-align: center; margin-top: 8px;
        }

        /* Mobile overlay */
        .conv-overlay {
          display: none; position: fixed; inset: 0;
          background: rgba(0,0,0,0.5); z-index: 59;
          backdrop-filter: blur(2px);
        }
        @media (max-width: 768px) {
          .conv-overlay.open { display: block; }
        }
      `}</style>

      <div className="ai-root">
        {/* Mobile overlay for conv sidebar */}
        <div
          className={`conv-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Conversations sidebar */}
        <aside className={`conv-sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="conv-header">
            <span className="conv-title">💬 Suhbatlar</span>
            <button className="new-chat-btn" onClick={newChat}>+ Yangi</button>
          </div>
          <div className="conv-list">
            {conversations.length === 0 && (
              <div style={{ padding: '16px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                Hali suhbat yo'q
              </div>
            )}
            {conversations.map(conv => (
              <button
                key={conv.id}
                className={`conv-item${activeConvId === conv.id ? ' active' : ''}`}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="conv-item-text">
                  <div className="conv-item-title">{conv.title}</div>
                  <div className="conv-item-sub">
                    {conv.last_message?.content || `${conv.message_count} xabar`}
                  </div>
                </div>
                <button
                  className="conv-delete"
                  onClick={(e) => deleteConversation(conv.id, e)}
                  title="O'chirish"
                >🗑</button>
              </button>
            ))}
          </div>
        </aside>

        {/* Main chat */}
        <div className="chat-area">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-icon">✨</div>
            <div className="chat-header-info">
              <h3>Tibbiy AI Yordamchi</h3>
              <p><span className="online-dot" /> Onlayn • Doim tayyor</p>
            </div>
            <button
              className="conv-toggle-btn"
              onClick={() => setSidebarOpen(v => !v)}
            >☰</button>
          </div>

          {/* Messages */}
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="welcome-screen">
                <div className="welcome-icon">✨</div>
                <div>
                  <div className="welcome-title">Tibbiy AI Yordamchi</div>
                  <p className="welcome-sub">
                    Tibbiy savollaringizga javob beraman, doktorlar va klinika haqida ma'lumot beraman
                  </p>
                </div>
                <div className="suggestions">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      className="suggestion-chip"
                      onClick={() => { setInput(s); inputRef.current?.focus() }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => <Message key={i} msg={msg} />)}
                {typing && (
                  <div className="msg-row">
                    <div className="msg-avatar">✨</div>
                    <div className="msg-bubble">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="input-area">
            <div className="input-wrap">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Tibbiy savolingizni yozing..."
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={handleKey}
                rows={1}
              />
              <button
                className="send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || loading}
              >
                ➤
              </button>
            </div>
            <div className="input-hint">Enter — yuborish • Shift+Enter — yangi qator</div>
          </div>
        </div>
      </div>
    </>
  )
}