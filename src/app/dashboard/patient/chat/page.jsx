"use client";

import { useState, useEffect, useRef } from "react";
import { sendChatMessage, getChatHistory, clearChatHistory, getCurrentUser } from "@/services/api_calls";
import MessageMarkdown from "@/components/MessageMarkdown";
import ChatQuickActions from "@/components/ChatQuickActions";

const fmtTime = (ts) => {
  if (!ts) return "";
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
};

const STARTER_CARDS = [
  { emoji: "📊", title: "Your data",      prompt: "What was my average heart rate last week?"      },
  { emoji: "🎯", title: "Goal tracking",  prompt: "Show me my goal completion rate this month"     },
  { emoji: "💡", title: "Recommendations",prompt: "What are my active health recommendations?"     },
  { emoji: "📈", title: "View trends",    prompt: "How has my glucose changed this month?"         },
];

export default function ChatPage() {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [userName,  setUserName]  = useState("");
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const [histRes, userRes] = await Promise.allSettled([getChatHistory(), getCurrentUser()]);
        if (histRes.status === "fulfilled") setMessages(histRes.value?.messages || []);
        if (userRes.status === "fulfilled") setUserName(userRes.value?.full_name?.split(" ")[0] || "there");
      } finally { setLoading(false); }
    })();
  }, []);

  const handleClear = async () => {
    if (!confirm("Clear all chat history?")) return;
    try { await clearChatHistory(); setMessages([]); } catch (_) {}
  };

  const handleQuickAction = (prompt) => {
    if (streaming) return;
    setInput(prompt);
    send(null, prompt);
  };

  const send = async (e, quickPrompt = null) => {
    if (e) e.preventDefault();
    const text = quickPrompt || input.trim();
    if (!text || streaming) return;
    setInput("");

    const userMsg = { role: "user",      content: text, created_at: new Date().toISOString() };
    const aId     = Date.now();
    const aMsg    = { id: aId, role: "assistant", content: "", created_at: new Date().toISOString(), isStreaming: true };

    setMessages((p) => [...p, userMsg, aMsg]);
    setStreaming(true);

    try {
      const response = await sendChatMessage(text);
      let idx = 0;
      const type = () => {
        if (idx > response.length) { setStreaming(false); return; }
        setMessages((p) => p.map((m) =>
          m.id === aId ? { ...m, content: response.substring(0, idx), isStreaming: idx < response.length } : m
        ));
        idx++;
        if (idx <= response.length) setTimeout(type, 10);
        else setStreaming(false);
      };
      type();
    } catch (_) {
      setMessages((p) => p.map((m) =>
        m.id === aId ? { ...m, content: "Sorry, something went wrong. Please try again.", isStreaming: false, isError: true } : m
      ));
      setStreaming(false);
    } finally { inputRef.current?.focus(); }
  };

  return (
    <div className="flex flex-col bg-[#030712]" style={{ height: "calc(100vh - 80px)" }}>

      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-serif)] text-white text-2xl font-bold">Pulse AI</h1>
        </div>
        <button
          onClick={handleClear}
          disabled={messages.length === 0}
          className="text-white/25 hover:text-red-400 text-xs transition-colors disabled:opacity-30"
        >
          Clear history
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Welcome */}
          {!loading && messages.length === 0 && (
            <div className="text-center py-10 space-y-6">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <h2 className="text-white/80 text-xl font-bold mb-1">Hey {userName}!</h2>
                <p className="text-white/35 text-sm max-w-sm mx-auto">
                  I'm your personal health assistant. Ask me anything about your data, goals, or recommendations.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 max-w-xl mx-auto text-left">
                {STARTER_CARDS.map((c) => (
                  <button key={c.title} onClick={() => handleQuickAction(c.prompt)}
                    className="rounded-xl border border-white/[0.07] bg-white/[0.02] hover:border-indigo-500/25 hover:bg-indigo-500/[0.05] p-4 text-left transition-colors group">
                    <p className="text-base mb-1">{c.emoji}</p>
                    <p className="text-white/55 text-xs font-semibold group-hover:text-white/70 transition-colors">{c.title}</p>
                    <p className="text-white/25 text-xs mt-0.5 leading-snug">{c.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
            </div>
          )}

          {/* Messages */}
          {messages.map((m, i) => (
            <div key={m.id || i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] md:max-w-[72%] px-4 py-3 rounded-2xl shadow-sm ${
                m.role === "user"
                  ? "bg-indigo-600/80 text-white rounded-tr-sm"
                  : m.isError
                  ? "bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-sm"
                  : "bg-white/[0.06] border border-white/[0.09] text-white/80 rounded-tl-sm"
              }`}>
                <div className="break-words text-sm leading-relaxed">
                  {m.role === "user"
                    ? <div className="whitespace-pre-wrap">{m.content}</div>
                    : <MessageMarkdown content={m.content} />
                  }
                  {m.isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
                </div>
                {m.created_at && (
                  <p className={`text-xs mt-1.5 ${m.role === "user" ? "text-indigo-300/60" : "text-white/25"}`}>
                    {fmtTime(m.created_at)}
                  </p>
                )}
              </div>
            </div>
          ))}

          <div ref={endRef} />
        </div>
      </div>

      {/* Quick actions */}
      <ChatQuickActions onActionClick={handleQuickAction} isDisabled={streaming} />

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-4 border-t border-white/[0.07] bg-[#0a0f1e]/50">
        <form onSubmit={send} className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={streaming ? "Pulse AI is thinking…" : "Ask me anything about your health…"}
            disabled={streaming}
            className="flex-1 px-4 py-3 bg-white/[0.04] border border-white/[0.09] rounded-xl text-white/80 placeholder-white/20 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="px-5 py-3 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {streaming
              ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
            }
          </button>
        </form>
      </div>
    </div>
  );
}
