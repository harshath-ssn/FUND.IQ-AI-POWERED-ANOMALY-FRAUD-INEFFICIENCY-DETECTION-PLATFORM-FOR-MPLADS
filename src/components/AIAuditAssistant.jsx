import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { askGeminiAssistant } from '../services/geminiAssistant';

const LANGUAGE_NAMES = { en: 'English', ta: 'Tamil', hi: 'Hindi' };

// Grounded assistant (Phase 5). Replaces the previous hardcoded
// pattern-matcher, which returned a fixed fabricated example ("Work ID
// W014 in Coimbatore... 100% of funds released, stalled at 10%")
// regardless of the actual user or data -- exactly the kind of invented
// finding this platform's own rules prohibit. Every answer here is
// grounded in the real `context` snapshot passed down from App.jsx and
// carries an explicit "not a determination" disclaimer; failures are
// shown honestly, never papered over with canned text.
export default function AIAuditAssistant({ currentUser, context }) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, loading]);

  const send = async (question) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);

    const result = await askGeminiAssistant({
      apiKey,
      context,
      question: trimmed,
      language: LANGUAGE_NAMES[language] || 'English',
    });

    setLoading(false);
    if (result.ok) {
      setMessages((prev) => [...prev, { sender: 'ai', text: result.text }]);
    } else {
      const errKey = {
        no_key: 'assistant.errors.noKey',
        rate_limited: 'assistant.errors.rateLimited',
        invalid_key: 'assistant.errors.invalidKey',
        offline: 'assistant.errors.offline',
      }[result.reason] || 'assistant.errors.generic';
      setMessages((prev) => [...prev, { sender: 'error', text: t(errKey) }]);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    send(input);
  };

  const quickPrompts = [
    t('assistant.quickAttention'),
    context?.selectedWork ? t('assistant.quickWhyFlagged') : t('assistant.quickFundPosition'),
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[1500] flex flex-col items-end">
      {isOpen && (
        <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl w-80 sm:w-96 h-[32rem] mb-4 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
          <div className="bg-gradient-to-r from-indigo-950 to-indigo-900 p-4 flex justify-between items-center text-white shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles size={18} className="text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t('assistant.title')}</h3>
                <p className="text-xs text-indigo-200">{t('assistant.subtitle')}</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-slate-500 px-1">
                  {currentUser?.name ? `${currentUser.name} — ` : ''}{t('assistant.subtitle')}.
                </p>
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => send(q)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'user' ? 'bg-indigo-100 text-indigo-700' : msg.sender === 'error' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-950 text-amber-300'
                }`}>
                  {msg.sender === 'user' ? <User size={16} /> : msg.sender === 'error' ? <AlertTriangle size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[80%] space-y-1`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user' ? 'bg-indigo-950 text-white rounded-tr-none'
                    : msg.sender === 'error' ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.sender === 'ai' && <p className="text-xs text-slate-400 px-1">{t('assistant.disclaimer')}</p>}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-950 text-amber-300 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 text-sm rounded-tl-none">
                  {t('assistant.thinking')}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('assistant.placeholder')}
              disabled={loading}
              className="flex-1 bg-slate-100 border-none rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 bg-indigo-950 hover:bg-indigo-900 disabled:bg-slate-200 disabled:text-slate-400 text-amber-300 rounded-xl transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
              aria-label={t('assistant.send')}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer ${
          isOpen ? 'bg-slate-800 text-white' : 'bg-indigo-950 text-amber-300 ring-4 ring-white/60'
        }`}
        aria-label={t('assistant.title')}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}
