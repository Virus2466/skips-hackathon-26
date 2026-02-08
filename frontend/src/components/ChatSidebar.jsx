import { useState, useRef, useEffect, useContext } from 'react';
import { X, Send, Bot, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../api/axios';
import remarkGfm from 'remark-gfm';
import AuthContext from '../context/AuthContext';
import remarkMath from 'remark-math'; // <--- 1. Import Math Plugin
import rehypeKatex from 'rehype-katex'; // <--- 2. Import KaTeX Plugin
import 'katex/dist/katex.min.css';

const ChatSidebar = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    { id: 1, text: `Hi ${user?.name || ''}! I'm your AI Mentor. I can analyze your tests or help you study. What's on your mind?`, sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 1. Add User Message to UI
    const userMsg = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 2. Call Your New Ollama Backend
      // The controller looks for: { userMessage, selectedCourse, mode }
      const { data } = await api.post('/api/ai/ask', {
        userMessage: input,
        selectedCourse: user?.course || "General", // Send user's course (e.g., JEE Mains)
        mode: "chat" // Tells the controller to use 'handleContextualChat'
      });

      // 3. Add Ollama's Response
      // Your controller returns: { success: true, message: "..." }
      if (data.success) {
        setMessages(prev => [...prev, { id: Date.now() + 1, text: data.message, sender: 'ai' }]);
      } else {
        throw new Error("AI failed to respond");
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "My brain is offline 🧠. Check if Ollama is running.", sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0  bg-opacity-30 backdrop-blur-sm" onClick={onClose}></div>

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in">
        
        {/* Header */}
        <div className="p-4 bg-primary text-black flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
               <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold">Exam Mentor AI</h3>
              <p className="text-xs text-indigo-200 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> Online (Ollama)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-primary text-black rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}>
                {/* 2. Use ReactMarkdown to render the text */}
                {msg.sender === 'user' ? (
                  msg.text
                ) : (
                  <div className="prose prose-sm max-w-none prose-indigo leading-relaxed">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm, remarkMath]} // Added remarkMath
                      rehypePlugins={[rehypeKatex]}            // Added rehypeKatex
                      components={{
                        // Optional: Ensure math blocks scroll if they are too wide
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions (Now trigger real calls) */}
        <div className="px-4 py-2 bg-gray-50 flex gap-2 overflow-x-auto no-scrollbar">
          {["Explain Quantum Physics", "How can I improve my score?", "Give me a study tip"].map((txt, i) => (
            <button 
              key={i} 
              onClick={() => setInput(txt)}
              className="whitespace-nowrap px-3 py-1 bg-white border border-indigo-100 text-black text-xs rounded-full hover:bg-indigo-50 transition flex items-center gap-1 shadow-sm"
            >
              <Sparkles size={12} /> {txt}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your studies..."
            className="flex-1 bg-gray-100 border-0 rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary focus:bg-white transition outline-none"
          />
          <button 
            type="submit" 
            className="p-3 bg-primary text-black rounded-xl hover:bg-black hover:text-white transition shadow-lg disabled:opacity-50"
            disabled={!input.trim()}
          >
            <Send size={18} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default ChatSidebar;