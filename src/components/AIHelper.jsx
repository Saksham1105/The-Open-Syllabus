import { AnimatePresence, motion } from 'motion/react';
import { Bot, Loader2, MessageSquare, Send, Sparkles, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useStudyMode } from '../contexts/StudyModeContext';

const initialMessage = {
  role: 'assistant',
  content: "Hi! I'm your Open Syllabus assistant. How can I help you today?",
};

export default function AIHelper() {
  const { isStudyMode } = useStudyMode();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  async function handleSend(event) {
    event.preventDefault();

    const message = input.trim();
    if (!message || isLoading) return;

    setInput('');
    setMessages((current) => [...current, { role: 'user', content: message }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'The AI service is unavailable.');
      }

      setMessages((current) => [
        ...current,
        { role: 'assistant', content: data.reply || 'I could not generate a response.' },
      ]);
    } catch (error) {
      console.error('AI request failed:', error);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: 'The AI helper is temporarily unavailable. Please try again in a moment.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 flex h-[500px] w-80 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:w-96"
          >
            <div className="flex items-center justify-between bg-indigo-600 p-4 text-white">
              <div className="flex items-center space-x-2">
                <div className="rounded-lg bg-white/20 p-1.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">AI Helper</h3>
                  <p className="text-[10px] opacity-80">Study assistant</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI helper"
                className="rounded-lg p-1 transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900/50">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';

                return (
                  <div key={`${message.role}-${index}`} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] items-start space-x-2 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 rounded-xl p-2 ${isUser ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-200 dark:bg-slate-800'}`}>
                        {isUser ? (
                          <User className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Bot className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                        )}
                      </div>
                      <div className={`rounded-2xl p-3 text-sm ${isUser
                        ? 'rounded-tr-none bg-indigo-600 text-white'
                        : 'rounded-tl-none border border-slate-100 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center space-x-2">
                    <div className="rounded-xl bg-slate-200 p-2 dark:bg-slate-800">
                      <Bot className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask me anything..."
                  aria-label="Ask the AI helper"
                  className="w-full rounded-xl bg-slate-100 py-3 pl-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                  className="absolute right-1.5 rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close AI helper' : 'Open AI helper'}
        className={`rounded-full p-4 shadow-2xl transition-all ${
          isOpen
            ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
            : isStudyMode
              ? 'bg-slate-800/50 text-slate-500 opacity-30 hover:opacity-100'
              : 'bg-indigo-600 text-white'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </motion.button>
    </div>
  );
}
