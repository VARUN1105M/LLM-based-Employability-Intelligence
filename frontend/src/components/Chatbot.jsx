import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, HelpCircle, MessageSquare } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am your AI Career Counselor powered by Llama 3.1 & RAG. Ask me anything about job search, resume enhancements, skill roadmaps, or interview preparation."
    }
  ]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef(null);

  const predefinedQuestions = [
    "How can I bridge my Docker skill gap?",
    "What certificates do recruiters look for in Full Stack Engineering?",
    "Give me advice on optimizing my resume."
  ];

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return;
    
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSubmitting(true);

    // Simulate RAG + LLM response
    setTimeout(() => {
      let botResponse = "I have scanned the local knowledge base and found matching resources. Based on industry demand for Full Stack Engineers, I recommend learning containerization via Docker. You can follow our roadmap step 4, which links to official documentation.";
      
      if (textToSend.toLowerCase().includes('resume')) {
        botResponse = "To optimize your resume for applicant tracking systems, focus on standardizing your headings (e.g., 'Work Experience' instead of 'Professional History') and list concrete details like programming languages and projects with GitHub links.";
      } else if (textToSend.toLowerCase().includes('certificate')) {
        botResponse = "For Full Stack roles, key certifications include: AWS Certified Developer, HashiCorp Certified: Terraform Associate, and specialized certificates in database administration.";
      }

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse
      };

      setMessages((prev) => [...prev, botMsg]);
      setSubmitting(false);
    }, 1500);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">AI Career Counselor</h3>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Llama 3.1 + RAG Connected
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'bot' && (
              <div className="h-8 w-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mr-3 shrink-0">
                <Bot className="h-4 w-4 text-primary-400" />
              </div>
            )}
            
            <div
              className={`max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed border ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-primary-600 to-indigo-600 border-primary-500/20 text-white rounded-tr-none'
                  : 'bg-slate-950/60 border-slate-850 text-slate-205 rounded-tl-none'
              }`}
            >
              {msg.text}
            </div>

            {msg.sender === 'user' && (
              <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center ml-3 shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {submitting && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 p-2">
            <div className="animate-bounce h-1.5 w-1.5 bg-slate-500 rounded-full" />
            <div className="animate-bounce h-1.5 w-1.5 bg-slate-500 rounded-full [animation-delay:0.2s]" />
            <div className="animate-bounce h-1.5 w-1.5 bg-slate-500 rounded-full [animation-delay:0.4s]" />
            <span>Counselor is typing...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Footer input and suggestions */}
      <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 space-y-4">
        {/* Question suggestions */}
        {messages.length === 1 && (
          <div className="space-y-2">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center">
              <HelpCircle className="h-3 w-3 mr-1" /> Suggested Questions
            </p>
            <div className="flex flex-wrap gap-2">
              {predefinedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question here..."
            className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 p-3 text-sm placeholder-slate-650"
          />
          <button
            type="submit"
            disabled={!input.trim() || submitting}
            className="h-11 w-11 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 flex items-center justify-center text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
