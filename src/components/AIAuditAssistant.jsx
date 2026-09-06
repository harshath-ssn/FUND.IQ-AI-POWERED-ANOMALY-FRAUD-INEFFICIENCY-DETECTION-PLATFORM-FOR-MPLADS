import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Globe, Sparkles, Mic, MicOff } from 'lucide-react';

const TRANSLATIONS = {
  en: {
    greeting: (name, role) => `Hello ${name}. As your Sentinel AI, I am monitoring ${role === 'mp' ? 'your constituency' : 'your jurisdiction'}. How can I assist you today?`,
    placeholder: "Ask or speak about delayed projects...",
    delayed: "I found 1 critical anomaly: Work ID W014 in Coimbatore. 100% of funds (₹18L) were released, but physical progress is stalled at 10%.",
    default: "I am analyzing the latest expenditure logs. Please specify if you want to check for 'delays', 'funds', or 'anomalies'.",
    langCode: 'en-US'
  },
  hi: {
    greeting: (name, role) => `नमस्ते ${name}। आपके प्रहरी AI के रूप में, मैं आपके अधिकार क्षेत्र की निगरानी कर रहा हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?`,
    placeholder: "विलंबित परियोजनाओं के बारे में पूछें...",
    delayed: "मुझे 1 गंभीर विसंगति मिली: कोयंबटूर में कार्य आईडी W014। 100% धन (₹18L) जारी किया गया है, लेकिन भौतिक प्रगति 10% पर रुकी हुई है।",
    default: "मैं नवीनतम व्यय लॉग का विश्लेषण कर रहा हूँ। कृपया निर्दिष्ट करें कि क्या आप 'विलंब', 'धन', या 'विसंगतियों' की जांच करना चाहते हैं।",
    langCode: 'hi-IN'
  },
  ta: {
    greeting: (name, role) => `வணக்கம் ${name}. உங்கள் சென்டினல் AI ஆக, நான் உங்கள் அதிகார வரம்பை கண்காணிக்கிறேன். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?`,
    placeholder: "தாமதமான திட்டங்கள் பற்றி கேளுங்கள்...",
    delayed: "1 முக்கியமான முரண்பாடு கண்டறியப்பட்டுள்ளது: கோயம்புத்தூரில் W014. 100% நிதி (₹18L) விடுவிக்கப்பட்டுள்ளது, ஆனால் உடல் முன்னேற்றம் 10% இல் நிற்கிறது.",
    default: "சமீபத்திய செலவு பதிவுகளை நான் பகுப்பாய்வு செய்கிறேன். 'தாமதங்கள்', 'நிதிகள்' அல்லது 'முரண்பாடுகள்' ஆகியவற்றை நீங்கள் சரிபார்க்க வேண்டுமா என்பதைக் குறிப்பிடவும்.",
    langCode: 'ta-IN'
  }
};

export default function AIAuditAssistant({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en'); 
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      setMessages([
        { sender: 'ai', text: TRANSLATIONS[language].greeting(currentUser.name, currentUser.role) }
      ]);
    }
  }, [currentUser, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Handle Speech Recognition
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Voice Input. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = TRANSLATIONS[language].langCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    setTimeout(() => {
      let aiReply = TRANSLATIONS[language].default;
      const lowerInput = userMsg.toLowerCase();
      
      if (lowerInput.includes('delay') || lowerInput.includes('विलंब') || lowerInput.includes('தாமத') || lowerInput.includes('anomaly')) {
        aiReply = TRANSLATIONS[language].delayed;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    }, 800);
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'hi' : prev === 'hi' ? 'ta' : 'en');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {isOpen && (
        <div className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl w-80 sm:w-96 h-[32rem] mb-4 flex flex-col overflow-hidden transform transition-all duration-300 origin-bottom-right animate-in zoom-in-95">
          
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 flex justify-between items-center text-white shadow-md z-10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles size={18} className="text-indigo-200 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Sentinel Voice AI</h3>
                <p className="text-xs text-indigo-200 opacity-80">Multilingual Audit Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleLanguage}
                className="p-1.5 hover:bg-white/20 rounded-md transition-colors flex items-center gap-1 text-xs font-bold bg-white/10"
                title="Switch Language"
              >
                <Globe size={14} />
                {language.toUpperCase()}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-slate-50/50 flex flex-col gap-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-indigo-100 text-indigo-700' : 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none leading-relaxed'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isListening && (
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-500 rounded-tl-none flex items-center gap-2">
                  <span className="animate-pulse">Listening</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-xl transition-all shadow-sm flex-shrink-0 ${
                isListening 
                  ? 'bg-red-100 text-red-600 animate-pulse ring-2 ring-red-500/50' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title="Click to Speak"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : TRANSLATIONS[language].placeholder}
              className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
            <button 
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all shadow-md flex-shrink-0"
            >
              <Send size={18} className={input.trim() ? "translate-x-0.5" : ""} />
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-center w-14 h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 ${
          isOpen 
            ? 'bg-slate-800 text-white rotate-90' 
            : 'bg-gradient-to-r from-indigo-600 to-indigo-800 text-white hover:shadow-indigo-500/50 ring-4 ring-white/50'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
    </div>
  );
}